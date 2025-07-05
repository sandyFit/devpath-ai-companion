const databaseInitService = require('../services/databaseInitService');
const projectRepository = require('../src/repositories/projectRepository');
const { v4: uuidv4 } = require('uuid');

const initializeDatabase = async (req, res) => {
  try {
    console.log('[DatabaseController] Received database initialization request');
    
    // Check if schema already exists
    const schemaExists = await databaseInitService.checkSchemaExists();
    
    if (schemaExists) {
      console.log('[DatabaseController] Schema already exists, skipping initialization');
      return res.json({
        success: true,
        message: 'Database schema already exists',
        data: {
          schemaExists: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Initialize the database
    const result = await databaseInitService.initializeDatabase();
    
    console.log('[DatabaseController] Database initialization completed successfully');
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      data: result
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in initializeDatabase:', error);
    res.status(500).json({
      error: 'Database initialization failed',
      details: error.message
    });
  }
};

const getSchemaInfo = async (req, res) => {
  try {
    console.log('[DatabaseController] Retrieving schema information');
    
    const schemaInfo = await databaseInitService.getSchemaInfo();
    
    res.json({
      success: true,
      data: {
        tables: schemaInfo,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in getSchemaInfo:', error);
    res.status(500).json({
      error: 'Failed to retrieve schema information',
      details: error.message
    });
  }
};

const createProject = async (req, res) => {
  try {
    console.log('[DatabaseController] Received create project request');
    console.log('[DatabaseController] Request body:', req.body);
    
    const { userId, projectName } = req.body;
    
    // Validate required fields
    if (!userId || !projectName) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId and projectName are required'
      });
    }
    
    // Create project using repository
    const result = await projectRepository.createProject({
      userId,
      projectName
    });
    
    console.log(`[DatabaseController] Project created successfully: ${result.data.projectId}`);
    
    res.json({
      success: true,
      message: 'Project created successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in createProject:', error);
    res.status(500).json({
      error: 'Project creation failed',
      details: error.message
    });
  }
};

const insertCodeFile = async (req, res) => {
  try {
    console.log('[DatabaseController] Received insert code file request');
    console.log('[DatabaseController] Request body:', req.body);
    
    const { projectId, filename, language, content } = req.body;
    
    // Validate required fields
    if (!projectId || !filename || !language || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'projectId, filename, language, and content are required'
      });
    }
    
    // Generate file ID and calculate file size
    const fileId = uuidv4();
    const fileSize = Buffer.byteLength(content, 'utf8');
    
    // Insert code file
    const result = await databaseInitService.insertCodeFile({
      fileId,
      projectId,
      filename,
      language,
      content,
      fileSize
    });
    
    console.log(`[DatabaseController] Code file inserted successfully: ${fileId}`);
    
    res.json({
      success: true,
      message: 'Code file inserted successfully',
      data: {
        fileId,
        projectId,
        filename,
        language,
        fileSize,
        result
      }
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in insertCodeFile:', error);
    res.status(500).json({
      error: 'Code file insertion failed',
      details: error.message
    });
  }
};

const insertAnalysis = async (req, res) => {
  try {
    console.log('[DatabaseController] Received insert analysis request');
    console.log('[DatabaseController] Request body:', req.body);
    
    const { 
      fileId, 
      issuesFound, 
      suggestions, 
      qualityScore, 
      complexityScore, 
      securityScore,
      strengths,
      learningRecommendations
    } = req.body;
    
    // Validate required fields
    if (!fileId || qualityScore === undefined || complexityScore === undefined || securityScore === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'fileId, qualityScore, complexityScore, and securityScore are required'
      });
    }
    
    // Generate analysis ID
    const analysisId = uuidv4();
    
    // Insert analysis
    const result = await databaseInitService.insertAnalysis({
      analysisId,
      fileId,
      issuesFound: issuesFound || [],
      suggestions: suggestions || [],
      qualityScore,
      complexityScore,
      securityScore,
      strengths: strengths || [],
      learningRecommendations: learningRecommendations || []
    });
    
    console.log(`[DatabaseController] Analysis inserted successfully: ${analysisId}`);
    
    res.json({
      success: true,
      message: 'Analysis inserted successfully',
      data: {
        analysisId,
        fileId,
        qualityScore,
        complexityScore,
        securityScore,
        result
      }
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in insertAnalysis:', error);
    res.status(500).json({
      error: 'Analysis insertion failed',
      details: error.message
    });
  }
};

const createLearningPath = async (req, res) => {
  try {
    console.log('[DatabaseController] Received create learning path request');
    console.log('[DatabaseController] Request body:', req.body);
    
    const { userId, projectId, recommendedTopics, difficultyLevel, estimatedHours } = req.body;
    
    // Validate required fields
    if (!userId || !projectId || !recommendedTopics) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId, projectId, and recommendedTopics are required'
      });
    }
    
    // Generate path ID
    const pathId = uuidv4();
    
    // Create learning path
    const result = await databaseInitService.createLearningPath({
      pathId,
      userId,
      projectId,
      recommendedTopics,
      difficultyLevel: difficultyLevel || 'INTERMEDIATE',
      estimatedHours: estimatedHours || 0
    });
    
    console.log(`[DatabaseController] Learning path created successfully: ${pathId}`);
    
    res.json({
      success: true,
      message: 'Learning path created successfully',
      data: {
        pathId,
        userId,
        projectId,
        difficultyLevel: difficultyLevel || 'INTERMEDIATE',
        estimatedHours: estimatedHours || 0,
        result
      }
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in createLearningPath:', error);
    res.status(500).json({
      error: 'Learning path creation failed',
      details: error.message
    });
  }
};

const getProjectSummary = async (req, res) => {
  try {
    console.log('[DatabaseController] Received get project summary request');
    
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        error: 'Missing project ID',
        details: 'projectId parameter is required'
      });
    }
    
    const summary = await databaseInitService.getProjectSummary(projectId);
    
    if (!summary) {
      return res.status(404).json({
        error: 'Project not found',
        details: `No project found with ID: ${projectId}`
      });
    }
    
    console.log(`[DatabaseController] Project summary retrieved for: ${projectId}`);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in getProjectSummary:', error);
    res.status(500).json({
      error: 'Failed to retrieve project summary',
      details: error.message
    });
  }
};

const getUserLearningProgress = async (req, res) => {
  try {
    console.log('[DatabaseController] Received get user learning progress request');
    
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing user ID',
        details: 'userId parameter is required'
      });
    }
    
    const progress = await databaseInitService.getUserLearningProgress(userId);
    
    if (!progress) {
      return res.status(404).json({
        error: 'User learning progress not found',
        details: `No learning progress found for user: ${userId}`
      });
    }
    
    console.log(`[DatabaseController] User learning progress retrieved for: ${userId}`);
    
    res.json({
      success: true,
      data: progress
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in getUserLearningProgress:', error);
    res.status(500).json({
      error: 'Failed to retrieve user learning progress',
      details: error.message
    });
  }
};

