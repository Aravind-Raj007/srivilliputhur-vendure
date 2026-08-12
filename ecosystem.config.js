module.exports = {
  apps: [
    {
      name: 'vendure-api',
      script: 'dist/index.js',
      cwd: 'apps/server',
      // Set to 2 instances max to avoid RAM swapping and DB pool exhaustion on VPS
      instances: process.env.PM2_INSTANCES ? parseInt(process.env.PM2_INSTANCES, 10) : 2,
      exec_mode: 'cluster',
      // Auto-restart if the process leaks memory beyond 400 MB
      max_memory_restart: '400M',
      // Restart automatically at 4am (low-traffic) for a fresh slate
      cron_restart: '0 4 * * *',
      // Log files on the server
      out_file: '/var/log/pm2/vendure-api-out.log',
      error_file: '/var/log/pm2/vendure-api-error.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        APP_ENV: 'prod',
      },
    },
    {
      name: 'vendure-worker',
      script: 'dist/index-worker.js',
      cwd: 'apps/server',
      // Worker MUST stay as fork (single instance) — Vendure job queue
      // is not designed for multiple concurrent worker processes.
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      out_file: '/var/log/pm2/vendure-worker-out.log',
      error_file: '/var/log/pm2/vendure-worker-error.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'prod',
      },
    },
  ],
};
