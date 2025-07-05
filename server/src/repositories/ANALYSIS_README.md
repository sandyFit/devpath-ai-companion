# Analysis Repository Documentation

The Analysis Repository provides a comprehensive data access layer for managing code analysis results in the DevPath AI Snowflake database. It handles all database operations related to AI-generated code analysis data with advanced analytics capabilities.

## Overview

The `AnalysisRepository` class manages:
- Creating and storing analysis results from AI code reviews
- Retrieving analysis data by file, project, or analysis ID
- Updating existing analysis results
- Generating comprehensive analytics and insights
- Cross-project user progress tracking
- Language-specific quality statistics

## Features

### ✅ Comprehensive Analysis Management
- **Create**: Store AI analysis results with VARIANT JSON data
- **Read**: Retrieve analyses by file, project, or ID with filtering
- **Update**: Modify existing analysis results with validation
- **Analytics**: Generate comprehensive project and user insights

### ✅ Advanced Analytics Capabilities
- **Project Analytics**: Comprehensive project-level analysis summaries
- **User Progress**: Cross-project analytics and improvement tracking
- **Language Statistics**: Quality metrics aggregated by programming language
- **Trend Analysis**: Improvement trends over time
- **Issue Tracking**: Most common issues and patterns

### ✅ Snowflake-Specific Features
- **VARIANT Handling**: Proper JSON storage and retrieval for complex data
- **Advanced Queries**: Leverages Snowflake's analytical capabilities
- **Performance Optimization**: Efficient queries with proper indexing
- **Data Aggregation**: Complex analytical queries with window functions

### ✅ Data Validation & Security
- **Score Validation**: Ensures scores are within valid ranges (1-10)
- **Required Fields**: Comprehensive validation of required parameters
- **SQL Injection Prevention**: Parameterized queries throughout
- **Type Safety**: Proper data type validation and conversion

## API Reference

### Constructor

```javascript
const analysisRepository = require('./src/repositories/analysisRepository');
```

The repository is exported as a singleton instance.

### Core Methods

#### `createAnalysis(analysisData)`

Creates a new analysis record with comprehensive validation.

**Parameters:**
- `analysisData` (Object)
  - `fileId` (string, required) - ID of the file being analyzed
  - `issuesFound` (Array, optional) - Array of issues found in the code
  - `suggestions` (Array, optional) - Array of improvement suggestions
  - `qualityScore` (number, required) - Quality score (1-10)
  - `complexityScore` (number, required) - Complexity score (1-10)
  - `securityScore` (number, required) - Security score (1-10)
  - `strengths` (Array, optional) - Array of code strengths
  - `learningRecommendations` (Array, optional) - Learning recommendations

**Issue Object Structure:**
```javascript
{
  type: 'style|performance|security|logic|maintainability',
  severity: 'low|medium|high|critical',
  description: 'Detailed description of the issue',
  line: 42, // Optional line number
  column: 15 // Optional column number
}
```

**Suggestion Object Structure:**
```javascript
{
  suggestion: 'Specific improvement suggestion',
  priority: 'low|medium|high',
  category: 'performance|readability|security|best-practices',
  effort: 'low|medium|high' // Optional effort estimate
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    analysisId: "uuid-string",
    fileId: "file-uuid",
    issuesFound: [...],
    suggestions: [...],
    qualityScore: 8,
    complexityScore: 5,
    securityScore: 9,
    strengths: [...],
    learningRecommendations: [...],
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  queryResult: { /* Snowflake query result */ }
}
```

**Example:**
```javascript
const result = await analysisRepository.createAnalysis({
  fileId: 'file-uuid-123',
  issuesFound: [
    {
      type: 'style',
      severity: 'medium',
      description: 'Missing semicolon at end of statement',
      line: 42
    },
    {
      type: 'performance',
      severity: 'low',
      description: 'Inefficient array iteration method',
      line: 67
    }
  ],
  suggestions: [
    {
      suggestion: 'Add semicolons for consistency',
      priority: 'medium',
      category: 'best-practices'
    },
    {
      suggestion: 'Use Array.forEach() instead of for loop',
      priority: 'low',
      category: 'performance'
    }
  ],
  qualityScore: 7,
  complexityScore: 5,
  securityScore: 9,
  strengths: ['Clean variable naming', 'Good error handling'],
  learningRecommendations: ['Study JavaScript best practices', 'Learn about performance optimization']
});
```

#### `getAnalysisByFileId(fileId)`

Retrieves the most recent analysis for a specific file.

**Parameters:**
- `fileId` (string, required) - File ID to get analysis for

