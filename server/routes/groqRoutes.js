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

module.exports = router;
