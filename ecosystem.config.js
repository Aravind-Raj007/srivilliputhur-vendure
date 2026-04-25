module.exports = {
  apps: [
    {
      name: 'vendure-api',
      script: 'dist/index.js',
      cwd: 'apps/server',
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
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'prod',
      },
    },
  ],
};
