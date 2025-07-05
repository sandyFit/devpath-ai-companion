const express = require('express');
const router = express.Router();
const {
  initializeDatabase,
  getSchemaInfo,
  createProject,
  insertCodeFile,
  insertAnalysis,
  createLearningPath,
  getProjectSummary,
  getUserLearningProgress,
  getCodeQualityInsights,
  updateProjectStatus
} = require('../controllers/databaseController');
const {
  validateEnvironmentConfig,
  rateLimitMiddleware
} = require('../middleware/snowflakeValidation');

// Apply rate limiting to all database routes
router.use('/database', rateLimitMiddleware);

// Database management endpoints
router.post('/database/init', validateEnvironmentConfig, initializeDatabase);
router.get('/database/schema', validateEnvironmentConfig, getSchemaInfo);

// Project management endpoints
router.post('/database/projects', validateEnvironmentConfig, createProject);
router.get('/database/projects/:projectId/summary', validateEnvironmentConfig, getProjectSummary);
router.put('/database/projects/:projectId/status', validateEnvironmentConfig, updateProjectStatus);

// Code file management endpoints
router.post('/database/files', validateEnvironmentConfig, insertCodeFile);

// Analysis management endpoints
router.post('/database/analysis', validateEnvironmentConfig, insertAnalysis);

// Learning path management endpoints
router.post('/database/learning-paths', validateEnvironmentConfig, createLearningPath);
router.get('/database/users/:userId/learning-progress', validateEnvironmentConfig, getUserLearningProgress);

// Analytics and insights endpoints
router.get('/database/insights/code-quality', validateEnvironmentConfig, getCodeQualityInsights);

module.exports = router;
