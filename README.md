# Cross-Platform MCP SIR Status Checker

A production-ready, cross-platform Model Context Protocol (MCP) server application for System Incident Response (SIR) status monitoring. Fully compatible with Windows 11, macOS (Intel/Apple Silicon), and Linux (Ubuntu/Debian/CentOS).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## Features

- **Cross-Platform Compatibility**: Runs without modification on Windows, macOS, and Linux
- **MCP Server Implementation**: Follows official MCP specification v1.0 strictly
- **Real-Time SIR Monitoring**: Track incident status (active/resolved/escalated/pending) and severity (P1-P4)
- **Local-First Architecture**: SQLite database for zero-config setup
- **Multi-Source Aggregation**: OS-aware metrics collection
- **Real-Time Updates**: WebSocket support for live dashboard updates
- **REST API Fallback**: Standard HTTP endpoints for non-MCP clients
- **Role-Based Access Control**: Admin/Operator/Viewer roles
- **Dark/Light Mode**: Modern responsive web dashboard

## Prerequisites

- **Node.js 20+ LTS** ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

### Platform-Specific Requirements

#### Windows 11
- PowerShell 5.1+ (included with Windows)
- Microsoft Build Tools (installed automatically with npm)

#### macOS (Intel/Apple Silicon)
- Xcode Command Line Tools: `xcode-select --install`

#### Linux (Ubuntu/Debian/CentOS)
- Build essentials: `sudo apt install build-essential` (Ubuntu/Debian)
- Or: `sudo yum groupinstall "Development Tools"` (CentOS)

## Installation

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd sir-mcp-checker

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Initialize the database
npm run migrate

# Start development server
npm run dev
```

### Detailed Installation by Platform

#### Windows 11

```powershell
# 1. Install Node.js from https://nodejs.org/ (LTS version)

# 2. Clone repository
git clone <repository-url>
cd sir-mcp-checker

# 3. Install dependencies
npm install

# 4. Configure environment
copy .env.example .env

# 5. Run migrations
npm run migrate

# 6. Start development
npm run dev
```

#### macOS

```bash
# 1. Install Node.js via Homebrew
brew install node@20

# Or download from https://nodejs.org/

# 2. Clone repository
git clone <repository-url>
cd sir-mcp-checker

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env

# 5. Run migrations
npm run migrate

# 6. Start development
npm run dev
```

#### Linux (Ubuntu/Debian)

```bash
# 1. Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install build tools
sudo apt-get install -y build-essential

# 3. Clone repository
git clone <repository-url>
cd sir-mcp-checker

# 4. Install dependencies
npm install

# 5. Configure environment
cp .env.example .env

# 6. Run migrations
npm run migrate

# 7. Start development
npm run dev
```

#### Linux (CentOS/RHEL)

```bash
# 1. Install Node.js 20 via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 2. Install build tools
sudo yum groupinstall "Development Tools"

# 3. Clone repository
git clone <repository-url>
cd sir-mcp-checker

# 4. Install dependencies
npm install

# 5. Configure environment
cp .env.example .env

# 6. Run migrations
npm run migrate

# 7. Start development
npm run dev
```

## Configuration

### Environment Variables (.env)

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_PATH=./data/sir.db

# Security
API_KEY=your-secure-api-key-here-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here!!

# Authentication (RBAC)
ADMIN_API_KEY=admin-key-change-me
OPERATOR_API_KEY=operator-key-change-me
VIEWER_API_KEY=viewer-key-change-me

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/sir-mcp.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generating Secure Keys

```bash
# Generate a secure API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use this for API_KEY, ENCRYPTION_KEY, and RBAC keys
```

## Usage

### Development Mode

```bash
# Start both server and dashboard
npm run dev

# Or start separately
npm run dev:server    # Backend server (port 3000)
npm run dev:dashboard # React dashboard (port 3001)
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Build dashboard
cd src/dashboard && npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

### Docker Deployment

```bash
# Build image
docker build -t sir-mcp-checker .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --name sir-mcp \
  sir-mcp-checker
```

## MCP Client Setup

### Claude Desktop Configuration

Add to your Claude Desktop config file:

#### Windows
`%APPDATA%\Claude\claude_desktop_config.json`

#### macOS
`~/Library/Application Support/Claude/claude_desktop_config.json`

