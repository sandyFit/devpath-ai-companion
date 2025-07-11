const path = require('path');
const fs = require('fs');
const { extractZipContents } = require('../services/zipService');
const projectRepository = require('../repositories/projectRepository');
const { v4: uuidv4 } = require('uuid');

const uploadHandler = async (req, res) => {
  try {
    console.log('[UploadController] Processing file upload');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract user information from request (you may need to adjust based on your auth system)
    const userId = req.body.userId || req.headers['x-user-id'] || 'anonymous-user';
    const projectName = req.body.projectName || `Project-${Date.now()}`;

    // Create project in Snowflake database first to get projectId
    let projectResult;
    try {
      console.log('[UploadController] Creating project in database');
      
      projectResult = await projectRepository.createProject({
        userId: userId,
        projectName: projectName,
        totalFiles: 0, // Will be updated after extraction
        status: 'PENDING'
      });

      console.log(`[UploadController] Project created successfully: ${projectResult.data.projectId}`);
    } catch (dbError) {
      console.error('[UploadController] Database error during project creation:', dbError);
      return res.status(500).json({
        error: 'Failed to create project in database',
        details: dbError.message
      });
    }

    // Extract files to project-specific directory
    const zipPath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const extractResult = extractZipContents(zipPath, projectResult.data.projectId);
    
    console.log('[UploadController] Request headers:', req.headers);
    console.log('[UploadController] File:', req.file);
    console.log(`[UploadController] Extracted ${extractResult.extractedFilesCount} files to project-specific directory`);

    if (extractResult.extractedFilesCount === 0) {
      return res.status(400).json({ error: 'No relevant code files found in ZIP' });
    }

    // Update project file count with actual extracted files
    try {
      await projectRepository.updateProjectFileCount(
        projectResult.data.projectId, 
        extractResult.extractedFilesCount
      );

      res.json({
        success: true,
        message: 'File uploaded and project created successfully',
        data: {
          projectId: projectResult.data.projectId,
          uploadedFile: req.file.filename,
          extractedFilesCount: extractResult.extractedFilesCount,
          extractedFiles: extractResult.extractedFiles,
          extractedDir: extractResult.extractedDir,
          project: {
            id: projectResult.data.projectId,
            name: projectResult.data.projectName,
            userId: projectResult.data.userId,
            status: projectResult.data.status,
            totalFiles: extractResult.extractedFilesCount,
            createdAt: projectResult.data.createdAt
          }
        },
        nextSteps: {
          analyzeAll: `POST /analyze/batch/${projectResult.data.projectId} - Analyze all extracted files`,
          analyzeSpecific: 'POST /analyze/file - Analyze a specific file',
          viewProject: `GET /api/project/${projectResult.data.projectId} - View project details`,
          viewResults: `GET /api/analysis/${projectResult.data.projectId} - View analysis results`
        }
      });

    } catch (dbError) {
      console.error('[UploadController] Database error:', dbError);
      
      // If database operation fails, still return success for file upload but indicate DB issue
      res.status(207).json({
        success: true,
        message: 'File uploaded successfully, but project creation failed',
        data: {
          uploadedFile: req.file.filename,
          extractedFilesCount: extractResult.extractedFilesCount,
          extractedFiles: extractResult.extractedFiles,
          extractedDir: extractResult.extractedDir
        },
        warning: 'Project was not saved to database',
        error: dbError.message,
        nextSteps: {
          analyzeAll: 'POST /analyze/batch - Analyze all extracted files (without project tracking)',
          analyzeSpecific: 'POST /analyze/file - Analyze a specific file'
        }
      });
    }

  } catch (err) {
    console.error('[UploadController] Error processing upload:', err);
    res.status(500).json({ 
      error: 'Failed to process uploaded file',
      details: err.message 
    });
  }
};

module.exports = { uploadHandler };
