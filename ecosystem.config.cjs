module.exports = {
  apps: [
    {
      name: "portfolio-cms",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "5174",
        ADMIN_TOKEN: "change-this-admin-token"
      }
    }
  ]
};
