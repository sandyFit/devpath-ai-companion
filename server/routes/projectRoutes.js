const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const analysisController = require('../controllers/analysisController');

// Project endpoints
router.get('/project/:projectId', projectController.getProject);
router.get('/user/:userId/projects', projectController.getUserProjects);
router.put('/project/:projectId/status', projectController.updateProjectStatus);
router.delete('/project/:projectId', projectController.deleteProject);
router.get('/project/:projectId/summary', projectController.getProjectSummary);
router.get('/project/:projectId/analyses', analysisController.getProjectAnalyses); 

module.exports = router;

