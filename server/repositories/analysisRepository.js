const snowflakeService = require('../services/snowflakeService');
const { ANALYSIS_TYPES } = require('../services/analysisService');
console.log('ANALYSIS_TYPES:', ANALYSIS_TYPES);
const { v4: uuidv4 } = require('uuid');

console.log('>>> USING ANALYSIS REPO FILE: analysisRepository.js');

/**
 * Analysis Repository for Snowflake data access
 * Handles all database operations related to code analysis data
 */
class AnalysisRepository {
  constructor() {
    this.tableName = 'ANALYSES';
    this.logger = console; // Can be replaced with a proper logger
  }

  /**
   * Create a new analysis record in the database
   * @param {Object} analysisData - Analysis data
   * @param {string} analysisData.fileId - ID of the file being analyzed
   * @param {Array} [analysisData.issuesFound=[]] - Array of issues found in the code
   * @param {Array} [analysisData.suggestions=[]] - Array of improvement suggestions
   * @param {number} analysisData.qualityScore - Quality score (1-10)
   * @param {number} analysisData.complexityScore - Complexity score (1-10)
   * @param {number} analysisData.securityScore - Security score (1-10)
   * @param {Array} [analysisData.strengths=[]] - Array of code strengths
   * @param {Array} [analysisData.learningRecommendations=[]] - Learning recommendations
   * @returns {Promise<Object>} Created analysis data with generated ID
   */
  async createAnalysis(analysisData) {
    try {
      console.log('[REPO DEBUG] Creating analysis with data:', analysisData);
      
      const { 
        fileId, 
        issuesFound = [], 
        suggestions = [], 
        qualityScore, 
        complexityScore, 
        securityScore,
        strengths = [], 
        learningRecommendations = [],
        projectId,
        analysisType
      } = analysisData;
  
      // Validate required fields
      if (!fileId) throw new Error('File ID is required');
      if (!projectId) throw new Error('Project ID is required');
      if (!analysisType) throw new Error('Analysis type is required');
  
      // ✅ FIXED VALIDATION
      const normalizedAnalysisType = (analysisType || '').toLowerCase();
      const normalizedAnalysisTypes = Object.values(ANALYSIS_TYPES).map(v => v.toLowerCase());
  
      console.log('>>> Raw analysisType:', analysisType);
      console.log('>>> Normalized:', normalizedAnalysisType);
      console.log('>>> Valid Types:', normalizedAnalysisTypes);
  
      if (!normalizedAnalysisTypes.includes(normalizedAnalysisType)) {
        throw new Error(`Invalid analysis type: ${analysisType}. Valid types are: ${normalizedAnalysisTypes.join(', ')}`);
      }
  
      // Validate scores
      const validateScore = (score, name) => {
        if (typeof score !== 'number' || score < 1 || score > 10) {
          throw new Error(`${name} must be a number between 1 and 10`);
        }
      };
      
      validateScore(qualityScore, 'qualityScore');
      validateScore(complexityScore, 'complexityScore');
      validateScore(securityScore, 'securityScore');
  
      const analysisId = uuidv4();
      console.log(`[REPO DEBUG] Generated analysis ID: ${analysisId}`);
  
      const insertQuery = `
        INSERT INTO ${this.tableName} (
          ANALYSIS_ID, FILE_ID, PROJECT_ID, ANALYSIS_TYPE,
          ISSUES_FOUND, SUGGESTIONS, QUALITY_SCORE, COMPLEXITY_SCORE, 
          SECURITY_SCORE, STRENGTHS, LEARNING_RECOMMENDATIONS,
          CREATED_AT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
      `;

  
      const insertParams = [
        analysisId,
        fileId,
        projectId,
        normalizedAnalysisType,
        JSON.stringify(issuesFound),
        JSON.stringify(suggestions),
        qualityScore,
        complexityScore,
        securityScore,
        JSON.stringify(strengths),
        JSON.stringify(learningRecommendations)
      ];
  
      console.log('[REPO DEBUG] Executing query with params:', insertParams);
      const result = await snowflakeService.executeQuery(insertQuery, insertParams, { timeout: 30000 });
      console.log('[REPO DEBUG] Query result:', result);
  
      if (!result || result.rowCount === 0) {
        throw new Error('Insert failed: No rows were affected');
      }
  
      return {
        success: true,
        data: {
          analysisId,
          fileId,
          projectId,
          analysisType: normalizedAnalysisType,
          qualityScore,
          complexityScore,
          securityScore,
          issuesFound,
          suggestions,
          strengths,
          learningRecommendations,
          createdAt: new Date().toISOString()
        }
      };
  
    } catch (error) {
      console.error('[REPO ERROR] Error creating analysis:', error);
      throw new Error(`Failed to create analysis: ${error.message}`);
    }
  }
  

