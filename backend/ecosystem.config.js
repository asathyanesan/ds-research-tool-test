// PM2 Ecosystem Configuration
// This file configures how PM2 manages your Node.js backend process

module.exports = {
  apps: [{
    name: 'ds-research',
    script: './server.js',
    
    // Runtime configuration
    instances: 1,
    exec_mode: 'fork',
    
    // Environment variables (overridden by .env file)
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Resource limits
    max_memory_restart: '500M',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000
  }]
};
