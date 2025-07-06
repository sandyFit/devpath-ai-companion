const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Define routes
router.get('/user/:userId/progress', analyticsController.getUserProgress);
router.get('/languages/trends', analyticsController.getLanguageTrends);
router.get('/skills/gaps', analyticsController.getSkillGaps);
router.get('/learning/effectiveness', analyticsController.getLearningEffectiveness);

module.exports = router;

