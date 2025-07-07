const fs = require('fs');
const path = require('path');
const { analysisService, ANALYSIS_TYPES } = require('../services/analysisService');
const analysisRepository = require('../repositories/analysisRepository');
const projectRepository = require('../repositories/projectRepository');
const { v4: uuidv4 } = require('uuid');


const analyzeFile = async (req, res) => {
  try {
    console.log('[AnalysisController] Received file analysis request');
    console.log('[AnalysisController] Request body:', req.body);
    
    const { filename, content, language, analysisTypes, projectId } = req.body;
    
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
    
    // Perform analysis using existing service
    const analysisResult = await analysisService.analyzeFile(fileData);
    
    // Store analysis in Snowflake if we have the analysis data
    let storedAnalysis = null;
    if (analysisResult && analysisResult.analysis) {
      try {
        const analysisData = {
          fileId: result.fileId,
          issuesFound: analysisResult.analysis.issues || [],
          suggestions: analysisResult.analysis.suggestions || [],
          qualityScore: analysisResult.analysis.qualityScore || 5,
          complexityScore: analysisResult.analysis.complexityScore || 5,
          securityScore: analysisResult.analysis.securityScore || 5,
          strengths: analysisResult.analysis.strengths || [],
          learningRecommendations: analysisResult.analysis.learningRecommendations || [],
          filename: fileData.filename,
          language: fileData.language
        };

        storedAnalysis = await analysisRepository.createAnalysis(analysisData);
        console.log(`[AnalysisController] Analysis stored in database: ${storedAnalysis.data.analysisId}`);
        
        // Update project status if projectId provided
        if (projectId) {
          try {
            await projectRepository.updateProjectStatus(projectId, 'PROCESSING');
          } catch (projectError) {
            console.warn('[AnalysisController] Could not update project status:', projectError.message);
          }
        }
        
      } catch (dbError) {
        console.warn('[AnalysisController] Could not store analysis in database:', dbError.message);
      }
    }
    
    console.log(`[AnalysisController] Analysis completed for file: ${filename}`);
    
    res.json({
      success: true,
      message: 'File analysis completed successfully',
      data: {
        ...analysisResult,
        databaseAnalysisId: storedAnalysis?.data?.analysisId || null,
        projectId: projectId || null,
        storedInDatabase: !!storedAnalysis
      }
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
    
    const { analysisTypes, projectId } = req.body;
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
    
    // Update project status to processing if projectId provided
    if (projectId) {
      try {
        await projectRepository.updateProjectStatus(projectId, 'PROCESSING');
        console.log(`[AnalysisController] Updated project ${projectId} status to PROCESSING`);
      } catch (projectError) {
        console.warn('[AnalysisController] Could not update project status:', projectError.message);
      }
    }
    
    // Perform batch analysis using existing service
    const batchResult = await analysisService.analyzeBatch(extractedDir, types);
    
    // Store successful analyses in Snowflake
    const storedAnalyses = [];
    let successfulStores = 0;
    
    for (const result of batchResult.results) {
      if (!result.error && result.analysis) {
        try {
          const analysisData = {
            fileId: result.fileId || uuidv4(),
            projectId: projectId || null, 
            issuesFound: result.analysis.issues || [],
            suggestions: result.analysis.suggestions || [],
            qualityScore: result.analysis.qualityScore || 5,
            complexityScore: result.analysis.complexityScore || 5,
            securityScore: result.analysis.securityScore || 5,
            strengths: result.analysis.strengths || [],
            learningRecommendations: result.analysis.learningRecommendations || []
          };

          const storedAnalysis = await analysisRepository.createAnalysis(analysisData);
          storedAnalyses.push({
            filename: result.filename,
            analysisId: storedAnalysis.data.analysisId,
            originalAnalysisId: result.analysisId
          });
          successfulStores++;
          
        } catch (dbError) {
          console.warn(`[AnalysisController] Could not store analysis for ${result.filename}:`, dbError.message);
        }
      }
    }
    
    // Update project status to completed if projectId provided and all analyses succeeded
    if (projectId && batchResult.failedAnalyses === 0) {
      try {
        await projectRepository.updateProjectStatus(projectId, 'COMPLETED');
        console.log(`[AnalysisController] Updated project ${projectId} status to COMPLETED`);
      } catch (projectError) {
        console.warn('[AnalysisController] Could not update project status to completed:', projectError.message);
      }
    } else if (projectId && batchResult.failedAnalyses > 0) {
      try {
        await projectRepository.updateProjectStatus(projectId, 'FAILED');
        console.log(`[AnalysisController] Updated project ${projectId} status to FAILED due to analysis failures`);
      } catch (projectError) {
        console.warn('[AnalysisController] Could not update project status to failed:', projectError.message);
      }
    }
    
    console.log(`[AnalysisController] Batch analysis completed. Processed ${batchResult.totalFiles} files, stored ${successfulStores} in database`);
    
    res.json({
      success: true,
      message: 'Batch analysis completed successfully',
      data: {
        ...batchResult,
        projectId: projectId || null,
        storedInDatabase: successfulStores,
        databaseAnalyses: storedAnalyses
      }
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in analyzeExtractedFiles:', error);
    
    // Update project status to failed if projectId provided
    if (req.body.projectId) {
      try {
        await projectRepository.updateProjectStatus(req.body.projectId, 'FAILED');
      } catch (projectError) {
        console.warn('[AnalysisController] Could not update project status to failed:', projectError.message);
      }
    }
    
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
    
    // Try to get from Snowflake first
    let result = null;
    try {
      const dbResult = await analysisRepository.getAnalysisById(analysisId);
      if (dbResult) {
        result = dbResult.data;
        console.log(`[AnalysisController] Found analysis in database: ${analysisId}`);
      }
    } catch (dbError) {
      console.warn('[AnalysisController] Could not retrieve from database:', dbError.message);
    }
    
    // Fallback to in-memory storage
    if (!result) {
      try {
        result = analysisService.getAnalysisResult(analysisId);
        console.log(`[AnalysisController] Found analysis in memory: ${analysisId}`);
      } catch (memoryError) {
        return res.status(404).json({ 
          error: 'Analysis result not found',
          details: `No analysis found with ID: ${analysisId}`
        });
      }
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in getAnalysisResult:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve analysis result', 
      details: error.message 
    });
  }
};

const getAllAnalysisResults = async (req, res) => {
  try {
    console.log('[AnalysisController] Retrieving all analysis results');
    
    // Get from both sources
    let dbResults = [];
    let memoryResults = [];
    
    try {
      // Note: This would need a method to get all analyses, which we don't have yet
      // For now, we'll use the in-memory results
      memoryResults = analysisService.getAllAnalysisResults();
    } catch (memoryError) {
      console.warn('[AnalysisController] Could not retrieve from memory:', memoryError.message);
    }
    
    const allResults = [...dbResults, ...memoryResults];
    
    res.json({
      success: true,
      count: allResults.length,
      data: allResults,
      sources: {
        database: dbResults.length,
        memory: memoryResults.length
      }
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
    
    // Get stats from memory (existing implementation)
    const memoryStats = analysisService.getAnalysisStats();
    
    // TODO: Add database stats when we have more repository methods
    // For now, return the memory stats
    
    res.json({
      success: true,
      data: memoryStats
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

// New endpoint to get project analyses
const getProjectAnalyses = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit, offset, minQualityScore, maxComplexityScore } = req.query;
    
    console.log(`[AnalysisController] Retrieving analyses for project: ${projectId}`);
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }
    
    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);
    if (minQualityScore) options.minQualityScore = parseFloat(minQualityScore);
    if (maxComplexityScore) options.maxComplexityScore = parseFloat(maxComplexityScore);
    
    const result = await analysisRepository.getAnalysesByProjectId(projectId, options);
    
    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in getProjectAnalyses:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve project analyses', 
      details: error.message 
    });
  }
};

// New endpoint to get project analytics summary
const getProjectAnalyticsSummary = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`[AnalysisController] Retrieving analytics summary for project: ${projectId}`);
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }
    
    const result = await analysisRepository.getProjectAnalyticsSummary(projectId);
    
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('[AnalysisController] Error in getProjectAnalyticsSummary:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve project analytics', 
      details: error.message 
    });
  }
};

