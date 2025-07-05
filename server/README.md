# Express Server with Groq AI Integration

A modular Express.js server that handles ZIP file uploads, extracts code files, and performs AI-powered code analysis using Groq's API.

## Features

- **File Upload & Extraction**: Upload ZIP files and extract supported code files (.js, .jsx, .ts, .tsx, .py)
- **AI Code Analysis**: Analyze code quality, complexity, security, best practices, and learning gaps using Groq AI
- **Modular Architecture**: Clean separation of concerns with controllers, services, routes, and middleware
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Input Validation**: Robust validation for all API endpoints
- **Error Handling**: Centralized error handling with meaningful error messages

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm
- Groq API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```env
GROQ_API_KEY=your_groq_api_key_here
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
│   └── analysisController.js
├── services/             # Business logic
│   ├── zipService.js
│   ├── groqService.js
│   └── analysisService.js
├── routes/               # API route definitions
│   ├── uploadRoutes.js
│   └── groqRoutes.js
├── middleware/           # Request processing middleware
│   ├── multerConfig.js
│   └── analysisValidation.js
├── uploads/              # Uploaded ZIP files
├── extracted/            # Extracted code files
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
- **multer**: File upload handling
- **adm-zip**: ZIP file processing
- **uuid**: Unique identifier generation
- **dotenv**: Environment variable management
- **morgan**: HTTP request logging

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required)
- `PORT`: Server port (default: 3800)
- `NODE_ENV`: Environment mode (development/production)

## Security Considerations

- File type validation for uploads
- Content size limits
- Input sanitization and validation
- Error message sanitization
- API key protection via environment variables
