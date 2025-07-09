require('dotenv').config();

const snowflake = require('snowflake-sdk');

class SnowflakeServiceSafe {
  constructor() {
    this.connection = null;
    this.connected = false;
    this.lastConnectedAt = null;
    this.connectionConfig = {
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
    };
    
    // Check if we have the required environment variables
    this.hasValidConfig = this.validateConfig();
  }

  validateConfig() {
    const required = ['SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_USERNAME', 'SNOWFLAKE_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn('[SnowflakeService] Missing environment variables:', missing);
      return false;
    }
    
    return true;
  }

  async connect() {
    if (!this.hasValidConfig) {
      throw new Error('Missing required Snowflake configuration');
    }

    if (this.connected) {
      return { status: 'already_connected' };
    }

    return new Promise((resolve, reject) => {
      this.connection = snowflake.createConnection(this.connectionConfig);
      
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout after 10 seconds'));
      }, 10000);

      this.connection.connect(async (err) => {
        clearTimeout(timeout);
        
        if (err) {
          console.error('[SnowflakeService] Connection failed:', err.message);
          return reject(err);
        }

        this.connected = true;
        this.lastConnectedAt = new Date();

        try {
          if (process.env.SNOWFLAKE_DATABASE) {
            await this.executeQuery(`USE DATABASE "${process.env.SNOWFLAKE_DATABASE}"`);
          }
          if (process.env.SNOWFLAKE_SCHEMA) {
            await this.executeQuery(`USE SCHEMA "${process.env.SNOWFLAKE_DATABASE}"."${process.env.SNOWFLAKE_SCHEMA}"`);
          }
        } catch (e) {
          console.warn('[SnowflakeService] Could not set database/schema:', e.message);
          // Don't fail the connection for this
        }

        resolve({
          status: 'connected',
          timestamp: this.lastConnectedAt.toISOString(),
        });
      });
    });
  }

  async ensureConnected() {
    if (!this.hasValidConfig) {
      throw new Error('Snowflake configuration is invalid');
    }
    
    if (!this.connected) {
      await this.connect();
    }
  }

  async executeQuery(sqlText, binds = [], options = {}) {
    if (!this.hasValidConfig) {
      throw new Error('Snowflake configuration is invalid');
    }

    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Query timeout after 30 seconds'));
      }, 30000);

      this.connection.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          clearTimeout(timeout);
          
          if (err) {
            console.error('[SnowflakeService] Query failed:', err.message);
            return reject(err);
          }

          resolve({
            queryId: stmt.getStatementId(),
            rowCount: rows.length,
            rows,
          });
        },
        ...options,
      });
    });
  }

  async disconnect() {
    if (!this.connection || !this.connected) {
      return 'Already disconnected';
    }

    return new Promise((resolve, reject) => {
      this.connection.destroy((err) => {
        if (err) return reject(err);
        this.connected = false;
        this.connection = null;
        resolve('Disconnected');
      });
    });
  }

  getConnectionStatus() {
    if (!this.hasValidConfig) {
      return 'invalid_config';
    }
    return this.connected ? 'connected' : 'disconnected';
  }

  getConnectionStats() {
    return {
      lastConnectedAt: this.lastConnectedAt,
      isConnected: this.connected,
      hasValidConfig: this.hasValidConfig,
    };
  }

  async healthCheck() {
    try {
      if (!this.hasValidConfig) {
        return {
          status: 'unhealthy',
          error: 'Invalid Snowflake configuration',
          timestamp: new Date().toISOString(),
        };
      }

      const result = await this.executeQuery('SELECT 1 as health_check');
      return {
        status: 'healthy',
        query: 'SELECT 1 as health_check',
        response: result.rows,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Mock mode for development/testing
  async mockExecuteQuery(sqlText, binds = []) {
    console.log('[SnowflakeService] MOCK MODE - Query:', sqlText);
    console.log('[SnowflakeService] MOCK MODE - Binds:', binds);
    
    // Return mock data based on query type
    if (sqlText.includes('INSERT')) {
      return { queryId: 'mock-insert-id', rowCount: 1, rows: [] };
    } else if (sqlText.includes('SELECT')) {
      return { queryId: 'mock-select-id', rowCount: 0, rows: [] };
    } else {
      return { queryId: 'mock-query-id', rowCount: 0, rows: [] };
    }
  }
}

module.exports = new SnowflakeServiceSafe();
