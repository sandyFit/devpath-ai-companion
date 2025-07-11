const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');

const uploadHandlerSimple = async (req, res) => {
  try {
    console.log('[SimpleUploadController] Processing file upload');
    console.log('[SimpleUploadController] Request headers:', req.headers);
    console.log('[SimpleUploadController] Request body:', req.body);
    
    if (!req.file) {
      console.log('[SimpleUploadController] No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[SimpleUploadController] File received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });

    // Extract user information from request
    const userId = req.body.userId || req.headers['x-user-id'] || 'anonymous-user';
    const projectName = req.body.projectName || `Project-${Date.now()}`;
    const projectId = uuidv4(); // Generate proper UUID for analysis compatibility

    console.log('[SimpleUploadController] Project info:', {
      userId,
      projectName,
      projectId
    });

    // Extract ZIP file to project-specific directory for analysis
    let extractedFilesCount = 0;
    let extractedFiles = [];
    
    try {
      const zipPath = req.file.path;
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      
      // Create project-specific extraction directory
      const baseExtractedDir = path.join(__dirname, '..', 'extracted');
      const extractedDir = path.join(baseExtractedDir, projectId);

      // Ensure directories exist
      if (!fs.existsSync(baseExtractedDir)) {
        fs.mkdirSync(baseExtractedDir, { recursive: true });
      }
      if (!fs.existsSync(extractedDir)) {
        fs.mkdirSync(extractedDir, { recursive: true });
      }

      const allowedExtensions = ['.js', '.jsx', '.py', '.ts', '.tsx'];

      zipEntries.forEach((entry) => {
        if (!entry.isDirectory) {
          const ext = path.extname(entry.entryName).toLowerCase();
          if (allowedExtensions.includes(ext)) {
            const outputPath = path.join(extractedDir, path.basename(entry.entryName));
            const content = entry.getData().toString('utf8');
            
            fs.writeFileSync(outputPath, content);
            extractedFilesCount++;
            
            extractedFiles.push({
              filename: path.basename(entry.entryName),
              originalPath: entry.entryName,
              extractedPath: outputPath,
              extension: ext,
              size: content.length
            });
          }
        }
      });

      console.log(`[SimpleUploadController] Extracted ${extractedFilesCount} files to ${extractedDir}`);
      
    } catch (extractError) {
      console.error('[SimpleUploadController] Error extracting ZIP:', extractError);
      // Continue without extraction - upload still succeeded
    }

    const response = {
      success: true,
      message: 'File uploaded and extracted successfully (simplified)',
      data: {
        projectId: projectId,
        uploadedFile: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        extractedFilesCount: extractedFilesCount,
        extractedFiles: extractedFiles,
        project: {
          id: projectId,
          name: projectName,
          userId: userId,
          status: 'UPLOADED',
          totalFiles: extractedFilesCount,
          createdAt: new Date().toISOString()
        }
      },
      debug: {
        serverTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    console.log('[SimpleUploadController] Sending response:', response);
    res.json(response);

  } catch (err) {
    console.error('[SimpleUploadController] Error processing upload:', err);
    res.status(500).json({ 
      error: 'Failed to process uploaded file',
      details: err.message,
      stack: err.stack
    });
  }
};

module.exports = { uploadHandlerSimple };
