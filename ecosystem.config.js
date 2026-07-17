module.exports = {
  apps: [
    {
      name: 'vendure-api',
      script: 'dist/index.js',
      cwd: 'apps/server',
      // Cluster mode: spawns one process per CPU core — massively improves
      // throughput and handles concurrent shop/checkout requests in parallel.
      instances: 'max',
      exec_mode: 'cluster',
      // Auto-restart if the process leaks memory beyond 512 MB
      max_memory_restart: '512M',
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
