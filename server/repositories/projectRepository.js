const snowflakeService = require('../services/snowflakeService');
const { v4: uuidv4 } = require('uuid');

/**
 * Project Repository for Snowflake data access
 * Handles all database operations related to projects
 */
class ProjectRepository {
  constructor() {
    this.tableName = 'PROJECTS';
    this.logger = console; // Can be replaced with a proper logger
  }

  /**
   * Create a new project in the database
   * @param {Object} projectData - Project data
   * @param {string} projectData.userId - User ID who owns the project
   * @param {string} projectData.projectName - Name of the project
   * @param {number} [projectData.totalFiles=0] - Total number of files in the project
   * @param {string} [projectData.status='PENDING'] - Initial status of the project
   * @returns {Promise<Object>} Created project data with generated ID
   */
  async createProject(projectData) {
    try {
      const { userId, projectName, totalFiles = 0, status = 'PENDING' } = projectData;
      
      // Validate required fields
      if (!userId || !projectName) {
        throw new Error('Missing required fields: userId and projectName are required');
      }

      // Validate status
      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const projectId = uuidv4();
      
      this.logger.log(`[ProjectRepository] Creating project: ${projectId} for user: ${userId}`);
      
      // Use stored procedure for project creation with validation
      const result = await snowflakeService.executeQuery(`
        INSERT INTO PROJECTS (PROJECT_ID, USER_ID, PROJECT_NAME, STATUS)
        VALUES (?, ?, ?, 'PENDING')
      `, [projectId, userId, projectName]);

      if (!projectId || !userId || !projectName?.trim()) {
        throw new Error('All fields are required');
      }
      
      
      
      this.logger.log(`[ProjectRepository] Project created successfully: ${projectId}`);
      
      return {
        success: true,
        data: {
          projectId,
          userId,
          projectName,
          totalFiles,
          status,
          uploadTimestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        queryResult: result
      };
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error creating project:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Get a project by its ID
   * @param {string} projectId - Project ID to retrieve
   * @returns {Promise<Object|null>} Project data or null if not found
   */
  async getProjectById(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      this.logger.log(`[ProjectRepository] Retrieving project: ${projectId}`);
      
      const result = await snowflakeService.executeQuery(
        `SELECT 
           PROJECT_ID,
           USER_ID,
           UPLOAD_TIMESTAMP,
           PROJECT_NAME,
           TOTAL_FILES,
           STATUS,
           CREATED_AT,
           UPDATED_AT
         FROM ${this.tableName} 
         WHERE PROJECT_ID = ?`,
        [projectId],
        { timeout: 30000 }
      );
      
      if (result.rows.length === 0) {
        this.logger.log(`[ProjectRepository] Project not found: ${projectId}`);
        return null;
      }
      
      const project = this.formatProjectData(result.rows[0]);
      this.logger.log(`[ProjectRepository] Project retrieved successfully: ${projectId}`);
      
      return {
        success: true,
        data: project
      };
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error retrieving project:', error);
      throw new Error(`Failed to retrieve project: ${error.message}`);
    }
  }

  /**
   * Get all projects for a specific user
   * @param {string} userId - User ID to get projects for
   * @param {Object} [options] - Query options
   * @param {string} [options.status] - Filter by status
   * @param {number} [options.limit=50] - Maximum number of results
   * @param {number} [options.offset=0] - Number of results to skip
   * @param {string} [options.orderBy='CREATED_AT'] - Field to order by
   * @param {string} [options.orderDirection='DESC'] - Order direction (ASC/DESC)
   * @returns {Promise<Object>} Array of projects and metadata
   */
  async getProjectsByUserId(userId, options = {}) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const {
        status,
        limit = 50,
        offset = 0,
        orderBy = 'CREATED_AT',
        orderDirection = 'DESC'
      } = options;

      // Validate orderBy field
      const validOrderFields = ['PROJECT_ID', 'PROJECT_NAME', 'STATUS', 'CREATED_AT', 'UPDATED_AT', 'UPLOAD_TIMESTAMP'];
      if (!validOrderFields.includes(orderBy)) {
        throw new Error(`Invalid orderBy field. Must be one of: ${validOrderFields.join(', ')}`);
      }

      // Validate orderDirection
      if (!['ASC', 'DESC'].includes(orderDirection.toUpperCase())) {
        throw new Error('Order direction must be ASC or DESC');
      }

      this.logger.log(`[ProjectRepository] Retrieving projects for user: ${userId}`);
      
      let query = `
        SELECT 
          PROJECT_ID,
          USER_ID,
          UPLOAD_TIMESTAMP,
          PROJECT_NAME,
          TOTAL_FILES,
          STATUS,
          CREATED_AT,
          UPDATED_AT
        FROM ${this.tableName} 
        WHERE USER_ID = ?`;
      
      const binds = [userId];
      
      // Add status filter if provided
      if (status) {
        query += ' AND STATUS = ?';
        binds.push(status);
      }
      
      // Add ordering
      query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
      
      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      binds.push(limit, offset);
      
      const result = await snowflakeService.executeQuery(query, binds, { timeout: 30000 });
      
      // Get total count for pagination metadata
      let countQuery = `SELECT COUNT(*) as TOTAL_COUNT FROM ${this.tableName} WHERE USER_ID = ?`;
      const countBinds = [userId];
      
      if (status) {
        countQuery += ' AND STATUS = ?';
        countBinds.push(status);
      }
      
      const countResult = await snowflakeService.executeQuery(countQuery, countBinds, { timeout: 30000 });
      const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;
      
      const projects = result.rows.map(row => this.formatProjectData(row));
      
      this.logger.log(`[ProjectRepository] Retrieved ${projects.length} projects for user: ${userId}`);
      
      return {
        success: true,
        data: projects,
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
      this.logger.error('[ProjectRepository] Error retrieving projects by user:', error);
      throw new Error(`Failed to retrieve projects: ${error.message}`);
    }
  }

  /**
   * Update project status
   * @param {string} projectId - Project ID to update
   * @param {string} status - New status value
   * @returns {Promise<Object>} Updated project data
   */
  async updateProjectStatus(projectId, status) {
    try {
      if (!projectId || !status) {
        throw new Error('Project ID and status are required');
      }

      // Validate status
      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      this.logger.log(`[ProjectRepository] Updating project status: ${projectId} to ${status}`);
      
      // Use stored procedure for status update with validation
      const result = await snowflakeService.executeQuery(
        'CALL SP_UPDATE_PROJECT_STATUS(?, ?)',
        [projectId, status],
        { timeout: 30000 }
      );
      
      // Get updated project data
      const updatedProject = await this.getProjectById(projectId);
      
      this.logger.log(`[ProjectRepository] Project status updated successfully: ${projectId}`);
      
      return {
        success: true,
        data: {
          projectId,
          status,
          updatedAt: new Date().toISOString(),
          project: updatedProject?.data
        },
        queryResult: result
      };
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error updating project status:', error);
      throw new Error(`Failed to update project status: ${error.message}`);
    }
  }

  /**
   * Delete a project (soft delete by setting status to ARCHIVED)
   * @param {string} projectId - Project ID to delete
   * @param {boolean} [hardDelete=false] - Whether to permanently delete the project
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProject(projectId, hardDelete = false) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      this.logger.log(`[ProjectRepository] ${hardDelete ? 'Hard' : 'Soft'} deleting project: ${projectId}`);
      
      if (hardDelete) {
        // Hard delete - permanently remove from database
        // Note: This should cascade delete related records due to foreign key constraints
        const result = await snowflakeService.executeQuery(
          `DELETE FROM ${this.tableName} WHERE PROJECT_ID = ?`,
          [projectId],
          { timeout: 30000 }
        );
        
        this.logger.log(`[ProjectRepository] Project permanently deleted: ${projectId}`);
        
        return {
          success: true,
          data: {
            projectId,
            deleted: true,
            deletedAt: new Date().toISOString(),
            type: 'hard_delete'
          },
          queryResult: result
        };
        
      } else {
        // Soft delete - set status to ARCHIVED
        const result = await this.updateProjectStatus(projectId, 'ARCHIVED');
        
        this.logger.log(`[ProjectRepository] Project archived (soft deleted): ${projectId}`);
        
        return {
          success: true,
          data: {
            projectId,
            archived: true,
            archivedAt: new Date().toISOString(),
            type: 'soft_delete',
            project: result.data.project
          }
        };
      }
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Get project summary with analytics data
   * @param {string} projectId - Project ID to get summary for
   * @returns {Promise<Object>} Project summary with file counts and analysis metrics
   */
  async getProjectSummary(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      this.logger.log(`[ProjectRepository] Retrieving project summary: ${projectId}`);
      
      const result = await snowflakeService.executeQuery(
        'SELECT * FROM VW_PROJECT_SUMMARY WHERE PROJECT_ID = ?',
        [projectId],
        { timeout: 30000 }
      );
      
      if (result.rows.length === 0) {
        this.logger.log(`[ProjectRepository] Project summary not found: ${projectId}`);
        return null;
      }
      
      const summary = this.formatProjectSummaryData(result.rows[0]);
      this.logger.log(`[ProjectRepository] Project summary retrieved successfully: ${projectId}`);
      
      return {
        success: true,
        data: summary
      };
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error retrieving project summary:', error);
      throw new Error(`Failed to retrieve project summary: ${error.message}`);
    }
  }

