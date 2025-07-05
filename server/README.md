# Express Server with Groq AI Integration & Snowflake Database

A modular Express.js server that handles ZIP file uploads, extracts code files, performs AI-powered code analysis using Groq's API, and provides Snowflake database connectivity for the DevPath AI project.

## Features

- **File Upload & Extraction**: Upload ZIP files and extract supported code files (.js, .jsx, .ts, .tsx, .py)
- **AI Code Analysis**: Analyze code quality, complexity, security, best practices, and learning gaps using Groq AI
- **Snowflake Database Integration**: Full-featured Snowflake database service with connection pooling, query execution, and batch processing
- **Modular Architecture**: Clean separation of concerns with controllers, services, routes, and middleware
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Input Validation**: Robust validation for all API endpoints
- **Error Handling**: Centralized error handling with meaningful error messages
- **Rate Limiting**: Built-in rate limiting for database operations

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm
- Groq API key
- Snowflake account and credentials

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory (use `.env.template` as reference):
```env
# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here

# Snowflake Database Configuration
SNOWFLAKE_ACCOUNT=your_account.region.snowflakecomputing.com
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema

# Server Configuration
PORT=3800
NODE_ENV=development
```

3. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### File Upload
- **POST /upload**
  - Upload and extract ZIP files
  - Supports: .js, .jsx, .ts, .tsx, .py files
  - Returns: Extraction results and next steps

### Code Analysis

#### Analyze Single File
- **POST /analyze/file**
  - Analyze a specific code file
  - Body:
    ```json
    {
      "filename": "example.js",
      "content": "const hello = 'world';",
      "language": "javascript",
      "analysisTypes": ["code_quality", "complexity", "security"]
    }
    ```

#### Analyze All Extracted Files
- **POST /analyze/batch**
  - Analyze all files in the extracted directory
  - Body:
    ```json
    {
      "analysisTypes": ["code_quality", "complexity", "security", "best_practices", "learning_gaps"]
    }
    ```

#### Get Analysis Results
- **GET /analyze/results/:analysisId** - Get specific analysis result
- **GET /analyze/results** - Get all analysis results
- **GET /analyze/stats** - Get analysis statistics
- **GET /analyze/types** - Get available analysis types

### Snowflake Database Operations

#### Connection Management
- **POST /snowflake/connect** - Connect to Snowflake database
- **POST /snowflake/disconnect** - Disconnect from Snowflake database
- **GET /snowflake/status** - Get connection status and statistics
- **GET /snowflake/health** - Perform health check with server info

#### Query Execution
- **POST /snowflake/query** - Execute single SQL query
  - Body:
    ```json
    {
      "sqlText": "SELECT * FROM users LIMIT 10",
      "binds": [],
      "options": {
        "timeout": 30000
      }
    }
    ```

- **POST /snowflake/batch** - Execute multiple queries in batch
  - Body:
    ```json
    {
      "queries": [
        {
          "sqlText": "SELECT COUNT(*) FROM users",
          "binds": []
        },
        {
          "sqlText": "INSERT INTO logs (message) VALUES (?)",
          "binds": ["Batch operation completed"]
        }
      ],
      "options": {
        "timeout": 300000,
        "continueOnError": true
      }
    }
    ```

#### Utility Endpoints
- **GET /snowflake/templates** - Get SQL query templates and examples

## Analysis Types

1. **code_quality** - Evaluate code readability, maintainability, and adherence to best practices
2. **complexity** - Assess algorithmic complexity, nesting levels, and code structure complexity
3. **security** - Identify potential security vulnerabilities and unsafe practices
4. **best_practices** - Check adherence to language-specific best practices and conventions
5. **learning_gaps** - Identify areas where the developer could improve their skills

## Response Format

### Analysis Result
```json
{
  "fileId": "uuid",
  "analysis": {
    "qualityScore": 8.5,
    "complexityScore": 6.2,
    "securityScore": 9.1,
    "issues": [
      {
        "type": "code_quality",
        "severity": "medium",
        "line": 45,
        "description": "Variable naming could be more descriptive",
        "suggestion": "Use descriptive names like userAccountBalance instead of bal"
      }
    ],
    "strengths": [
      "Good error handling implementation",
      "Clean function structure"
    ],
    "learningRecommendations": [
      {
        "topic": "JavaScript ES6 Features",
        "priority": "high",
        "reason": "Code uses outdated patterns that could be modernized"
      }
    ]
  }
}
```

## Architecture