const storeGroqBatchAnalysis = async (req, res) => {
  try {
    console.log('[Mock Mode] Returning fake Groq batch analysis results');

    // 🔁 Return mock response if `mock` flag is present
    if (req.body.mock === true) {
      // Simulate an LLM delay
      await new Promise((res) => setTimeout(res, 1500));

      return res.status(200).json({
        success: true,
        message: 'Mock Groq batch analysis stored successfully',
        projectId: req.body.projectId || 'mock-project-id',
        analysisIds: ['mock-analysis-1', 'mock-analysis-2'],
        data: [
          {
            analysisId: 'eeafb2fb-a399-4284-841d-adb710040b78',
            qualityScore: 8,
            complexityScore: 7,
            securityScore: 9,
            issues: [
              { type: 'Unused import', description: 'The \'os\' module is imported but not used.' },
              { type: 'Magic number', description: 'The number 1024 is used multiple times, consider defining a constant.' },
              { type: 'Error handling', description: 'The error handling in the \'file_uploader_component\' function can be improved.' }
            ],
            strengths: ['Good use of docstrings for function documentation.', 'Consistent coding style throughout the code.'],
            suggestions: [
              'Consider adding input validation for the \'api_url\' and \'user_role\' parameters.',
              'Use a more robust way to handle file uploads, such as using a library like \'requests\' instead of \'httpx\'.'
            ],
            learningRecommendations: [
              'Learn about best practices for error handling in Python.',
              'Study the \'requests\' library for making HTTP requests in Python.'
            ]
          },
          {
            analysisId: 'project-level-id-1',
            overallScore: 7,
            mainIssues: ['Poor modularity'],
            suggestions: ['Split components by concern'],
            recommendedTopics: ['React architecture', 'SOLID principles']
          }
        ]
      });
    }


    console.log('[AnalysisController] Storing Groq batch analysis results');

    const { results, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        error: 'Missing required "projectId"'
      });
    }

    if (!Array.isArray(results)) {
      return res.status(400).json({
        error: 'Missing or invalid "results" array in request body'
      });
    }

    const storedAnalyses = [];
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      const { analysisId, fileId, analysis } = results[i];

      if (!analysis) {
        errors.push(`Result ${i + 1}: Missing "analysis" object`);
        continue;
      }

      try {
        const analysisData = {
          analysisId,
          fileId: fileId || uuidv4(),
          projectId,
          analysisType: results[i].analysisTypes?.join(', ') || 'unspecified',
          issuesFound: analysis.issues || [],
          suggestions: analysis.suggestions || [],
          qualityScore: analysis.qualityScore ?? 5,
          complexityScore: analysis.complexityScore ?? 5,
          securityScore: analysis.securityScore ?? 5,
          strengths: analysis.strengths || [],
          learningRecommendations: analysis.learningRecommendations || []
        };
        
        
        const stored = await analysisRepository.createAnalysis(analysisData);

        if (stored?.success && stored?.data?.analysisId) {
          storedAnalyses.push(stored.data.analysisId);
        } else {
          errors.push(`Result ${i + 1}: Insert returned no analysisId`);
        }

      } catch (err) {
        errors.push(`Result ${i + 1}: Failed to create analysis: ${err.message}`);
      }
    }

    const response = {
      success: errors.length === 0,
      message:
        errors.length === 0
          ? 'Groq batch analysis results stored successfully'
          : `Batch analysis results processed with ${errors.length} errors`,
      total: results.length,
      inserted: storedAnalyses.length,
      analysisIds: storedAnalyses,
      projectId
    };

    if (errors.length) response.errors = errors;

    res.status(errors.length ? 400 : 200).json(response);

  } catch (error) {
    console.error('[storeGroqBatchAnalysis] Error:', error);
    res.status(500).json({ error: 'Failed to store Groq analyses', details: error.message });
  }
};



module.exports = {
  analyzeFile,
  analyzeExtractedFiles,
  getAnalysisResult,
  getAllAnalysisResults,
  getAnalysisStats,
  getAvailableAnalysisTypes,
  getProjectAnalyses,
  getProjectAnalyticsSummary,
  storeGroqBatchAnalysis
};
