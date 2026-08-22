FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY src/dashboard/package*.json ./src/dashboard/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Build dashboard
WORKDIR /app/src/dashboard
RUN npm install && npm run build

WORKDIR /app

# Create data directory
RUN mkdir -p /app/data /app/logs /app/exports

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start with PM2
RUN npm install -g pm2
CMD ["pm2-runtime", "ecosystem.config.js"]
