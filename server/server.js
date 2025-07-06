require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const uploadRoutes = require('./routes/uploadRoutes');
const groqRoutes = require('./routes/groqRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const snowflakeRoutes = require('./routes/snowflakeRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const snowflakeConfig = require('./config/snowflake');
const snowflakeService = require('./services/snowflakeService');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connection validation with retry logic
async function connectWithRetry(retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await snowflakeService.connect();
      console.log('[Server] Connected to Snowflake successfully');
      return;
    } catch (error) {
      console.error(`[Server] Snowflake connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        const backoff = delay * Math.pow(2, i);
        console.log(`[Server] Retrying in ${backoff} ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        console.error('[Server] All Snowflake connection attempts failed');
        process.exit(1);
      }
    }
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the modular Express.js server with Groq AI integration!',
    endpoints: {
      upload: 'POST /upload - Upload and extract ZIP files',
      analysis: {
        file: 'POST /analyze/file - Analyze single file',
        batch: 'POST /analyze/batch - Analyze all extracted files',
        results: 'GET /analyze/results/:id - Get analysis result',
        allResults: 'GET /analyze/results - Get all results',
        stats: 'GET /analyze/stats - Get analysis statistics',
        types: 'GET /analyze/types - Get available analysis types'
      },
      snowflake: {
        connect: 'POST /snowflake/connect - Connect to Snowflake',
        disconnect: 'POST /snowflake/disconnect - Disconnect from Snowflake',
        status: 'GET /snowflake/status - Get connection status',
        health: 'GET /snowflake/health - Health check',
        query: 'POST /snowflake/query - Execute single query',
        batch: 'POST /snowflake/batch - Execute batch queries',
        templates: 'GET /snowflake/templates - Get query templates'
      },
      database: {
        init: 'POST /database/init - Initialize database schema',
        schema: 'GET /database/schema - Get schema information',
        projects: 'POST /database/projects - Create new project',
        projectSummary: 'GET /database/projects/:id/summary - Get project summary',
        projectStatus: 'PUT /database/projects/:id/status - Update project status',
        files: 'POST /database/files - Insert code file',
        analysis: 'POST /database/analysis - Insert analysis results',
        learningPaths: 'POST /database/learning-paths - Create learning path',
        userProgress: 'GET /database/users/:id/learning-progress - Get user progress',
        insights: 'GET /database/insights/code-quality - Get code quality insights'
      }
    }
  });
});
app.use('/', uploadRoutes);
app.use('/', groqRoutes);
app.use('/analyze', analysisRoutes);
app.use('/', snowflakeRoutes);
app.use('/', databaseRoutes);
app.use('/api/analytics', analyticsRoutes);

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

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server with connection validation
const PORT = process.env.PORT || 3800;
connectWithRetry()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[Server] Failed to start server:', err);
    process.exit(1);
  });
