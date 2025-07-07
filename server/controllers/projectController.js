const projectRepository = require('../repositories/projectRepository');
const analysisRepository = require('../repositories/analysisRepository');

const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`[ProjectController] Retrieving project: ${projectId}`);
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }
    
    const result = await projectRepository.getProjectById(projectId);
    
    if (!result.data) {
      return res.status(404).json({ 
        error: 'Project not found',
        details: `No project found with ID: ${projectId}`
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('[ProjectController] Error in getProject:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve project', 
      details: error.message 
    });
  }
};

const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit, offset } = req.query;
    
    console.log(`[ProjectController] Retrieving projects for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }
    
    const options = {};
    if (status) options.status = status;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);
    
    const result = await projectRepository.getProjectsByUserId(userId, options);
    
    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
    
  } catch (error) {
    console.error('[ProjectController] Error in getUserProjects:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user projects', 
      details: error.message 
    });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;
    
    console.log(`[ProjectController] Updating project ${projectId} status to: ${status}`);
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }
    
    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required' 
      });
    }
    
    const result = await projectRepository.updateProjectStatus(projectId, status);
    
    res.json({
      success: true,
      message: 'Project status updated successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('[ProjectController] Error in updateProjectStatus:', error);
    res.status(500).json({ 
      error: 'Failed to update project status', 
      details: error.message 
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`[ProjectController] Deleting project: ${projectId}`);
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }
    
    const result = await projectRepository.deleteProject(projectId);
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('[ProjectController] Error in deleteProject:', error);
    res.status(500).json({ 
      error: 'Failed to delete project', 
      details: error.message 
    });
  }
};

const getProjectSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    // ✅ Use query string or body to trigger mock
    const isMock = req.query.mock === 'true' || req.body?.mock === true;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (isMock) {
      console.log(`[Mock Mode] Returning mock project summary for projectId: ${projectId}`);

      // ⬇️ Your mock data goes here
      const mockProject = {
        projectId,
        name: 'Mock AI Project',
        description: 'This is a mock project for testing frontend integration',
        status: 'COMPLETED',
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-11-10T12:00:00Z',
        totalFiles: 12,
        languages: ['JavaScript', 'Python']
      };

      const mockAnalytics = {
        totalAnalyses: 12,
        avgQualityScore: 8.5,
        avgComplexityScore: 7.2,
        avgSecurityScore: 9.0,
        totalIssues: 20,
        totalSuggestions: 40,
        topIssueTypes: [
          { type: 'Code Quality', count: 10 },
          { type: 'Security', count: 6 },
          { type: 'Complexity', count: 4 }
        ],
        languageBreakdown: [
          { language: 'JavaScript', files: 8, avgScore: 8.6 },
          { language: 'Python', files: 4, avgScore: 8.3 }
        ]
      };

      const mockLearningPaths = [
        {
          topic: 'Clean Code in JavaScript',
          type: 'video',
          url: 'https://youtube.com/clean-code-js',
          source: 'YouTube',
          estimatedTime: '25 mins'
        },
        {
          topic: 'Python Security Tips',
          type: 'article',
          url: 'https://realpython.com/python-security/',
          source: 'Real Python',
          estimatedTime: '15 mins'
        }
      ];

      return res.json({
        success: true,
        data: {
          project: mockProject,
          analytics: mockAnalytics,
          learningPaths: mockLearningPaths
        }
      });
    }

    // 🔁 Real logic follows if not mock
    console.log(`[ProjectController] Retrieving project summary: ${projectId}`);

    const projectResult = await projectRepository.getProjectById(projectId);
    if (!projectResult.data) {
      return res.status(404).json({
        error: 'Project not found',
        details: `No project found with ID: ${projectId}`
      });
    }

    let analyticsSummary = null;
    try {
      const analyticsResult = await analysisRepository.getProjectAnalyticsSummary(projectId);
      analyticsSummary = analyticsResult.data;
    } catch (analyticsError) {
      console.warn('[ProjectController] Could not retrieve analytics summary:', analyticsError.message);
    }

    res.json({
      success: true,
      data: {
        project: projectResult.data,
        analytics: analyticsSummary
      }
    });

  } catch (error) {
    console.error('[ProjectController] Error in getProjectSummary:', error);
    res.status(500).json({
      error: 'Failed to retrieve project summary',
      details: error.message
    });
  }
};


module.exports = {
  getProject,
  getUserProjects,
  updateProjectStatus,
  deleteProject,
  getProjectSummary
};
