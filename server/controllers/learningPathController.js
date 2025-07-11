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

    if (isMock) {
      console.log(`[Mock Mode] Returning mock learning paths for user: ${userId}`);

      return res.json({
        success: true,
        data: [
          {
            path_id: 'lp_001',
            user_id: userId,
            project_id: 'proj_abc123',
            recommended_topics: ['Secure Coding', 'Code Readability', 'Refactoring'],
            difficulty_level: 'Intermediate',
            estimated_hours: 5,
            progress_percentage: 0,
            status: 'NOT_STARTED',
            learning_objectives: [
              'Understand common security flaws in web apps',
              'Improve code structure readability',
              'Apply refactoring patterns'
            ],
            prerequisites: ['Basic JavaScript', 'Git'],
            resources: [
              {
                type: 'video',
                title: 'Secure JS Practices',
                url: 'https://example.com/secure-js-video'
              },
              {
                type: 'article',
                title: 'Refactor Like a Pro',
                url: 'https://dev.to/refactor-guide'
              },
              {
                type: 'course',
                title: 'Code Readability Masterclass',
                url: 'https://courses.dev/readability'
              }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });
    }

    // Fetch real data
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

async function getProjectLearningPaths(req, res) {
  try {
    const { projectId } = req.params;
    const isMock = req.query.mock === 'true' || req.body?.mock === true;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (isMock) {
      console.log(`[Mock Mode] Returning mock learning paths for project: ${projectId}`);

      return res.json({
        success: true,
        data: [
          {
            path_id: 'lp_project_001',
            project_id: projectId,
            recommended_topics: ['Code Quality', 'Security Best Practices', 'Performance Optimization'],
            difficulty_level: 'Intermediate',
            estimated_hours: 8,
            priority: 'HIGH',
            learning_objectives: [
              'Improve overall code quality scores',
              'Address security vulnerabilities',
              'Optimize application performance'
            ],
            based_on_analysis: true,
            resources: [
              {
                type: 'course',
                title: 'JavaScript Security Fundamentals',
                url: 'https://example.com/js-security',
                priority: 'HIGH'
              },
              {
                type: 'article',
                title: 'Code Quality Metrics That Matter',
                url: 'https://dev.to/code-quality',
                priority: 'MEDIUM'
              },
              {
                type: 'video',
                title: 'Performance Optimization Techniques',
                url: 'https://youtube.com/performance-tips',
                priority: 'MEDIUM'
              }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });
    }

    // For now, return mock data since we don't have project-specific learning path service
    // In the future, this would call learningPathService.getProjectLearningPaths(projectId)
    console.log(`[learningPathController] Returning mock project learning paths for: ${projectId}`);
    
    return res.json({
      success: true,
      data: [
        {
          path_id: 'lp_project_001',
          project_id: projectId,
          recommended_topics: ['Code Quality', 'Security Best Practices', 'Performance Optimization'],
          difficulty_level: 'Intermediate',
          estimated_hours: 8,
          priority: 'HIGH',
          learning_objectives: [
            'Improve overall code quality scores',
            'Address security vulnerabilities',
            'Optimize application performance'
          ],
          based_on_analysis: true,
          resources: [
            {
              type: 'course',
              title: 'JavaScript Security Fundamentals',
              url: 'https://example.com/js-security',
              priority: 'HIGH'
            },
            {
              type: 'article',
              title: 'Code Quality Metrics That Matter',
              url: 'https://dev.to/code-quality',
              priority: 'MEDIUM'
            },
            {
              type: 'video',
              title: 'Performance Optimization Techniques',
              url: 'https://youtube.com/performance-tips',
              priority: 'MEDIUM'
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    });

  } catch (error) {
    console.error('[learningPathController] getProjectLearningPaths error:', error);
    res.status(500).json({
      error: 'Failed to retrieve project learning paths',
      details: error.stack || error.message || error.toString()
    });
  }
}

module.exports = {
  generateLearningPath,
  getLearningPaths,
  getProjectLearningPaths
};
