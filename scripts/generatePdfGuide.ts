/**
 * Script to generate PDF Installation Guide content
 * This generates the markdown content that would be converted to PDF
 */

import fs from 'fs';
import path from 'path';

const pdfContent = `# SIR MCP Server Installation Guide

## Professional Installation Documentation for Cross-Platform MCP SIR Status Checker

**Version:** 1.0.0  
**Date:** ${new Date().toISOString().split('T')[0]}  
**Author:** SIR MCP Development Team

---

## Table of Contents

1. [Introduction](#chapter-1-introduction)
2. [Prerequisites](#chapter-2-prerequisites)
3. [Installation Steps](#chapter-3-installation-steps)
4. [Configuration](#chapter-4-configuration)
5. [Running the Application](#chapter-5-running-the-application)
6. [MCP Client Setup](#chapter-6-mcp-client-setup)
7. [Troubleshooting](#chapter-7-troubleshooting)
8. [Appendix A: API Reference](#appendix-a-api-reference)
9. [Appendix B: Security Best Practices](#appendix-b-security-best-practices)

---

## Chapter 1: Introduction

### Overview

The SIR (System Incident Response) MCP Status Checker is a production-ready, cross-platform Model Context Protocol server application designed for comprehensive incident monitoring and management. It provides real-time tracking of system incidents with severity levels (P1-P4) and status monitoring (active/resolved/escalated/pending).

### Key Features

- **Cross-Platform Support**: Native compatibility with Windows 11, macOS (Intel/Apple Silicon), and Linux distributions
- **MCP Protocol v1.0**: Full compliance with Model Context Protocol specification
- **Local-First Architecture**: SQLite database for zero-configuration deployment
- **Real-Time Monitoring**: WebSocket-based live updates
- **Role-Based Access Control**: Admin, Operator, and Viewer roles
- **REST API**: Standard HTTP endpoints for integration
- **Web Dashboard**: Modern, responsive React-based UI

### System Requirements

| Platform | Minimum Requirements |
|----------|---------------------|
| Windows 11 | 4GB RAM, 500MB disk, PowerShell 5.1+ |
| macOS 12+ | 4GB RAM, 500MB disk, Xcode CLI Tools |
| Ubuntu 20.04+ | 4GB RAM, 500MB disk, build-essential |
| Debian 11+ | 4GB RAM, 500MB disk, build-essential |
| CentOS 8+ | 4GB RAM, 500MB disk, Development Tools |

### Supported Node.js Versions

- **Required**: Node.js 20.x LTS or higher
- **Recommended**: Latest Node.js 20 LTS

---

## Chapter 2: Prerequisites

### Installing Node.js on Windows

#### Method 1: MSI Installer (Recommended)

1. Visit https://nodejs.org/
2. Download the Windows Installer (.msi) for Node.js 20 LTS
3. Run the installer and follow the wizard:
   - Accept the license agreement
   - Choose installation location (default: C:\\Program Files\\nodejs)
   - Ensure "Add to PATH" is checked
   - Install npm package manager (default)
4. Click "Finish" to complete installation

#### Verification

Open PowerShell and run:
\`\`\`powershell
node --version
npm --version
\`\`\`

Expected output:
\`\`\`
v20.x.x
10.x.x
\`\`\`

#### Method 2: Winget Package Manager

\`\`\`powershell
winget install OpenJS.NodeJS.LTS
\`\`\`

---

### Installing Node.js on macOS

#### Method 1: Homebrew (Recommended for Intel/Apple Silicon)

1. Install Homebrew if not already installed:
\`\`\`bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
\`\`\`

2. Install Node.js 20:
\`\`\`bash
brew install node@20
\`\`\`

3. Add to PATH (if needed):
\`\`\`bash
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
\`\`\`

#### Method 2: Official PKG Installer

1. Visit https://nodejs.org/
2. Download the macOS Installer (.pkg)
3. Double-click the downloaded file
4. Follow the installation wizard
5. Enter administrator password when prompted

#### Verification

\`\`\`bash
node --version
npm --version
\`\`\`

---

### Installing Node.js on Linux

#### Ubuntu/Debian

1. Remove existing Node.js (if any):
\`\`\`bash
sudo apt remove nodejs npm
\`\`\`

2. Install prerequisites:
\`\`\`bash
sudo apt update
sudo apt install -y curl gnupg ca-certificates
\`\`\`

3. Add NodeSource repository:
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
\`\`\`

4. Install Node.js:
\`\`\`bash
sudo apt install -y nodejs
\`\`\`

5. Verify installation:
\`\`\`bash
node --version
npm --version
\`\`\`

#### CentOS/RHEL

1. Install prerequisites:
\`\`\`bash
sudo yum install -y curl
\`\`\`

2. Add NodeSource repository:
\`\`\`bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
\`\`\`

3. Install Node.js:
\`\`\`bash
sudo yum install -y nodejs
\`\`\`

4. Install build tools:
\`\`\`bash
sudo yum groupinstall "Development Tools"
\`\`\`

5. Verify installation:
\`\`\`bash
node --version
npm --version
\`\`\`

---

## Chapter 3: Installation Steps

### Step 1: Clone the Repository

\`\`\`bash
git clone <repository-url>
cd sir-mcp-checker
\`\`\`

### Step 2: Install Dependencies

\`\`\`bash
npm install
\`\`\`

**Windows Note**: If you encounter build errors, run:
\`\`\`powershell
npm install --global windows-build-tools
npm rebuild better-sqlite3
\`\`\`

**macOS/Linux Note**: If you encounter node-gyp errors:
\`\`\`bash
npm rebuild
\`\`\`

### Step 3: Configure Environment

\`\`\`bash
cp .env.example .env
\`\`\`

### Step 4: Initialize Database

\`\`\`bash
npm run migrate
\`\`\`

Expected output:
\`\`\`
Starting database migration...
Database migrations completed successfully.
\`\`\`

### Step 5: Verify Installation

\`\`\`bash
npm run dev
\`\`\`

Expected output:
\`\`\`
Starting SIR MCP Server...
HTTP server listening on http://localhost:3000
MCP server started with stdio transport
SIR MCP Server started successfully
Dashboard available at http://localhost:3000
\`\`\`

---

## Chapter 4: Configuration

### Environment Variables

Edit the \`.env\` file with your settings:

\`\`\`env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_PATH=./data/sir.db

# Security - GENERATE NEW KEYS FOR PRODUCTION
API_KEY=generate-with-crypto-randomBytes(32)
ENCRYPTION_KEY=generate-32-characters-minimum

# RBAC API Keys
ADMIN_API_KEY=admin-secure-key-here
OPERATOR_API_KEY=operator-secure-key-here
VIEWER_API_KEY=viewer-secure-key-here

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/sir-mcp.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
\`\`\`

### Generating Secure Keys

Use this command to generate secure random keys:

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

Generate separate keys for:
- API_KEY
- ENCRYPTION_KEY
- ADMIN_API_KEY
- OPERATOR_API_KEY
- VIEWER_API_KEY

### Role Definitions

| Role | Permissions |
|------|-------------|
| Admin | Full access, user management, all operations |
| Operator | Create/update incidents, acknowledge alerts |
| Viewer | Read-only access to incidents and metrics |

---

## Chapter 5: Running the Application

### Development Mode

\`\`\`bash
# Start both server and dashboard
npm run dev

# Or separately
npm run dev:server    # Port 3000
npm run dev:dashboard # Port 3001
\`\`\`

### Production Mode

#### Using PM2 (Recommended)

1. Install PM2 globally:
\`\`\`bash
npm install -g pm2
\`\`\`

2. Build the application:
\`\`\`bash
npm run build
cd src/dashboard && npm run build
cd ../..
\`\`\`

3. Start with PM2:
\`\`\`bash
pm2 start ecosystem.config.js --env production
\`\`\`

4. Manage PM2:
\`\`\`bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart sir-mcp-server
pm2 stop sir-mcp-server
pm2 delete sir-mcp-server
\`\`\`

5. Save PM2 configuration:
\`\`\`bash
pm2 save
pm2 startup
\`\`\`

#### Using Docker

1. Build image:
\`\`\`bash
docker build -t sir-mcp-checker .
\`\`\`

2. Run container:
\`\`\`bash
docker run -d \\
  -p 3000:3000 \\
  -v $(pwd)/data:/app/data \\
  -v $(pwd)/logs:/app/logs \\
  --name sir-mcp \\
  sir-mcp-checker
\`\`\`

3. View logs:
\`\`\`bash
docker logs -f sir-mcp
\`\`\`

### Health Check

Verify the server is running:

\`\`\`bash
curl http://localhost:3000/health
\`\`\`

Expected response:
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

---

## Chapter 6: MCP Client Setup

### Claude Desktop Configuration

#### Windows

Location: \`%APPDATA%\\Claude\\claude_desktop_config.json\`

#### macOS

Location: \`~/Library/Application Support/Claude/claude_desktop_config.json\`

#### Linux

Location: \`~/.config/Claude/claude_desktop_config.json\`

#### Configuration Content

\`\`\`json
{
  "mcpServers": {
    "sir-status-checker": {
      "command": "node",
      "args": ["/absolute/path/to/sir-mcp-checker/dist/server.js"],
      "env": {
        "API_KEY": "your-admin-api-key",
        "NODE_ENV": "production"
      }
    }
  }
}
\`\`\`

### Cursor IDE Configuration

1. Open Cursor Settings
2. Navigate to MCP Servers
3. Add new server:

\`\`\`json
{
  "mcp": {
    "servers": {
      "sir-status-checker": {
        "command": "node",
        "args": ["/absolute/path/to/sir-mcp-checker/dist/server.js"],
        "env": {
          "API_KEY": "your-admin-api-key"
        }
      }
    }
  }
}
\`\`\`

### Testing MCP Connection

After configuration, test by asking Claude or Cursor:
- "Check the current SIR status"
- "Show me active incidents"
- "Get system metrics"

---

## Chapter 7: Troubleshooting

### Windows Issues

#### Problem: better-sqlite3 installation fails

**Solution:**
\`\`\`powershell
npm install --global windows-build-tools
npm rebuild better-sqlite3
\`\`\`

#### Problem: Permission denied on database

**Solution:**
\`\`\`powershell
mkdir data
icacls data /grant Everyone:F
\`\`\`

#### Problem: PowerShell execution policy

**Solution:**
\`\`\`powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
\`\`\`

### macOS Issues

#### Problem: node-gyp errors

**Solution:**
\`\`\`bash
xcode-select --install
npm rebuild
\`\`\`

#### Problem: Cannot read system.log

**Solution:**
\`\`\`bash
sudo chmod 644 /var/log/system.log
\`\`\`

#### Problem: Port 3000 in use

**Solution:**
\`\`\`bash
lsof -ti:3000 | xargs kill
# Or change PORT in .env
\`\`\`

### Linux Issues

#### Problem: Permission denied binding to port

**Solution:**
\`\`\`bash
# Use port > 1024
# Or set capabilities
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node
\`\`\`

#### Problem: Cannot read syslog

**Solution:**
\`\`\`bash
sudo usermod -aG adm $USER
# Log out and back in
\`\`\`

#### Problem: Missing build dependencies

**Ubuntu/Debian:**
\`\`\`bash
sudo apt install -y build-essential python3
\`\`\`

**CentOS/RHEL:**
\`\`\`bash
sudo yum groupinstall "Development Tools"
sudo yum install -y python3
\`\`\`

### General Issues

#### Problem: Database locked

**Solution:**
\`\`\`bash
rm -f data/*.db-journal data/*.db-wal data/*.db-shm
\`\`\`

#### Problem: MCP client cannot connect

**Solution:**
1. Verify server is running: \`npm run dev:server\`
2. Check logs: \`tail -f logs/sir-mcp.log\`
3. Verify paths in MCP config are absolute
4. Check firewall settings

#### Problem: Dashboard not loading

**Solution:**
\`\`\`bash
# Rebuild dashboard
cd src/dashboard
npm install
npm run build
\`\`\`

---

## Appendix A: API Reference

### Authentication

All API endpoints require the \`X-API-Key\` header:

\`\`\`http
X-API-Key: your-api-key
\`\`\`

### Endpoints

#### GET /api/status
Returns current system status.

**Response:**
\`\`\`json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "activeIncidents": 3,
  "unresolvedAlerts": 5,
  "systemHealth": {
    "cpuUsage": 45.2,
    "memoryUsage": 62.8,
    "diskUsage": 71.5
  }
}
\`\`\`

#### GET /api/incidents
List all incidents with optional filters.

**Query Parameters:**
- \`severity\`: P1, P2, P3, P4
- \`status\`: active, resolved, escalated, pending
- \`keyword\`: Search term
- \`days\`: Number of days to look back

#### POST /api/incidents
Create a new incident.

**Body:**
\`\`\`json
{
  "title": "Server Outage",
  "description": "Production server unresponsive",
  "severity": "P1",
  "source": "Monitoring System"
}
\`\`\`

#### POST /api/alerts/:id/acknowledge
Acknowledge an alert.

**Body:**
\`\`\`json
{
  "userId": "operator-123"
}
\`\`\`

#### GET /api/metrics
Returns system metrics.

**Response:**
\`\`\`json
{
  "cpu": { "usage": 45.2, "cores": 8, "model": "Intel..." },
  "memory": { "total": 17179869184, "free": 6442450944 },
  "disk": { "total": 500000000000, "free": 150000000000 },
  "platform": "darwin",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

---

## Appendix B: Security Best Practices

### 1. Key Management

- Never commit \`.env\` files to version control
- Generate unique keys for each environment
- Rotate keys regularly (every 90 days recommended)
- Use secrets management in production (AWS Secrets Manager, HashiCorp Vault)

### 2. Network Security

- Deploy behind reverse proxy (nginx, Apache)
- Enable TLS/SSL for all connections
- Configure firewall rules:
  - Allow only necessary ports (3000, 3001)
  - Restrict access by IP when possible
- Use rate limiting (configured by default)

### 3. Access Control

- Implement principle of least privilege
- Use appropriate RBAC roles
- Regularly audit user access
- Monitor failed authentication attempts

### 4. Data Protection

- Encryption key must be 32+ characters
- Store encryption key securely
- Regular database backups
- Encrypt backups at rest

### 5. Logging & Monitoring

- Enable structured JSON logging
- Monitor log files for anomalies
- Set up log rotation (configured by default)
- Retain audit logs for compliance

### 6. Updates & Maintenance

- Keep Node.js updated to latest LTS
- Regularly update npm dependencies
- Monitor security advisories
- Test updates in staging first

### 7. Production Checklist

- [ ] Change all default API keys
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up log monitoring
- [ ] Configure automated backups
- [ ] Set up health check monitoring
- [ ] Document recovery procedures
- [ ] Test disaster recovery

---

## Contact & Support

For additional support:
- Documentation: See README.md
- Issues: GitHub Issues
- Emergency: Contact your system administrator

**Document Version:** 1.0.0  
**Last Updated:** ${new Date().toISOString().split('T')[0]}
`;

// Write the content to a file
const outputPath = path.join(process.cwd(), 'docs', 'SIR_MCP_Install_Guide.md');
fs.writeFileSync(outputPath, pdfContent, 'utf8');

console.log(`Installation guide generated at: ${outputPath}`);
console.log('To convert to PDF, use a tool like:');
console.log('  - pandoc: pandoc docs/SIR_MCP_Install_Guide.md -o docs/SIR_MCP_Install_Guide.pdf');
console.log('  - wkhtmltopdf: wkhtmltopdf docs/SIR_MCP_Install_Guide.md docs/SIR_MCP_Install_Guide.pdf');
console.log('  - Chrome Print to PDF: Open in browser and print to PDF');
