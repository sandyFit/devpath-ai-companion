const snowflakeService = require('../services/snowflakeService');
const { v4: uuidv4 } = require('uuid');

const connect = async (req, res) => {
  try {
    console.log('[SnowflakeController] Received connection request');
    
    const connection = await snowflakeService.connect();
    const status = snowflakeService.getConnectionStatus();
    
    console.log('[SnowflakeController] Connection established successfully');
    
    res.json({
      success: true,
      message: 'Successfully connected to Snowflake',
      data: {
        connectionStatus: status,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[SnowflakeController] Error in connect:', error);
    res.status(500).json({
      error: 'Failed to connect to Snowflake',
      details: error.message
    });
  }
};

const disconnect = async (req, res) => {
  try {
    console.log('[SnowflakeController] Received disconnect request');
    
    await snowflakeService.disconnect();
    
    console.log('[SnowflakeController] Disconnection completed successfully');
    
    res.json({
      success: true,
      message: 'Successfully disconnected from Snowflake',
      data: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[SnowflakeController] Error in disconnect:', error);
    res.status(500).json({
      error: 'Failed to disconnect from Snowflake',
      details: error.message
    });
  }
};

const executeQuery = async (req, res) => {
  try {
    console.log('[SnowflakeController] Received query execution request');
    console.log('[SnowflakeController] Request body:', req.body);
    
    const { sqlText, binds, options } = req.body;
    
    // Validate required fields
    if (!sqlText || typeof sqlText !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid sqlText',
        details: 'sqlText is required and must be a string'
      });
    }
    
    // Execute query
    const result = await snowflakeService.executeQuery(
      sqlText,
      binds || [],
      options || {}
    );
    
    console.log(`[SnowflakeController] Query executed successfully: ${result.queryId}`);
    
    res.json({
      success: true,
      message: 'Query executed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('[SnowflakeController] Error in executeQuery:', error);
    res.status(500).json({
      error: 'Query execution failed',
      details: error.message
    });
  }
};

const executeBatch = async (req, res) => {
  try {
    console.log('[SnowflakeController] Received batch execution request');
    console.log('[SnowflakeController] Request body:', req.body);
    
    const { queries, options } = req.body;
    
    // Validate required fields
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid queries',
        details: 'queries is required and must be a non-empty array'
      });
    }
    
    // Validate each query in the batch
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (!query.sqlText || typeof query.sqlText !== 'string') {
        return res.status(400).json({
          error: `Invalid query at index ${i}`,
          details: 'Each query must have a sqlText property that is a string'
        });
      }
    }
    
    // Execute batch
    const result = await snowflakeService.executeBatch(queries, options || {});
    
    console.log(`[SnowflakeController] Batch executed successfully: ${result.batchId}`);
    
    res.json({
      success: true,
      message: 'Batch executed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('[SnowflakeController] Error in executeBatch:', error);
    res.status(500).json({
      error: 'Batch execution failed',
      details: error.message
    });
  }
};

const getConnectionStatus = async (req, res) => {
  try {
    console.log('[SnowflakeController] Retrieving connection status');
    
    const status = snowflakeService.getConnectionStatus();
    const stats = snowflakeService.getConnectionStats();
    
    res.json({
      success: true,
      data: {
        status: status,
        stats: stats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[SnowflakeController] Error in getConnectionStatus:', error);
    res.status(500).json({
      error: 'Failed to retrieve connection status',
      details: error.message
    });
  }
};

const healthCheck = async (req, res) => {
  try {
    console.log('[SnowflakeController] Performing health check');
    
    const health = await snowflakeService.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
    
  } catch (error) {
    console.error('[SnowflakeController] Error in healthCheck:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
};

const getQueryTemplates = (req, res) => {
  try {
    console.log('[SnowflakeController] Retrieving query templates');
    
    const templates = {
      basic: {
        select: {
          description: 'Basic SELECT query',
          sqlText: 'SELECT * FROM {table_name} LIMIT 10',
          binds: [],
          example: {
            sqlText: 'SELECT * FROM users LIMIT 10',
            binds: []
          }
        },
        insert: {
          description: 'Basic INSERT query',
          sqlText: 'INSERT INTO {table_name} ({columns}) VALUES ({values})',
          binds: [],
          example: {
            sqlText: 'INSERT INTO users (name, email) VALUES (?, ?)',
            binds: ['John Doe', 'john@example.com']
          }
        },
        update: {
          description: 'Basic UPDATE query',
          sqlText: 'UPDATE {table_name} SET {column} = ? WHERE {condition}',
          binds: [],
          example: {
            sqlText: 'UPDATE users SET email = ? WHERE id = ?',
            binds: ['newemail@example.com', 123]
          }
        },
        delete: {
          description: 'Basic DELETE query',
          sqlText: 'DELETE FROM {table_name} WHERE {condition}',
          binds: [],
          example: {
            sqlText: 'DELETE FROM users WHERE id = ?',
            binds: [123]
          }
        }
      },
      analytics: {
        count: {
          description: 'Count records',
          sqlText: 'SELECT COUNT(*) as total_count FROM {table_name}',
          binds: []
        },
        groupBy: {
          description: 'Group by analysis',
          sqlText: 'SELECT {group_column}, COUNT(*) as count FROM {table_name} GROUP BY {group_column} ORDER BY count DESC',
          binds: []
        },
        dateRange: {
          description: 'Date range query',
          sqlText: 'SELECT * FROM {table_name} WHERE {date_column} BETWEEN ? AND ?',
          binds: ['2024-01-01', '2024-12-31']
        }
      },
      metadata: {
        showTables: {
          description: 'Show all tables',
          sqlText: 'SHOW TABLES',
          binds: []
        },
        describeTable: {
          description: 'Describe table structure',
          sqlText: 'DESCRIBE TABLE {table_name}',
          binds: []
        },
        showColumns: {
          description: 'Show table columns',
          sqlText: 'SHOW COLUMNS IN TABLE {table_name}',
          binds: []
        }
      }
    };
    
    res.json({
      success: true,
      data: templates
    });
    
  } catch (error) {
    console.error('[SnowflakeController] Error in getQueryTemplates:', error);
    res.status(500).json({
      error: 'Failed to retrieve query templates',
      details: error.message
    });
  }
};

module.exports = {
  connect,
  disconnect,
  executeQuery,
  executeBatch,
  getConnectionStatus,
  healthCheck,
  getQueryTemplates
};
