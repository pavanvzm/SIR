import knex, { Knex } from 'knex';
import path from 'path';

/**
 * Database configuration for better-sqlite3
 */
const dbPath = process.env.DB_PATH || './data/sir.db';

// Ensure data directory exists
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

/**
 * Knex database instance configured for SQLite
 */
export const db: Knex = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

/**
 * Incident status types
 */
export type IncidentStatus = 'active' | 'resolved' | 'escalated' | 'pending';

/**
 * Incident severity levels
 */
export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4';

/**
 * User role types for RBAC
 */
export type UserRole = 'admin' | 'operator' | 'viewer';

/**
 * Alert priority levels
 */
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Incident interface
 */
export interface Incident {
  id: string;
  title: string | null;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
  assigned_to: string | null;
  source: string | null;
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  message: string;
  priority: AlertPriority;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  source: string | null;
}

/**
 * Audit log interface
 */
export interface AuditLog {
  id: string;
  action: string;
  user_id: string | null;
  resource_type: string;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

/**
 * User interface for RBAC
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  api_key_hash: string;
  created_at: string;
  last_login: string | null;
}

/**
 * Database schema initialization and migrations
 */
export async function initializeDatabase(): Promise<void> {
  // Check if tables exist
  const hasIncidents = await db.schema.hasTable('incidents');
  
  if (!hasIncidents) {
    await runMigrations();
  }
}

/**
 * Runs database migrations
 */
export async function runMigrations(): Promise<void> {
  // Create incidents table
  await db.schema.createTableIfNotExists('incidents', (table) => {
    table.string('id').primary();
    table.string('title');
    table.text('description');
    table.enum('severity', ['P1', 'P2', 'P3', 'P4']).notNullable();
    table.enum('status', ['active', 'resolved', 'escalated', 'pending']).notNullable().defaultTo('active');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at');
    table.timestamp('resolved_at');
    table.string('assigned_to');
    table.string('source');
  });

  // Create alerts table
  await db.schema.createTableIfNotExists('alerts', (table) => {
    table.string('id').primary();
    table.string('message').notNullable();
    table.enum('priority', ['critical', 'high', 'medium', 'low']).notNullable();
    table.boolean('acknowledged').defaultTo(false);
    table.string('acknowledged_by');
    table.timestamp('acknowledged_at');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.string('source');
  });

  // Create audit_logs table
  await db.schema.createTableIfNotExists('audit_logs', (table) => {
    table.string('id').primary();
    table.string('action').notNullable();
    table.string('user_id');
    table.string('resource_type').notNullable();
    table.string('resource_id');
    table.text('details');
    table.string('ip_address');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  // Create users table for RBAC
  await db.schema.createTableIfNotExists('users', (table) => {
    table.string('id').primary();
    table.string('username').unique().notNullable();
    table.enum('role', ['admin', 'operator', 'viewer']).notNullable();
    table.string('api_key_hash').notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('last_login');
  });

  // Create metrics table for historical data
  await db.schema.createTableIfNotExists('metrics', (table) => {
    table.string('id').primary();
    table.json('cpu_data');
    table.json('memory_data');
    table.json('disk_data');
    table.timestamp('recorded_at').defaultTo(db.fn.now());
  });

  // Create indexes
  await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)');
  await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity)');
  await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged)');
  await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');
}

/**
 * Closes the database connection
 */
export async function closeDatabase(): Promise<void> {
  await db.destroy();
}
