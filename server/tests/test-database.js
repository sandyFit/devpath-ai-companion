const axios = require('axios');

const BASE_URL = 'http://localhost:3800';

async function testDatabaseEndpoints() {
  console.log('🗄️ Starting Database Service Testing...\n');

  // Test 1: Get Schema Information
  console.log('📋 Test 1: GET /database/schema');
  try {
    const response = await axios.get(`${BASE_URL}/database/schema`);
    console.log('✅ Status:', response.status);
    console.log('✅ Tables found:', response.data.data.tables.length);
    if (response.data.data.tables.length > 0) {
      console.log('✅ Table names:', response.data.data.tables.map(t => t.TABLE_NAME).join(', '));
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 2: Initialize Database Schema
  console.log('🔧 Test 2: POST /database/init');
  try {
    const response = await axios.post(`${BASE_URL}/database/init`);
    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    if (response.data.data.statementsExecuted) {
      console.log('✅ Statements executed:', response.data.data.statementsExecuted);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 3: Create Project
  console.log('📁 Test 3: POST /database/projects');
  let projectId = null;
  try {
    const response = await axios.post(`${BASE_URL}/database/projects`, {
      userId: 'test-user-123',
      projectName: 'Test Project for Database'
    });
    console.log('✅ Status:', response.status);
    console.log('✅ Project ID:', response.data.data.projectId);
    projectId = response.data.data.projectId;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 4: Insert Code File
  console.log('📄 Test 4: POST /database/files');
  let fileId = null;
  if (projectId) {
    try {
      const response = await axios.post(`${BASE_URL}/database/files`, {
        projectId: projectId,
        filename: 'test.js',
        language: 'javascript',
        content: 'console.log("Hello, World!");'
      });
      console.log('✅ Status:', response.status);
      console.log('✅ File ID:', response.data.data.fileId);
      console.log('✅ File size:', response.data.data.fileSize, 'bytes');
      fileId = response.data.data.fileId;
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  } else {
    console.log('⏭️ Skipped - No project ID available');
  }
  console.log('');

  // Test 5: Insert Analysis
  console.log('🔍 Test 5: POST /database/analysis');
  if (fileId) {
    try {
      const response = await axios.post(`${BASE_URL}/database/analysis`, {
        fileId: fileId,
        issuesFound: [
          { type: 'style', severity: 'low', description: 'Missing semicolon' }
        ],
        suggestions: [
          { suggestion: 'Add semicolon at end of statement', priority: 'low' }
        ],
        qualityScore: 8,
        complexityScore: 3,
        securityScore: 10,
        strengths: ['Simple and clear code'],
        learningRecommendations: ['Learn about JavaScript best practices']
      });
      console.log('✅ Status:', response.status);
      console.log('✅ Analysis ID:', response.data.data.analysisId);
      console.log('✅ Scores - Quality:', response.data.data.qualityScore, 
                  'Complexity:', response.data.data.complexityScore,
                  'Security:', response.data.data.securityScore);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  } else {
    console.log('⏭️ Skipped - No file ID available');
  }
  console.log('');

  // Test 6: Create Learning Path
  console.log('🎓 Test 6: POST /database/learning-paths');
  if (projectId) {
    try {
      const response = await axios.post(`${BASE_URL}/database/learning-paths`, {
        userId: 'test-user-123',
        projectId: projectId,
        recommendedTopics: [
          { topic: 'JavaScript Fundamentals', priority: 'high' },
          { topic: 'Code Quality', priority: 'medium' }
        ],
        difficultyLevel: 'BEGINNER',
        estimatedHours: 10
      });
      console.log('✅ Status:', response.status);
      console.log('✅ Path ID:', response.data.data.pathId);
      console.log('✅ Difficulty:', response.data.data.difficultyLevel);
      console.log('✅ Estimated hours:', response.data.data.estimatedHours);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  } else {
    console.log('⏭️ Skipped - No project ID available');
  }
  console.log('');

  // Test 7: Get Project Summary
  console.log('📊 Test 7: GET /database/projects/:id/summary');
  if (projectId) {
    try {
      const response = await axios.get(`${BASE_URL}/database/projects/${projectId}/summary`);
      console.log('✅ Status:', response.status);
      console.log('✅ Project name:', response.data.data.PROJECT_NAME);
      console.log('✅ Status:', response.data.data.STATUS);
      console.log('✅ File count:', response.data.data.ACTUAL_FILE_COUNT);
      console.log('✅ Analyzed files:', response.data.data.ANALYZED_FILE_COUNT);
      if (response.data.data.AVG_QUALITY_SCORE) {
        console.log('✅ Avg quality score:', response.data.data.AVG_QUALITY_SCORE);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  } else {
    console.log('⏭️ Skipped - No project ID available');
  }
  console.log('');

  // Test 8: Update Project Status
  console.log('🔄 Test 8: PUT /database/projects/:id/status');
  if (projectId) {
    try {
      const response = await axios.put(`${BASE_URL}/database/projects/${projectId}/status`, {
        status: 'COMPLETED'
      });
      console.log('✅ Status:', response.status);
      console.log('✅ Message:', response.data.message);
      console.log('✅ New status:', response.data.data.status);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  } else {
    console.log('⏭️ Skipped - No project ID available');
  }
  console.log('');

  // Test 9: Get User Learning Progress
  console.log('📈 Test 9: GET /database/users/:id/learning-progress');
  try {
    const response = await axios.get(`${BASE_URL}/database/users/test-user-123/learning-progress`);
    console.log('✅ Status:', response.status);
    console.log('✅ Total learning paths:', response.data.data.TOTAL_LEARNING_PATHS);
    console.log('✅ Completed paths:', response.data.data.COMPLETED_PATHS);
    console.log('✅ In progress paths:', response.data.data.IN_PROGRESS_PATHS);
    console.log('✅ Total estimated hours:', response.data.data.TOTAL_ESTIMATED_HOURS);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 10: Get Code Quality Insights
  console.log('💡 Test 10: GET /database/insights/code-quality');
  try {
    const response = await axios.get(`${BASE_URL}/database/insights/code-quality`);
    console.log('✅ Status:', response.status);
    console.log('✅ Insights found:', response.data.data.insights.length);
    if (response.data.data.insights.length > 0) {
      const jsInsight = response.data.data.insights.find(i => i.LANGUAGE === 'javascript');
      if (jsInsight) {
        console.log('✅ JavaScript files:', jsInsight.TOTAL_FILES);
        console.log('✅ Avg quality score:', jsInsight.AVG_QUALITY_SCORE);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 11: Validation Tests
  console.log('🔒 Test 11: Validation Tests');
  
  // Test missing required fields
  try {
    await axios.post(`${BASE_URL}/database/projects`, {
      userId: 'test-user'
      // Missing projectName
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation working - Missing projectName caught');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  // Test invalid status
  if (projectId) {
    try {
      await axios.put(`${BASE_URL}/database/projects/${projectId}/status`, {
        status: 'INVALID_STATUS'
      });
      console.log('❌ Should have failed validation');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation working - Invalid status caught');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
  }

  console.log('');

  console.log('🎉 Database Service Testing Complete!\n');
}

// Run tests
testDatabaseEndpoints().catch(console.error);