#### Linux
`~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sir-status-checker": {
      "command": "node",
      "args": ["/path/to/sir-mcp-checker/dist/server.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor IDE Configuration

In Cursor settings, add MCP server:

```json
{
  "mcp": {
    "servers": {
      "sir-status-checker": {
        "command": "node",
        "args": ["/path/to/sir-mcp-checker/dist/server.js"]
      }
    }
  }
}
```

## Available MCP Resources

| Resource URI | Description |
|-------------|-------------|
| `sir://current-status` | JSON summary of active incidents |
| `sir://incidents/{id}` | Detailed incident object |
| `sir://history?range={days}` | Historical data array |
| `sir://metrics` | System health metrics (CPU, Mem, Disk) |
| `sir://alerts/unresolved` | List of unacknowledged alerts |

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `check_sir_status` | Returns current status overview |
| `get_incident_details` | Fetches full incident timeline by ID |
| `search_incidents` | Filters by severity, date, status, or keyword |
| `create_incident_report` | Generates PDF/CSV report |
| `acknowledge_alert` | Updates alert status with user/timestamp |

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Current status overview |
| GET | `/api/incidents` | List incidents (with filters) |
| GET | `/api/incidents/:id` | Get incident by ID |
| POST | `/api/incidents` | Create new incident |
| PUT | `/api/incidents/:id` | Update incident |
| GET | `/api/alerts` | List alerts |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/metrics` | System metrics |

All API endpoints require `X-API-Key` header authentication.

## Dashboard Access

Open your browser to:
- **Development**: `http://localhost:3001`
- **Production**: `http://localhost:3000`

Features:
- Real-time incident monitoring
- Alert acknowledgment workflow
- System metrics visualization
- Dark/Light theme toggle
- Responsive design (desktop/tablet/mobile)

## Troubleshooting

### Common Issues

#### Windows

**Issue**: `better-sqlite3` installation fails
```powershell
# Solution: Install build tools
npm install --global windows-build-tools
npm rebuild better-sqlite3
```

**Issue**: Permission denied on database
```powershell
# Solution: Ensure data directory exists and is writable
mkdir data
icacls data /grant Everyone:F
```

#### macOS

**Issue**: `node-gyp` errors during installation
```bash
# Solution: Rebuild native modules
npm rebuild
```

**Issue**: Cannot read syslog
```bash
# Solution: Grant terminal access to system logs
sudo chmod 644 /var/log/system.log
```

#### Linux

**Issue**: Permission denied on port 3000
```bash
# Solution: Use port > 1024 or set capabilities
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node
```

**Issue**: Cannot read /var/log/syslog
```bash
# Solution: Add user to adm group
sudo usermod -aG adm $USER
# Log out and back in
```

### General Troubleshooting

**Issue**: Database locked
```bash
# Solution: Remove lock files
rm -f data/*.db-journal data/*.db-wal data/*.db-shm
```

**Issue**: MCP client cannot connect
```bash
# Verify server is running
npm run dev:server

# Check logs
tail -f logs/sir-mcp.log
```

## Security Best Practices

1. **Change Default Keys**: Always change default API keys in production
2. **Use HTTPS**: Deploy behind a reverse proxy with TLS
3. **Firewall Rules**: Restrict access to necessary ports only
4. **Regular Updates**: Keep dependencies updated
5. **Audit Logs**: Review audit_logs table regularly
6. **Encryption Key**: Store encryption key securely (use secrets manager)

## Project Structure

```
sir-mcp-checker/
├── src/
│   ├── server.ts           # Main entry point
│   ├── mcp/
│   │   └── server.ts       # MCP server implementation
│   ├── db/
│   │   ├── schema.ts       # Database schema & migrations
│   │   └── migrate.ts      # Migration script
│   ├── utils/
│   │   ├── logger.ts       # Winston logging
│   │   ├── osMetrics.ts    # Cross-platform metrics
│   │   ├── encryption.ts   # AES-256 encryption
│   │   └── pdfGenerator.ts # Report generation
│   └── dashboard/          # React dashboard
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── components/
│       │       ├── Dashboard.tsx
│       │       ├── Incidents.tsx
│       │       ├── Alerts.tsx
│       │       └── Settings.tsx
│       └── dist/           # Built dashboard
├── tests/
│   └── osMetrics.test.ts
├── data/                   # SQLite database
├── logs/                   # Application logs
├── exports/                # Generated reports
├── .env.example
├── ecosystem.config.js     # PM2 configuration
├── Dockerfile
└── package.json
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please open an issue on the GitHub repository.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Compatible With**: Windows 11, macOS 12+, Ubuntu 20.04+, Debian 11+, CentOS 8+
