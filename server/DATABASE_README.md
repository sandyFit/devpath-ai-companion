# DevPath AI - Database Schema & API Documentation

DevPath AI provides a comprehensive platform for code analysis and learning path generation with integrated Snowflake database support.

## Database Schema

The system uses a Snowflake database with the following tables:

### 1. PROJECTS Table
Stores information about uploaded code projects.

```sql
CREATE TABLE PROJECTS (
    PROJECT_ID VARCHAR(36) PRIMARY KEY,
    USER_ID VARCHAR(255) NOT NULL,
    UPLOAD_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PROJECT_NAME VARCHAR(500) NOT NULL,
    TOTAL_FILES INTEGER DEFAULT 0,
    STATUS VARCHAR(50) DEFAULT 'PENDING',
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Status Values**: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `ARCHIVED`

### 2. CODE_FILES Table
Stores individual code files within projects.

```sql
CREATE TABLE CODE_FILES (
    FILE_ID VARCHAR(36) PRIMARY KEY,
    PROJECT_ID VARCHAR(36) NOT NULL,
    FILENAME VARCHAR(1000) NOT NULL,
    LANGUAGE VARCHAR(50) NOT NULL,
    CONTENT TEXT,
    FILE_SIZE INTEGER DEFAULT 0,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY (PROJECT_ID) REFERENCES PROJECTS(PROJECT_ID)
);
```

**Supported Languages**: `javascript`, `typescript`, `python`, `java`, `csharp`, `cpp`, `go`, `rust`, `php`, `ruby`, `other`

### 3. ANALYSIS Table
Stores AI analysis results for code files.

```sql
CREATE TABLE ANALYSIS (
    ANALYSIS_ID VARCHAR(36) PRIMARY KEY,
    FILE_ID VARCHAR(36) NOT NULL,
    ISSUES_FOUND VARIANT,
    SUGGESTIONS VARIANT,
    QUALITY_SCORE INTEGER CHECK (QUALITY_SCORE BETWEEN 1 AND 10),
    COMPLEXITY_SCORE INTEGER CHECK (COMPLEXITY_SCORE BETWEEN 1 AND 10),
    SECURITY_SCORE INTEGER CHECK (SECURITY_SCORE BETWEEN 1 AND 10),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY (FILE_ID) REFERENCES CODE_FILES(FILE_ID)
);
```

### 4. LEARNING_PATHS Table
Stores personalized learning recommendations.

```sql
CREATE TABLE LEARNING_PATHS (
    PATH_ID VARCHAR(36) PRIMARY KEY,
    USER_ID VARCHAR(255) NOT NULL,
    PROJECT_ID VARCHAR(36) NOT NULL,
    RECOMMENDED_TOPICS VARIANT,
    DIFFICULTY_LEVEL VARCHAR(20) DEFAULT 'INTERMEDIATE',
    ESTIMATED_HOURS INTEGER DEFAULT 0,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY (PROJECT_ID) REFERENCES PROJECTS(PROJECT_ID)
);
```

**Difficulty Levels**: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`

## Environment Variables

Create a `.env` file in the server directory:

```env
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your-account.snowflakecomputing.com
SNOWFLAKE_USERNAME=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_WAREHOUSE=your-warehouse
SNOWFLAKE_DATABASE=DEVPATH_AI
SNOWFLAKE_SCHEMA=MAIN

# Groq AI Configuration
GROQ_API_KEY=your-groq-api-key

# Server Configuration
PORT=3800
NODE_ENV=development
```

## API Endpoints

### Database Management
- `POST /database/init` - Initialize database schema
- `GET /database/schema` - Get schema information

### Project Management
- `POST /database/projects` - Create new project
- `GET /database/projects/:id/summary` - Get project summary
- `PUT /database/projects/:id/status` - Update project status

### File Management
- `POST /database/files` - Insert code file

### Analysis Management
- `POST /database/analysis` - Insert analysis results

### Learning Path Management
- `POST /database/learning-paths` - Create learning path
- `GET /database/users/:id/learning-progress` - Get user progress

### Analytics & Insights
- `GET /database/insights/code-quality` - Get code quality insights