  /**
   * Update project file count
   * @param {string} projectId - Project ID to update
   * @param {number} totalFiles - New total file count
   * @returns {Promise<Object>} Update result
   */
  async updateProjectFileCount(projectId, totalFiles) {
    try {
      if (!projectId || totalFiles === undefined) {
        throw new Error('Project ID and totalFiles are required');
      }

      if (totalFiles < 0) {
        throw new Error('Total files count cannot be negative');
      }

      this.logger.log(`[ProjectRepository] Updating file count for project: ${projectId} to ${totalFiles}`);
      
      const result = await snowflakeService.executeQuery(
        `UPDATE ${this.tableName} 
         SET TOTAL_FILES = ?, UPDATED_AT = CURRENT_TIMESTAMP() 
         WHERE PROJECT_ID = ?`,
        [totalFiles, projectId],
        { timeout: 30000 }
      );
      
      this.logger.log(`[ProjectRepository] File count updated successfully: ${projectId}`);
      
      return {
        success: true,
        data: {
          projectId,
          totalFiles,
          updatedAt: new Date().toISOString()
        },
        queryResult: result
      };
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error updating file count:', error);
      throw new Error(`Failed to update file count: ${error.message}`);
    }
  }

  /**
   * Format project data from Snowflake result
   * @private
   * @param {Object} row - Raw row data from Snowflake
   * @returns {Object} Formatted project data
   */
  formatProjectData(row) {
    return {
      projectId: row.PROJECT_ID,
      userId: row.USER_ID,
      uploadTimestamp: row.UPLOAD_TIMESTAMP,
      projectName: row.PROJECT_NAME,
      totalFiles: row.TOTAL_FILES,
      status: row.STATUS,
      createdAt: row.CREATED_AT,
      updatedAt: row.UPDATED_AT
    };
  }

