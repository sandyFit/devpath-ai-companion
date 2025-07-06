const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    maxConnections: parseInt(process.env.SNOWFLAKE_MAX_CONNECTIONS, 10) || 5,
    queryTimeout: parseInt(process.env.SNOWFLAKE_QUERY_TIMEOUT, 10) || 60,
    useSSL: process.env.SNOWFLAKE_USE_SSL === 'true',
  },
  staging: {
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    maxConnections: parseInt(process.env.SNOWFLAKE_MAX_CONNECTIONS, 10) || 5,
    queryTimeout: parseInt(process.env.SNOWFLAKE_QUERY_TIMEOUT, 10) || 60,
    useSSL: process.env.SNOWFLAKE_USE_SSL === 'true',
  },
  production: {
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    maxConnections: parseInt(process.env.SNOWFLAKE_MAX_CONNECTIONS, 10) || 5,
    queryTimeout: parseInt(process.env.SNOWFLAKE_QUERY_TIMEOUT, 10) || 60,
    useSSL: process.env.SNOWFLAKE_USE_SSL === 'true',
  }
};

module.exports = config[env];
