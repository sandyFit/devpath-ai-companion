const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('[MULTER] File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  // Only allow ZIP files
  const allowedTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip'
  ];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || fileExtension === '.zip') {
    console.log('[MULTER] ✅ ZIP file accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('[MULTER] ❌ File rejected:', file.originalname);
    cb(new Error('Only ZIP files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  }
});

module.exports = upload;