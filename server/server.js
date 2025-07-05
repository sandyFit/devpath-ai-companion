require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const uploadRoutes = require('./routes/uploadRoutes');
const groqRoutes = require('./routes/groqRoutes');
const snowflakeRoutes = require('./routes/snowflakeRoutes');
const databaseRoutes = require('./routes/databaseRoutes');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/', snowflakeRoutes);
app.use('/', databaseRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start
const PORT = process.env.PORT || 3800;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