  /**
   * Get all analyses for a project
   * @param {string} projectId - Project ID to get analyses for
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=50] - Maximum number of results
   * @param {number} [options.offset=0] - Number of results to skip
   * @param {string} [options.orderBy='CREATED_AT'] - Field to order by
   * @param {string} [options.orderDirection='DESC'] - Order direction (ASC/DESC)
   * @param {number} [options.minQualityScore] - Minimum quality score filter
   * @param {number} [options.maxComplexityScore] - Maximum complexity score filter
   * @returns {Promise<Object>} Array of analyses and metadata
   */
  async getAnalysesByProjectId(projectId, options = {}) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const {
        limit = 50,
        offset = 0,
        orderBy = 'CREATED_AT',
        orderDirection = 'DESC',
        minQualityScore,
        maxComplexityScore
      } = options;

      // Validate orderBy field
      const validOrderFields = ['ANALYSIS_ID', 'QUALITY_SCORE', 'COMPLEXITY_SCORE', 'SECURITY_SCORE', 'CREATED_AT'];
      if (!validOrderFields.includes(orderBy)) {
        throw new Error(`Invalid orderBy field. Must be one of: ${validOrderFields.join(', ')}`);
      }

      // Validate orderDirection
      if (!['ASC', 'DESC'].includes(orderDirection.toUpperCase())) {
        throw new Error('Order direction must be ASC or DESC');
      }

      this.logger.log(`[AnalysisRepository] Retrieving analyses for project: ${projectId}`);
      
      let query = `
        SELECT 
          a.ANALYSIS_ID,
          a.FILE_ID,
          a.ISSUES_FOUND,
          a.SUGGESTIONS,
          a.QUALITY_SCORE,
          a.COMPLEXITY_SCORE,
          a.SECURITY_SCORE,
          a.STRENGTHS,
          a.LEARNING_RECOMMENDATIONS,
          a.CREATED_AT,
          cf.FILENAME,
          cf.LANGUAGE
        FROM ${this.tableName} a
        JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID
        WHERE cf.PROJECT_ID = ?`;
      
      const binds = [projectId];
      
      // Add score filters if provided
      if (minQualityScore !== undefined) {
        query += ' AND a.QUALITY_SCORE >= ?';
        binds.push(minQualityScore);
      }
      
      if (maxComplexityScore !== undefined) {
        query += ' AND a.COMPLEXITY_SCORE <= ?';
        binds.push(maxComplexityScore);
      }
      
      // Add ordering
      query += ` ORDER BY a.${orderBy} ${orderDirection.toUpperCase()}`;
      
      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      binds.push(limit, offset);
      
      const result = await snowflakeService.executeQuery(query, binds, { timeout: 30000 });
      
      // Get total count for pagination metadata
      let countQuery = `
        SELECT COUNT(*) as TOTAL_COUNT 
        FROM ${this.tableName} a
        JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID
        WHERE cf.PROJECT_ID = ?`;
      
      const countBinds = [projectId];
      
      if (minQualityScore !== undefined) {
        countQuery += ' AND a.QUALITY_SCORE >= ?';
        countBinds.push(minQualityScore);
      }
      
      if (maxComplexityScore !== undefined) {
        countQuery += ' AND a.COMPLEXITY_SCORE <= ?';
        countBinds.push(maxComplexityScore);
      }
      
      const countResult = await snowflakeService.executeQuery(countQuery, countBinds, { timeout: 30000 });
      const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;
      
      const analyses = result.rows.map(row => this.formatAnalysisDataWithFile(row));
      
      this.logger.log(`[AnalysisRepository] Retrieved ${analyses.length} analyses for project: ${projectId}`);
      