**Returns:**
- Analysis data object if found
- `null` if no analysis found

**Example:**
```javascript
const analysis = await analysisRepository.getAnalysisByFileId('file-uuid-123');
if (analysis) {
  console.log('Quality Score:', analysis.data.qualityScore);
  console.log('Issues Found:', analysis.data.issuesFound.length);
}
```

#### `getAnalysesByProjectId(projectId, options)`

Retrieves all analyses for a project with advanced filtering and pagination.

**Parameters:**
- `projectId` (string, required) - Project ID to get analyses for
- `options` (Object, optional)
  - `limit` (number) - Maximum results (default: 50)
  - `offset` (number) - Results to skip (default: 0)
  - `orderBy` (string) - Field to order by (default: 'CREATED_AT')
  - `orderDirection` (string) - 'ASC' or 'DESC' (default: 'DESC')
  - `minQualityScore` (number) - Minimum quality score filter
  - `maxComplexityScore` (number) - Maximum complexity score filter

**Valid orderBy Fields:**
- `ANALYSIS_ID`
- `QUALITY_SCORE`
- `COMPLEXITY_SCORE`
- `SECURITY_SCORE`
- `CREATED_AT`

**Returns:**
```javascript
{
  success: true,
  data: [/* array of analyses with file info */],
  metadata: {
    totalCount: 25,
    limit: 10,
    offset: 0,
    hasMore: true,
    currentPage: 1,
    totalPages: 3
  }
}
```

**Example:**
```javascript
const result = await analysisRepository.getAnalysesByProjectId('project-uuid', {
  minQualityScore: 6,
  maxComplexityScore: 7,
  limit: 20,
  orderBy: 'QUALITY_SCORE',
  orderDirection: 'DESC'
});
```

#### `updateAnalysis(analysisId, updates)`

Updates an existing analysis with field validation.

**Parameters:**
- `analysisId` (string, required) - Analysis ID to update
- `updates` (Object, required) - Fields to update
  - `issuesFound` (Array, optional) - Updated issues
  - `suggestions` (Array, optional) - Updated suggestions
  - `qualityScore` (number, optional) - Updated quality score (1-10)
  - `complexityScore` (number, optional) - Updated complexity score (1-10)
  - `securityScore` (number, optional) - Updated security score (1-10)
  - `strengths` (Array, optional) - Updated strengths
  - `learningRecommendations` (Array, optional) - Updated recommendations

**Returns:**
```javascript
{
  success: true,
  data: {
    analysisId: "uuid-string",
    updatedFields: ["qualityScore", "suggestions"],
    updatedAt: "2024-01-01T00:00:00.000Z",
    analysis: { /* updated analysis data */ }
  },
  queryResult: { /* Snowflake query result */ }
}
```

**Example:**
```javascript
const result = await analysisRepository.updateAnalysis('analysis-uuid', {
  qualityScore: 8,
  suggestions: [
    { suggestion: 'Updated suggestion', priority: 'high' }
  ]
});
```

### Analytics Methods

#### `getProjectAnalyticsSummary(projectId)`

Generates comprehensive analytics summary for a project.

**Parameters:**
- `projectId` (string, required) - Project ID to analyze

**Returns:**
```javascript
{
  success: true,
  data: {
    totalAnalyses: 25,
    analyzedFiles: 20,
    avgQualityScore: 7.5,
    avgComplexityScore: 5.2,
    avgSecurityScore: 8.9,
    minQualityScore: 4,
    maxQualityScore: 10,
    minComplexityScore: 2,
    maxComplexityScore: 8,
    minSecurityScore: 6,
    maxSecurityScore: 10,
    languagesCount: 3,
    firstAnalysis: "2024-01-01T00:00:00.000Z",
    lastAnalysis: "2024-01-15T00:00:00.000Z",
    languageDistribution: [
      {
        language: "javascript",
        analysisCount: 15,
        avgQuality: 7.8,
        avgComplexity: 5.1,
        avgSecurity: 9.2
      }
    ],
    commonIssues: [
      {
        issueType: "style",
        severity: "medium",
        occurrenceCount: 45
      }
    ]
  }
}
```

**Example:**
```javascript
const summary = await analysisRepository.getProjectAnalyticsSummary('project-uuid');
console.log(`Project has ${summary.data.totalAnalyses} analyses`);
console.log(`Average quality score: ${summary.data.avgQualityScore}`);
```

#### `getUserProgressAnalytics(userId, options)`

Generates cross-project analytics for user progress tracking.

