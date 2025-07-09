// Debug server startup script
console.log('=== Server Startup Debug ===');

// Check environment variables
console.log('1. Checking environment variables...');
require('dotenv').config();

const requiredEnvVars = ['GROQ_API_KEY', 'SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_USERNAME', 'SNOWFLAKE_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars);
  console.log('   Server will run but some features may not work properly');
} else {
  console.log('✅ All required environment variables are set');
}

// Check dependencies
console.log('\n2. Checking dependencies...');
try {
  require('express');
  require('cors');
  require('morgan');
  console.log('✅ Core dependencies loaded successfully');
} catch (error) {
  console.error('❌ Failed to load dependencies:', error.message);
  process.exit(1);
}

// Check file structure
console.log('\n3. Checking file structure...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'server.js',
  'routes/groqRoutes.js',
  'controllers/analysisController.js',
  'services/analysisService.js',
  'repositories/analysisRepository.js'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles);
  process.exit(1);
} else {
  console.log('✅ All required files exist');
}

// Try to start the server
console.log('\n4. Starting server...');
try {
  // Mock problematic services to avoid API calls
  const mockGroqService = {
    analyzeCode: async () => ({
      qualityScore: 7,
      complexityScore: 5,
      securityScore: 8,
      issues: [],
      strengths: [],
      suggestions: [],
      learningRecommendations: []
    })
  };

  const mockSnowflakeService = {
    healthCheck: async () => ({ status: 'healthy', message: 'Mock connection' }),
    executeQuery: async () => ({ rows: [], rowCount: 0 })
  };

  // Replace services with mocks
  require.cache[require.resolve('./services/groqService')] = { exports: mockGroqService };
  require.cache[require.resolve('./services/snowflakeService')] = { exports: mockSnowflakeService };

  // Start the server
  require('./server.js');
  
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
