const axios = require('axios');

const BASE_URL = 'http://localhost:3800';

async function testBasicEndpoints() {
  console.log('🔍 Testing Basic Database Endpoints...\n');

  // Test 1: Root endpoint
  console.log('1️⃣ Testing GET /');
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Status:', response.status);
    console.log('✅ Database endpoints available:', !!response.data.endpoints.database);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 2: Schema endpoint (quick test)
  console.log('2️⃣ Testing GET /database/schema (quick)');
  try {
    const response = await axios.get(`${BASE_URL}/database/schema`, { timeout: 10000 });
    console.log('✅ Status:', response.status);
    console.log('✅ Response received');
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('⏱️ Request timed out (expected with test credentials)');
    } else {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 3: Validation test
  console.log('3️⃣ Testing POST /database/projects (validation)');
  try {
    const response = await axios.post(`${BASE_URL}/database/projects`, {
      // Missing required fields
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

  console.log('🎉 Basic Testing Complete!\n');
}

// Run basic tests
testBasicEndpoints().catch(console.error);
