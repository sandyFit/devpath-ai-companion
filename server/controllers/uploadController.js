const path = require('path');
const fs = require('fs');
const { extractZipContents } = require('../services/zipService');

const uploadHandler = (req, res) => {
  try {
    console.log('[UploadController] Processing file upload');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const zipPath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const result = extractZipContents(zipPath);
    
    console.log('[UploadController] Request headers:', req.headers);
    console.log('[UploadController] File:', req.file);
    console.log(`[UploadController] Extracted ${result.extractedFilesCount} files`);

    if (result.extractedFilesCount === 0) {
      return res.status(400).json({ error: 'No relevant code files found in ZIP' });
    }

    res.json({
      message: 'File uploaded and extracted successfully',
      uploadedFile: req.file.filename,
      extractedFilesCount: result.extractedFilesCount,
      extractedFiles: result.extractedFiles,
      extractedDir: result.extractedDir,
      nextSteps: {
        analyzeAll: 'POST /analyze/batch - Analyze all extracted files',
        analyzeSpecific: 'POST /analyze/file - Analyze a specific file',
        viewResults: 'GET /analyze/results - View analysis results'
      }
    });
  } catch (err) {
    console.error('[UploadController] Error extracting ZIP:', err);
    res.status(500).json({ error: 'Failed to extract ZIP file' });
  }
};

module.exports = { uploadHandler };