**Parameters:**
- `userId` (string, required) - User ID to analyze
- `options` (Object, optional)
  - `timeframe` (string) - Time frame: '7d', '30d', '90d', '1y' (default: '30d')

**Returns:**
```javascript
{
  success: true,
  data: {
    userId: "user-123",
    timeframe: "30d",
    overall: {
      totalProjects: 5,
      totalAnalyses: 50,
      totalFilesAnalyzed: 45,
      avgQualityScore: 7.5,
      avgComplexityScore: 5.2,
      avgSecurityScore: 8.9,
      firstAnalysis: "2024-01-01T00:00:00.000Z",
      lastAnalysis: "2024-01-30T00:00:00.000Z"
    },
    progressOverTime: [
      {
        weekStart: "2024-01-01T00:00:00.000Z",
        analysesCount: 12,
        avgQuality: 7.2,
        avgComplexity: 5.5,
        avgSecurity: 8.7
      }
    ],
    languageExpertise: [
      {
        language: "javascript",
        analysisCount: 30,
        avgQuality: 7.8,
        avgComplexity: 5.1,
        avgSecurity: 9.2,
        projectsCount: 3
      }
    ]
  }
}
```

**Example:**
```javascript
const analytics = await analysisRepository.getUserProgressAnalytics('user-123', {
  timeframe: '90d'
});
console.log(`User has analyzed ${analytics.data.overall.totalFilesAnalyzed} files`);
```

## Advanced Analytics Features

### Language Quality Statistics

Get quality metrics aggregated by programming language:

```javascript
const stats = await analysisRepository.getLanguageQualityStats({
  minSampleSize: 5 // Minimum analyses per language
});
```

### Common Issues Analysis

Identify the most frequent issues across projects:

```javascript
const issues = await analysisRepository.getCommonIssues({
  limit: 20,
  severity: 'high' // Optional severity filter
});
```

### Improvement Trends

Track improvement trends over time:

```javascript
const trends = await analysisRepository.getImprovementTrends({
  language: 'javascript',
  timeframe: '90d',
  groupBy: 'week'
});
```

### Language Distribution

Get language usage statistics:

```javascript
const distribution = await analysisRepository.getLanguageDistribution({
  minAnalyses: 3
});
```

## Data Structures

### Analysis Data Format

```javascript
{
  analysisId: "uuid-string",
  fileId: "file-uuid",
  issuesFound: [
    {
      type: "style|performance|security|logic|maintainability",
      severity: "low|medium|high|critical",
      description: "Issue description",
      line: 42,
      column: 15
    }
  ],
  suggestions: [
    {
      suggestion: "Improvement suggestion",
      priority: "low|medium|high",
      category: "performance|readability|security|best-practices",
      effort: "low|medium|high"
    }
  ],
  qualityScore: 8, // 1-10
  complexityScore: 5, // 1-10
  securityScore: 9, // 1-10
  strengths: ["Clean code", "Good error handling"],
  learningRecommendations: ["Study patterns", "Learn best practices"],
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Project Analytics Summary

```javascript
{
  totalAnalyses: 25,
  analyzedFiles: 20,
  avgQualityScore: 7.5,
  avgComplexityScore: 5.2,
  avgSecurityScore: 8.9,
  minQualityScore: 4,
  maxQualityScore: 10,
  languagesCount: 3,
  firstAnalysis: "2024-01-01T00:00:00.000Z",
  lastAnalysis: "2024-01-15T00:00:00.000Z",
  languageDistribution: [...],
  commonIssues: [...]
}
```

## Error Handling

### Validation Errors
```javascript
// Missing required fields
throw new Error('File ID is required');
throw new Error('Quality, complexity, and security scores are required');

// Invalid score ranges
throw new Error('qualityScore must be a number between 1 and 10');

// Invalid parameters
throw new Error('Analysis ID is required');
throw new Error('At least one field to update is required');
```

### Database Errors
```javascript
// Connection issues
throw new Error('Failed to create analysis: Database connection failed');

// Query execution errors
throw new Error('Failed to retrieve analysis: Query execution failed');
```

### Business Logic Errors
```javascript
// Invalid order field
throw new Error('Invalid orderBy field. Must be one of: ANALYSIS_ID, QUALITY_SCORE, COMPLEXITY_SCORE, SECURITY_SCORE, CREATED_AT');

