import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db, Incident, Alert } from '../db/schema';
import { getSystemMetrics } from '../utils/osMetrics';
import { createIncidentReport } from '../utils/pdfGenerator';
import { logInfo, logError } from '../utils/logger';

/**
 * Creates and configures the MCP server with all resources and tools
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'sir-status-checker',
    version: '1.0.0',
  });

  // Register MCP Resources
  registerResources(server);

  // Register MCP Tools
  registerTools(server);

  return server;
}

/**
 * Registers MCP resources for SIR monitoring
 */
function registerResources(server: McpServer): void {
  // Resource: sir://current-status
  server.resource(
    'current-status',
    'sir://current-status',
    async (uri) => {
      try {
        const activeIncidents = await db<Incident>('incidents')
          .where('status', 'active')
          .select('*');
        
        const unresolvedAlerts = await db<Alert>('alerts')
          .where('acknowledged', false)
          .select('*');

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              timestamp: new Date().toISOString(),
              activeIncidents: activeIncidents.length,
              unresolvedAlerts: unresolvedAlerts.length,
              incidents: activeIncidents,
              alerts: unresolvedAlerts,
            }, null, 2),
            mimeType: 'application/json',
          }],
        };
      } catch (error) {
        logError('Failed to get current status', error as Error);
        throw error;
      }
    }
  );

  // Resource: sir://incidents/{id}
  server.resource(
    'incident-details',
    'sir://incidents/{id}',
    async (uri, { id }) => {
      try {
        const incident = await db<Incident>('incidents')
          .where('id', id)
          .first();

        if (!incident) {
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify({ error: 'Incident not found' }, null, 2),
              mimeType: 'application/json',
            }],
          };
        }

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(incident, null, 2),
            mimeType: 'application/json',
          }],
        };
      } catch (error) {
        logError(`Failed to get incident ${id}`, error as Error);
        throw error;
      }
    }
  );

  // Resource: sir://history?range={days}
  server.resource(
    'history',
    'sir://history',
    async (uri, { range }) => {
      try {
        const days = parseInt(range || '7', 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const historicalIncidents = await db<Incident>('incidents')
          .where('created_at', '>=', startDate.toISOString())
          .orderBy('created_at', 'desc')
          .select('*');

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              range: `${days} days`,
              startDate: startDate.toISOString(),
              endDate: new Date().toISOString(),
              count: historicalIncidents.length,
              incidents: historicalIncidents,
            }, null, 2),
            mimeType: 'application/json',
          }],
        };
      } catch (error) {
        logError('Failed to get history', error as Error);
        throw error;
      }
    }
  );

  // Resource: sir://metrics
  server.resource(
    'metrics',
    'sir://metrics',
    async (uri) => {
      try {
        const metrics = getSystemMetrics();
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(metrics, null, 2),
            mimeType: 'application/json',
          }],
        };
      } catch (error) {
        logError('Failed to get metrics', error as Error);
        throw error;
      }
    }
  );

  // Resource: sir://alerts/unresolved
  server.resource(
    'unresolved-alerts',
    'sir://alerts/unresolved',
    async (uri) => {
      try {
        const alerts = await db<Alert>('alerts')
          .where('acknowledged', false)
          .orderBy('created_at', 'desc')
          .select('*');

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              count: alerts.length,
              alerts,
            }, null, 2),
            mimeType: 'application/json',
          }],
        };
      } catch (error) {
        logError('Failed to get unresolved alerts', error as Error);
        throw error;
      }
    }
  );
}

/**
 * Registers MCP tools for SIR operations
 */
