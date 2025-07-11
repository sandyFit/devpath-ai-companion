const ANALYSIS_TYPES = {
  CODE_QUALITY: 'code_quality',
  COMPLEXITY: 'complexity', 
  SECURITY: 'security',
  BEST_PRACTICES: 'best_practices',
  LEARNING_GAPS: 'learning_gaps'
};

const validateAnalysisRequest = (req, res, next) => {
  try {
    console.log('[AnalysisValidation] Validating analysis request');
    
    const { filename, content, analysisTypes } = req.body;
    
    // Validate filename
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      return res.status(400).json({
        error: 'Invalid filename',
        details: 'Filename is required and must be a non-empty string'
      });
    }
    
    // Validate content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        error: 'Invalid content',
        details: 'File content is required and must be a non-empty string'
      });
    }
    
    // Validate analysis types if provided
    if (analysisTypes) {
      if (!Array.isArray(analysisTypes)) {
        return res.status(400).json({
          error: 'Invalid analysis types',
          details: 'Analysis types must be an array'
        });
      }
      
      const validTypes = Object.values(ANALYSIS_TYPES);
      const invalidTypes = analysisTypes.filter(type => !validTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          error: 'Invalid analysis types',
          details: `Invalid types: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}`
        });
      }
      
      if (analysisTypes.length === 0) {
        return res.status(400).json({
          error: 'Invalid analysis types',
          details: 'At least one analysis type must be specified'
        });
      }
    }
    
    // Validate file size (content length)
    const maxContentSize = 100000; // 100KB limit for content
    if (content.length > maxContentSize) {
      return res.status(400).json({
        error: 'Content too large',
        details: `File content exceeds maximum size of ${maxContentSize} characters`
      });
    }
    
    console.log('[AnalysisValidation] Request validation passed');
    next();
    
  } catch (error) {
    console.error('[AnalysisValidation] Validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      details: error.message
    });
  }
};

const validateBatchAnalysisRequest = (req, res, next) => {
  try {
    console.log('[AnalysisValidation] Validating batch analysis request');
    
    const { analysisTypes, projectId } = req.body;
    
    // Validate projectId is required for batch analysis
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      return res.status(400).json({
        error: 'Project ID required',
        details: 'Project ID is required for batch analysis to ensure file isolation'
      });
    }
    
    // Basic UUID format validation for projectId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({
        error: 'Invalid project ID format',
        details: 'Project ID must be a valid UUID'
      });
    }
    
    // Validate analysis types if provided
    if (analysisTypes) {
      if (!Array.isArray(analysisTypes)) {
        return res.status(400).json({
          error: 'Invalid analysis types',
          details: 'Analysis types must be an array'
        });
      }
      
      const validTypes = Object.values(ANALYSIS_TYPES);
      const invalidTypes = analysisTypes.filter(type => !validTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          error: 'Invalid analysis types',
          details: `Invalid types: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}`
        });
      }
      
      if (analysisTypes.length === 0) {
        return res.status(400).json({
          error: 'Invalid analysis types',
          details: 'At least one analysis type must be specified'
        });
      }
    }
    
    console.log('[AnalysisValidation] Batch request validation passed');
    next();
    
  } catch (error) {
    console.error('[AnalysisValidation] Batch validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      details: error.message
    });
  }
};

const validateAnalysisId = (req, res, next) => {
  try {
    console.log('[AnalysisValidation] Validating analysis ID');
    
    const { analysisId } = req.params;
    
    if (!analysisId || typeof analysisId !== 'string' || analysisId.trim() === '') {
      return res.status(400).json({
        error: 'Invalid analysis ID',
        details: 'Analysis ID is required and must be a non-empty string'
      });
    }
    
    // Basic UUID format validation (optional but recommended)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(analysisId)) {
      return res.status(400).json({
        error: 'Invalid analysis ID format',
        details: 'Analysis ID must be a valid UUID'
      });
    }
    
    console.log('[AnalysisValidation] Analysis ID validation passed');
    next();
    
  } catch (error) {
    console.error('[AnalysisValidation] Analysis ID validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      details: error.message
    });
  }
};

module.exports = {
  validateAnalysisRequest,
  validateBatchAnalysisRequest,
  validateAnalysisId,
  ANALYSIS_TYPES
};
