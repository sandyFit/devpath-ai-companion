const axios = require('axios');

const BASE_URL = 'http://localhost:3800';

async function testAnalyticsEndpoints() {
  console.log('Starting Analytics Endpoints Testing...\n');

  // Test 1: GET /api/analytics/user/:userId/progress
  console.log('Test 1: GET /api/analytics/user/test-user-123/progress');
  try {
    const response = await axios.get(`${BASE_URL}/api/analytics/user/test-user-123/progress?page=1&pageSize=5`);
    console.log('Status:', response.status);
    console.log('Data labels:', response.data.data.labels);
    console.log('Data datasets:', response.data.data.datasets.length);
    console.log('Pagination:', response.data.pagination);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 2: GET /api/analytics/languages/trends
  console.log('Test 2: GET /api/analytics/languages/trends?page=1&pageSize=5');
  try {
    const response = await axios.get(`${BASE_URL}/api/analytics/languages/trends?page=1&pageSize=5`);
    console.log('Status:', response.status);
    console.log('Data rows count:', response.data.data.length);
    console.log('Pagination:', response.data.pagination);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 3: GET /api/analytics/skills/gaps
  console.log('Test 3: GET /api/analytics/skills/gaps?page=1&pageSize=5');
  try {
    const response = await axios.get(`${BASE_URL}/api/analytics/skills/gaps?page=1&pageSize=5`);
    console.log('Status:', response.status);
    console.log('Data labels:', response.data.data.labels);
    console.log('Data datasets:', response.data.data.datasets.length);
    console.log('Pagination:', response.data.pagination);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 4: GET /api/analytics/learning/effectiveness
  console.log('Test 4: GET /api/analytics/learning/effectiveness?page=1&pageSize=5');
  try {
    const response = await axios.get(`${BASE_URL}/api/analytics/learning/effectiveness?page=1&pageSize=5`);
    console.log('Status:', response.status);
    console.log('Data labels:', response.data.data.labels);
    console.log('Data datasets:', response.data.data.datasets.length);
    console.log('Pagination:', response.data.pagination);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  console.log('Analytics Endpoints Testing Complete!\n');
}

// Run tests
testAnalyticsEndpoints().catch(console.error);
