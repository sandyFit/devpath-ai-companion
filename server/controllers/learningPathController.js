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
    const isMock = req.query.mock === 'true' || req.body?.mock === true;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // ✅ Return mock response if mock flag is set
    if (isMock) {
      console.log(`[Mock Mode] Returning mock learning paths for user: ${userId}`);

      return res.json({
        success: true,
        data: [
          {
            id: 'lp1',
            topic: 'Understanding Code Complexity',
            type: 'video',
            estimatedTime: '20 mins',
            source: 'YouTube',
            url: 'https://www.youtube.com/watch?v=complexity-basics'
          },
          {
            id: 'lp2',
            topic: 'Clean Code Practices',
            type: 'article',
            estimatedTime: '10 mins',
            source: 'Medium',
            url: 'https://medium.com/clean-code-principles'
          },
          {
            id: 'lp3',
            topic: 'Secure Coding in JavaScript',
            type: 'course',
            estimatedTime: '45 mins',
            source: 'OWASP',
            url: 'https://owasp.org/www-project-top-ten/'
          }
        ]
      });
    }

    // 🧠 Real backend response
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

}

module.exports = {
  generateLearningPath,
  getLearningPaths
};
