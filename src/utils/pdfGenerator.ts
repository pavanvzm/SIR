import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Incident, Alert } from '../db/schema';

/**
 * Options for PDF report generation
 */
export interface ReportOptions {
  title: string;
  subtitle?: string;
  includeIncidents: boolean;
  includeAlerts: boolean;
  dateRange?: { start: Date; end: Date };
  outputDir: string;
  filename: string;
}

/**
 * Generates a PDF report with incident and alert data
 * Cross-platform compatible using pdfkit
 */
export async function generatePdfReport(
  incidents: Incident[],
  alerts: Alert[],
  options: ReportOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(options.outputDir)) {
        fs.mkdirSync(options.outputDir, { recursive: true });
      }

      const filePath = path.join(options.outputDir, `${options.filename}.pdf`);
      const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 50, bottom: 50, left: 50, right: 50 } 
      });
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Title Page
      doc.fontSize(24).text(options.title, { align: 'center' });
      doc.moveDown();
      
      if (options.subtitle) {
        doc.fontSize(16).text(options.subtitle, { align: 'center' });
        doc.moveDown();
      }
      
      doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      
      if (options.dateRange) {
        doc.text(
          `Period: ${options.dateRange.start.toISOString()} - ${options.dateRange.end.toISOString()}`,
          { align: 'center' }
        );
      }
      
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Executive Summary
      doc.fontSize(18).text('Executive Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(11);
      
      const totalIncidents = incidents.length;
      const activeIncidents = incidents.filter(i => i.status === 'active').length;
      const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
      const criticalIncidents = incidents.filter(i => i.severity === 'P1').length;
      
      doc.text(`Total Incidents: ${totalIncidents}`);
      doc.text(`Active Incidents: ${activeIncidents}`);
      doc.text(`Resolved Incidents: ${resolvedIncidents}`);
      doc.text(`Critical (P1) Incidents: ${criticalIncidents}`);
      doc.moveDown(2);

      // Incidents Section
      if (options.includeIncidents && incidents.length > 0) {
        doc.fontSize(18).text('Incident Details', { underline: true });
        doc.moveDown();
        
        incidents.forEach((incident, index) => {
          doc.fontSize(14).text(`${index + 1}. ${incident.title}`, { bold: true });
          doc.fontSize(11);
          doc.text(`ID: ${incident.id}`);
          doc.text(`Severity: ${incident.severity}`);
          doc.text(`Status: ${incident.status}`);
          doc.text(`Created: ${new Date(incident.created_at).toISOString()}`);
          
          if (incident.description) {
            doc.text(`Description: ${incident.description}`, { width: 500 });
          }
          
          doc.moveDown();
        });
      }

      // Alerts Section
      if (options.includeAlerts && alerts.length > 0) {
        doc.addPage();
        doc.fontSize(18).text('Unresolved Alerts', { underline: true });
        doc.moveDown();
        
        alerts.forEach((alert, index) => {
          doc.fontSize(12).text(`${index + 1}. ${alert.message}`, { bold: true });
          doc.fontSize(11);
          doc.text(`Priority: ${alert.priority}`);
          doc.text(`Created: ${new Date(alert.created_at).toISOString()}`);
          doc.text(`Acknowledged: ${alert.acknowledged ? 'Yes' : 'No'}`);
          
          if (alert.acknowledged_by) {
            doc.text(`Acknowledged by: ${alert.acknowledged_by}`);
          }
          
          doc.moveDown();
        });
      }

      // Footer with page numbers
      const pageCount = doc.bufferedPageRange();
      for (let i = 0; i < pageCount.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10).text(
          `Page ${i + 1} of ${pageCount.count}`,
          50,
          750,
          { align: 'right' }
        );
      }

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a CSV report
 */
export function generateCsvReport(
  incidents: Incident[],
  filename: string,
  outputDir: string
): string {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `${filename}.csv`);
  
  // CSV Header
  const headers = ['ID', 'Title', 'Severity', 'Status', 'Description', 'Created At', 'Updated At'];
  
  // CSV Rows
  const rows = incidents.map(incident => [
    incident.id,
    `"${(incident.title || '').replace(/"/g, '""')}"`,
    incident.severity,
    incident.status,
    `"${(incident.description || '').replace(/"/g, '""')}"`,
    incident.created_at,
    incident.updated_at || '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  fs.writeFileSync(filePath, csvContent, 'utf8');
  
  return filePath;
}

/**
 * Report format options
 */
export type ReportFormat = 'pdf' | 'csv';

/**
 * Main report generation function that supports multiple formats
 */
export async function createIncidentReport(
  incidents: Incident[],
  alerts: Alert[],
  format: ReportFormat,
  outputDir: string = './exports'
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `incident_report_${timestamp}`;
  
  if (format === 'pdf') {
    return generatePdfReport(incidents, alerts, {
      title: 'SIR Incident Report',
      subtitle: 'System Incident Response Status Summary',
      includeIncidents: true,
      includeAlerts: true,
      outputDir,
      filename: baseFilename,
    });
  } else if (format === 'csv') {
    return generateCsvReport(incidents, baseFilename, outputDir);
  } else {
    throw new Error(`Unsupported report format: ${format}`);
  }
}
