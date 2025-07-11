require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('=== SERVER DEBUG STARTUP ===');
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 3800);

const app = express();

// Basic CORS setup
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Test endpoints
app.get('/api/health', (req, res) => {
  console.log('[DEBUG] Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Debug Server',
    port: process.env.PORT || 3800,
    message: 'Server is running and accessible'
  });
});

app.get('/api/upload/test', (req, res) => {
  console.log('[DEBUG] Upload test requested');
  res.json({
    status: 'OK',
    message: 'Upload endpoint would be accessible',
    endpoint: '/api/upload',
    method: 'POST',
    contentType: 'multipart/form-data'
  });
});

// Simple upload test endpoint
app.post('/api/upload', (req, res) => {
  console.log('[DEBUG] Upload request received');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Content-Length:', req.get('Content-Length'));
  
  res.json({
    success: true,
    message: 'Debug upload endpoint reached',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[DEBUG 404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not Found',
    method: req.method,
    url: req.originalUrl,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/upload/test',
      'POST /api/upload'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[DEBUG ERROR]', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    stack: err.stack
  });
});

const PORT = process.env.PORT || 3800;

const server = app.listen(PORT, () => {
  console.log(`[DEBUG SERVER] Running on port ${PORT}`);
  console.log(`[DEBUG SERVER] Test URLs:`);
  console.log(`  - Health: http://localhost:${PORT}/api/health`);
  console.log(`  - Upload Test: http://localhost:${PORT}/api/upload/test`);
  console.log(`  - Upload: POST http://localhost:${PORT}/api/upload`);
  console.log('=== SERVER READY ===');
});

server.on('error', (err) => {
  console.error('[DEBUG SERVER ERROR]', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please:`);
    console.error('1. Stop any other servers running on this port');
    console.error('2. Or change the PORT environment variable');
  }
});

process.on('SIGINT', () => {
  console.log('\n[DEBUG SERVER] Shutting down gracefully...');
  server.close(() => {
    console.log('[DEBUG SERVER] Server closed');
    process.exit(0);
  });
});
