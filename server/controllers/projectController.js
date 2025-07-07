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
    
    console.log(`[ProjectController] Retrieving project summary: ${projectId}`);
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }
    
    // Get project details
    const projectResult = await projectRepository.getProjectById(projectId);
    
    if (!projectResult.data) {
      return res.status(404).json({ 
        error: 'Project not found',
        details: `No project found with ID: ${projectId}`
      });
    }
    
    // Get project analytics summary
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
