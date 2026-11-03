const app = require('./app');
const config = require('./config/config');
const { testConnection } = require('./config/db');

async function start() {
  try {
    await testConnection();
    console.log('[db] MySQL connection OK');
  } catch (err) {
    console.error('[db] Could not connect to MySQL:', err.message);
    console.error('[db] Import backend/database/hostel_attendance.sql and check .env credentials.');
  }

  app.listen(config.port, () => {
    console.log(`[server] Hostel Attendance API running on http://localhost:${config.port}`);
    console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
  });
}

start();
