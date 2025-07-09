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
const projectRoutes = require('./routes/projectRoutes');

// Use the safe Snowflake service
const snowflakeService = require('./services/snowflakeServiceSafe');

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
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: snowflakeService.getConnectionStatus()
  });
});

// Test endpoint for batch analysis
app.post('/api/test/batch-analysis', async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Mock successful batch analysis
    res.json({
      success: true,
      message: 'Test batch analysis completed',
      data: {
        projectId,
        totalFiles: 5,
        successfulAnalyses: 5,
        failedAnalyses: 0,
        storedInDatabase: 5,
        databaseAnalyses: [
          { filename: 'test1.js', analysisId: 'mock-id-1' },
          { filename: 'test2.py', analysisId: 'mock-id-2' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
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

console.log('=== Server Starting ===');
console.log('Environment check:');
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Missing');
console.log('- SNOWFLAKE_ACCOUNT:', process.env.SNOWFLAKE_ACCOUNT ? 'Set' : 'Missing');
console.log('- Database status:', snowflakeService.getConnectionStatus());

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Analysis API server running on port ${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[SERVER] Database health: http://localhost:${PORT}/api/health/database`);
  console.log(`[SERVER] Test batch analysis: POST http://localhost:${PORT}/api/test/batch-analysis`);
  console.log(`[SERVER] Original batch analysis: POST http://localhost:${PORT}/api/analyze/batch`);
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