const getCodeQualityInsights = async (req, res) => {
  try {
    console.log('[DatabaseController] Received get code quality insights request');
    
    const { language } = req.query;
    
    const insights = await databaseInitService.getCodeQualityInsights(language);
    
    console.log(`[DatabaseController] Code quality insights retrieved`);
    
    res.json({
      success: true,
      data: {
        insights,
        language: language || 'all',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in getCodeQualityInsights:', error);
    res.status(500).json({
      error: 'Failed to retrieve code quality insights',
      details: error.message
    });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    console.log('[DatabaseController] Received update project status request');
    console.log('[DatabaseController] Request body:', req.body);
    
    const { projectId } = req.params;
    const { status } = req.body;
    
    if (!projectId || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'projectId and status are required'
      });
    }
    
    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const result = await databaseInitService.updateProjectStatus(projectId, status);
    
    console.log(`[DatabaseController] Project status updated: ${projectId} -> ${status}`);
    
    res.json({
      success: true,
      message: 'Project status updated successfully',
      data: {
        projectId,
        status,
        result
      }
    });
    
  } catch (error) {
    console.error('[DatabaseController] Error in updateProjectStatus:', error);
    res.status(500).json({
      error: 'Project status update failed',
      details: error.message
    });
  }
};

module.exports = {
  initializeDatabase,
  getSchemaInfo,
  createProject,
  insertCodeFile,
  insertAnalysis,
  createLearningPath,
  getProjectSummary,
  getUserLearningProgress,
  getCodeQualityInsights,
  updateProjectStatus
};
