// Test script to verify batch analysis database storage fixes
const path = require('path');
const fs = require('fs');

// Mock the groqService to avoid API calls
const mockGroqService = {
  analyzeCode: async (content, language, analysisTypes, isHighPriority) => {
    console.log(`[MOCK] Analyzing ${language} file (priority: ${isHighPriority})`);
    return {
      qualityScore: 7,
      complexityScore: 5,
      securityScore: 8,
      issues: [{ type: 'test', description: 'Mock issue' }],
      strengths: ['Mock strength'],
      suggestions: ['Mock suggestion'],
      learningRecommendations: ['Mock learning recommendation']
    };
  }
};

// Mock the analysisRepository to avoid database calls
const mockAnalysisRepository = {
  createAnalysis: async (analysisData) => {
    console.log('[MOCK DB] Creating analysis:', {
      filename: analysisData.filename,
      projectId: analysisData.projectId,
      analysisType: analysisData.analysisType,
      qualityScore: analysisData.qualityScore
    });
    
    return {
      success: true,
      data: {
        analysisId: 'mock-analysis-id-' + Date.now(),
        ...analysisData
      }
    };
  }
};

// Replace the real services with mocks
require.cache[require.resolve('./services/groqService')] = {
  exports: mockGroqService
};

require.cache[require.resolve('./repositories/analysisRepository')] = {
  exports: mockAnalysisRepository
};

// Now require the analysis service
const { analysisService } = require('./services/analysisService');

async function testBatchAnalysis() {
  try {
    console.log('=== Testing Batch Analysis Database Storage Fix ===\n');
    
    const extractedDir = path.join(__dirname, 'extracted');
    const projectId = '48f008cb-3376-4cb8-a311-9e6c755e3160';
    const analysisTypes = ['code_quality', 'security'];
    
    console.log('1. Checking extracted directory...');
    if (!fs.existsSync(extractedDir)) {
      console.error('❌ Extracted directory not found:', extractedDir);
      return;
    }
    
    const files = fs.readdirSync(extractedDir);
    console.log(`✅ Found ${files.length} files in extracted directory:`, files);
    
    console.log('\n2. Running batch analysis...');
    const result = await analysisService.analyzeBatch(extractedDir, analysisTypes, projectId);
    
    console.log('\n3. Batch analysis results:');
    console.log(`   - Total files: ${result.totalFiles}`);
    console.log(`   - Successful analyses: ${result.successfulAnalyses}`);
    console.log(`   - Failed analyses: ${result.failedAnalyses}`);
    console.log(`   - Priority files: ${result.priorityFiles}`);
    
    console.log('\n4. Individual file results:');
    result.results.forEach((fileResult, index) => {
      if (fileResult.error) {
        console.log(`   ${index + 1}. ❌ ${fileResult.filename}: ${fileResult.error}`);
      } else {
        console.log(`   ${index + 1}. ✅ ${fileResult.filename}: Analysis ID ${fileResult.analysisId}`);
        console.log(`      - Quality Score: ${fileResult.analysis?.qualityScore || 'N/A'}`);
        console.log(`      - Issues: ${fileResult.analysis?.issues?.length || 0}`);
      }
    });
    
    console.log('\n=== Test Summary ===');
    if (result.successfulAnalyses > 0) {
      console.log('✅ Batch analysis is working correctly!');
      console.log('✅ Files are being processed and analysis data is being generated');
      console.log('✅ The controller should now be able to store these results in the database');
    } else {
      console.log('❌ No successful analyses were generated');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testBatchAnalysis();
