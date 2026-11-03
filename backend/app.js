const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const authRequired = require('./middleware/authMiddleware');

const app = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'College Hostel Attendance API is running'
  });
});

app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/students', authRequired, require('./routes/studentRoutes'));
app.use('/api/rooms', authRequired, require('./routes/roomRoutes'));
app.use('/api/attendance', authRequired, require('./routes/attendanceRoutes'));
app.use('/api/academic-years', authRequired, require('./routes/academicYearRoutes'));
app.use('/api/dashboard', authRequired, require('./routes/dashboardRoutes'));
app.use('/api/reports', authRequired, require('./routes/reportRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
