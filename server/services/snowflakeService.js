const snowflake = require('snowflake-sdk');
const { v4: uuidv4 } = require('uuid');

class SnowflakeService {
  constructor() {
    this.connection = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
    });

    this.connected = false;
    this.lastConnectedAt = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.connection.connect(async (err) => {
        if (err) {
          return reject(err);
        }

        this.connected = true;
        this.lastConnectedAt = new Date();

        try {
          await this.executeQuery(`USE DATABASE "DEVPATH_AI"`);
          await this.executeQuery(`USE SCHEMA "DEVPATH_AI"."MAIN"`);

        } catch (e) {
          return reject(new Error(`Connected but failed to set DB/Schema: ${e.message}`));
        }

        resolve({
          status: 'connected',
          timestamp: this.lastConnectedAt.toISOString(),
        });
      });
    });
  }

  async ensureConnected() {
    if (!this.connected) {
      await this.connect();
    }
  }

  async executeQuery(sqlText, binds = [], options = {}) {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) {
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
    return new Promise((resolve, reject) => {
      this.connection.destroy((err) => {
        if (err) return reject(err);
        this.connected = false;
        resolve('Disconnected');
      });
    });
  }

  getConnectionStatus() {
    return this.connected ? 'connected' : 'disconnected';
  }

  getConnectionStats() {
    return {
      lastConnectedAt: this.lastConnectedAt,
      isConnected: this.connected,
    };
  }

  async healthCheck() {
    try {
      const result = await this.executeQuery('SELECT 1');
      return {
        status: 'healthy',
        query: 'SELECT 1',
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
}

module.exports = new SnowflakeService();
