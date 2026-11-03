require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hostel_attendance',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    multipleStatements: true,
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  auth: {
    secret: process.env.AUTH_SECRET || 'dev-hostel-attendance-secret-change-me',
    tokenTtlSeconds: parseInt(process.env.AUTH_TOKEN_TTL || '28800', 10),
  },
};

module.exports = config;