// Invalid timeframe
throw new Error('Invalid timeframe. Must be one of: 7d, 30d, 90d, 1y');
```

## Usage Examples

### Complete Analysis Workflow

```javascript
async function analyzeCodeFile(fileId, analysisResults) {
  try {
    // 1. Create analysis from AI results
    const analysis = await analysisRepository.createAnalysis({
      fileId: fileId,
      issuesFound: analysisResults.issues,
      suggestions: analysisResults.suggestions,
      qualityScore: analysisResults.quality,
      complexityScore: analysisResults.complexity,
      securityScore: analysisResults.security,
      strengths: analysisResults.strengths,
      learningRecommendations: analysisResults.recommendations
    });
    
    console.log('Analysis created:', analysis.data.analysisId);
    
    // 2. Get project analytics
    const projectAnalytics = await analysisRepository.getProjectAnalyticsSummary(projectId);
    console.log('Project quality average:', projectAnalytics.data.avgQualityScore);
    
    // 3. Update analysis if needed
    if (analysisResults.needsUpdate) {
      await analysisRepository.updateAnalysis(analysis.data.analysisId, {
        qualityScore: analysisResults.updatedQuality
      });
    }
    
    return analysis.data;
    
  } catch (error) {
    console.error('Analysis workflow error:', error.message);
    throw error;
  }
}
```

### User Progress Dashboard

```javascript
async function generateUserDashboard(userId) {
  try {
    // Get user progress analytics
    const progress = await analysisRepository.getUserProgressAnalytics(userId, {
      timeframe: '30d'
    });
    
    // Get language expertise
    const languages = progress.data.languageExpertise.sort(
      (a, b) => b.analysisCount - a.analysisCount
    );
    
    // Calculate improvement
    const progressData = progress.data.progressOverTime;
    const improvement = progressData.length > 1 ? 
      progressData[progressData.length - 1].avgQuality - progressData[0].avgQuality : 0;
    
    return {
      totalAnalyses: progress.data.overall.totalAnalyses,
      averageQuality: progress.data.overall.avgQualityScore,
      improvement: improvement,
      topLanguage: languages[0]?.language || 'None',
      projectsAnalyzed: progress.data.overall.totalProjects
    };
    
  } catch (error) {
    console.error('Dashboard generation error:', error.message);
    throw error;
  }
}
```

### Project Quality Report

```javascript
async function generateQualityReport(projectId) {
  try {
    // Get project analytics
    const analytics = await analysisRepository.getProjectAnalyticsSummary(projectId);
    
    // Get all analyses for detailed breakdown
    const analyses = await analysisRepository.getAnalysesByProjectId(projectId, {
      orderBy: 'QUALITY_SCORE',
      orderDirection: 'ASC',
      limit: 100
    });
    
    // Calculate quality distribution
    const qualityDistribution = {
      excellent: analyses.data.filter(a => a.qualityScore >= 9).length,
      good: analyses.data.filter(a => a.qualityScore >= 7 && a.qualityScore < 9).length,
      fair: analyses.data.filter(a => a.qualityScore >= 5 && a.qualityScore < 7).length,
      poor: analyses.data.filter(a => a.qualityScore < 5).length
    };
    
    return {
      summary: analytics.data,
      qualityDistribution,
      totalFiles: analyses.data.length,
      needsAttention: analyses.data.filter(a => a.qualityScore < 6)
    };
    
  } catch (error) {
    console.error('Quality report error:', error.message);
    throw error;
  }
}
```

## Performance Considerations

### Database Optimization
- **Indexed Queries**: All queries leverage database indexes for optimal performance
- **Parameterized Queries**: Prevents SQL injection and improves query plan caching
- **Batch Operations**: Efficient handling of multiple analyses
- **JSON Optimization**: Proper VARIANT field handling for complex data structures

### Memory Management
- **Pagination**: Built-in pagination prevents memory issues with large datasets
- **Streaming**: Large result sets processed efficiently
- **Connection Pooling**: Leverages Snowflake connection pooling

### Analytics Performance
- **Aggregation Queries**: Efficient use of Snowflake's analytical capabilities
- **Window Functions**: Optimized trend analysis and ranking queries
- **Materialized Views**: Can be used for frequently accessed analytics

## Security Features

### Data Protection
- **Parameterized Queries**: All queries use safe parameter binding
- **Input Validation**: Comprehensive validation of all inputs
- **Type Checking**: Strict type validation for all parameters
- **JSON Sanitization**: Safe handling of JSON data in VARIANT fields

### Access Control
- **Project-based Filtering**: All queries respect project ownership
- **User-based Analytics**: Analytics respect user data boundaries
- **Score Validation**: Prevents invalid score manipulation

The Analysis Repository provides a robust, secure, and performant foundation for managing code analysis data in the DevPath AI platform, with advanced analytics capabilities that leverage Snowflake's powerful analytical features.
