require('dotenv').config();
console.log('[DEBUG] Loaded SNOWFLAKE_USER:', process.env.SNOWFLAKE_USER);

const assert = require('assert');
const snowflakeService = require('../services/snowflakeService');
const dbMigration = require('../utils/dbMigration');

async function testConnection() {
  console.log('Testing Snowflake connection...');
  try {
    await snowflakeService.connect();
    const status = snowflakeService.getConnectionStatus();
    assert.strictEqual(status, 'connected', 'Connection status should be connected');
    console.log('✅ Snowflake connection successful');
  } catch (error) {
    console.error('❌ Snowflake connection failed:', error);
    throw error;
  }
}

async function testMigration() {
  console.log('Testing database migration...');
  try {
    await dbMigration.migrate();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function testSeeding() {
  console.log('Testing test data seeding...');
  try {
    await dbMigration.seedTestData();
    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
    throw error;
  }
}

async function testReset() {
  console.log('Testing database reset...');
  try {
    await dbMigration.resetDatabase();
    console.log('✅ Database reset successfully');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

async function runTests() {
  try {
    await testConnection();
    await testMigration();
    await testSeeding();
    await testReset();
    console.log('🎉 All Snowflake tests passed!');
  } catch (error) {
    console.error('Some tests failed:', error);
    process.exit(1);
  } finally {
    await snowflakeService.disconnect();
  }
}

runTests();
