const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const groqService = require('./groqService');
const analysisRepository = require('../repositories/analysisRepository');

const ANALYSIS_TYPES = {
  CODE_QUALITY: 'code_quality',
  COMPLEXITY: 'complexity',
  SECURITY: 'security',
  BEST_PRACTICES: 'best_practices',
  LEARNING_GAPS: 'learning_gaps'
};

class AnalysisService {
  constructor() {
    this.analysisResults = new Map();

    this.FILE_CONFIG = {
      maxFileSize: 50000,
      maxBatchSize: 500000,
      maxBatchFiles: 50, // Increased from 20 to 50 to handle larger projects
      supportedExtensions: ['.js', '.jsx', '.py'],
      priorityExtensions: ['.js', '.jsx', '.py']
    };
  }

  async analyzeFile(fileData, isHighPriority = null) {
    try {
      console.log(`[AnalysisService] Analyzing file: ${fileData.filename}`);
      this.validateAnalysisRequest(fileData);

      if (isHighPriority === null) {
        isHighPriority = this.isPriorityFile(fileData.filename);
      }

      const analysisId = uuidv4();

      const groqResult = await groqService.analyzeCode(
        fileData.content,
        fileData.language,
        fileData.analysisTypes,
        isHighPriority
      );

      console.log(`[AnalysisService] DEBUG - groqResult:`, groqResult);

      // ✅ Fix: Ensure the result has the expected structure
      let analysis;
      if (groqResult && typeof groqResult === 'object') {
        // If groqResult has qualityScore directly, use it as analysis
        if (groqResult.qualityScore !== undefined) {
          analysis = groqResult;
        } else if (groqResult.analysis && typeof groqResult.analysis === 'object') {
          analysis = groqResult.analysis;
        } else {
          // Fallback to default values
          analysis = {
            qualityScore: 5,
            complexityScore: 5,
            securityScore: 5,
            issues: [],
            strengths: [],
            suggestions: [],
            learningRecommendations: []
          };
        }
      } else {
        // Fallback to default values
        analysis = {
          qualityScore: 5,
          complexityScore: 5,
          securityScore: 5,
          issues: [],
          strengths: [],
          suggestions: [],
          learningRecommendations: []
        };
      }

      console.log(`[AnalysisService] DEBUG - analysis:`, analysis);
      
      const result = {
        fileId: fileData.fileId,
        filename: fileData.filename,
        language: fileData.language,
        analysis: analysis
      };

      const fullResult = {
        analysisId,
        ...result,
        timestamp: new Date().toISOString(),
        isHighPriority
      };

      this.analysisResults.set(analysisId, fullResult);

      // Note: Database saving is handled by the controller to avoid duplicate saves
      return {
        analysisId,
        ...result
      };

    } catch (error) {
      console.error('[AnalysisService] Error during analysis:', error);
      throw error;
    }
  }

  async analyzeBatch(extractedDir, analysisTypes, projectId = null) {
    const types = Array.isArray(analysisTypes) && analysisTypes.length > 0
      ? analysisTypes
      : Object.values(ANALYSIS_TYPES);

    try {
      console.log(`[AnalysisService] Starting batch analysis in directory: ${extractedDir}`);

      const files = this.getExtractedFiles(extractedDir);

      // Validate batch size
      this.validateBatchSize(files);

      const results = [];
      const batchId = uuidv4();

      // Sort files by priority (high priority first)
      const sortedFiles = files.sort((a, b) => {
        const aPriority = this.isPriorityFile(a.name);
        const bPriority = this.isPriorityFile(b.name);
        return bPriority - aPriority; // true (1) comes before false (0)
      });

      console.log(`[AnalysisService] Processing ${sortedFiles.length} files in priority order`);

      for (const [index, file] of sortedFiles.entries()) {
        try {
          const fileContent = fs.readFileSync(file.path, 'utf8');
          const isHighPriority = this.isPriorityFile(file.name);

          const fileData = {
            fileId: uuidv4(),
            filename: file.name,
            language: this.detectLanguage(file.name),
            content: fileContent,
            analysisTypes: types,
            projectId: projectId
          };

          console.log(`[AnalysisService] Processing file ${index + 1}/${sortedFiles.length}: ${file.name} (Priority: ${isHighPriority})`);

          const analysis = await this.analyzeFile(fileData, isHighPriority);
          results.push(analysis);

        } catch (fileError) {
          console.error(`[AnalysisService] Error analyzing file ${file.name}:`, fileError);
          results.push({
            filename: file.name,
            error: fileError.message,
            analysisId: null
          });
        }
      }

      console.log(`[AnalysisService] Batch analysis completed. Processed ${results.length} files`);

      return {
        batchId,
        totalFiles: files.length,
        successfulAnalyses: results.filter(r => !r.error).length,
        failedAnalyses: results.filter(r => r.error).length,
        priorityFiles: sortedFiles.filter(f => this.isPriorityFile(f.name)).length,
        results
      };

    } catch (error) {
      console.error('[AnalysisService] Error during batch analysis:', error);
      throw error;
    }
  }

  getAnalysisResult(analysisId) {
    const result = this.analysisResults.get(analysisId);
    if (!result) {
      throw new Error(`Analysis result not found for ID: ${analysisId}`);
    }
    return result;
  }

