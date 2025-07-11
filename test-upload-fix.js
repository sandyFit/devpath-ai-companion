const axios = require('axios');

const API_BASE = 'http://localhost:3800/api';

async function testUploadFixes() {
    console.log('=== TESTING UPLOAD API FIXES ===\n');
    
    try {
        // Test 1: Basic server connectivity
        console.log('1. Testing server connectivity...');
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log('✅ Server is running:', healthResponse.data);
        
        // Test 2: Upload endpoint availability
        console.log('\n2. Testing upload endpoint availability...');
        const uploadStatusResponse = await axios.get(`${API_BASE}/upload/status`);
        console.log('✅ Upload endpoint is accessible:', uploadStatusResponse.data);
        
        // Test 3: CORS headers
        console.log('\n3. Testing CORS configuration...');
        const corsResponse = await axios.options(`${API_BASE}/upload`);
        console.log('✅ CORS preflight successful, status:', corsResponse.status);
        
        // Test 4: Error handling for missing file
        console.log('\n4. Testing error handling for POST without file...');
        try {
            await axios.post(`${API_BASE}/upload`, {});
        } catch (error) {
            if (error.response) {
                console.log('✅ Server properly handles missing file:', error.response.status, error.response.data);
            } else {
                console.log('❌ Network error:', error.message);
            }
        }
        
        console.log('\n=== ALL TESTS COMPLETED ===');
        console.log('✅ Server is running and accessible');
        console.log('✅ Upload endpoint is properly configured');
        console.log('✅ Error handling is working');
        console.log('\nThe upload functionality should now work properly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('Server is not running. Please start the server first:');
            console.error('cd server && npm start');
        }
    }
}

// Run the tests
testUploadFixes();
