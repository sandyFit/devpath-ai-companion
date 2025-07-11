const express = require('express');
const router = express.Router();
const { uploadHandler } = require('../controllers/uploadController');
const { uploadHandlerSimple } = require('../controllers/uploadControllerSimple');
const upload = require('../middleware/multerConfig');

// Enhanced upload route with detailed logging
router.post('/upload', (req, res, next) => {
  console.log('[UPLOAD ROUTE] === FILE UPLOAD REQUEST RECEIVED ===');
  console.log('[UPLOAD ROUTE] Method:', req.method);
  console.log('[UPLOAD ROUTE] URL:', req.originalUrl);
  console.log('[UPLOAD ROUTE] Content-Type:', req.get('Content-Type'));
  console.log('[UPLOAD ROUTE] Content-Length:', req.get('Content-Length'));
  console.log('[UPLOAD ROUTE] User-Agent:', req.get('User-Agent'));
  
  // Apply multer middleware
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD ROUTE] Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          error: 'File too large', 
          message: 'File size exceeds 50MB limit',
          maxSize: '50MB'
        });
      }
      if (err.message === 'Only ZIP files are allowed') {
        return res.status(415).json({ 
          error: 'Unsupported file type', 
          message: 'Only ZIP files are allowed',
          acceptedTypes: ['.zip']
        });
      }
      return res.status(400).json({ 
        error: 'File upload error', 
        message: err.message 
      });
    }
    
    console.log('[UPLOAD ROUTE] Multer processing completed');
    console.log('[UPLOAD ROUTE] File received:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file');
    console.log('[UPLOAD ROUTE] Body data:', req.body);
    
    // Use simplified upload handler to bypass database issues
    console.log('[UPLOAD ROUTE] Using simplified upload handler');
    uploadHandlerSimple(req, res, next);
  });
});

// Test route to verify upload endpoint is accessible
router.get('/upload/status', (req, res) => {
  console.log('[UPLOAD STATUS] Upload status check requested');
  res.json({
    status: 'active',
    endpoint: '/api/upload',
    method: 'POST',
    contentType: 'multipart/form-data',
    fieldName: 'file',
    maxFileSize: '50MB',
    allowedTypes: ['application/zip', '.zip'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
