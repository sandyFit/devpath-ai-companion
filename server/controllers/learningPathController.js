const learningPathService = require('../services/learningPathService');

async function generateLearningPath(req, res) {
  try {
    const { userId } = req.params;
    const learningPath = await learningPathService.generateAndStoreLearningPath(userId);
    res.json({
      success: true,
      data: learningPath
    });
  } catch (error) {
    console.error('[learningPathController] generateLearningPath error:', error);
    res.status(500).json({
      error: 'Failed to generate learning path',
      details: error.stack || error.message || error.toString()
    });
  }
}

async function getLearningPaths(req, res) {
  try {
    const { userId } = req.params;
    const learningPaths = await learningPathService.getLearningPaths(userId);
    res.json({
      success: true,
      data: learningPaths
    });
  } catch (error) {
    console.error('[learningPathController] getLearningPaths error:', error);
    res.status(500).json({
      error: 'Failed to retrieve learning paths',
      details: error.stack || error.message || error.toString()
    });
  }
}

module.exports = {
  generateLearningPath,
  getLearningPaths
};
