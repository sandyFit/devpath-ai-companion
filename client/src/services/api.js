import axios from 'axios';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: 'http://localhost:3800',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (optional, can add auth tokens here if needed)
apiClient.interceptors.request.use(
  (config) => {
    // You can add authorization headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses and errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can customize error handling here
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error('API error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('API error: No response received', error.request);
    } else {
      // Something else happened
      console.error('API error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API service methods
const api = {
  // File Upload
  uploadProject: async (zipFile, userId) => {
    const formData = new FormData();
    formData.append('file', zipFile);
    formData.append('userId', userId);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await apiClient.post('/upload', formData, config);
    return response.data;
  },

  // Project Management
  getProject: async (projectId) => {
    const response = await apiClient.get(`/api/project/${projectId}`);
    return response.data;
  },

  getUserProjects: async (userId) => {
    const response = await apiClient.get(`/api/user/${userId}/projects`);
    return response.data;
  },

  getProjectSummary: async (projectId) => {
    const response = await apiClient.get(`/api/project/${projectId}/summary`);
    return response.data;
  },

  updateProjectStatus: async (projectId, status) => {
    const response = await apiClient.put(`/api/project/${projectId}/status`, { status });
    return response.data;
  },

  // Analysis Results
  getProjectAnalysis: async (projectId) => {
    const response = await apiClient.get(`/api/analysis/${projectId}`);
    return response.data;
  },

  getProjectAnalyticsSummary: async (projectId) => {
    const response = await apiClient.get(`/api/analysis/${projectId}/summary`);
    return response.data;
  },

  // Analysis Details
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

  // Learning Paths
  getUserLearningPaths: async (userId) => {
    const response = await apiClient.get(`/api/learning-paths/user/${userId}`);
    return response.data;
  },

  generateLearningPath: async (userId, data) => {
    const response = await apiClient.post(`/api/learning-paths/user/${userId}/generate`, data);
    return response.data;
  },

  deleteProject: async (projectId) => {
    const response = await apiClient.delete(`/api/project/${projectId}`);
    return response.data;
  },
};

export default api;