  getAllAnalysisResults() {
    return Array.from(this.analysisResults.values());
  }

  getExtractedFiles(extractedDir) {
    try {
      if (!fs.existsSync(extractedDir)) {
        throw new Error(`Extracted directory not found: ${extractedDir}`);
      }

      const files = this.getAllFilesRecursively(extractedDir);

      return files
        .filter(file => {
          const ext = path.extname(file.name).toLowerCase();
          return this.FILE_CONFIG.supportedExtensions.includes(ext);
        })
        .map(file => ({
          ...file,
          extension: path.extname(file.name).toLowerCase()
        }));

    } catch (error) {
      console.error('[AnalysisService] Error reading extracted files:', error);
      throw error;
    }
  }

  getAllFilesRecursively(dir, basePath = '') {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip common directories that usually don't contain relevant code
        if (!['node_modules', '.git', '.vscode', 'dist', 'build'].includes(item)) {
          files.push(...this.getAllFilesRecursively(fullPath, relativePath));
        }
      } else {
        files.push({
          name: relativePath,
          path: fullPath
        });
      }
    }

    return files;
  }

  detectLanguage(filename) {
    const ext = path.extname(filename).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala'
    };

    return languageMap[ext] || 'unknown';
  }

  isPriorityFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.FILE_CONFIG.priorityExtensions.includes(ext);
  }

  validateAnalysisRequest(fileData) {
    const { filename, content, analysisTypes } = fileData;

    if (!filename) {
      throw new Error('Filename is required');
    }

    if (content === undefined || content === null || typeof content !== 'string') {
      throw new Error('File content is required and must be a string');
    }

    // Allow empty files but log a warning
    if (content.trim() === '') {
      console.warn(`[AnalysisService] Warning: File ${filename} is empty or contains only whitespace`);
    }

    // Validate file size
    const fileSize = Buffer.byteLength(content, 'utf8');
    if (fileSize > this.FILE_CONFIG.maxFileSize) {
      throw new Error(
        `File ${filename} is too large (${fileSize} bytes). Maximum allowed: ${this.FILE_CONFIG.maxFileSize} bytes`
      );
    }

    if (!analysisTypes || !Array.isArray(analysisTypes) || analysisTypes.length === 0) {
      throw new Error('At least one analysis type is required');
    }

    const validTypes = Object.values(ANALYSIS_TYPES);
    const invalidTypes = analysisTypes.filter(type => !validTypes.includes(type));

    if (invalidTypes.length > 0) {
      throw new Error(`Invalid analysis types: ${invalidTypes.join(', ')}`);
    }
  }

  validateBatchSize(files) {
    // Check number of files
    if (files.length > this.FILE_CONFIG.maxBatchFiles) {
      throw new Error(
        `Too many files in batch (${files.length}). Maximum allowed: ${this.FILE_CONFIG.maxBatchFiles}`
      );
    }

    // Check total size
    let totalSize = 0;
    for (const file of files) {
      try {
        const stat = fs.statSync(file.path);
        totalSize += stat.size;
      } catch (error) {
        console.warn(`[AnalysisService] Could not get size for file: ${file.name}`);
      }
    }

    if (totalSize > this.FILE_CONFIG.maxBatchSize) {
      throw new Error(
        `Batch size too large (${totalSize} bytes). Maximum allowed: ${this.FILE_CONFIG.maxBatchSize} bytes`
      );
    }

    console.log(`[AnalysisService] Batch validation passed: ${files.length} files, ${totalSize} bytes`);
  }

  getAnalysisStats() {
    const results = this.getAllAnalysisResults();

    if (results.length === 0) {
      return {
        totalAnalyses: 0,
        averageQualityScore: 0,
        averageComplexityScore: 0,
        averageSecurityScore: 0,
        priorityAnalyses: 0,
        mostCommonIssues: [],
        languageDistribution: {}
      };
    }

    const totalQuality = results.reduce((sum, r) => sum + (r.analysis?.qualityScore || 0), 0);
    const totalComplexity = results.reduce((sum, r) => sum + (r.analysis?.complexityScore || 0), 0);
    const totalSecurity = results.reduce((sum, r) => sum + (r.analysis?.securityScore || 0), 0);
    const priorityCount = results.filter(r => r.isHighPriority).length;

    const allIssues = results.flatMap(r => r.analysis?.issues || []);
    const issueTypes = allIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});

    const mostCommonIssues = Object.entries(issueTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const languageDistribution = results.reduce((acc, r) => {
      acc[r.language] = (acc[r.language] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAnalyses: results.length,
      averageQualityScore: (totalQuality / results.length).toFixed(2),
      averageComplexityScore: (totalComplexity / results.length).toFixed(2),
      averageSecurityScore: (totalSecurity / results.length).toFixed(2),
      priorityAnalyses: priorityCount,
      mostCommonIssues,
      languageDistribution
    };
  }

  // Get rate limit status from groqService
  getRateLimitStatus() {
    return groqService.getRateLimitStatus();
  }
}

// Export a singleton instance instead of the class
const analysisService = new AnalysisService();

module.exports = {
  analysisService,        // Export the instance
  AnalysisService,        // Keep the class export for testing
  ANALYSIS_TYPES
};
