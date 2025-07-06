require('dotenv').config();
const snowflakeService = require('../services/snowflakeService');

async function storeGroqBatchAnalysis(batchData) {
  if (!batchData || !Array.isArray(batchData.results)) {
    throw new Error('Invalid batchData: results array is required');
  }

  const insertSql = `
    INSERT INTO CODE_ANALYSIS (
      ANALYSIS_ID,
      FILE_ID,
      MODEL,
      QUALITY_SCORE,
      COMPLEXITY_SCORE,
      SECURITY_SCORE,
      ISSUES,
      STRENGTHS,
      LEARNING_RECOMMENDATIONS
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  let successCount = 0;
  const failed = [];

  for (const result of batchData.results) {
    try {
      const {
        analysisId,
        fileId,
        model,
        analysis
      } = result;

      const issues = JSON.stringify(analysis.issues || []);
      const strengths = JSON.stringify(analysis.strengths || []);
      const learning = JSON.stringify(analysis.learningRecommendations || []);

      const binds = [
        analysisId,
        fileId,
        model || 'unknown',
        analysis.qualityScore || 0,
        analysis.complexityScore || 0,
        analysis.securityScore || 0,
        issues,
        strengths,
        learning
      ];

      await snowflakeService.executeQuery(insertSql, binds);
      successCount++;
    } catch (err) {
      console.warn(`⚠️ Failed to insert analysis ${result.analysisId}:`, err.message);
      failed.push(result.analysisId);
    }
  }

  return {
    inserted: successCount,
    failed
  };
}

module.exports = storeGroqBatchAnalysis;
