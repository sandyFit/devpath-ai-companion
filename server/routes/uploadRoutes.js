const express = require('express');
const router = express.Router();
const { uploadHandler } = require('../controllers/uploadController');
const upload = require('../middleware/multerConfig');

// POST /api/upload
router.post('/upload', upload.single('file'), (req, res, next) => {
  console.log('[UPLOAD] Received file upload request');
  console.log('[UPLOAD] File:', req.file ? req.file.filename : 'No file');
  uploadHandler(req, res, next);
});

module.exports = router;