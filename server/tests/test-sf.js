const snowflake = require('snowflake-sdk');
require('dotenv').config();

console.log('[DEBUG]', {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD ? '****' : undefined,
});

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
});

console.log('[INFO] Connecting...');

connection.connect((err, conn) => {
  if (err) {
    console.error('[ERROR] Connection failed:', err.message);
  } else {
    console.log('[SUCCESS] Connected to Snowflake!');
  }
});
