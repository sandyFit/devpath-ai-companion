require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const uploadRoutes = require('./routes/uploadRoutes');
const groqRoutes = require('./routes/groqRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const snowflakeRoutes = require('./routes/snowflakeRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const learningPathRoutes = require('./routes/learningPathRoutes');
const snowflakeConfig = require('./config/snowflake');
const snowflakeService = require('./services/snowflakeService');
const projectRoutes = require('./routes/projectRoutes');

const app = express();

// Enable CORS for all origins (dev mode)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    console.log(`[ROUTING DEBUG] ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api', uploadRoutes);
app.use('/api', groqRoutes);
app.use('/api', analysisRoutes);
app.use('/api', snowflakeRoutes);
app.use('/api', databaseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api', projectRoutes);

// Database health check endpoint
app.get('/api/health/database', async (req, res) => {
  try {
    const health = await snowflakeService.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    console.error('[Server] Database health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Database health check failed',
      details: error.message
    });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 50MB.' });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server with connection validation
const PORT = process.env.PORT || 3800;
const server = app.listen(PORT, () => {
  console.log(`[SERVER] Analysis API server running on port ${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
  console.log(`[SERVER] Store analysis: http://localhost:${PORT}/api/analyze/store`);
  console.log(`[SERVER] Upload endpoint: http://localhost:${PORT}/api/upload`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('[SERVER ERROR]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});