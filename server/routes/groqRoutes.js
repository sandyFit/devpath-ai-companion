const express = require('express');
const router = express.Router();
const {
  analyzeFile,
  analyzeExtractedFiles,
  getAnalysisResult,
  getAllAnalysisResults,
  getAnalysisStats,
  getAvailableAnalysisTypes,
  getProjectAnalyses,
  getProjectAnalyticsSummary
} = require('../controllers/analysisController');
const {
  validateAnalysisRequest,
  validateBatchAnalysisRequest,
  validateAnalysisId
} = require('../middleware/analysisValidation');
const analysisRepository = require('../repositories/analysisRepository');
const snowflakeService = require('../services/snowflakeService');

// Analysis endpoints
router.post('/analyze/file', validateAnalysisRequest, analyzeFile);
router.post('/analyze/batch', validateBatchAnalysisRequest, analyzeExtractedFiles);
router.get('/analyze/results/:analysisId', validateAnalysisId, getAnalysisResult);
router.get('/analyze/results', getAllAnalysisResults);
router.get('/analyze/stats', getAnalysisStats);
router.get('/analyze/types', getAvailableAnalysisTypes);

// Project analysis endpoints
router.get('/api/analysis/:projectId', getProjectAnalyses);
router.get('/api/analysis/:projectId/summary', getProjectAnalyticsSummary);

// DEBUG ENDPOINTS - Add debugging endpoints to help diagnose database issues
router.get('/debug/database/health', async (req, res) => {
  try {
    console.log('[DEBUG] Checking database health...');
    const health = await snowflakeService.healthCheck();
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DEBUG] Database health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/debug/database/recent-analyses', async (req, res) => {
  try {
    console.log('[DEBUG] Fetching recent analyses from database...');
    const recentAnalyses = await analysisRepository.debugGetAnalyses();
    res.json({
      success: true,
      count: recentAnalyses.length,
      data: recentAnalyses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DEBUG] Failed to fetch recent analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent analyses',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/debug/database/test-query', async (req, res) => {
  try {
    console.log('[DEBUG] Testing basic database query...');
    const testQuery = 'SELECT CURRENT_TIMESTAMP() as CURRENT_TIME, CURRENT_DATABASE() as DATABASE_NAME';
    const result = await snowflakeService.executeQuery(testQuery, [], { timeout: 10000 });
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DEBUG] Test query failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test query failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/debug/database/test-insert', async (req, res) => {
  try {
    console.log('[DEBUG] Testing database insert...');
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required for test insert'
      });
    }

    const testAnalysisData = {
      fileId: 'test-file-id-' + Date.now(),
      projectId: projectId,
      analysisType: 'code_quality',
      filename: 'test-debug-file.js',
      language: 'javascript',
      issuesFound: [{ type: 'test', description: 'This is a test issue' }],
      suggestions: ['This is a test suggestion'],
      qualityScore: 7,
      complexityScore: 5,
      securityScore: 8,
      strengths: ['Test strength'],
      learningRecommendations: ['Test learning recommendation']
    };

    console.log('[DEBUG] Test analysis data:', JSON.stringify(testAnalysisData, null, 2));
    const result = await analysisRepository.createAnalysis(testAnalysisData);
    
    res.json({
      success: true,
      message: 'Test insert completed',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DEBUG] Test insert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test insert failed',
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
