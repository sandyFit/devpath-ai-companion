import axios from 'axios';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: 'http://localhost:3800/api',
  timeout: 30000, // 30 second timeout for uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log request for debugging
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with detailed error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${data?.message || data?.error || 'Invalid request format'}`);
        case 413:
          throw new Error('File too large. Please reduce file size and try again.');
        case 415:
          throw new Error('Unsupported file type. Please upload a valid ZIP file.');
        case 422:
          throw new Error(`Validation Error: ${data?.message || data?.error || 'Invalid file content'}`);
        case 500:
          throw new Error('Server error. Please try again later.');
        case 503:
          throw new Error('Service unavailable. Please try again later.');
        default:
          throw new Error(`Upload failed: ${data?.message || data?.error || `Error ${status}`}`);
      }
    } else if (error.request) {
      // Request timeout or network error
      console.error('Request failed - no response received:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        code: error.code
      });
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Please check your connection and try again.');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please ensure the server is running on port 3800.');
      }
      if (error.code === 'ENOTFOUND') {
        throw new Error('Server not found. Please check the server URL.');
      }
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
);

// API service methods
const api = {
  // Enhanced File Upload with better validation
  uploadProject: async (zipFile, userId) => {
    try {
      // Validate inputs
      if (!zipFile) {
        throw new Error('No file selected');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Validate file type
      if (!zipFile.type.includes('zip') && !zipFile.name.endsWith('.zip')) {
        throw new Error('Please select a valid ZIP file');
      }

      // Check file size (e.g., 50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (zipFile.size > maxSize) {
        throw new Error('File size exceeds 50MB limit');
      }

      console.log('Uploading file:', {
        name: zipFile.name,
        size: zipFile.size,
        type: zipFile.type,
        userId: userId
      });

      const formData = new FormData();
      formData.append('file', zipFile);
      formData.append('userId', userId);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      };

      const response = await apiClient.post('/upload', formData, config);
      console.log('Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Enhanced connection testing
  testConnection: async () => {
    try {
      console.log('Testing server connection...');
      const response = await apiClient.get('/health');
      console.log('Server connection successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // Try to get more specific error information
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please ensure the server is running on port 3800.');
      }
      if (error.code === 'ENOTFOUND') {
        throw new Error('Server not found. Please check if localhost:3800 is accessible.');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Server may be slow to respond.');
      }
      
      throw new Error(`Cannot connect to server: ${error.message}`);
    }
  },

  // Test upload endpoint specifically
  testUploadEndpoint: async () => {
    try {
      console.log('Testing upload endpoint...');
      const response = await apiClient.get('/upload/status');
      console.log('Upload endpoint test successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload endpoint test failed:', error);
      throw new Error(`Upload endpoint not accessible: ${error.message}`);
    }
  },

  // Other methods remain the same...
  getProject: async (projectId) => {
    const response = await apiClient.get(`/project/${projectId}`);
    return response.data;
  },

  getUserProjects: async (userId) => {
    const response = await apiClient.get(`/user/${userId}/projects`);
    return response.data;
  },

  getProjectSummary: async (projectId) => {
    const response = await apiClient.get(`/project/${projectId}/summary`);
    return response.data;
  },

  updateProjectStatus: async (projectId, status) => {
    const response = await apiClient.put(`/project/${projectId}/status`, { status });
    return response.data;
  },

  getProjectAnalysis: async (projectId) => {
    const response = await apiClient.get(`/project/${projectId}/analyses`);
    return response.data;
  },

  // NEW: Store mock Groq batch analysis for testing UI
  mockGroqBatchAnalysis: async (projectId) => {
    const response = await apiClient.post('/analyze/store', {
      mock: true,
      projectId,
    });
    return response.data;
  },

  // NEW: Run actual batch analysis
  runBatchAnalysis: async (projectId) => {
    const response = await apiClient.post('/analyze/batch', {
      projectId,
    }, {
      timeout: 300000 // 5 minute timeout for batch analysis
    });
    return response.data;
  },
  

  getProjectAnalyticsSummary: async (projectId) => {
    const response = await apiClient.get(`/analysis/${projectId}/summary`);
    return response.data;
  },

  getAnalysisResult: async (analysisId) => {
    const response = await apiClient.get(`/analyze/results/${analysisId}`);
    return response.data;
  },

  getAnalysisStats: async () => {
    const response = await apiClient.get('/analyze/stats');
    return response.data;
  },

  getAnalysisTypes: async () => {
    const response = await apiClient.get('/analyze/types');
    return response.data;
  },

  getUserLearningPaths: async (userId) => {
    const response = await apiClient.get(`/learning-paths/user/${userId}`);
    return response.data;
  },

  getProjectLearningPaths: async (projectId) => {
    const response = await apiClient.get(`/learning-paths/project/${projectId}`);
    return response.data;
  },

  generateLearningPath: async (userId, data) => {
    const response = await apiClient.post(`/learning-paths/user/${userId}/generate`, data);
    return response.data;
  },

  deleteProject: async (projectId) => {
    const response = await apiClient.delete(`/project/${projectId}`);
    return response.data;
  },
};

export default api;