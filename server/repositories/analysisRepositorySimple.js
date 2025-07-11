const { v4: uuidv4 } = require('uuid');

// Simple in-memory storage for immediate testing
let inMemoryAnalyses = [];

class SimpleAnalysisRepository {
  constructor() {
    this.logger = console;
    // Pre-populate with some test data
    this.initializeTestData();
  }

  initializeTestData() {
    // Start with empty storage - only real analysis results will be stored
    inMemoryAnalyses = [];
    console.log(`[SimpleAnalysisRepository] Initialized with empty storage - only real analysis results will be stored`);
  }

  async createAnalysis(analysisData) {
    try {
      console.log('[SimpleAnalysisRepository] Creating analysis:', analysisData);

      const analysisId = uuidv4();
      const analysis = {
        analysisId,
        fileId: analysisData.fileId || uuidv4(),
        projectId: analysisData.projectId,
        analysisType: analysisData.analysisType || 'code_quality',
        filename: analysisData.filename || 'unknown_file',
        language: analysisData.language || 'unknown',
        issuesFound: analysisData.issuesFound || [],
        suggestions: analysisData.suggestions || [],
        qualityScore: analysisData.qualityScore || 5,
        complexityScore: analysisData.complexityScore || 5,
        securityScore: analysisData.securityScore || 5,
        strengths: analysisData.strengths || [],
        learningRecommendations: analysisData.learningRecommendations || [],
        createdAt: new Date().toISOString()
      };

      inMemoryAnalyses.push(analysis);
      console.log(`[SimpleAnalysisRepository] Analysis created with ID: ${analysisId}`);

      return {
        success: true,
        data: analysis
      };

    } catch (error) {
      console.error('[SimpleAnalysisRepository] Error creating analysis:', error);
      throw error;
    }
  }

  async getAnalysesByProjectId(projectId, options = {}) {
    try {
      console.log(`[SimpleAnalysisRepository] Getting analyses for project: ${projectId}`);
      
      const projectAnalyses = inMemoryAnalyses.filter(analysis => 
        analysis.projectId === projectId
      );

      console.log(`[SimpleAnalysisRepository] Found ${projectAnalyses.length} analyses for project ${projectId}`);

      return {
        success: true,
        data: projectAnalyses,
        metadata: {
          totalCount: projectAnalyses.length,
          limit: options.limit || 50,
          offset: options.offset || 0,
          hasMore: false,
          currentPage: 1,
          totalPages: 1
        }
      };

    } catch (error) {
      console.error('[SimpleAnalysisRepository] Error getting analyses:', error);
      throw error;
    }
  }

  async getProjectAnalyticsSummary(projectId) {
    try {
      console.log(`[SimpleAnalysisRepository] Getting analytics summary for project: ${projectId}`);
      
      const projectAnalyses = inMemoryAnalyses.filter(analysis => 
        analysis.projectId === projectId
      );

      if (projectAnalyses.length === 0) {
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

      const avgQualityScore = projectAnalyses.reduce((sum, a) => sum + a.qualityScore, 0) / projectAnalyses.length;
      const avgComplexityScore = projectAnalyses.reduce((sum, a) => sum + a.complexityScore, 0) / projectAnalyses.length;
      const avgSecurityScore = projectAnalyses.reduce((sum, a) => sum + a.securityScore, 0) / projectAnalyses.length;

      const summary = {
        projectId,
        totalAnalyses: projectAnalyses.length,
        analyzedFiles: new Set(projectAnalyses.map(a => a.fileId)).size,
        avgQualityScore: parseFloat(avgQualityScore.toFixed(2)),
        avgComplexityScore: parseFloat(avgComplexityScore.toFixed(2)),
        avgSecurityScore: parseFloat(avgSecurityScore.toFixed(2)),
        languageDistribution: this.getLanguageDistribution(projectAnalyses),
        commonIssues: this.getCommonIssues(projectAnalyses)
      };

      console.log(`[SimpleAnalysisRepository] Analytics summary generated for project ${projectId}`);

      return {
        success: true,
        data: summary
      };

    } catch (error) {
      console.error('[SimpleAnalysisRepository] Error getting analytics summary:', error);
      throw error;
    }
  }

  getLanguageDistribution(analyses) {
    const languageMap = {};
    
    analyses.forEach(analysis => {
      const lang = analysis.language || 'unknown';
      if (!languageMap[lang]) {
        languageMap[lang] = {
          language: lang,
          analysisCount: 0,
          totalQuality: 0,
          totalComplexity: 0,
          totalSecurity: 0
        };
      }
      
      languageMap[lang].analysisCount++;
      languageMap[lang].totalQuality += analysis.qualityScore;
      languageMap[lang].totalComplexity += analysis.complexityScore;
      languageMap[lang].totalSecurity += analysis.securityScore;
    });

    return Object.values(languageMap).map(lang => ({
      language: lang.language,
      analysisCount: lang.analysisCount,
      avgQuality: parseFloat((lang.totalQuality / lang.analysisCount).toFixed(2)),
      avgComplexity: parseFloat((lang.totalComplexity / lang.analysisCount).toFixed(2)),
      avgSecurity: parseFloat((lang.totalSecurity / lang.analysisCount).toFixed(2))
    }));
  }

  getCommonIssues(analyses) {
    const issueMap = {};
    
    analyses.forEach(analysis => {
      analysis.issuesFound.forEach(issue => {
        const key = `${issue.type}_${issue.severity || 'medium'}`;
        if (!issueMap[key]) {
          issueMap[key] = {
            issueType: issue.type,
            severity: issue.severity || 'medium',
            occurrenceCount: 0
          };
        }
        issueMap[key].occurrenceCount++;
      });
    });

    return Object.values(issueMap)
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10);
  }

  async getAnalysisById(analysisId) {
    try {
      const analysis = inMemoryAnalyses.find(a => a.analysisId === analysisId);
      
      if (!analysis) {
        return null;
      }

      return {
        success: true,
        data: analysis
      };

    } catch (error) {
      console.error('[SimpleAnalysisRepository] Error getting analysis by ID:', error);
      throw error;
    }
  }

  async debugGetAnalyses() {
    return inMemoryAnalyses;
  }
}

module.exports = new SimpleAnalysisRepository();
