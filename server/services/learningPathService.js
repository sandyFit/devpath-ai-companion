const snowflakeService = require('./snowflakeService');

class LearningPathService {
  // Fetch Groq analysis results for a user or project
  async fetchAnalysisResults(userId) {
    const sql = `
      SELECT code_quality_score, skill_gaps, languages_used, complexity_level, common_issues
      FROM groq_analysis_results
      WHERE user_id = ?
      ORDER BY analysis_date DESC
      LIMIT 1
    `;
    const result = await snowflakeService.executeQuery(sql, [userId]);
    return result.rows[0] || null;
  }

  // Generate personalized learning recommendations based on analysis
  generateRecommendations(analysis) {
    if (!analysis) return [];

    const recommendations = [];

    // Example logic for recommendations
    if (analysis.code_quality_score < 70) {
      recommendations.push({
        topic: 'Code Quality Improvement',
        difficulty: 'Intermediate',
        estimatedTimeHours: 5,
        resources: [
          { title: 'Clean Code by Robert C. Martin', url: 'https://cleancode.com' },
          { title: 'Refactoring Techniques', url: 'https://refactoring.guru' }
        ]
      });
    }

    if (analysis.skill_gaps && analysis.skill_gaps.length > 0) {
      analysis.skill_gaps.forEach(skill => {
        recommendations.push({
          topic: `Learn ${skill}`,
          difficulty: 'Beginner',
          estimatedTimeHours: 3,
          resources: [
            { title: `${skill} Official Documentation`, url: `https://docs.${skill.toLowerCase()}.org` }
          ]
        });
      });
    }

    // Add recommendations based on languages used
    if (analysis.languages_used && analysis.languages_used.length > 0) {
      analysis.languages_used.forEach(lang => {
        recommendations.push({
          topic: `Advanced ${lang} Concepts`,
          difficulty: 'Advanced',
          estimatedTimeHours: 4,
          resources: [
            { title: `${lang} Advanced Tutorials`, url: `https://advanced.${lang.toLowerCase()}.com` }
          ]
        });
      });
    }

    // Add recommendations based on complexity level
    if (analysis.complexity_level && analysis.complexity_level > 7) {
      recommendations.push({
        topic: 'Algorithm and Data Structures',
        difficulty: 'Advanced',
        estimatedTimeHours: 6,
        resources: [
          { title: 'Algorithms Course', url: 'https://algorithms.com' }
        ]
      });
    }

    // Add recommendations based on common issues
    if (analysis.common_issues && analysis.common_issues.length > 0) {
      analysis.common_issues.forEach(issue => {
        recommendations.push({
          topic: `Fixing ${issue}`,
          difficulty: 'Intermediate',
          estimatedTimeHours: 2,
          resources: [
            { title: `How to fix ${issue}`, url: `https://fix.${issue.replace(/\s+/g, '').toLowerCase()}.com` }
          ]
        });
      });
    }

    return recommendations;
  }

  // Store learning path in Snowflake database
  async storeLearningPath(userId, learningPath) {
    const sql = `
      INSERT INTO learning_paths (user_id, created_at, path_data)
      VALUES (?, CURRENT_TIMESTAMP(), PARSE_JSON(?))
    `;
    const pathData = JSON.stringify(learningPath);
    await snowflakeService.executeQuery(sql, [userId, pathData]);
  }

  // Retrieve learning paths for a user
  async getLearningPaths(userId) {
    const sql = `
      SELECT id, created_at, path_data
      FROM learning_paths
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const result = await snowflakeService.executeQuery(sql, [userId]);
    return result.rows.map(row => ({
      id: row.ID,
      createdAt: row.CREATED_AT,
      pathData: row.PATH_DATA
    }));
  }

  // Generate and store learning path for a user
  async generateAndStoreLearningPath(userId) {
    const analysis = await this.fetchAnalysisResults(userId);
    const recommendations = this.generateRecommendations(analysis);
    const learningPath = {
      userId,
      recommendations,
      generatedAt: new Date().toISOString()
    };
    await this.storeLearningPath(userId, learningPath);
    return learningPath;
  }
}

module.exports = new LearningPathService();
