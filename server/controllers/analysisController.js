const fs = require('fs');
const path = require('path');
const analysisService = require('../services/analysisService');
const { v4: uuidv4 } = require('uuid');

const ANALYSIS_TYPES = {
  CODE_QUALITY: 'code_quality',
  COMPLEXITY: 'complexity', 
  SECURITY: 'security',
  BEST_PRACTICES: 'best_practices',
  LEARNING_GAPS: 'learning_gaps'
};

const analyzeFile = async (req, res) => {
  try {
    console.log('[AnalysisController] Received file analysis request');
    console.log('[AnalysisController] Request body:', req.body);
    
    const { filename, content, language, analysisTypes } = req.body;
    
    // Validate required fields
    if (!filename || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: filename and content are required' 
      });
    }
    
    // Use default analysis types if not provided
    const types = analysisTypes && analysisTypes.length > 0 
      ? analysisTypes 
      : Object.values(ANALYSIS_TYPES);
    
    const fileData = {
      fileId: uuidv4(),
      filename,
      language: language || analysisService.detectLanguage(filename),
      content,
      analysisTypes: types
    };
    
    const result = await analysisService.analyzeFile(fileData);
    
    console.log(`[AnalysisController] Analysis completed for file: ${filename}`);
    
    res.json({
      success: true,
      message: 'File analysis completed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in analyzeFile:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
  }
};

const analyzeExtractedFiles = async (req, res) => {
  try {
    console.log('[AnalysisController] Received batch analysis request');
    
    const { analysisTypes } = req.body;
    const extractedDir = path.join(__dirname, '..', 'extracted');
    
    // Check if extracted directory exists
    if (!fs.existsSync(extractedDir)) {
      return res.status(400).json({ 
        error: 'No extracted files found. Please upload and extract a ZIP file first.' 
      });
    }
    
    // Use default analysis types if not provided
    const types = analysisTypes && analysisTypes.length > 0 
      ? analysisTypes 
      : Object.values(ANALYSIS_TYPES);
    
    const result = await analysisService.analyzeBatch(extractedDir, types);
    
    console.log(`[AnalysisController] Batch analysis completed. Processed ${result.totalFiles} files`);
    
    res.json({
      success: true,
      message: 'Batch analysis completed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in analyzeExtractedFiles:', error);
    res.status(500).json({ 
      error: 'Batch analysis failed', 
      details: error.message 
    });
  }
};

const getAnalysisResult = async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    console.log(`[AnalysisController] Retrieving analysis result for ID: ${analysisId}`);
    
    if (!analysisId) {
      return res.status(400).json({ 
        error: 'Analysis ID is required' 
      });
    }
    
    const result = analysisService.getAnalysisResult(analysisId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in getAnalysisResult:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Analysis result not found',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to retrieve analysis result', 
      details: error.message 
    });
  }
};

const getAllAnalysisResults = async (req, res) => {
  try {
    console.log('[AnalysisController] Retrieving all analysis results');
    
    const results = analysisService.getAllAnalysisResults();
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in getAllAnalysisResults:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve analysis results', 
      details: error.message 
    });
  }
};

const getAnalysisStats = async (req, res) => {
  try {
    console.log('[AnalysisController] Retrieving analysis statistics');
    
    const stats = analysisService.getAnalysisStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in getAnalysisStats:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve analysis statistics', 
      details: error.message 
    });
  }
};

const getAvailableAnalysisTypes = (req, res) => {
  try {
    console.log('[AnalysisController] Retrieving available analysis types');
    
    res.json({
      success: true,
      data: {
        analysisTypes: Object.values(ANALYSIS_TYPES),
        descriptions: {
          [ANALYSIS_TYPES.CODE_QUALITY]: 'Evaluate code readability, maintainability, and adherence to best practices',
          [ANALYSIS_TYPES.COMPLEXITY]: 'Assess algorithmic complexity, nesting levels, and code structure complexity',
          [ANALYSIS_TYPES.SECURITY]: 'Identify potential security vulnerabilities and unsafe practices',
          [ANALYSIS_TYPES.BEST_PRACTICES]: 'Check adherence to language-specific best practices and conventions',
          [ANALYSIS_TYPES.LEARNING_GAPS]: 'Identify areas where the developer could improve their skills'
        }
      }
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in getAvailableAnalysisTypes:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve analysis types', 
      details: error.message 
    });
  }
};

module.exports = {
  analyzeFile,
  analyzeExtractedFiles,
  getAnalysisResult,
  getAllAnalysisResults,
  getAnalysisStats,
  getAvailableAnalysisTypes
};
