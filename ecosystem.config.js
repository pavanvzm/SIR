module.exports = {
  apps: [{
    name: 'sir-mcp-server',
    script: './dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
    },
    error_file: './logs/pm2-err.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
  }],
};
