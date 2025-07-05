const snowflakeService = require('./snowflakeService');
const fs = require('fs');
const path = require('path');

class DatabaseInitService {
  constructor() {
    this.schemaPath = path.join(__dirname, '..', 'src', 'database', 'snowflake-schema.sql');
  }

  async initializeDatabase() {
    try {
      console.log('[DatabaseInitService] Starting database initialization...');
      
      // Ensure connection to Snowflake
      await snowflakeService.connect();
      
      // Read the schema file
      const schemaSQL = fs.readFileSync(this.schemaPath, 'utf8');
      
      // Split the schema into individual statements
      const statements = this.parseSchemaStatements(schemaSQL);
      
      console.log(`[DatabaseInitService] Found ${statements.length} SQL statements to execute`);
      
      // Execute statements in batches
      const results = await this.executeSchemaStatements(statements);
      
      console.log('[DatabaseInitService] Database initialization completed successfully');
      
      return {
        success: true,
        statementsExecuted: results.length,
        results: results
      };
      
    } catch (error) {
      console.error('[DatabaseInitService] Database initialization failed:', error);
      throw error;
    }
  }

  parseSchemaStatements(schemaSQL) {
    // Remove comments and split by semicolons
    const cleanSQL = schemaSQL
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    // Split by semicolons but be careful with semicolons inside strings
    const statements = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < cleanSQL.length; i++) {
      const char = cleanSQL[i];
      const prevChar = i > 0 ? cleanSQL[i - 1] : '';
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      } else if (!inString && char === ';') {
        const statement = currentStatement.trim();
        if (statement && !statement.startsWith('--')) {
          statements.push(statement);
        }
        currentStatement = '';
        continue;
      }
      
