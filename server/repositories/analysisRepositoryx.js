const snowflakeService = require('../services/snowflakeService');
const { ANALYSIS_TYPES } = require('../utils/analysisTypes');
console.log('ANALYSIS_TYPES:', ANALYSIS_TYPES);
const { v4: uuidv4 } = require('uuid');

console.log('>>> USING ANALYSIS REPO FILE: analysisRepository.js');

class AnalysisRepository {
    constructor(db) {
        this.db = db;
    }

    async createAnalysis(analysisData) {
        const {
            fileId,
            projectId,
            analysisType,
            issuesFound,
            suggestions,
            qualityScore,
            complexityScore,
            securityScore,
            strengths,
            learningRecommendations
        } = analysisData;

        // Validate required fields
        if (!fileId) {
            throw new Error('File ID is required');
        }
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        if (!analysisType) {
            throw new Error('Analysis type is required');
        }

        console.log(`[REPO DEBUG] Creating analysis with data:`, JSON.stringify(analysisData, null, 2));

        try {
            const query = `
          INSERT INTO analyses (
            file_id, 
            project_id, 
            analysis_type, 
            issues_found, 
            suggestions, 
            quality_score, 
            complexity_score, 
            security_score, 
            strengths, 
            learning_recommendations,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

            const params = [
                fileId,
                projectId,
                analysisType,
                JSON.stringify(issuesFound || []),
                JSON.stringify(suggestions || []),
                qualityScore || 5,
                complexityScore || 5,
                securityScore || 5,
                JSON.stringify(strengths || []),
                JSON.stringify(learningRecommendations || [])
            ];

            const result = await this.db.run(query, params);

            console.log(`[REPO DEBUG] ✅ Analysis created successfully with ID: ${result.lastID}`);

            return {
                id: result.lastID,
                fileId,
                projectId,
                analysisType,
                issuesFound,
                suggestions,
                qualityScore,
                complexityScore,
                securityScore,
                strengths,
                learningRecommendations
            };

        } catch (error) {
            console.error('[REPO ERROR] Error creating analysis:', error);
            throw error;
        }
    }

    async getAnalysisByFileId(fileId) {
        try {
            const query = `
          SELECT 
            id,
            file_id,
            project_id,
            analysis_type,
            issues_found,
            suggestions,
            quality_score,
            complexity_score,
            security_score,
            strengths,
            learning_recommendations,
            created_at,
            updated_at
          FROM analyses 
          WHERE file_id = ?
        `;

            const row = await this.db.get(query, [fileId]);

            if (!row) {
                return null;
            }

            return {
                id: row.id,
                fileId: row.file_id,
                projectId: row.project_id,
                analysisType: row.analysis_type,
                issuesFound: JSON.parse(row.issues_found || '[]'),
                suggestions: JSON.parse(row.suggestions || '[]'),
                qualityScore: row.quality_score,
                complexityScore: row.complexity_score,
                securityScore: row.security_score,
                strengths: JSON.parse(row.strengths || '[]'),
                learningRecommendations: JSON.parse(row.learning_recommendations || '[]'),
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };

        } catch (error) {
            console.error('[REPO ERROR] Error fetching analysis by file ID:', error);
            throw error;
        }
    }

    async getAnalysesByProjectId(projectId) {
        try {
            const query = `
          SELECT 
            a.id,
            a.file_id,
            a.project_id,
            a.analysis_type,
            a.issues_found,
            a.suggestions,
            a.quality_score,
            a.complexity_score,
            a.security_score,
            a.strengths,
            a.learning_recommendations,
            a.created_at,
            a.updated_at,
            f.filename,
            f.language
          FROM analyses a
          JOIN files f ON a.file_id = f.id
          WHERE a.project_id = ?
          ORDER BY a.created_at DESC
        `;

            const rows = await this.db.all(query, [projectId]);

            return rows.map(row => ({
                id: row.id,
                fileId: row.file_id,
                projectId: row.project_id,
                analysisType: row.analysis_type,
                issuesFound: JSON.parse(row.issues_found || '[]'),
                suggestions: JSON.parse(row.suggestions || '[]'),
                qualityScore: row.quality_score,
                complexityScore: row.complexity_score,
                securityScore: row.security_score,
                strengths: JSON.parse(row.strengths || '[]'),
                learningRecommendations: JSON.parse(row.learning_recommendations || '[]'),
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                filename: row.filename,
                language: row.language
            }));

        } catch (error) {
            console.error('[REPO ERROR] Error fetching analyses by project ID:', error);
            throw error;
        }
    }

    async updateAnalysis(analysisId, updates) {
        try {
            const allowedUpdates = [
                'analysis_type',
                'issues_found',
                'suggestions',
                'quality_score',
                'complexity_score',
                'security_score',
                'strengths',
                'learning_recommendations'
            ];

            const updateFields = [];
            const params = [];

            for (const [key, value] of Object.entries(updates)) {
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (allowedUpdates.includes(dbKey)) {
                    updateFields.push(`${dbKey} = ?`);
                    params.push(typeof value === 'object' ? JSON.stringify(value) : value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No valid fields to update');
            }

            updateFields.push('updated_at = datetime("now")');
            params.push(analysisId);

            const query = `
          UPDATE analyses 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;

            const result = await this.db.run(query, params);

            if (result.changes === 0) {
                throw new Error('Analysis not found or no changes made');
            }

            console.log(`[REPO DEBUG] ✅ Analysis updated successfully: ${analysisId}`);

            return await this.getAnalysisById(analysisId);

        } catch (error) {
            console.error('[REPO ERROR] Error updating analysis:', error);
            throw error;
        }
    }

    async getAnalysisById(analysisId) {
        try {
            const query = `
          SELECT 
            id,
            file_id,
            project_id,
            analysis_type,
            issues_found,
            suggestions,
            quality_score,
            complexity_score,
            security_score,
            strengths,
            learning_recommendations,
            created_at,
            updated_at
          FROM analyses 
          WHERE id = ?
        `;

            const row = await this.db.get(query, [analysisId]);

            if (!row) {
                return null;
            }

            return {
                id: row.id,
                fileId: row.file_id,
                projectId: row.project_id,
                analysisType: row.analysis_type,
                issuesFound: JSON.parse(row.issues_found || '[]'),
                suggestions: JSON.parse(row.suggestions || '[]'),
                qualityScore: row.quality_score,
                complexityScore: row.complexity_score,
                securityScore: row.security_score,
                strengths: JSON.parse(row.strengths || '[]'),
                learningRecommendations: JSON.parse(row.learning_recommendations || '[]'),
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };

        } catch (error) {
            console.error('[REPO ERROR] Error fetching analysis by ID:', error);
            throw error;
        }
    }

    async deleteAnalysis(analysisId) {
        try {
            const query = 'DELETE FROM analyses WHERE id = ?';
            const result = await this.db.run(query, [analysisId]);

            if (result.changes === 0) {
                throw new Error('Analysis not found');
            }

            console.log(`[REPO DEBUG] ✅ Analysis deleted successfully: ${analysisId}`);

            return true;

        } catch (error) {
            console.error('[REPO ERROR] Error deleting analysis:', error);
            throw error;
        }
    }
}

module.exports = AnalysisRepository;