      return {
        success: true,
        data: analyses,
        metadata: {
          totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
      
    } catch (error) {
      this.logger.error('[AnalysisRepository] Error retrieving analyses by project:', error);
      throw new Error(`Failed to retrieve analyses: ${error.message}`);
    }
  }

  /**
   * Update an existing analysis
   * @param {string} analysisId - Analysis ID to update
   * @param {Object} updates - Fields to update
   * @param {Array} [updates.issuesFound] - Updated issues found
   * @param {Array} [updates.suggestions] - Updated suggestions
   * @param {number} [updates.qualityScore] - Updated quality score
   * @param {number} [updates.complexityScore] - Updated complexity score
   * @param {number} [updates.securityScore] - Updated security score
   * @param {Array} [updates.strengths] - Updated strengths
   * @param {Array} [updates.learningRecommendations] - Updated learning recommendations
   * @returns {Promise<Object>} Updated analysis data
   */
  async updateAnalysis(analysisId, updates) {
    try {
      if (!analysisId) {
        throw new Error('Analysis ID is required');
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('At least one field to update is required');
      }

      // Validate score ranges if provided
      const scoreFields = ['qualityScore', 'complexityScore', 'securityScore'];
      for (const field of scoreFields) {
        if (updates[field] !== undefined) {
          if (typeof updates[field] !== 'number' || updates[field] < 1 || updates[field] > 10) {
            throw new Error(`${field} must be a number between 1 and 10`);
          }
        }
      }

      this.logger.log(`[AnalysisRepository] Updating analysis: ${analysisId}`);
      
      const updateFields = [];
      const binds = [];
      
      // Build dynamic update query
      if (updates.issuesFound !== undefined) {
        updateFields.push('ISSUES_FOUND = PARSE_JSON(?)');
        binds.push(JSON.stringify(updates.issuesFound));
      }
      
      if (updates.suggestions !== undefined) {
        updateFields.push('SUGGESTIONS = PARSE_JSON(?)');
        binds.push(JSON.stringify(updates.suggestions));
      }
      
      if (updates.qualityScore !== undefined) {
        updateFields.push('QUALITY_SCORE = ?');
        binds.push(updates.qualityScore);
      }
      
      if (updates.complexityScore !== undefined) {
        updateFields.push('COMPLEXITY_SCORE = ?');
        binds.push(updates.complexityScore);
      }
      
      if (updates.securityScore !== undefined) {
        updateFields.push('SECURITY_SCORE = ?');
        binds.push(updates.securityScore);
      }
      
      if (updates.strengths !== undefined) {
        updateFields.push('STRENGTHS = PARSE_JSON(?)');
        binds.push(JSON.stringify(updates.strengths));
      }
      
      if (updates.learningRecommendations !== undefined) {
        updateFields.push('LEARNING_RECOMMENDATIONS = PARSE_JSON(?)');
        binds.push(JSON.stringify(updates.learningRecommendations));
      }
      
      // Add updated timestamp
      updateFields.push('UPDATED_AT = CURRENT_TIMESTAMP()');
      
      // Add analysis ID for WHERE clause
      binds.push(analysisId);
      
      const query = `
        UPDATE ${this.tableName} 
        SET ${updateFields.join(', ')}
        WHERE ANALYSIS_ID = ?`;
      
      const result = await snowflakeService.executeQuery(query, binds, { timeout: 30000 });
      
      // Get updated analysis data
      const updatedAnalysis = await this.getAnalysisById(analysisId);
      
      this.logger.log(`[AnalysisRepository] Analysis updated successfully: ${analysisId}`);
      
      return {
        success: true,
        data: {
          analysisId,
          updatedFields: Object.keys(updates),
          updatedAt: new Date().toISOString(),
          analysis: updatedAnalysis?.data
        },
        queryResult: result
      };
      
    } catch (error) {
      this.logger.error('[AnalysisRepository] Error updating analysis:', error);
      throw new Error(`Failed to update analysis: ${error.message}`);
    }
  }

