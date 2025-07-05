const express = require('express');
const router = express.Router();
const {
  connect,
  disconnect,
  executeQuery,
  executeBatch,
  getConnectionStatus,
  healthCheck,
  getQueryTemplates
} = require('../controllers/snowflakeController');
const {
  validateQueryRequest,
  validateBatchRequest,
  validateEnvironmentConfig,
  rateLimitMiddleware
} = require('../middleware/snowflakeValidation');

// Apply rate limiting to all Snowflake routes
router.use('/snowflake', rateLimitMiddleware);

// Connection management endpoints
router.post('/snowflake/connect', validateEnvironmentConfig, connect);
router.post('/snowflake/disconnect', disconnect);
router.get('/snowflake/status', getConnectionStatus);
router.get('/snowflake/health', healthCheck);

// Query execution endpoints
router.post('/snowflake/query', validateEnvironmentConfig, validateQueryRequest, executeQuery);
router.post('/snowflake/batch', validateEnvironmentConfig, validateBatchRequest, executeBatch);

// Utility endpoints
router.get('/snowflake/templates', getQueryTemplates);

module.exports = router;
