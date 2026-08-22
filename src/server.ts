import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { db, initializeDatabase, closeDatabase, Incident, Alert, AuditLog } from './db/schema';
import { createMcpServer } from './mcp/server';
import { getSystemMetrics } from './utils/osMetrics';
import { logInfo, logError, logWarn } from './utils/logger';
import { hash, isValidApiKey } from './utils/encryption';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || 'localhost';
const API_KEY = process.env.API_KEY || 'default-api-key';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-key';
const OPERATOR_API_KEY = process.env.OPERATOR_API_KEY || 'operator-key';
const VIEWER_API_KEY = process.env.VIEWER_API_KEY || 'viewer-key';

/**
 * Main application class for SIR MCP Server
 */
class SirMcpApplication {
  private app: Express;
  private httpServer: any;
  private wss: WebSocketServer;
  private mcpServer: McpServer;
  private clients: Set<any> = new Set();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.httpServer, path: '/ws' });
    this.mcpServer = createMcpServer();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandler();
  }

  /**
   * Configures Express middleware
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: { error: 'Too many requests, please try again later' },
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logInfo(`${req.method} ${req.path}`, { 
        ip: req.ip, 
        userAgent: req.get('user-agent') 
      });
      next();
    });
  }

  /**
   * Sets up API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // API Key authentication middleware
    const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string | undefined;
      
      if (!apiKey || !isValidApiKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid or missing API key' });
      }

      // Check against configured keys
      const validKeys = [API_KEY, ADMIN_API_KEY, OPERATOR_API_KEY, VIEWER_API_KEY];
      if (!validKeys.includes(apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      next();
    };

    // REST API endpoints (fallback for non-MCP clients)
    
    // GET /api/status - Current status overview
    this.app.get('/api/status', authenticateApiKey, async (_req: Request, res: Response) => {
      try {
        const activeIncidents = await db<Incident>('incidents')
          .where('status', 'active')
          .select('*');
        
        const unresolvedAlerts = await db<Alert>('alerts')
          .where('acknowledged', false)
          .select('*');

        const metrics = getSystemMetrics();

        res.json({
          timestamp: new Date().toISOString(),
          activeIncidents: activeIncidents.length,
          unresolvedAlerts: unresolvedAlerts.length,
          systemHealth: {
            cpuUsage: metrics.cpu.usage,
            memoryUsage: metrics.memory.usagePercent,
            diskUsage: metrics.disk.usagePercent,
          },
          incidents: activeIncidents,
          alerts: unresolvedAlerts,
        });
      } catch (error) {
        logError('Failed to get status', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // GET /api/incidents - List incidents with filters
    this.app.get('/api/incidents', authenticateApiKey, async (req: Request, res: Response) => {
      try {
        const { severity, status, keyword, days } = req.query;
        let query = db<Incident>('incidents').select('*');

        if (severity) {
          query = query.where('severity', severity as string);
        }
        if (status) {
          query = query.where('status', status as string);
        }
        if (keyword) {
          query = query.where((builder) => {
            builder.where('title', 'like', `%${keyword}%`)
                   .orWhere('description', 'like', `%${keyword}%`);
          });
        }
        if (days) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - parseInt(days as string, 10));
          query = query.where('created_at', '>=', startDate.toISOString());
        }

        const incidents = await query.orderBy('created_at', 'desc');
        res.json({ count: incidents.length, incidents });
      } catch (error) {
        logError('Failed to get incidents', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // GET /api/incidents/:id - Get incident by ID
    this.app.get('/api/incidents/:id', authenticateApiKey, async (req: Request, res: Response) => {
      try {
        const incident = await db<Incident>('incidents')
          .where('id', req.params.id)
          .first();

        if (!incident) {
          return res.status(404).json({ error: 'Incident not found' });
        }

        res.json(incident);
      } catch (error) {
        logError(`Failed to get incident ${req.params.id}`, error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/incidents - Create new incident
    this.app.post('/api/incidents', authenticateApiKey, async (req: Request, res: Response) => {
      try {
        const { title, description, severity, source } = req.body;
        
        if (!title || !severity) {
          return res.status(400).json({ error: 'Title and severity are required' });
        }

        const incident: Partial<Incident> = {
          id: uuidv4(),
          title,
          description: description || null,
          severity: severity as 'P1' | 'P2' | 'P3' | 'P4',
          status: 'active',
          source: source || null,
          created_at: new Date().toISOString(),
        };

        await db<Incident>('incidents').insert(incident);
        
        // Log audit trail
        await this.logAudit('CREATE', 'incident', incident.id, req);

        // Broadcast update via WebSocket
        this.broadcastUpdate({ type: 'incident_created', data: incident });

        res.status(201).json({ message: 'Incident created', incident });
      } catch (error) {
        logError('Failed to create incident', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // PUT /api/incidents/:id - Update incident
    this.app.put('/api/incidents/:id', authenticateApiKey, async (req: Request, res: Response) => {
      try {
        const { status, assigned_to, description } = req.body;
        const updates: Record<string, unknown> = {};

        if (status) updates.status = status;
        if (assigned_to) updates.assigned_to = assigned_to;
        if (description) updates.description = description;
        if (status === 'resolved') {
          updates.resolved_at = new Date().toISOString();
        }
        updates.updated_at = new Date().toISOString();

        await db<Incident>('incidents')
          .where('id', req.params.id)
          .update(updates);

        await this.logAudit('UPDATE', 'incident', req.params.id, req);
        this.broadcastUpdate({ type: 'incident_updated', id: req.params.id, updates });

        res.json({ message: 'Incident updated' });
      } catch (error) {
        logError(`Failed to update incident ${req.params.id}`, error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // GET /api/alerts - List alerts
    this.app.get('/api/alerts', authenticateApiKey, async (req: Request, res: Response) => {
      try {
        const { acknowledged } = req.query;
        let query = db<Alert>('alerts').select('*');

        if (acknowledged !== undefined) {
          query = query.where('acknowledged', acknowledged === 'true');
        }

        const alerts = await query.orderBy('created_at', 'desc');
        res.json({ count: alerts.length, alerts });
      } catch (error) {
        logError('Failed to get alerts', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/alerts/:id/acknowledge - Acknowledge alert
    this.app.post('/api/alerts/:id/acknowledge', authenticateApiKey, async (req: Request, res: Response) => {
      try {
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const alert = await db<Alert>('alerts').where('id', req.params.id).first();
        
        if (!alert) {
          return res.status(404).json({ error: 'Alert not found' });
        }

        await db<Alert>('alerts')
          .where('id', req.params.id)
          .update({
            acknowledged: true,
            acknowledged_by: userId,
            acknowledged_at: new Date().toISOString(),
          });

        await this.logAudit('ACKNOWLEDGE', 'alert', req.params.id, req);
        this.broadcastUpdate({ type: 'alert_acknowledged', id: req.params.id, userId });

        res.json({ message: 'Alert acknowledged' });
      } catch (error) {
        logError(`Failed to acknowledge alert ${req.params.id}`, error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // GET /api/metrics - System metrics
    this.app.get('/api/metrics', authenticateApiKey, (_req: Request, res: Response) => {
      try {
        const metrics = getSystemMetrics();
        res.json(metrics);
      } catch (error) {
        logError('Failed to get metrics', error as Error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Serve static files (dashboard)
    const dashboardPath = path.join(__dirname, '../src/dashboard/dist');
    this.app.use(express.static(dashboardPath));
    
    // Catch-all for SPA routing
    this.app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(dashboardPath, 'index.html'));
    });
  }

  /**
   * Sets up WebSocket for real-time updates
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      logInfo('WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          logInfo('WebSocket message received', message);
        } catch (error) {
          logError('Failed to parse WebSocket message', error as Error);
        }
      });

      ws.on('close', () => {
        logInfo('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logError('WebSocket error', error);
      });
    });
  }

  /**
   * Broadcasts updates to all connected WebSocket clients
   */
  private broadcastUpdate(data: Record<string, unknown>): void {
    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  /**
   * Logs audit trail entries
   */
  private async logAudit(
    action: string,
    resourceType: string,
    resourceId: string | null,
    req?: Request
  ): Promise<void> {
    try {
      const auditLog: Partial<AuditLog> = {
        id: uuidv4(),
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: req?.ip || null,
        created_at: new Date().toISOString(),
      };

      await db<AuditLog>('audit_logs').insert(auditLog);
    } catch (error) {
      logError('Failed to log audit entry', error as Error);
    }
  }

  /**
   * Sets up global error handler
   */
  private setupErrorHandler(): void {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logError('Unhandled error', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Starts the MCP server with stdio transport
   */
  private async startMcpServer(): Promise<void> {
    try {
      const stdioTransport = new StdioServerTransport();
      await this.mcpServer.connect(stdioTransport);
      logInfo('MCP server started with stdio transport');
    } catch (error) {
      logError('Failed to start MCP server', error as Error);
      throw error;
    }
  }

  /**
   * Starts the HTTP server
   */
  private async startHttpServer(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(PORT, HOST, () => {
        logInfo(`HTTP server listening on http://${HOST}:${PORT}`);
        resolve();
      });
    });
  }

  /**
   * Initializes the database
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await initializeDatabase();
      logInfo('Database initialized successfully');
    } catch (error) {
      logError('Failed to initialize database', error as Error);
      throw error;
    }
  }

  /**
   * Starts the application
   */
  async start(): Promise<void> {
    try {
      logInfo('Starting SIR MCP Server...');
      
      await this.initializeDatabase();
      await this.startHttpServer();
      await this.startMcpServer();

      logInfo('SIR MCP Server started successfully');
      logInfo(`Dashboard available at http://${HOST}:${PORT}`);
      logInfo(`REST API available at http://${HOST}:${PORT}/api`);
      logInfo(`WebSocket available at ws://${HOST}:${PORT}/ws`);
    } catch (error) {
      logError('Failed to start server', error as Error);
      process.exit(1);
    }
  }

  /**
   * Gracefully shuts down the application
   */
  async shutdown(): Promise<void> {
    logInfo('Shutting down SIR MCP Server...');
    
    // Close WebSocket connections
    this.wss.close();
    this.clients.clear();

    // Close HTTP server
    this.httpServer.close();

    // Close MCP server
    await this.mcpServer.close();

    // Close database
    await closeDatabase();

    logInfo('Server shutdown complete');
  }
}

// Create and start application
const app = new SirMcpApplication();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await app.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await app.shutdown();
  process.exit(0);
});

// Start the server
app.start().catch((error) => {
  logError('Fatal error during startup', error);
  process.exit(1);
});

export default app;
