const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Project endpoints
router.get('/api/project/:projectId', projectController.getProject);
router.get('/api/user/:userId/projects', projectController.getUserProjects);
router.put('/api/project/:projectId/status', projectController.updateProjectStatus);
router.delete('/api/project/:projectId', projectController.deleteProject);
router.get('/api/project/:projectId/summary', projectController.getProjectSummary);

module.exports = router;
