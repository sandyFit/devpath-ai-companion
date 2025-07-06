# Project Repository Documentation

The Project Repository provides a clean data access layer for managing projects in the DevPath AI Snowflake database. It follows the repository pattern to separate business logic from data access concerns.

## Overview

The `ProjectRepository` class handles all database operations related to projects, including:
- Creating new projects
- Retrieving projects by ID or user
- Updating project status and metadata
- Soft/hard deletion of projects
- Project analytics and summaries

## Features

### ✅ Comprehensive CRUD Operations
- **Create**: New project creation with validation
- **Read**: Single project, user projects, filtered queries
- **Update**: Status updates, file count management
- **Delete**: Soft delete (archive) and hard delete options

### ✅ Advanced Query Options
- **Pagination**: Limit/offset support for large datasets
- **Filtering**: Status-based filtering
- **Sorting**: Configurable ordering by multiple fields
- **Search**: User-based and status-based queries

### ✅ Data Validation
- **Required Fields**: Automatic validation of required parameters
- **Status Validation**: Enum validation for project statuses
- **Type Checking**: Parameter type validation
- **Business Rules**: Custom validation logic

### ✅ Error Handling
- **Comprehensive Logging**: Detailed logging for debugging
- **Graceful Degradation**: Proper error handling and recovery
- **Consistent Responses**: Standardized response formats
- **SQL Injection Prevention**: Parameterized queries

## API Reference

### Constructor

```javascript
const projectRepository = require('./src/repositories/projectRepository');
```

The repository is exported as a singleton instance.

### Methods

#### `createProject(projectData)`

Creates a new project in the database.

**Parameters:**
- `projectData` (Object)
  - `userId` (string, required) - User ID who owns the project
  - `projectName` (string, required) - Name of the project
  - `totalFiles` (number, optional) - Total number of files (default: 0)
  - `status` (string, optional) - Initial status (default: 'PENDING')

**Valid Status Values:**
- `PENDING` - Project is waiting to be processed
- `PROCESSING` - Project is currently being analyzed
- `COMPLETED` - Project analysis is complete
- `FAILED` - Project analysis failed
- `ARCHIVED` - Project has been archived/deleted

**Returns:**
```javascript
{
  success: true,
  data: {
    projectId: "uuid-string",
    userId: "user-123",
    projectName: "My Project",
    totalFiles: 0,
    status: "PENDING",
    uploadTimestamp: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  queryResult: { /* Snowflake query result */ }
}
```

**Example:**
```javascript
const result = await projectRepository.createProject({
  userId: 'user-123',
  projectName: 'My Web Application'
});
```

#### `getProjectById(projectId)`

Retrieves a single project by its ID.

**Parameters:**
- `projectId` (string, required) - Project ID to retrieve

**Returns:**
- Project data object if found
- `null` if project not found

**Example:**
```javascript
const project = await projectRepository.getProjectById('project-uuid');
if (project) {
  console.log('Project found:', project.data.projectName);
} else {
  console.log('Project not found');
}
```

#### `getProjectsByUserId(userId, options)`

Retrieves all projects for a specific user with optional filtering and pagination.

**Parameters:**
- `userId` (string, required) - User ID to get projects for
- `options` (Object, optional)
  - `status` (string) - Filter by status
  - `limit` (number) - Maximum results (default: 50)
  - `offset` (number) - Results to skip (default: 0)
  - `orderBy` (string) - Field to order by (default: 'CREATED_AT')
  - `orderDirection` (string) - 'ASC' or 'DESC' (default: 'DESC')

**Valid orderBy Fields:**
- `PROJECT_ID`
- `PROJECT_NAME`
- `STATUS`
- `CREATED_AT`
- `UPDATED_AT`
- `UPLOAD_TIMESTAMP`

**Returns:**
```javascript
{
  success: true,
  data: [/* array of projects */],
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
const result = await projectRepository.getProjectsByUserId('user-123', {
  status: 'COMPLETED',
  limit: 10,
  orderBy: 'PROJECT_NAME',
  orderDirection: 'ASC'
});
```

#### `updateProjectStatus(projectId, status)`

Updates the status of a project.

**Parameters:**
- `projectId` (string, required) - Project ID to update
- `status` (string, required) - New status value

**Returns:**
```javascript
{
  success: true,
  data: {
    projectId: "uuid-string",
    status: "COMPLETED",
    updatedAt: "2024-01-01T00:00:00.000Z",
    project: { /* updated project data */ }
  },
  queryResult: { /* Snowflake query result */ }
}
```

**Example:**
```javascript
const result = await projectRepository.updateProjectStatus(
  'project-uuid', 
  'COMPLETED'
);
```

#### `deleteProject(projectId, hardDelete)`

Deletes a project (soft delete by default).

**Parameters:**
- `projectId` (string, required) - Project ID to delete
- `hardDelete` (boolean, optional) - Whether to permanently delete (default: false)

