const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Define routes
router.post('/file', analysisController.analyzeFile);
router.post('/batch', analysisController.analyzeExtractedFiles);
router.get('/results/:analysisId', analysisController.getAnalysisResult);
router.get('/results', analysisController.getAllAnalysisResults);
router.get('/stats', analysisController.getAnalysisStats);
router.get('/types', analysisController.getAvailableAnalysisTypes);
router.get('/project/:projectId/analyses', analysisController.getProjectAnalyses);
router.get('/project/:projectId/summary', analysisController.getProjectAnalyticsSummary);

module.exports = router;
