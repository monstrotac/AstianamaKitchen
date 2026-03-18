module.exports = {
  apps: [
    {
      name:        'gardeners-api',
      script:      'src/index.js',
      cwd:         '/UinderalDeployment/AstianamaKitchen/backend',
      env: {
        NODE_ENV: 'production',
      },
      // Restart automatically if the process crashes
      autorestart:   true,
      // Restart if memory climbs above 300 MB
      max_memory_restart: '300M',
      // Keep the last 14 days of logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file:    '/UinderalDeployment/AstianamaKitchen/logs/api-out.log',
      error_file:  '/UinderalDeployment/AstianamaKitchen/logs/api-err.log',
      merge_logs:  true,
    },
  ],
};
