const express = require('express');
const router = express.Router();
const learningPathController = require('../controllers/learningPathController');

// POST /api/learning-paths/user/:userId/generate
router.post('/user/:userId/generate', learningPathController.generateLearningPath);

// GET /api/learning-paths/user/:userId
router.get('/user/:userId', learningPathController.getLearningPaths);

// GET /api/learning-paths/project/:projectId
router.get('/project/:projectId', learningPathController.getProjectLearningPaths);

module.exports = router;