### Directory Structure
```
server/
├── controllers/          # HTTP request handlers
│   ├── uploadController.js
│   ├── analysisController.js
│   └── snowflakeController.js
├── services/             # Business logic
│   ├── zipService.js
│   ├── groqService.js
│   ├── analysisService.js
│   └── snowflakeService.js
├── routes/               # API route definitions
│   ├── uploadRoutes.js
│   ├── groqRoutes.js
│   └── snowflakeRoutes.js
├── middleware/           # Request processing middleware
│   ├── multerConfig.js
│   ├── analysisValidation.js
│   └── snowflakeValidation.js
├── uploads/              # Uploaded ZIP files
├── extracted/            # Extracted code files
├── .env.template         # Environment variables template
└── server.js            # Main application entry point
```

### Service Layer

#### GroqService
- Handles direct communication with Groq API
- Builds analysis prompts based on code and analysis types
- Parses AI responses into structured format
- Provides fallback handling for parsing errors

#### AnalysisService
- Orchestrates the analysis workflow
- Manages file processing and result storage
- Provides batch analysis capabilities
- Generates analysis statistics

#### SnowflakeService
- Manages Snowflake database connections with pooling
- Handles authentication using username/password method
- Provides query execution with retry logic and error handling
- Supports batch query execution with transaction management
- Includes connection health monitoring and statistics
- Implements rate limiting and timeout management

#### ZipService
- Handles ZIP file extraction
- Filters supported file types
- Provides file metadata and content access
- Language detection for extracted files

### Middleware

#### AnalysisValidation
- Validates analysis request parameters
- Ensures required fields are present
- Validates analysis types against allowed values
- Enforces content size limits

#### SnowflakeValidation
- Validates SQL query requests and batch operations
- Implements basic SQL injection prevention
- Enforces query size and timeout limits
- Provides rate limiting for database operations
- Validates environment configuration

#### MulterConfig
- Handles file upload configuration
- Validates file types (ZIP only)
- Sets file size limits
- Manages upload directory

## Error Handling

The application includes comprehensive error handling:

- **Validation Errors**: 400 status with detailed validation messages
- **Not Found Errors**: 404 status for missing resources
- **API Errors**: 500 status with error details
- **Groq API Errors**: Graceful handling with fallback responses

## Logging

Detailed logging is implemented throughout the application:

- HTTP request logging via Morgan
- Service-level operation logging
- Error logging with stack traces
- Analysis progress tracking

## Development

### Adding New Analysis Types

1. Add the new type to `ANALYSIS_TYPES` in relevant files
2. Update the analysis prompt in `groqService.js`
3. Add validation in `analysisValidation.js`
4. Update documentation

### Testing

Test the integration with sample files:

1. Upload a ZIP file with code files
2. Analyze extracted files using batch endpoint
3. Retrieve analysis results
4. Check analysis statistics

## Dependencies

- **express**: Web framework
- **groq-sdk**: Groq AI API client
- **snowflake-sdk**: Snowflake database connector
- **multer**: File upload handling
- **adm-zip**: ZIP file processing
- **uuid**: Unique identifier generation
- **dotenv**: Environment variable management
- **morgan**: HTTP request logging

## Environment Variables

### Required
- `GROQ_API_KEY`: Your Groq API key
- `SNOWFLAKE_ACCOUNT`: Snowflake account identifier
- `SNOWFLAKE_USERNAME`: Snowflake username
- `SNOWFLAKE_PASSWORD`: Snowflake password
- `SNOWFLAKE_WAREHOUSE`: Snowflake warehouse name
- `SNOWFLAKE_DATABASE`: Snowflake database name
- `SNOWFLAKE_SCHEMA`: Snowflake schema name

### Optional
- `PORT`: Server port (default: 3800)
- `NODE_ENV`: Environment mode (development/production)

## Security Considerations

- File type validation for uploads
- Content size limits
- Input sanitization and validation
- Basic SQL injection prevention for database queries
- Rate limiting for database operations
- Error message sanitization
- API key and database credential protection via environment variables
- Connection pooling with timeout management
- Query size and execution time limits

## Snowflake Service Features

### Connection Management
- Automatic connection pooling with configurable limits
- Connection health monitoring and automatic reconnection
- Session keep-alive for long-running connections
- Graceful connection cleanup and resource management

### Query Execution
- Single query execution with parameter binding
- Batch query execution with transaction support
- Configurable timeouts for different operation types
- Retry logic with exponential backoff for transient failures
- Comprehensive query metadata and statistics

### Error Handling
- Detailed error logging with query context
- Retry logic for recoverable errors
- Graceful degradation for connection issues
- Comprehensive error reporting with actionable messages

### Performance Features
- Connection pooling to reduce connection overhead
- Query result caching and metadata extraction
- Execution time tracking and performance monitoring
- Rate limiting to prevent database overload
