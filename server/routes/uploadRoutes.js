const express = require('express');
const router = express.Router();
const { uploadHandler } = require('../controllers/uploadController');
const upload = require('../middleware/multerConfig');

router.post('/upload', upload.single('file'), uploadHandler);

module.exports = router;
