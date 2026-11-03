const app = require('./app');
const config = require('./config/config');
const { testConnection } = require('./config/db');

async function start() {
  try {
    await testConnection();
    console.log('[db] MySQL connection OK');
  } catch (err) {
    console.error('[db] Could not connect to MySQL:', err.message);
  }

  const PORT = process.env.PORT || config.port || 5000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] Hostel Attendance API running on port ${PORT}`);
    console.log(`[server] Health check: /api/health`);
  });
}

start();