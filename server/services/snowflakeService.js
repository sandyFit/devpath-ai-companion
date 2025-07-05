const snowflake = require('snowflake-sdk');
const { v4: uuidv4 } = require('uuid');

class SnowflakeService {
  constructor() {
    this.connection = null;
    this.connectionPool = new Map();
    this.isConnected = false;
    this.connectionId = null;
    
    // Connection configuration
    this.config = {
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      // Connection pool settings
      pooling: true,
      maxConnections: 10,
      minConnections: 1,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      // Additional settings
      clientSessionKeepAlive: true,
      clientSessionKeepAliveHeartbeatFrequency: 3600,
      jsTreatIntegerAsBigInt: false
    };
    
    // Query timeout settings
    this.queryTimeouts = {
      default: 30000, // 30 seconds
      batch: 300000,  // 5 minutes
      longRunning: 600000 // 10 minutes
    };
    
    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    };
  }

  async connect() {
    try {
      console.log('[SnowflakeService] Attempting to connect to Snowflake...');
      
      // Validate required environment variables
      this.validateConfig();
      
      // Create connection if it doesn't exist
      if (!this.connection || !this.isConnected) {
        this.connectionId = uuidv4();
        
        this.connection = snowflake.createConnection(this.config);
        
        // Connect with promise wrapper
        await new Promise((resolve, reject) => {
          this.connection.connect((err, conn) => {
            if (err) {
              console.error('[SnowflakeService] Connection failed:', err);
              reject(new Error(`Snowflake connection failed: ${err.message}`));
            } else {
              console.log(`[SnowflakeService] Successfully connected to Snowflake`);
              console.log(`[SnowflakeService] Connection ID: ${this.connectionId}`);
              console.log(`[SnowflakeService] Database: ${this.config.database}`);
              console.log(`[SnowflakeService] Schema: ${this.config.schema}`);
              console.log(`[SnowflakeService] Warehouse: ${this.config.warehouse}`);
              
              this.isConnected = true;
              this.connectionPool.set(this.connectionId, {
                connection: conn,
                createdAt: new Date(),
                lastUsed: new Date(),
                queryCount: 0
              });
              
              resolve(conn);
            }
          });
        });
      }
      
      return this.connection;
      
    } catch (error) {
      console.error('[SnowflakeService] Error during connection:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      console.log('[SnowflakeService] Disconnecting from Snowflake...');
      
      if (this.connection && this.isConnected) {
        // Disconnect with promise wrapper
        await new Promise((resolve, reject) => {
          this.connection.destroy((err, conn) => {
            if (err) {
              console.error('[SnowflakeService] Disconnect error:', err);
              reject(new Error(`Snowflake disconnect failed: ${err.message}`));
            } else {
              console.log('[SnowflakeService] Successfully disconnected from Snowflake');
              resolve(conn);
            }
          });
        });
        
        // Clean up connection pool
        this.connectionPool.delete(this.connectionId);
        this.connection = null;
        this.isConnected = false;
        this.connectionId = null;
      }
      
    } catch (error) {
      console.error('[SnowflakeService] Error during disconnect:', error);
      throw error;
    }
  }

  async executeQuery(sqlText, binds = [], options = {}) {
    try {
      const queryId = uuidv4();
      const startTime = Date.now();
      
      console.log(`[SnowflakeService] Executing query ${queryId}`);
      console.log(`[SnowflakeService] SQL: ${sqlText}`);
      console.log(`[SnowflakeService] Binds: ${JSON.stringify(binds)}`);
      
      // Ensure connection exists
      await this.ensureConnection();
      
      // Set query timeout
      const timeout = options.timeout || this.queryTimeouts.default;
      
      // Execute query with retry logic
      const result = await this.executeWithRetry(async () => {
        return new Promise((resolve, reject) => {
          const statement = this.connection.execute({
            sqlText: sqlText,
            binds: binds,
            complete: (err, stmt, rows) => {
              const executionTime = Date.now() - startTime;
              
              if (err) {
                console.error(`[SnowflakeService] Query ${queryId} failed after ${executionTime}ms:`, err);
                reject(new Error(`Query execution failed: ${err.message}`));
              } else {
                console.log(`[SnowflakeService] Query ${queryId} completed successfully in ${executionTime}ms`);
                console.log(`[SnowflakeService] Rows affected/returned: ${rows ? rows.length : 0}`);
                
                // Update connection stats
                if (this.connectionPool.has(this.connectionId)) {
                  const connInfo = this.connectionPool.get(this.connectionId);
                  connInfo.lastUsed = new Date();
                  connInfo.queryCount++;
                }
                
                resolve({
                  queryId: queryId,
                  executionTime: executionTime,
                  rowCount: rows ? rows.length : 0,
                  rows: rows || [],
                  statement: stmt,
                  metadata: {
                    columns: stmt.getColumns ? stmt.getColumns() : [],
                    queryType: this.getQueryType(sqlText)
                  }
                });
              }
            },
            // Set query timeout
            timeout: timeout
          });
        });
      });
      
      return result;
      
    } catch (error) {
      console.error('[SnowflakeService] Error executing query:', error);
      throw error;
    }
  }

  async executeBatch(queries, options = {}) {
    try {
      const batchId = uuidv4();
      const startTime = Date.now();
      
      console.log(`[SnowflakeService] Executing batch ${batchId} with ${queries.length} queries`);
      
      // Ensure connection exists
      await this.ensureConnection();
      
      const results = [];
      const timeout = options.timeout || this.queryTimeouts.batch;
      const continueOnError = options.continueOnError || false;
      
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        const queryStartTime = Date.now();
        
        try {
          console.log(`[SnowflakeService] Batch ${batchId} - Executing query ${i + 1}/${queries.length}`);
          
          const result = await this.executeQuery(
            query.sqlText, 
            query.binds || [], 
            { timeout: timeout }
          );
          
          results.push({
            index: i,
            success: true,
            result: result,
            executionTime: Date.now() - queryStartTime
          });
          
        } catch (error) {
          console.error(`[SnowflakeService] Batch ${batchId} - Query ${i + 1} failed:`, error);
          
          results.push({
            index: i,
            success: false,
            error: error.message,
            executionTime: Date.now() - queryStartTime
          });
          
          if (!continueOnError) {
            throw new Error(`Batch execution failed at query ${i + 1}: ${error.message}`);
          }
        }
      }
      
      const totalTime = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      console.log(`[SnowflakeService] Batch ${batchId} completed in ${totalTime}ms`);
      console.log(`[SnowflakeService] Success: ${successCount}, Failures: ${failureCount}`);
      
      return {
        batchId: batchId,
        totalQueries: queries.length,
        successCount: successCount,
        failureCount: failureCount,
        totalExecutionTime: totalTime,
        results: results
      };
      
    } catch (error) {
      console.error('[SnowflakeService] Error executing batch:', error);
      throw error;
    }
  }

  async ensureConnection() {
    if (!this.connection || !this.isConnected) {
      console.log('[SnowflakeService] Connection not available, attempting to connect...');
      await this.connect();
    }
    
    // Test connection with a simple query
    try {
      await this.executeQuery('SELECT 1 as test', [], { timeout: 5000 });
    } catch (error) {
      console.log('[SnowflakeService] Connection test failed, reconnecting...');
      this.isConnected = false;
      await this.connect();
    }
  }

  async executeWithRetry(operation, retryCount = 0) {
    try {
      return await operation();
    } catch (error) {
      if (retryCount < this.retryConfig.maxRetries && this.isRetryableError(error)) {
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
        
        console.log(`[SnowflakeService] Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
        
        await this.sleep(delay);
        
        // Reset connection if it's a connection-related error
        if (this.isConnectionError(error)) {
          this.isConnected = false;
          await this.ensureConnection();
        }
        
        return this.executeWithRetry(operation, retryCount + 1);
      }
      
      throw error;
    }
  }

  validateConfig() {
    const requiredFields = [
      'SNOWFLAKE_ACCOUNT',
      'SNOWFLAKE_USERNAME', 
      'SNOWFLAKE_PASSWORD',
      'SNOWFLAKE_WAREHOUSE',
      'SNOWFLAKE_DATABASE',
      'SNOWFLAKE_SCHEMA'
    ];
    
    const missingFields = requiredFields.filter(field => !process.env[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required Snowflake environment variables: ${missingFields.join(', ')}`);
    }
    
    console.log('[SnowflakeService] Configuration validation passed');
  }

  getQueryType(sqlText) {
    const sql = sqlText.trim().toUpperCase();
    if (sql.startsWith('SELECT')) return 'SELECT';
    if (sql.startsWith('INSERT')) return 'INSERT';
    if (sql.startsWith('UPDATE')) return 'UPDATE';
    if (sql.startsWith('DELETE')) return 'DELETE';
    if (sql.startsWith('CREATE')) return 'CREATE';
    if (sql.startsWith('DROP')) return 'DROP';
    if (sql.startsWith('ALTER')) return 'ALTER';
    return 'OTHER';
  }

  isRetryableError(error) {
    const retryableErrors = [
      'NETWORK_ERROR',
      'CONNECTION_ERROR',
      'TIMEOUT',
      'TEMPORARY_FAILURE'
    ];
    
    return retryableErrors.some(errorType => 
      error.message && error.message.includes(errorType)
    );
  }

  isConnectionError(error) {
    const connectionErrors = [
      'CONNECTION_ERROR',
      'NETWORK_ERROR',
      'AUTHENTICATION_ERROR'
    ];
    
    return connectionErrors.some(errorType => 
      error.message && error.message.includes(errorType)
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      poolSize: this.connectionPool.size,
      connectionInfo: this.connectionId ? this.connectionPool.get(this.connectionId) : null
    };
  }

  getConnectionStats() {
    if (!this.connectionId || !this.connectionPool.has(this.connectionId)) {
      return null;
    }
    
    const connInfo = this.connectionPool.get(this.connectionId);
    return {
      connectionId: this.connectionId,
      createdAt: connInfo.createdAt,
      lastUsed: connInfo.lastUsed,
      queryCount: connInfo.queryCount,
      uptime: Date.now() - connInfo.createdAt.getTime()
    };
  }

  // Health check method
  async healthCheck() {
    try {
      const result = await this.executeQuery(
        'SELECT CURRENT_VERSION() as version, CURRENT_DATABASE() as database, CURRENT_SCHEMA() as schema, CURRENT_WAREHOUSE() as warehouse',
        [],
        { timeout: 10000 }
      );
      
      return {
        status: 'healthy',
        connection: this.getConnectionStatus(),
        stats: this.getConnectionStats(),
        serverInfo: result.rows[0] || {}
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connection: this.getConnectionStatus()
      };
    }
  }
}

module.exports = new SnowflakeService();