      currentStatement += char;
    }
    
    // Add the last statement if it doesn't end with semicolon
    const lastStatement = currentStatement.trim();
    if (lastStatement && !lastStatement.startsWith('--')) {
      statements.push(lastStatement);
    }
    
    return statements.filter(stmt => stmt.length > 0);
  }

  async executeSchemaStatements(statements) {
    const results = [];
    const batchSize = 10; // Execute in smaller batches to avoid timeouts
    
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      
      console.log(`[DatabaseInitService] Executing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(statements.length / batchSize)}`);
      
      const batchQueries = batch.map(statement => ({
        sqlText: statement,
        binds: []
      }));
      
      try {
        const batchResult = await snowflakeService.executeBatch(batchQueries, {
          timeout: 120000, // 2 minutes timeout for schema operations
          continueOnError: false
        });
        
        results.push(...batchResult.results);
        
        // Log progress
        console.log(`[DatabaseInitService] Batch completed: ${batchResult.successCount}/${batchResult.totalQueries} successful`);
        
      } catch (error) {
        console.error(`[DatabaseInitService] Batch execution failed:`, error);
        throw error;
      }
    }
    
    return results;
  }

  async createProject(projectData) {
    try {
      const { projectId, userId, projectName } = projectData;
      
      const result = await snowflakeService.executeQuery(
        'CALL SP_CREATE_PROJECT(?, ?, ?)',
        [projectId, userId, projectName],
        { timeout: 30000 }
      );
      
      return result;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error creating project:', error);
      throw error;
    }
  }

  async insertCodeFile(fileData) {
    try {
      const { fileId, projectId, filename, language, content, fileSize } = fileData;
      
      const result = await snowflakeService.executeQuery(
        `INSERT INTO CODE_FILES (FILE_ID, PROJECT_ID, FILENAME, LANGUAGE, CONTENT, FILE_SIZE)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [fileId, projectId, filename, language, content, fileSize],
        { timeout: 60000 }
      );
      
      return result;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error inserting code file:', error);
      throw error;
    }
  }

  async insertAnalysis(analysisData) {
    try {
      const { 
        analysisId, 
        fileId, 
        issuesFound, 
        suggestions, 
        qualityScore, 
        complexityScore, 
        securityScore,
        strengths,
        learningRecommendations
      } = analysisData;
      
      const result = await snowflakeService.executeQuery(
        `INSERT INTO ANALYSIS (
          ANALYSIS_ID, FILE_ID, ISSUES_FOUND, SUGGESTIONS, 
          QUALITY_SCORE, COMPLEXITY_SCORE, SECURITY_SCORE,
          STRENGTHS, LEARNING_RECOMMENDATIONS
        ) VALUES (?, ?, PARSE_JSON(?), PARSE_JSON(?), ?, ?, ?, PARSE_JSON(?), PARSE_JSON(?))`,
        [
          analysisId, 
          fileId, 
          JSON.stringify(issuesFound), 
          JSON.stringify(suggestions),
          qualityScore, 
          complexityScore, 
          securityScore,
          JSON.stringify(strengths),
          JSON.stringify(learningRecommendations)
        ],
        { timeout: 30000 }
      );
      
      return result;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error inserting analysis:', error);
      throw error;
    }
  }

  async createLearningPath(learningPathData) {
    try {
      const { 
        pathId, 
        userId, 
        projectId, 
        recommendedTopics, 
        difficultyLevel, 
        estimatedHours 
      } = learningPathData;
      
      const result = await snowflakeService.executeQuery(
        `INSERT INTO LEARNING_PATHS (
          PATH_ID, USER_ID, PROJECT_ID, RECOMMENDED_TOPICS, 
          DIFFICULTY_LEVEL, ESTIMATED_HOURS
        ) VALUES (?, ?, ?, PARSE_JSON(?), ?, ?)`,
        [
          pathId, 
          userId, 
          projectId, 
          JSON.stringify(recommendedTopics), 
          difficultyLevel, 
          estimatedHours
        ],
        { timeout: 30000 }
      );
      
      return result;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error creating learning path:', error);
      throw error;
    }
  }

  async getProjectSummary(projectId) {
    try {
      const result = await snowflakeService.executeQuery(
        'SELECT * FROM VW_PROJECT_SUMMARY WHERE PROJECT_ID = ?',
        [projectId],
        { timeout: 30000 }
      );
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error getting project summary:', error);
      throw error;
    }
  }

  async getUserLearningProgress(userId) {
    try {
      const result = await snowflakeService.executeQuery(
        'SELECT * FROM VW_USER_LEARNING_PROGRESS WHERE USER_ID = ?',
        [userId],
        { timeout: 30000 }
      );
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error getting user learning progress:', error);
      throw error;
    }
  }

  async getCodeQualityInsights(language = null) {
    try {
      let query = 'SELECT * FROM VW_CODE_QUALITY_INSIGHTS';
      let binds = [];
      
      if (language) {
        query += ' WHERE LANGUAGE = ?';
        binds = [language];
      }
      
      const result = await snowflakeService.executeQuery(query, binds, { timeout: 30000 });
      
      return result.rows;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error getting code quality insights:', error);
      throw error;
    }
  }

  async updateProjectStatus(projectId, status) {
    try {
      const result = await snowflakeService.executeQuery(
        'CALL SP_UPDATE_PROJECT_STATUS(?, ?)',
        [projectId, status],
        { timeout: 30000 }
      );
      
      return result;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error updating project status:', error);
      throw error;
    }
  }

  async checkSchemaExists() {
    try {
      const result = await snowflakeService.executeQuery(
        `SELECT COUNT(*) as table_count 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = 'MAIN' 
         AND TABLE_NAME IN ('PROJECTS', 'CODE_FILES', 'ANALYSIS', 'LEARNING_PATHS')`,
        [],
        { timeout: 30000 }
      );
      
      const tableCount = result.rows[0]?.TABLE_COUNT || 0;
      return tableCount === 4;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error checking schema:', error);
      return false;
    }
  }

  async getSchemaInfo() {
    try {
      const result = await snowflakeService.executeQuery(
        `SELECT 
           TABLE_NAME,
           TABLE_TYPE,
           ROW_COUNT,
           BYTES,
           COMMENT
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = 'MAIN' 
         ORDER BY TABLE_NAME`,
        [],
        { timeout: 30000 }
      );
      
      return result.rows;
      
    } catch (error) {
      console.error('[DatabaseInitService] Error getting schema info:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseInitService();
