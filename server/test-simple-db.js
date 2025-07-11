const snowflakeService = require('./services/snowflakeService');

async function testSimpleDB() {
  try {
    console.log('🔍 Testing basic database connection...');
    
    // Test basic query
    const testQuery = 'SELECT CURRENT_TIMESTAMP() as CURRENT_TIME';
    const result = await snowflakeService.executeQuery(testQuery, [], { timeout: 10000 });
    console.log('✅ Database connection successful:', result);
    
    // Check if ANALYSES table exists
    const tableQuery = 'SHOW TABLES LIKE \'ANALYSES\'';
    const tableResult = await snowflakeService.executeQuery(tableQuery, [], { timeout: 10000 });
    console.log('📋 ANALYSES table check:', tableResult);
    
    // Check table structure
    const describeQuery = 'DESCRIBE TABLE ANALYSES';
    const describeResult = await snowflakeService.executeQuery(describeQuery, [], { timeout: 10000 });
    console.log('🏗️ ANALYSES table structure:', describeResult);
    
    // Count existing records
    const countQuery = 'SELECT COUNT(*) as TOTAL_COUNT FROM ANALYSES';
    const countResult = await snowflakeService.executeQuery(countQuery, [], { timeout: 10000 });
    console.log('📊 Total analyses count:', countResult);
    
    // Get sample records
    const sampleQuery = 'SELECT * FROM ANALYSES LIMIT 5';
    const sampleResult = await snowflakeService.executeQuery(sampleQuery, [], { timeout: 10000 });
    console.log('📝 Sample analyses:', sampleResult);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testSimpleDB();
