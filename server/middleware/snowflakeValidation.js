const validateQueryRequest = (req, res, next) => {
  try {
    console.log('[SnowflakeValidation] Validating query request');
    
    const { sqlText, binds, options } = req.body;
    
    // Validate sqlText
    if (!sqlText || typeof sqlText !== 'string' || sqlText.trim() === '') {
      return res.status(400).json({
        error: 'Invalid sqlText',
        details: 'sqlText is required and must be a non-empty string'
      });
    }
    
    // Validate sqlText length
    const maxSqlLength = 100000; // 100KB limit
    if (sqlText.length > maxSqlLength) {
      return res.status(400).json({
        error: 'SQL text too large',
        details: `SQL text exceeds maximum length of ${maxSqlLength} characters`
      });
    }
    
    // Validate binds if provided
    if (binds && !Array.isArray(binds)) {
      return res.status(400).json({
        error: 'Invalid binds',
        details: 'binds must be an array if provided'
      });
    }
    
    // Validate options if provided
    if (options && typeof options !== 'object') {
      return res.status(400).json({
        error: 'Invalid options',
        details: 'options must be an object if provided'
      });
    }
    
    // Validate timeout in options
    if (options && options.timeout) {
      if (typeof options.timeout !== 'number' || options.timeout <= 0) {
        return res.status(400).json({
          error: 'Invalid timeout',
          details: 'timeout must be a positive number'
        });
      }
      
      const maxTimeout = 600000; // 10 minutes
      if (options.timeout > maxTimeout) {
        return res.status(400).json({
          error: 'Timeout too large',
          details: `timeout cannot exceed ${maxTimeout}ms (10 minutes)`
        });
      }
    }
    
    // Basic SQL injection prevention (simple checks)
    const suspiciousPatterns = [
      /;\s*(drop|delete|truncate|alter)\s+/i,
      /union\s+select/i,
      /exec\s*\(/i,
      /xp_cmdshell/i
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      pattern.test(sqlText)
    );
    
    if (hasSuspiciousPattern) {
      console.warn('[SnowflakeValidation] Suspicious SQL pattern detected:', sqlText);
      return res.status(400).json({
        error: 'Potentially unsafe SQL detected',
        details: 'The SQL contains patterns that may be unsafe'
      });
    }
    
    console.log('[SnowflakeValidation] Query request validation passed');
    next();
    
  } catch (error) {
    console.error('[SnowflakeValidation] Query validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      details: error.message
    });
  }
};

const validateBatchRequest = (req, res, next) => {
  try {
    console.log('[SnowflakeValidation] Validating batch request');
    
    const { queries, options } = req.body;
    
    // Validate queries array
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        error: 'Invalid queries',
        details: 'queries is required and must be a non-empty array'
      });
    }
    
    // Validate batch size
    const maxBatchSize = 100;
    if (queries.length > maxBatchSize) {
      return res.status(400).json({
        error: 'Batch too large',
        details: `Batch size cannot exceed ${maxBatchSize} queries`
      });
    }
    
    // Validate each query in the batch
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      if (!query || typeof query !== 'object') {
        return res.status(400).json({
          error: `Invalid query at index ${i}`,
          details: 'Each query must be an object'
        });
      }
      
      if (!query.sqlText || typeof query.sqlText !== 'string' || query.sqlText.trim() === '') {
        return res.status(400).json({
          error: `Invalid sqlText at index ${i}`,
          details: 'Each query must have a non-empty sqlText property'
        });
      }
      
      // Validate sqlText length
      const maxSqlLength = 50000; // 50KB limit per query in batch
      if (query.sqlText.length > maxSqlLength) {
        return res.status(400).json({
          error: `SQL text too large at index ${i}`,
          details: `SQL text exceeds maximum length of ${maxSqlLength} characters`
        });
      }
      
      // Validate binds if provided
      if (query.binds && !Array.isArray(query.binds)) {
        return res.status(400).json({
          error: `Invalid binds at index ${i}`,
          details: 'binds must be an array if provided'
        });
      }
    }
    
    // Validate options if provided
    if (options && typeof options !== 'object') {
      return res.status(400).json({
        error: 'Invalid options',
        details: 'options must be an object if provided'
      });
    }
    
    // Validate timeout in options
    if (options && options.timeout) {
      if (typeof options.timeout !== 'number' || options.timeout <= 0) {
        return res.status(400).json({
          error: 'Invalid timeout',
          details: 'timeout must be a positive number'
        });
      }
      
      const maxTimeout = 1800000; // 30 minutes for batch
      if (options.timeout > maxTimeout) {
        return res.status(400).json({
          error: 'Timeout too large',
          details: `timeout cannot exceed ${maxTimeout}ms (30 minutes)`
        });
      }
    }
    
    // Validate continueOnError option
    if (options && options.continueOnError !== undefined && typeof options.continueOnError !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid continueOnError',
        details: 'continueOnError must be a boolean if provided'
      });
    }
    
    console.log('[SnowflakeValidation] Batch request validation passed');
    next();
    
  } catch (error) {
    console.error('[SnowflakeValidation] Batch validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      details: error.message
    });
  }
};

const validateEnvironmentConfig = (req, res, next) => {
  try {
    console.log('[SnowflakeValidation] Validating environment configuration');
    
    const requiredEnvVars = [
      'SNOWFLAKE_ACCOUNT',
      'SNOWFLAKE_USERNAME',
      'SNOWFLAKE_PASSWORD',
      'SNOWFLAKE_WAREHOUSE',
      'SNOWFLAKE_DATABASE',
      'SNOWFLAKE_SCHEMA'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(500).json({
        error: 'Missing Snowflake configuration',
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        requiredVariables: requiredEnvVars
      });
    }
    
    console.log('[SnowflakeValidation] Environment configuration validation passed');
    next();
    
  } catch (error) {
    console.error('[SnowflakeValidation] Environment validation error:', error);
    res.status(500).json({
      error: 'Configuration validation failed',
      details: error.message
    });
  }
};

const rateLimitMiddleware = (req, res, next) => {
  try {
    // Simple in-memory rate limiting (in production, use Redis or similar)
    if (!global.snowflakeRateLimit) {
      global.snowflakeRateLimit = new Map();
    }
    
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 30; // Max 30 requests per minute
    
    // Clean old entries
    for (const [id, data] of global.snowflakeRateLimit.entries()) {
      if (now - data.windowStart > windowMs) {
        global.snowflakeRateLimit.delete(id);
      }
    }
    
    // Get or create client data
    let clientData = global.snowflakeRateLimit.get(clientId);
    if (!clientData || now - clientData.windowStart > windowMs) {
      clientData = {
        requests: 0,
        windowStart: now
      };
    }
    
    // Check rate limit
    if (clientData.requests >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        details: `Maximum ${maxRequests} requests per minute allowed`,
        retryAfter: Math.ceil((windowMs - (now - clientData.windowStart)) / 1000)
      });
    }
    
    // Update request count
    clientData.requests++;
    global.snowflakeRateLimit.set(clientId, clientData);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - clientData.requests,
      'X-RateLimit-Reset': new Date(clientData.windowStart + windowMs).toISOString()
    });
    
    next();
    
  } catch (error) {
    console.error('[SnowflakeValidation] Rate limit error:', error);
    next(); // Continue on rate limit errors
  }
};

module.exports = {
  validateQueryRequest,
  validateBatchRequest,
  validateEnvironmentConfig,
  rateLimitMiddleware
};