**Soft Delete (default):**
- Sets project status to 'ARCHIVED'
- Preserves all data for potential recovery
- Recommended for most use cases

**Hard Delete:**
- Permanently removes project from database
- Cascades to related records (files, analysis, learning paths)
- Cannot be undone

**Returns:**
```javascript
// Soft delete
{
  success: true,
  data: {
    projectId: "uuid-string",
    archived: true,
    archivedAt: "2024-01-01T00:00:00.000Z",
    type: "soft_delete",
    project: { /* archived project data */ }
  }
}

// Hard delete
{
  success: true,
  data: {
    projectId: "uuid-string",
    deleted: true,
    deletedAt: "2024-01-01T00:00:00.000Z",
    type: "hard_delete"
  },
  queryResult: { /* Snowflake query result */ }
}
```

**Example:**
```javascript
// Soft delete (archive)
const result = await projectRepository.deleteProject('project-uuid');

// Hard delete (permanent)
const result = await projectRepository.deleteProject('project-uuid', true);
```

#### `getProjectSummary(projectId)`

Retrieves comprehensive project analytics and summary data.

**Parameters:**
- `projectId` (string, required) - Project ID to get summary for

**Returns:**
```javascript
{
  success: true,
  data: {
    projectId: "uuid-string",
    userId: "user-123",
    projectName: "My Project",
    status: "COMPLETED",
    uploadTimestamp: "2024-01-01T00:00:00.000Z",
    totalFiles: 10,
    actualFileCount: 8,
    analyzedFileCount: 6,
    avgQualityScore: 7.5,
    avgComplexityScore: 5.2,
    avgSecurityScore: 8.9,
    learningPathsCount: 2
  }
}
```

**Example:**
```javascript
const summary = await projectRepository.getProjectSummary('project-uuid');
if (summary) {
  console.log(`Project has ${summary.data.analyzedFileCount} analyzed files`);
}
```

#### `updateProjectFileCount(projectId, totalFiles)`

Updates the total file count for a project.

**Parameters:**
- `projectId` (string, required) - Project ID to update
- `totalFiles` (number, required) - New total file count (must be >= 0)

**Returns:**
```javascript
{
  success: true,
  data: {
    projectId: "uuid-string",
    totalFiles: 15,
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  queryResult: { /* Snowflake query result */ }
}
```

**Example:**
```javascript
const result = await projectRepository.updateProjectFileCount('project-uuid', 15);
```

#### `projectExists(projectId)`

Checks if a project exists in the database.

**Parameters:**
- `projectId` (string, required) - Project ID to check

**Returns:**
- `true` if project exists
- `false` if project does not exist

**Example:**
```javascript
const exists = await projectRepository.projectExists('project-uuid');
if (exists) {
  console.log('Project exists');
} else {
  console.log('Project not found');
}
```

#### `getProjectsByStatus(status, options)`

Retrieves all projects with a specific status.

**Parameters:**
- `status` (string, required) - Status to filter by
- `options` (Object, optional)
  - `limit` (number) - Maximum results (default: 50)
  - `offset` (number) - Results to skip (default: 0)

**Returns:**
```javascript
{
  success: true,
  data: [/* array of projects with specified status */],
  metadata: {
    status: "PROCESSING",
    count: 5,
    limit: 50,
    offset: 0
  }
}
```

**Example:**
```javascript
const processingProjects = await projectRepository.getProjectsByStatus('PROCESSING');
console.log(`Found ${processingProjects.data.length} processing projects`);
```

## Error Handling

All methods include comprehensive error handling:

### Validation Errors
```javascript
// Missing required fields
throw new Error('Missing required fields: userId and projectName are required');

// Invalid status
throw new Error('Invalid status. Must be one of: PENDING, PROCESSING, COMPLETED, FAILED, ARCHIVED');

// Invalid parameters
throw new Error('Project ID is required');
```

### Database Errors
```javascript
// Connection issues
throw new Error('Failed to create project: Database connection failed');

// Query execution errors
throw new Error('Failed to retrieve project: Query execution failed');
```

### Business Logic Errors
```javascript
// Negative file count
throw new Error('Total files count cannot be negative');

// Invalid order field
throw new Error('Invalid orderBy field. Must be one of: PROJECT_ID, PROJECT_NAME, STATUS, CREATED_AT, UPDATED_AT, UPLOAD_TIMESTAMP');
```

## Usage Examples

### Complete Project Lifecycle