### Snowflake Direct Access
- `POST /snowflake/connect` - Connect to Snowflake
- `POST /snowflake/disconnect` - Disconnect from Snowflake
- `GET /snowflake/status` - Get connection status
- `GET /snowflake/health` - Health check
- `POST /snowflake/query` - Execute single query
- `POST /snowflake/batch` - Execute batch queries
- `GET /snowflake/templates` - Get query templates

## API Usage Examples

### Initialize Database Schema
```bash
curl -X POST http://localhost:3800/database/init
```

### Create Project
```bash
curl -X POST http://localhost:3800/database/projects \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "projectName": "My Web App"
  }'
```

### Insert Code File
```bash
curl -X POST http://localhost:3800/database/files \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "app.js",
    "language": "javascript",
    "content": "const express = require(\"express\");\nconst app = express();"
  }'
```

### Insert Analysis Results
```bash
curl -X POST http://localhost:3800/database/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "550e8400-e29b-41d4-a716-446655440001",
    "issuesFound": [
      {"type": "style", "severity": "medium", "description": "Missing semicolon"}
    ],
    "suggestions": [
      {"suggestion": "Add semicolons for consistency", "priority": "medium"}
    ],
    "qualityScore": 8,
    "complexityScore": 5,
    "securityScore": 9
  }'
```

### Create Learning Path
```bash
curl -X POST http://localhost:3800/database/learning-paths \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "recommendedTopics": [
      {"topic": "JavaScript Best Practices", "priority": "high"},
      {"topic": "Code Quality", "priority": "medium"}
    ],
    "difficultyLevel": "INTERMEDIATE",
    "estimatedHours": 15
  }'
```

### Get Project Summary
```bash
curl -X GET http://localhost:3800/database/projects/550e8400-e29b-41d4-a716-446655440000/summary
```

### Get Code Quality Insights
```bash
curl -X GET http://localhost:3800/database/insights/code-quality?language=javascript
```

## Database Views

The system includes several pre-built views for analytics:

### VW_PROJECT_SUMMARY
Comprehensive project overview with file counts and analysis metrics.

```sql
SELECT 
    p.PROJECT_ID,
    p.USER_ID,
    p.PROJECT_NAME,
    p.STATUS,
    p.UPLOAD_TIMESTAMP,
    p.TOTAL_FILES,
    COUNT(DISTINCT cf.FILE_ID) as ACTUAL_FILE_COUNT,
    COUNT(DISTINCT a.ANALYSIS_ID) as ANALYZED_FILE_COUNT,
    AVG(a.QUALITY_SCORE) as AVG_QUALITY_SCORE,
    AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY_SCORE,
    AVG(a.SECURITY_SCORE) as AVG_SECURITY_SCORE,
    COUNT(DISTINCT lp.PATH_ID) as LEARNING_PATHS_COUNT
FROM PROJECTS p
LEFT JOIN CODE_FILES cf ON p.PROJECT_ID = cf.PROJECT_ID
LEFT JOIN ANALYSIS a ON cf.FILE_ID = a.FILE_ID
LEFT JOIN LEARNING_PATHS lp ON p.PROJECT_ID = lp.PROJECT_ID
GROUP BY p.PROJECT_ID, p.USER_ID, p.PROJECT_NAME, p.STATUS, p.UPLOAD_TIMESTAMP, p.TOTAL_FILES;
```

### VW_USER_LEARNING_PROGRESS
User learning progress tracking across all projects.

```sql
SELECT 
    lp.USER_ID,
    COUNT(DISTINCT lp.PATH_ID) as TOTAL_LEARNING_PATHS,
    COUNT(DISTINCT CASE WHEN lp.COMPLETION_STATUS = 'COMPLETED' THEN lp.PATH_ID END) as COMPLETED_PATHS,
    COUNT(DISTINCT CASE WHEN lp.COMPLETION_STATUS = 'IN_PROGRESS' THEN lp.PATH_ID END) as IN_PROGRESS_PATHS,
    SUM(lp.ESTIMATED_HOURS) as TOTAL_ESTIMATED_HOURS,
    AVG(lp.PRIORITY_SCORE) as AVG_PRIORITY_SCORE,
    COUNT(DISTINCT lp.PROJECT_ID) as PROJECTS_WITH_LEARNING_PATHS
FROM LEARNING_PATHS lp
GROUP BY lp.USER_ID;
```