function registerTools(server: McpServer): void {
  // Tool: check_sir_status
  server.tool(
    'check_sir_status',
    'Returns current SIR status overview including active incidents and unresolved alerts',
    {},
    async () => {
      try {
        const activeIncidents = await db<Incident>('incidents')
          .where('status', 'active')
          .select('*');
        
        const unresolvedAlerts = await db<Alert>('alerts')
          .where('acknowledged', false)
          .select('*');

        const metrics = getSystemMetrics();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              timestamp: new Date().toISOString(),
              summary: {
                activeIncidents: activeIncidents.length,
                unresolvedAlerts: unresolvedAlerts.length,
                systemHealth: {
                  cpuUsage: metrics.cpu.usage,
                  memoryUsage: metrics.memory.usagePercent,
                  diskUsage: metrics.disk.usagePercent,
                },
              },
              incidents: activeIncidents,
              alerts: unresolvedAlerts,
            }, null, 2),
          }],
        };
      } catch (error) {
        logError('Failed to check SIR status', error as Error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', message: (error as Error).message }),
          }],
          isError: true,
        };
      }
    }
  );

  // Tool: get_incident_details
  server.tool(
    'get_incident_details',
    'Fetches full incident timeline and details by ID',
    {
      incidentId: z.string().describe('The unique identifier of the incident'),
    },
    async ({ incidentId }) => {
      try {
        const incident = await db<Incident>('incidents')
          .where('id', incidentId)
          .first();

        if (!incident) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ 
                status: 'error', 
                message: `Incident ${incidentId} not found` 
              }),
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              incident,
            }, null, 2),
          }],
        };
      } catch (error) {
        logError(`Failed to get incident details for ${incidentId}`, error as Error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', message: (error as Error).message }),
          }],
          isError: true,
        };
      }
    }
  );

  // Tool: search_incidents
  server.tool(
    'search_incidents',
    'Searches and filters incidents by severity, status, date range, or keyword',
    {
      severity: z.enum(['P1', 'P2', 'P3', 'P4']).optional().describe('Filter by severity level'),
      status: z.enum(['active', 'resolved', 'escalated', 'pending']).optional().describe('Filter by status'),
      keyword: z.string().optional().describe('Search keyword in title or description'),
      days: z.number().optional().describe('Number of days to look back'),
    },
    async ({ severity, status, keyword, days }) => {
      try {
        let query = db<Incident>('incidents').select('*');

        if (severity) {
          query = query.where('severity', severity);
        }

        if (status) {
          query = query.where('status', status);
        }

        if (keyword) {
          query = query.where((builder) => {
            builder.where('title', 'like', `%${keyword}%`)
                   .orWhere('description', 'like', `%${keyword}%`);
          });
        }

        if (days) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          query = query.where('created_at', '>=', startDate.toISOString());
        }

        const incidents = await query.orderBy('created_at', 'desc');

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              count: incidents.length,
              incidents,
            }, null, 2),
          }],
        };
      } catch (error) {
        logError('Failed to search incidents', error as Error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', message: (error as Error).message }),
          }],
          isError: true,
        };
      }
    }
  );

  // Tool: create_incident_report
  server.tool(
    'create_incident_report',
    'Generates a PDF or CSV report of incidents',
    {
      format: z.enum(['pdf', 'csv']).default('pdf').describe('Report format'),
      includeAlerts: z.boolean().default(true).describe('Include alerts in report'),
      days: z.number().default(30).describe('Number of days of data to include'),
    },
    async ({ format, includeAlerts, days }) => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const incidents = await db<Incident>('incidents')
          .where('created_at', '>=', startDate.toISOString())
          .orderBy('created_at', 'desc')
          .select('*');

        const alerts = includeAlerts 
          ? await db<Alert>('alerts')
              .where('created_at', '>=', startDate.toISOString())
              .select('*')
          : [];

        const filePath = await createIncidentReport(incidents, alerts, format);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Report generated successfully`,
              filePath,
              format,
              incidentCount: incidents.length,
              alertCount: alerts.length,
            }, null, 2),
          }],
        };
      } catch (error) {
        logError('Failed to create incident report', error as Error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', message: (error as Error).message }),
          }],
          isError: true,
        };
      }
    }
  );

  // Tool: acknowledge_alert
  server.tool(
    'acknowledge_alert',
    'Acknowledges an alert with user information and timestamp',
    {
      alertId: z.string().describe('The unique identifier of the alert'),
      userId: z.string().describe('The user acknowledging the alert'),
    },
    async ({ alertId, userId }) => {
      try {
        const alert = await db<Alert>('alerts')
          .where('id', alertId)
          .first();

        if (!alert) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ 
                status: 'error', 
                message: `Alert ${alertId} not found` 
              }),
            }],
            isError: true,
          };
        }

        if (alert.acknowledged) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ 
                status: 'info', 
                message: `Alert ${alertId} is already acknowledged` 
              }),
            }],
          };
        }

        await db<Alert>('alerts')
          .where('id', alertId)
          .update({
            acknowledged: true,
            acknowledged_by: userId,
            acknowledged_at: new Date().toISOString(),
          });

        logInfo(`Alert ${alertId} acknowledged by ${userId}`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Alert ${alertId} acknowledged successfully`,
              alertId,
              acknowledgedBy: userId,
              acknowledgedAt: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (error) {
        logError(`Failed to acknowledge alert ${alertId}`, error as Error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', message: (error as Error).message }),
          }],
          isError: true,
        };
      }
    }
  );
}
