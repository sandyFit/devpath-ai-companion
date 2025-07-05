const axios = require('axios');

const BASE_URL = 'http://localhost:3800';

async function testValidationEndpoints() {
  console.log('🔍 Testing Database Validation...\n');

  // Test 1: Missing required fields
  console.log('1️⃣ Testing POST /database/projects (missing fields)');
  try {
    const response = await axios.post(`${BASE_URL}/database/projects`, {});
    console.log('❌ Should have failed validation');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation working - Status:', error.response.status);
      console.log('✅ Error message:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 2: Valid project creation (will fail at DB level with test credentials)
  console.log('2️⃣ Testing POST /database/projects (valid data)');
  try {
    const response = await axios.post(`${BASE_URL}/database/projects`, {
      userId: 'test-user-123',
      projectName: 'Test Project'
    }, { timeout: 5000 });
    console.log('✅ Status:', response.status);
    console.log('✅ Project created:', response.data.data.projectId);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('⏱️ Request timed out (expected with test credentials)');
    } else if (error.response?.status === 500) {
      console.log('✅ Expected DB error with test credentials - Status:', error.response.status);
      console.log('✅ Error type:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 3: Invalid status update
  console.log('3️⃣ Testing PUT /database/projects/:id/status (invalid status)');
  try {
    const response = await axios.put(`${BASE_URL}/database/projects/test-id/status`, {
      status: 'INVALID_STATUS'
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation working - Status:', error.response.status);
      console.log('✅ Error message:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 4: Missing file data
  console.log('4️⃣ Testing POST /database/files (missing fields)');
  try {
    const response = await axios.post(`${BASE_URL}/database/files`, {
      projectId: 'test-project-id'
      // Missing filename, language, content
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation working - Status:', error.response.status);
      console.log('✅ Error message:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 5: Missing analysis data
  console.log('5️⃣ Testing POST /database/analysis (missing fields)');
  try {
    const response = await axios.post(`${BASE_URL}/database/analysis`, {
      fileId: 'test-file-id'
      // Missing scores
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation working - Status:', error.response.status);
      console.log('✅ Error message:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');

  console.log('🎉 Validation Testing Complete!\n');
}

// Run validation tests
testValidationEndpoints().catch(console.error);