### VW_CODE_QUALITY_INSIGHTS
Code quality metrics aggregated by programming language.

```sql
SELECT 
    cf.LANGUAGE,
    COUNT(DISTINCT cf.FILE_ID) as TOTAL_FILES,
    COUNT(DISTINCT a.ANALYSIS_ID) as ANALYZED_FILES,
    AVG(a.QUALITY_SCORE) as AVG_QUALITY_SCORE,
    AVG(a.COMPLEXITY_SCORE) as AVG_COMPLEXITY_SCORE,
    AVG(a.SECURITY_SCORE) as AVG_SECURITY_SCORE,
    AVG(cf.FILE_SIZE) as AVG_FILE_SIZE,
    COUNT(DISTINCT cf.PROJECT_ID) as PROJECTS_COUNT
FROM CODE_FILES cf
LEFT JOIN ANALYSIS a ON cf.FILE_ID = a.FILE_ID
GROUP BY cf.LANGUAGE
ORDER BY TOTAL_FILES DESC;
```

## Stored Procedures

### SP_CREATE_PROJECT
Creates a new project with validation.

```sql
CALL SP_CREATE_PROJECT('project-id', 'user-id', 'project-name');
```

### SP_UPDATE_PROJECT_STATUS
Updates project status with validation.

```sql
CALL SP_UPDATE_PROJECT_STATUS('project-id', 'COMPLETED');
```

## Indexes

The schema includes optimized indexes for performance:

### PROJECTS Table Indexes
- `IDX_PROJECTS_USER_ID` - User-based queries
- `IDX_PROJECTS_STATUS` - Status filtering
- `IDX_PROJECTS_UPLOAD_TIMESTAMP` - Time-based queries
- `IDX_PROJECTS_USER_STATUS` - Combined user and status queries

### CODE_FILES Table Indexes
- `IDX_CODE_FILES_PROJECT_ID` - Project-based file queries
- `IDX_CODE_FILES_LANGUAGE` - Language filtering
- `IDX_CODE_FILES_PROJECT_LANGUAGE` - Combined project and language queries

### ANALYSIS Table Indexes
- `IDX_ANALYSIS_FILE_ID` - File-based analysis queries
- `IDX_ANALYSIS_SCORES` - Score-based filtering and sorting

### LEARNING_PATHS Table Indexes
- `IDX_LEARNING_PATHS_USER_ID` - User-based learning path queries
- `IDX_LEARNING_PATHS_PROJECT_ID` - Project-based learning paths
- `IDX_LEARNING_PATHS_USER_STATUS` - User progress tracking

## Security Features

- **SQL Injection Prevention**: Automatic detection and blocking
- **Input Validation**: Comprehensive validation for all endpoints
- **Rate Limiting**: 30 requests per minute per IP
- **Parameter Binding**: Safe SQL parameter binding
- **Environment Validation**: Required configuration checks

## Error Handling

Standardized error responses with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `404` - Not Found (resource not found)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error (database/connection issues)
- `503` - Service Unavailable (health check failures)

## Testing

Run the comprehensive test suite:

```bash
# Test database functionality
node test-database.js

# Test Snowflake service
node test-snowflake.js
```

## Architecture

The system follows a modular architecture with clear separation of concerns:

- **Services**: Core business logic and database operations
  - `snowflakeService.js` - Snowflake connection and query execution
  - `databaseInitService.js` - Database initialization and high-level operations

- **Controllers**: HTTP request handling and response formatting
  - `snowflakeController.js` - Snowflake API endpoints
  - `databaseController.js` - Database management endpoints

- **Routes**: API endpoint definitions and middleware integration
  - `snowflakeRoutes.js` - Snowflake service routes
  - `databaseRoutes.js` - Database management routes

- **Middleware**: Validation, authentication, and security
  - `snowflakeValidation.js` - Input validation and security

- **Database**: Schema definitions and stored procedures
  - `snowflake-schema.sql` - Complete database schema

This design ensures maintainability, scalability, and testability of the entire system.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Snowflake credentials
   ```

3. **Start Server**
   ```bash
   npm start
   ```

4. **Initialize Database**
   ```bash
   curl -X POST http://localhost:3800/database/init
   ```

5. **Test the API**
   ```bash
   node test-database.js
   ```

The DevPath AI database system is now ready for code analysis and learning path generation!
