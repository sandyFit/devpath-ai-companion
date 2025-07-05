const express = require('express');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Ensure extracted directory exists
const extractedDir = path.join(__dirname, 'extracted');
if (!fs.existsSync(extractedDir)) {
  fs.mkdirSync(extractedDir);
}

// Middleware setup
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = /\.zip$/i;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  // Accept additional mimetypes for ZIP files
  const mimetype = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', 'multipart/x-zip'].includes(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP files are allowed'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Simple root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express.js server foundation!' });
});

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const zipPath = path.join(uploadDir, req.file.filename);
    const zip = new AdmZip(zipPath);

    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) {
      return res.status(400).json({ error: 'Uploaded ZIP is empty' });
    }

    const allowedExtensions = ['.js', '.jsx', '.py'];
    let extractedFilesCount = 0;

    zipEntries.forEach((entry) => {
      if (!entry.isDirectory) {
        const ext = path.extname(entry.entryName).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          const outputPath = path.join(extractedDir, path.basename(entry.entryName));
          fs.writeFileSync(outputPath, entry.getData());
          extractedFilesCount++;
        }
      }
    });

    if (extractedFilesCount === 0) {
      return res.status(400).json({ error: 'No relevant code files found in ZIP' });
    }

    res.json({
      message: 'File uploaded and extracted successfully',
      uploadedFile: req.file.filename,
      extractedFilesCount,
    });
  } catch (err) {
    console.error('Error extracting ZIP:', err);
    res.status(500).json({ error: 'Failed to extract ZIP file' });
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    res.status(400).json({ error: err.message });
  } else if (err.message === 'Only images and PDFs are allowed') {
    res.status(400).json({ error: err.message });
  } else {
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
      },
    });
  }
});

// Start server
const PORT = process.env.PORT || 3800;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});

module.exports = app;