```javascript
const projectRepository = require('./src/repositories/projectRepository');

async function projectLifecycle() {
  try {
    // 1. Create a new project
    const newProject = await projectRepository.createProject({
      userId: 'user-123',
      projectName: 'My Web Application'
    });
    
    const projectId = newProject.data.projectId;
    console.log('Created project:', projectId);
    
    // 2. Update project status to processing
    await projectRepository.updateProjectStatus(projectId, 'PROCESSING');
    console.log('Project status updated to PROCESSING');
    
    // 3. Update file count as files are processed
    await projectRepository.updateProjectFileCount(projectId, 25);
    console.log('File count updated to 25');
    
    // 4. Complete the project
    await projectRepository.updateProjectStatus(projectId, 'COMPLETED');
    console.log('Project completed');
    
    // 5. Get project summary
    const summary = await projectRepository.getProjectSummary(projectId);
    console.log('Project summary:', summary.data);
    
    // 6. Archive the project when done
    await projectRepository.deleteProject(projectId); // Soft delete
    console.log('Project archived');
    
  } catch (error) {
    console.error('Error in project lifecycle:', error.message);
  }
}
```

### User Project Management

```javascript
async function manageUserProjects(userId) {
  try {
    // Get all projects for user
    const allProjects = await projectRepository.getProjectsByUserId(userId);
    console.log(`User has ${allProjects.data.length} total projects`);
    
    // Get only completed projects
    const completedProjects = await projectRepository.getProjectsByUserId(userId, {
      status: 'COMPLETED',
      orderBy: 'PROJECT_NAME',
      orderDirection: 'ASC'
    });
    console.log(`User has ${completedProjects.data.length} completed projects`);
    
    // Get projects with pagination
    const recentProjects = await projectRepository.getProjectsByUserId(userId, {
      limit: 10,
      offset: 0,
      orderBy: 'CREATED_AT',
      orderDirection: 'DESC'
    });
    console.log(`Recent projects (page 1):`, recentProjects.data.length);
    console.log(`Total pages:`, recentProjects.metadata.totalPages);
    
  } catch (error) {
    console.error('Error managing user projects:', error.message);
  }
}
```

### Batch Operations

```javascript
async function batchOperations() {
  try {
    // Get all processing projects
    const processingProjects = await projectRepository.getProjectsByStatus('PROCESSING');
    
    // Complete all processing projects
    for (const project of processingProjects.data) {
      await projectRepository.updateProjectStatus(project.projectId, 'COMPLETED');
      console.log(`Completed project: ${project.projectName}`);
    }
    
    // Get all failed projects and archive them
    const failedProjects = await projectRepository.getProjectsByStatus('FAILED');
    
    for (const project of failedProjects.data) {
      await projectRepository.deleteProject(project.projectId); // Soft delete
      console.log(`Archived failed project: ${project.projectName}`);
    }
    
  } catch (error) {
    console.error('Error in batch operations:', error.message);
  }
}
```

## Integration with Controllers

The repository integrates seamlessly with Express controllers:

```javascript
const projectRepository = require('../src/repositories/projectRepository');

const createProject = async (req, res) => {
  try {
    const { userId, projectName } = req.body;
    
    // Validate required fields
    if (!userId || !projectName) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId and projectName are required'
      });
    }
    
    // Create project using repository
    const result = await projectRepository.createProject({
      userId,
      projectName
    });
    
    res.json({
      success: true,
      message: 'Project created successfully',
      data: result.data
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Project creation failed',
      details: error.message
    });
  }
};
```

## Testing

The repository includes comprehensive test coverage:

```bash
# Run repository tests
node test-project-repository.js
```

Test coverage includes:
- ✅ Project creation with validation
- ✅ Project retrieval by ID and user
- ✅ Status updates with validation
- ✅ File count management
- ✅ Soft and hard deletion
- ✅ Project existence checking
- ✅ Pagination and filtering
- ✅ Error handling and validation
- ✅ Edge cases and boundary conditions

## Performance Considerations

### Database Optimization
- **Parameterized Queries**: All queries use parameter binding for security and performance
- **Indexed Fields**: Queries leverage database indexes for optimal performance
- **Batch Operations**: Support for batch processing to reduce database round trips

### Memory Management
- **Pagination**: Built-in pagination prevents memory issues with large datasets
- **Streaming**: Large result sets can be processed in chunks
- **Connection Pooling**: Leverages Snowflake connection pooling for efficiency

### Caching Strategy
- **Repository Pattern**: Enables easy integration with caching layers
- **Consistent Responses**: Standardized response formats for cache compatibility
- **Invalidation**: Clear patterns for cache invalidation on updates

## Security Features

### SQL Injection Prevention
- **Parameterized Queries**: All queries use safe parameter binding
- **Input Validation**: Comprehensive validation of all inputs
- **Type Checking**: Strict type validation for all parameters

### Access Control
- **User-based Filtering**: All queries respect user ownership
- **Status Validation**: Enum validation prevents invalid status injection
- **Field Validation**: Whitelist validation for sortable fields

### Data Protection
- **Soft Delete**: Default soft delete preserves data integrity
- **Audit Trail**: Comprehensive logging for all operations
- **Error Sanitization**: Error messages don't expose sensitive information

The Project Repository provides a robust, secure, and performant foundation for project management in the DevPath AI platform.