  /**
   * Get comprehensive analytics summary for a project
   * @param {string} projectId - Project ID to get analytics for
   * @returns {Promise<Object>} Project analytics summary
   */
  async getProjectAnalyticsSummary(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      this.logger.log(`[AnalysisRepository] Retrieving analytics summary for project: ${projectId}`);
      
      const query = `
        SELECT 
          COUNT(DISTINCT a.ANALYSIS_ID) as TOTAL_ANALYSES,
          COUNT(DISTINCT a.FILE_ID) as ANALYZED_FILES,
          AVG(a.QUALITY_SCORE) as AVG_QUALITY_SCORE,
          AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY_SCORE,
          AVG(a.SECURITY_SCORE) as AVG_SECURITY_SCORE,
          MIN(a.QUALITY_SCORE) as MIN_QUALITY_SCORE,
          MAX(a.QUALITY_SCORE) as MAX_QUALITY_SCORE,
          MIN(a.COMPLEXITY_SCORE) as MIN_COMPLEXITY_SCORE,
          MAX(a.COMPLEXITY_SCORE) as MAX_COMPLEXITY_SCORE,
          MIN(a.SECURITY_SCORE) as MIN_SECURITY_SCORE,
          MAX(a.SECURITY_SCORE) as MAX_SECURITY_SCORE,
          COUNT(DISTINCT cf.LANGUAGE) as LANGUAGES_COUNT,
          MIN(a.CREATED_AT) as FIRST_ANALYSIS,
          MAX(a.CREATED_AT) as LAST_ANALYSIS
        FROM ${this.tableName} a
        JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID
        WHERE cf.PROJECT_ID = ?`;
      
      const result = await snowflakeService.executeQuery(query, [projectId], { timeout: 30000 });
      
      if (result.rows.length === 0 || result.rows[0].TOTAL_ANALYSES === 0) {
        return {
          success: true,
          data: {
            projectId,
            totalAnalyses: 0,
            analyzedFiles: 0,
            message: 'No analyses found for this project'
          }
        };
      }
      
      // Get language distribution
      const languageQuery = `
        SELECT 
          cf.LANGUAGE,
          COUNT(DISTINCT a.ANALYSIS_ID) as ANALYSIS_COUNT,
          AVG(a.QUALITY_SCORE) as AVG_QUALITY,
          AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY,
          AVG(a.SECURITY_SCORE) as AVG_SECURITY
        FROM ${this.tableName} a
        JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID
        WHERE cf.PROJECT_ID = ?
        GROUP BY cf.LANGUAGE
        ORDER BY ANALYSIS_COUNT DESC`;
      
      const languageResult = await snowflakeService.executeQuery(languageQuery, [projectId], { timeout: 30000 });
      
      // Get most common issues
      const issuesQuery = `
        SELECT 
          issue.value:type::STRING as ISSUE_TYPE,
          issue.value:severity::STRING as SEVERITY,
          COUNT(*) as OCCURRENCE_COUNT
        FROM ${this.tableName} a
        JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID,
        LATERAL FLATTEN(input => a.ISSUES_FOUND) issue
        WHERE cf.PROJECT_ID = ?
        GROUP BY issue.value:type::STRING, issue.value:severity::STRING
        ORDER BY OCCURRENCE_COUNT DESC
        LIMIT 10`;
      
      const issuesResult = await snowflakeService.executeQuery(issuesQuery, [projectId], { timeout: 30000 });
      
      const summary = this.formatProjectAnalyticsSummary(result.rows[0]);
      summary.languageDistribution = languageResult.rows.map(row => this.formatLanguageDistribution(row));
      summary.commonIssues = issuesResult.rows.map(row => this.formatCommonIssue(row));
      
      this.logger.log(`[AnalysisRepository] Analytics summary retrieved for project: ${projectId}`);
      
      return {
        success: true,
        data: summary
      };
      
    } catch (error) {
      this.logger.error('[AnalysisRepository] Error retrieving project analytics summary:', error);
      throw new Error(`Failed to retrieve project analytics: ${error.message}`);
    }
  }

  /**
   * Get cross-project analytics for a user
   * @param {string} userId - User ID to get analytics for
   * @param {Object} [options] - Query options
   * @param {string} [options.timeframe='30d'] - Time frame for analysis (7d, 30d, 90d, 1y)
   * @returns {Promise<Object>} User progress analytics
   */
  async getUserProgressAnalytics(userId, options = {}) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { timeframe = '30d' } = options;
      
      // Convert timeframe to days
      const timeframeDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      
      const days = timeframeDays[timeframe];
      if (!days) {
        throw new Error('Invalid timeframe. Must be one of: 7d, 30d, 90d, 1y');
      }

      this.logger.log(`[AnalysisRepository] Retrieving user progress analytics for: ${userId} (${timeframe})`);
      
      // Overall user statistics
      const overallQuery = `
        SELECT 
          COUNT(DISTINCT p.PROJECT_ID) as TOTAL_PROJECTS,
          COUNT(DISTINCT a.ANALYSIS_ID) as TOTAL_ANALYSES,
          COUNT(DISTINCT a.FILE_ID) as TOTAL_FILES_ANALYZED,
          AVG(a.QUALITY_SCORE) as AVG_QUALITY_SCORE,
          AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY_SCORE,
          AVG(a.SECURITY_SCORE) as AVG_SECURITY_SCORE,
          MIN(a.CREATED_AT) as FIRST_ANALYSIS,
          MAX(a.CREATED_AT) as LAST_ANALYSIS
        FROM PROJECTS p
        JOIN CODE_FILES cf ON p.PROJECT_ID = cf.PROJECT_ID
        JOIN ${this.tableName} a ON cf.FILE_ID = a.FILE_ID
        WHERE p.USER_ID = ?
        AND a.CREATED_AT >= DATEADD(day, -?, CURRENT_TIMESTAMP())`;
      
      const overallResult = await snowflakeService.executeQuery(overallQuery, [userId, days], { timeout: 30000 });
      
      // Progress over time (weekly breakdown)
      const progressQuery = `
        SELECT 
          DATE_TRUNC('week', a.CREATED_AT) as WEEK_START,
          COUNT(DISTINCT a.ANALYSIS_ID) as ANALYSES_COUNT,
          AVG(a.QUALITY_SCORE) as AVG_QUALITY,
          AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY,
          AVG(a.SECURITY_SCORE) as AVG_SECURITY
        FROM PROJECTS p
        JOIN CODE_FILES cf ON p.PROJECT_ID = cf.PROJECT_ID
        JOIN ${this.tableName} a ON cf.FILE_ID = a.FILE_ID
        WHERE p.USER_ID = ?
        AND a.CREATED_AT >= DATEADD(day, -?, CURRENT_TIMESTAMP())
        GROUP BY DATE_TRUNC('week', a.CREATED_AT)
        ORDER BY WEEK_START`;
      
      const progressResult = await snowflakeService.executeQuery(progressQuery, [userId, days], { timeout: 30000 });
      
      // Language expertise
      const languageQuery = `
        SELECT 
          cf.LANGUAGE,
          COUNT(DISTINCT a.ANALYSIS_ID) as ANALYSIS_COUNT,
          AVG(a.QUALITY_SCORE) as AVG_QUALITY,
          AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY,
          AVG(a.SECURITY_SCORE) as AVG_SECURITY,
          COUNT(DISTINCT cf.PROJECT_ID) as PROJECTS_COUNT
        FROM PROJECTS p
        JOIN CODE_FILES cf ON p.PROJECT_ID = cf.PROJECT_ID
        JOIN ${this.tableName} a ON cf.FILE_ID = a.FILE_ID
        WHERE p.USER_ID = ?
        AND a.CREATED_AT >= DATEADD(day, -?, CURRENT_TIMESTAMP())
        GROUP BY cf.LANGUAGE
        ORDER BY ANALYSIS_COUNT DESC`;
      
      const languageResult = await snowflakeService.executeQuery(languageQuery, [userId, days], { timeout: 30000 });
      
      if (overallResult.rows.length === 0 || overallResult.rows[0].TOTAL_ANALYSES === 0) {
        return {
          success: true,
          data: {
            userId,
            timeframe,
            totalAnalyses: 0,
            message: 'No analyses found for this user in the specified timeframe'
          }
        };
      }
      
      const analytics = {
        userId,
        timeframe,
        overall: this.formatUserOverallStats(overallResult.rows[0]),
        progressOverTime: progressResult.rows.map(row => this.formatProgressData(row)),
        languageExpertise: languageResult.rows.map(row => this.formatLanguageExpertise(row))
      };
      
      this.logger.log(`[AnalysisRepository] User progress analytics retrieved for: ${userId}`);
      
      return {
        success: true,
        data: analytics
      };
      
    } catch (error) {
      this.logger.error('[AnalysisRepository] Error retrieving user progress analytics:', error);
      throw new Error(`Failed to retrieve user analytics: ${error.message}`);
    }
  }

  /**
   * Get analysis by ID
   * @param {string} analysisId - Analysis ID to retrieve
   * @returns {Promise<Object|null>} Analysis data or null if not found
   */
  async getAnalysisById(analysisId) {
    try {
      if (!analysisId) {
        throw new Error('Analysis ID is required');
      }

      const result = await snowflakeService.executeQuery(
        `SELECT 
           ANALYSIS_ID,
           FILE_ID,
           ISSUES_FOUND,
           SUGGESTIONS,
           QUALITY_SCORE,
           COMPLEXITY_SCORE,
           SECURITY_SCORE,
           STRENGTHS,
           LEARNING_RECOMMENDATIONS,
           CREATED_AT
         FROM ${this.tableName} 
         WHERE ANALYSIS_ID = ?`,
        [analysisId],
        { timeout: 30000 }
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        success: true,
        data: this.formatAnalysisData(result.rows[0])
      };
      
    } catch (error) {
      this.logger.error('[AnalysisRepository] Error retrieving analysis by ID:', error);
      throw new Error(`Failed to retrieve analysis: ${error.message}`);
    }
  }

  async insertDummyCodeFile(fileId, projectId) {
    const query = `
      INSERT INTO CODE_FILES (FILE_ID, PROJECT_ID, FILENAME, LANGUAGE, CREATED_AT)
      VALUES (?, ?, 'testfile.js', 'javascript', CURRENT_TIMESTAMP())
    `;
    await snowflakeService.executeQuery(query, [fileId, projectId]);
  }
  

  /**
 * DEBUG: Get recent analyses directly from the ANALYSES table
 * @returns {Promise<Array>} Last 10 analysis records
 */
  async debugGetAnalyses() {
    const query = `SELECT * FROM ${this.tableName} ORDER BY CREATED_AT DESC LIMIT 10`;
    const result = await snowflakeService.executeQuery(query);
    return result.rows;
  }
  

  // Private formatting methods

  /**
   * Format analysis data from Snowflake result
   * @private
   */
  formatAnalysisData(row) {
    return {
      analysisId: row.ANALYSIS_ID,
      fileId: row.FILE_ID,
      issuesFound: row.ISSUES_FOUND ? JSON.parse(row.ISSUES_FOUND) : [],
      suggestions: row.SUGGESTIONS ? JSON.parse(row.SUGGESTIONS) : [],
      qualityScore: row.QUALITY_SCORE,
      complexityScore: row.COMPLEXITY_SCORE,
      securityScore: row.SECURITY_SCORE,
      strengths: row.STRENGTHS ? JSON.parse(row.STRENGTHS) : [],
      learningRecommendations: row.LEARNING_RECOMMENDATIONS ? JSON.parse(row.LEARNING_RECOMMENDATIONS) : [],
      createdAt: row.CREATED_AT
    };
  }

  /**
   * Format analysis data with file information
   * @private
   */
  formatAnalysisDataWithFile(row) {
    const analysis = this.formatAnalysisData(row);
    analysis.filename = row.FILENAME;
    analysis.language = row.LANGUAGE;
    return analysis;
  }

  /**
   * Format project analytics summary data
   * @private
   */
  formatProjectAnalyticsSummary(row) {
    return {
      totalAnalyses: row.TOTAL_ANALYSES,
      analyzedFiles: row.ANALYZED_FILES,
      avgQualityScore: parseFloat(row.AVG_QUALITY_SCORE?.toFixed(2)) || 0,
      avgComplexityScore: parseFloat(row.AVG_COMPLEXITY_SCORE?.toFixed(2)) || 0,
      avgSecurityScore: parseFloat(row.AVG_SECURITY_SCORE?.toFixed(2)) || 0,
      minQualityScore: row.MIN_QUALITY_SCORE,
      maxQualityScore: row.MAX_QUALITY_SCORE,
      minComplexityScore: row.MIN_COMPLEXITY_SCORE,
      maxComplexityScore: row.MAX_COMPLEXITY_SCORE,
      minSecurityScore: row.MIN_SECURITY_SCORE,
      maxSecurityScore: row.MAX_SECURITY_SCORE,
      languagesCount: row.LANGUAGES_COUNT,
      firstAnalysis: row.FIRST_ANALYSIS,
      lastAnalysis: row.LAST_ANALYSIS
    };
  }

  /**
 * Get comprehensive analytics summary for a project
 * @param {string} projectId - Project ID to get analytics for
 * @returns {Promise<Object>} Project analytics summary
 */
  async getProjectAnalyticsSummary(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      this.logger.log(`[AnalysisRepository] Retrieving analytics summary for project: ${projectId}`);
      
      const query = `
        SELECT 
          COUNT(DISTINCT a.ANALYSIS_ID) as TOTAL_ANALYSES,
          COUNT(DISTINCT a.FILE_ID) as ANALYZED_FILES,
          AVG(a.QUALITY_SCORE) as AVG_QUALITY_SCORE,
          AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY_SCORE,
          AVG(a.SECURITY_SCORE) as AVG_SECURITY_SCORE,
          MIN(a.QUALITY_SCORE) as MIN_QUALITY_SCORE,
          MAX(a.QUALITY_SCORE) as MAX_QUALITY_SCORE,
          MIN(a.COMPLEXITY_SCORE) as MIN_COMPLEXITY_SCORE,
          MAX(a.COMPLEXITY_SCORE) as MAX_COMPLEXITY_SCORE,
          MIN(a.SECURITY_SCORE) as MIN_SECURITY_SCORE,
          MAX(a.SECURITY_SCORE) as MAX_SECURITY_SCORE,
          COUNT(DISTINCT cf.LANGUAGE) as LANGUAGES_COUNT,
          MIN(a.CREATED_AT) as FIRST_ANALYSIS,
          MAX(a.CREATED_AT) as LAST_ANALYSIS
        FROM ${this.tableName} a
        JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID
        WHERE cf.PROJECT_ID = ?`;
      
      const result = await snowflakeService.executeQuery(query, [projectId], { timeout: 30000 });
      
      if (result.rows.length === 0 || result.rows[0].TOTAL_ANALYSES === 0) {
        return {
          success: true,
          data: {
            projectId,
            totalAnalyses: 0,
            analyzedFiles: 0,
            message: 'No analyses found for this project'
          }
        };
      }
      
      // Get language distribution
      const languageQuery = `
        SELECT 
          cf.LANGUAGE,
          COUNT(DISTINCT a.ANALYSIS_ID) as ANALYSIS_COUNT,
          AVG(a.QUALITY_SCORE) as AVG_QUALITY,
          AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY,
          AVG(a.SECURITY_SCORE) as AVG_SECURITY
        FROM ${this.tableName} a
        JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID
        WHERE cf.PROJECT_ID = ?
        GROUP BY cf.LANGUAGE
        ORDER BY ANALYSIS_COUNT DESC`;
      
      const languageResult = await snowflakeService.executeQuery(languageQuery, [projectId], { timeout: 30000 });
      
      // Get most common issues - Fixed query to handle JSON parsing properly
      const issuesQuery = `
        SELECT 
          issue_type,
          issue_severity,
          COUNT(*) as OCCURRENCE_COUNT
        FROM (
          SELECT 
            a.ANALYSIS_ID,
            TRY_PARSE_JSON(a.ISSUES_FOUND) as parsed_issues
          FROM ${this.tableName} a
          JOIN CODE_FILES cf ON a.FILE_ID = cf.FILE_ID
          WHERE cf.PROJECT_ID = ?
          AND a.ISSUES_FOUND IS NOT NULL
          AND a.ISSUES_FOUND != '[]'
          AND a.ISSUES_FOUND != ''
        ) issues_data,
        LATERAL FLATTEN(input => CASE 
          WHEN IS_ARRAY(issues_data.parsed_issues) THEN issues_data.parsed_issues 
          ELSE ARRAY_CONSTRUCT() 
        END) as flattened_issues,
        LATERAL (
          SELECT 
            GET(flattened_issues.value, 'type')::STRING as issue_type,
            GET(flattened_issues.value, 'severity')::STRING as issue_severity
        ) as issue_details
        WHERE issue_type IS NOT NULL
        GROUP BY issue_type, issue_severity
        ORDER BY OCCURRENCE_COUNT DESC
        LIMIT 10`;
      
      let issuesResult;
      try {
        issuesResult = await snowflakeService.executeQuery(issuesQuery, [projectId], { timeout: 30000 });
      } catch (issuesError) {
        console.warn('[AnalysisRepository] Could not retrieve common issues:', issuesError.message);
        // Return empty array if issues query fails
        issuesResult = { rows: [] };
      }
      
      const summary = this.formatProjectAnalyticsSummary(result.rows[0]);
      summary.projectId = projectId;
      summary.languageDistribution = languageResult.rows.map(row => this.formatLanguageDistribution(row));
      summary.commonIssues = issuesResult.rows.map(row => this.formatCommonIssue(row));
      
      this.logger.log(`[AnalysisRepository] Analytics summary retrieved for project: ${projectId}`);
      
      return {
        success: true,
        data: summary
      };
      
    } catch (error) {
      this.logger.error('[AnalysisRepository] Error retrieving project analytics summary:', error);
      throw new Error(`Failed to retrieve project analytics: ${error.message}`);
    }
  }

  
  /**
   * Format language distribution data
   * @private
   */
  formatLanguageDistribution(row) {
    return {
      language: row.LANGUAGE,
      analysisCount: row.ANALYSIS_COUNT,
      avgQuality: parseFloat(row.AVG_QUALITY?.toFixed(2)) || 0,
      avgComplexity: parseFloat(row.AVG_COMPLEXITY?.toFixed(2)) || 0,
      avgSecurity: parseFloat(row.AVG_SECURITY?.toFixed(2)) || 0
    };
  }

  /**
   * Format common issue data
   * @private
   */
  formatCommonIssue(row) {
    return {
      issueType: row.ISSUE_TYPE,
      severity: row.SEVERITY,
      occurrenceCount: row.OCCURRENCE_COUNT
    };
  }

  /**
   * Format user overall statistics
   * @private
   */
  formatUserOverallStats(row) {
    return {
      totalProjects: row.TOTAL_PROJECTS,
      totalAnalyses: row.TOTAL_ANALYSES,
      totalFilesAnalyzed: row.TOTAL_FILES_ANALYZED,
      avgQualityScore: parseFloat(row.AVG_QUALITY_SCORE?.toFixed(2)) || 0,
      avgComplexityScore: parseFloat(row.AVG_COMPLEXITY_SCORE?.toFixed(2)) || 0,
      avgSecurityScore: parseFloat(row.AVG_SECURITY_SCORE?.toFixed(2)) || 0,
      firstAnalysis: row.FIRST_ANALYSIS,
      lastAnalysis: row.LAST_ANALYSIS
    };
  }

  /**
   * Format progress data
   * @private
   */
  formatProgressData(row) {
    return {
      weekStart: row.WEEK_START,
      analysesCount: row.ANALYSES_COUNT,
      avgQuality: parseFloat(row.AVG_QUALITY?.toFixed(2)) || 0,
      avgComplexity: parseFloat(row.AVG_COMPLEXITY?.toFixed(2)) || 0,
      avgSecurity: parseFloat(row.AVG_SECURITY?.toFixed(2)) || 0
    };
  }

  /**
   * Format language expertise data
   * @private
   */
  formatLanguageExpertise(row) {
    return {
      language: row.LANGUAGE,
      analysisCount: row.ANALYSIS_COUNT,
      avgQuality: parseFloat(row.AVG_QUALITY?.toFixed(2)) || 0,
      avgComplexity: parseFloat(row.AVG_COMPLEXITY?.toFixed(2)) || 0,
      avgSecurity: parseFloat(row.AVG_SECURITY?.toFixed(2)) || 0,
      projectsCount: row.PROJECTS_COUNT
    };
  }
}



module.exports = new AnalysisRepository();
