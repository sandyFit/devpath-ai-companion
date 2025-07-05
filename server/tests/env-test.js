require('dotenv').config();

console.log('All environment variables:');
console.log('SNOWFLAKE_ACCOUNT:', process.env.SNOWFLAKE_ACCOUNT);
console.log('SNOWFLAKE_USERNAME:', process.env.SNOWFLAKE_USERNAME);
console.log('SNOWFLAKE_PASSWORD:', process.env.SNOWFLAKE_PASSWORD);
console.log('SNOWFLAKE_DATABASE:', process.env.SNOWFLAKE_DATABASE);
console.log('SNOWFLAKE_SCHEMA:', process.env.SNOWFLAKE_SCHEMA);
console.log('SNOWFLAKE_WAREHOUSE:', process.env.SNOWFLAKE_WAREHOUSE);

// Check if .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
console.log('\n.env file path:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));