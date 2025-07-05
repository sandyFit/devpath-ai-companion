const path = require('path');
const fs = require('fs');
const { extractZipContents } = require('../services/zipService');

const uploadHandler = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const zipPath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const result = extractZipContents(zipPath);
    console.log('Request headers:', req.headers);
    console.log('File:', req.file);


    if (result.extractedFilesCount === 0) {
      return res.status(400).json({ error: 'No relevant code files found in ZIP' });
    }

    res.json({
      message: 'File uploaded and extracted successfully',
      uploadedFile: req.file.filename,
      extractedFilesCount: result.extractedFilesCount,
    });
  } catch (err) {
    console.error('Error extracting ZIP:', err);
    res.status(500).json({ error: 'Failed to extract ZIP file' });
  }
};

module.exports = { uploadHandler };
