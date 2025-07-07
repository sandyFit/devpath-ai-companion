const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const analysisRepository = require('../repositories/analysisRepository');

// Fallback ANALYSIS_TYPES if import fails
const ANALYSIS_TYPES = {
    CODE_QUALITY: 'code_quality', 
    COMPLEXITY: 'complexity', 
    SECURITY: 'security',
    BEST_PRACTICES: 'best_practices',
    LEARNING_GAPS: 'learning_gaps'
  };

// Define routes
router.post('/file', analysisController.analyzeFile);
router.post('/batch', analysisController.analyzeExtractedFiles);
router.get('/results/:analysisId', analysisController.getAnalysisResult);
router.get('/results', analysisController.getAllAnalysisResults);
router.get('/stats', analysisController.getAnalysisStats);
router.get('/types', analysisController.getAvailableAnalysisTypes);
router.get('/project/:projectId/analyses', analysisController.getProjectAnalyses);
router.get('/project/:projectId/summary', analysisController.getProjectAnalyticsSummary);
router.post('/analize/store', analysisController.storeGroqBatchAnalysis);




router.get('/debug/all', async (req, res) => {
    try {
      const rows = await analysisRepository.debugGetAnalyses();
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});
  

router.post('/debug/insert-codefile', async (req, res) => {
    try {
      const { fileId, projectId } = req.body;
      await analysisRepository.insertDummyCodeFile(fileId, projectId);
      res.json({ success: true, message: 'Dummy CODE_FILE inserted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});

  
  

module.exports = router;