  /**
   * Format project summary data from Snowflake result
   * @private
   * @param {Object} row - Raw row data from Snowflake view
   * @returns {Object} Formatted project summary data
   */
  formatProjectSummaryData(row) {
    return {
      projectId: row.PROJECT_ID,
      userId: row.USER_ID,
      projectName: row.PROJECT_NAME,
      status: row.STATUS,
      uploadTimestamp: row.UPLOAD_TIMESTAMP,
      totalFiles: row.TOTAL_FILES,
      actualFileCount: row.ACTUAL_FILE_COUNT,
      analyzedFileCount: row.ANALYZED_FILE_COUNT,
      avgQualityScore: row.AVG_QUALITY_SCORE,
      avgComplexityScore: row.AVG_COMPLEXITY_SCORE,
      avgSecurityScore: row.AVG_SECURITY_SCORE,
      learningPathsCount: row.LEARNING_PATHS_COUNT
    };
  }

  /**
   * Check if a project exists
   * @param {string} projectId - Project ID to check
   * @returns {Promise<boolean>} True if project exists, false otherwise
   */
  async projectExists(projectId) {
    try {
      if (!projectId) {
        return false;
      }

      const result = await snowflakeService.executeQuery(
        `SELECT 1 FROM ${this.tableName} WHERE PROJECT_ID = ? LIMIT 1`,
        [projectId],
        { timeout: 30000 }
      );
      
      return result.rows.length > 0;
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error checking project existence:', error);
      return false;
    }
  }

  /**
   * Get projects by status
   * @param {string} status - Status to filter by
   * @param {Object} [options] - Query options
   * @returns {Promise<Object>} Array of projects with the specified status
   */
  async getProjectsByStatus(status, options = {}) {
    try {
      if (!status) {
        throw new Error('Status is required');
      }

      const { limit = 50, offset = 0 } = options;

      this.logger.log(`[ProjectRepository] Retrieving projects with status: ${status}`);
      
      const result = await snowflakeService.executeQuery(
        `SELECT 
           PROJECT_ID,
           USER_ID,
           UPLOAD_TIMESTAMP,
           PROJECT_NAME,
           TOTAL_FILES,
           STATUS,
           CREATED_AT,
           UPDATED_AT
         FROM ${this.tableName} 
         WHERE STATUS = ?
         ORDER BY CREATED_AT DESC
         LIMIT ? OFFSET ?`,
        [status, limit, offset],
        { timeout: 30000 }
      );
      
      const projects = result.rows.map(row => this.formatProjectData(row));
      
      this.logger.log(`[ProjectRepository] Retrieved ${projects.length} projects with status: ${status}`);
      
      return {
        success: true,
        data: projects,
        metadata: {
          status,
          count: projects.length,
          limit,
          offset
        }
      };
      
    } catch (error) {
      this.logger.error('[ProjectRepository] Error retrieving projects by status:', error);
      throw new Error(`Failed to retrieve projects by status: ${error.message}`);
    }
  }
}

module.exports = new ProjectRepository();
