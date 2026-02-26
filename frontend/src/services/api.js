/**
 * services/api.js - API Service Layer
 * ====================================
 * This module provides a centralized API client for communicating
 * with the Flask backend. Uses Axios for HTTP requests.
 * 
 * Features:
 * - Automatic token attachment to requests
 * - Request/response interceptors for error handling
 * - Organized API methods by feature
 * 
 * Usage:
 *   import { resumeAPI, jobsAPI } from './services/api';
 *   const result = await resumeAPI.analyze(resumeId, jobDescription);
 */

import axios from 'axios';

// ==========================================
// Axios Instance Configuration
// ==========================================

const api = axios.create({
  // Use environment variable if available, otherwise fallback to local dev URL
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// Request Interceptor
// ==========================================

/**
 * Request interceptor - runs before every request
 * 
 * Automatically attaches the JWT token from localStorage
 * to the Authorization header for authenticated requests.
 */
api.interceptors.request.use(
  (config) => {
    // Get access token from localStorage
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');

    // If token exists, add to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    // Handle request setup errors
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor
// ==========================================

/**
 * Response interceptor - runs after every response
 * 
 * Handles common error scenarios:
 * - 401 Unauthorized: Clear token and redirect to login
 * - 403 Forbidden: Access denied
 * - 500 Server Error: Show generic error
 */
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 API Response: ${response.status} ${response.config.url}`);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;

    // Skip refresh logic for login/register/refresh itself
    const skipRefresh = ['/auth/login', '/auth/register', '/auth/refresh'].some(
      path => originalRequest.url?.includes(path)
    );

    if (response && response.status === 401 && !originalRequest._retry && !skipRefresh) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          console.log('🔄 Attempting to refresh access token...');
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });

          if (res.data.success && res.data.access_token) {
            const newToken = res.data.access_token;
            localStorage.setItem('access_token', newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
        }
      }

      // If no refresh token or refresh failed, logout
      console.warn('Unauthorized - clearing tokens and logging out');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return Promise.reject(error);
  }
);

// ==========================================
// Authentication API
// ==========================================

/**
 * Authentication API methods
 * 
 * Handles user registration, login, logout, and token validation.
 */
export const authAPI = {
  /**
   * Register a new user
   * 
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.name - User name
   * @returns {Promise} Registration response with user data and token
   * 
   * @example
   * const result = await authAPI.register({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   name: 'John Doe'
   * });
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login existing user
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login response with user data and JWT token
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Logout current user
   * 
   * @returns {Promise} Logout confirmation
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Validate JWT token
   * 
   * @param {string} token - JWT token to validate
   * @returns {Promise} Validation result with user data if valid
   */
  validateToken: async (token) => {
    try {
      const response = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      // Only return invalid if it's explicitly a 401
      if (error.response && error.response.status === 401) {
        return { valid: false };
      }
      // For other errors (500, network), throw
      throw error;
    }
  },

  /**
   * Refresh access token
   * 
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} Refresh response
   */
  refresh: async (refreshToken) => {
    const response = await api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    return response.data;
  }
};

// ==========================================
// Resume API
// ==========================================

/**
 * Resume API methods
 * 
 * Handles resume upload, analysis, and skill extraction.
 */
export const resumeAPI = {
  /**
   * Get the most recently uploaded resume
   * 
   * @returns {Promise} Latest resume metadata
   */
  getLatest: async () => {
    const response = await api.get('/resume/latest');
    return response.data;
  },

  /**
   * Perform skill analysis on a resume
   * 
   * @param {string} resumeId - ID of the resume to analyze
   * @param {string} jobDescription - Optional job description
   * @returns {Promise} Skill analysis results
   */
  skillAnalysis: async (resumeId, jobDescription) => {
    const response = await api.post('/resume/skill-analysis', {
      resume_id: resumeId,
      job_description: jobDescription
    });
    return response.data;
  },

  /**
   * Upload a resume file
   * 
   * @param {File} file - Resume file (PDF, DOC, DOCX, TXT)
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise} Upload response with resume ID and preview
   * 
   * @example
   * const result = await resumeAPI.upload(file, (progress) => {
   *   console.log(`Upload: ${progress}%`);
   * });
   */
  upload: async (file, onProgress) => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        // Calculate upload percentage
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) onProgress(percentCompleted);
      },
    });

    return response.data;
  },

  /**
   * Analyze an uploaded resume
   * 
   * @param {string} resumeId - ID of the uploaded resume
   * @param {string} jobDescription - Optional job description for matching
   * @returns {Promise} Analysis results (skills, experience, education)
   * 
   * @example
   * const analysis = await resumeAPI.analyze('abc123', 'Looking for Python developer...');
   */
  analyze: async (resumeId, jobDescription = '') => {
    const response = await api.post('/resume/analyze', {
      resume_id: resumeId,
      job_description: jobDescription
    });
    return response.data;
  },

  /**
   * Get ATS score for a resume
   * 
   * @param {string} resumeId - ID of the resume to score
   * @param {string} jobDescription - Optional job description
   * @returns {Promise} ATS score and breakdown
   */
  getATSScore: async (resumeId, jobDescription = '') => {
    const response = await api.post('/resume/ats-score', {
      resume_id: resumeId,
      job_description: jobDescription
    });
    return response.data;
  },

  /**
   * Get extracted skills for a resume
   * 
   * @param {string} resumeId - ID of the resume
   * @returns {Promise} Categorized skills
   */
  getSkills: async (resumeId) => {
    const response = await api.get(`/resume/skills/${resumeId}`);
    return response.data;
  },

  /**
   * Get user's resume analysis history
   * 
   * @param {number} limit - Max results to return
   * @param {number} skip - Results to skip (pagination)
   * @returns {Promise} List of previous analyses
   */
  getHistory: async (limit = 10, skip = 0) => {
    const response = await api.get('/resume/history', {
      params: { limit, skip }
    });
    return response.data;
  },

  /**
   * Analyze resume text directly without upload
   * 
   * @param {string} text - Resume text content
   * @param {string} jobDescription - Optional job description
   * @returns {Promise} Analysis results
   */
  analyzeText: async (text, jobDescription = '') => {
    const response = await api.post('/resume/analyze-text', {
      text,
      job_description: jobDescription
    });
    return response.data;
  },

  /**
   * Convert resume to ATS-friendly format
   * @param {FormData} formData - Contains 'file' and optional 'job_keywords'
   */
  convertATS: async (formData) => {
    const response = await api.post('/resume/convert-ats', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Download ATS-friendly resume as DOCX
   * @param {string} resumeText - Converted ATS text
   */
  downloadATSDocx: async (resumeText) => {
    return api.post('/resume/download-ats-docx', { ats_resume: resumeText }, {
      responseType: 'blob'
    });
  }
};

// ==========================================
// Resume Builder API
// ==========================================

/**
 * Resume Builder API methods
 * 
 * Handles resume creation and PDF generation.
 */
export const builderAPI = {
  /**
   * Save resume data
   * 
   * @param {Object} resumeData - Complete resume data
   * @returns {Promise} Save response with resume ID
   */
  save: async (resumeData) => {
    const response = await api.post('/builder/save', resumeData);
    return response.data;
  },

  /**
   * Generate PDF from resume data
   * 
   * @param {string} resumeId - ID of saved resume
   * @param {string} template - Template name to use
   * @returns {Promise} Blob of generated PDF
   */
  generatePDF: async (resumeId, template = 'professional') => {
    const response = await api.post('/builder/generate',
      { resume_id: resumeId, template },
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Get AI suggestions for resume content
   * 
   * @param {string} section - Section to get suggestions for
   * @param {Object} context - Current content context
   * @returns {Promise} AI-generated suggestions
   */
  getSuggestions: async (section, context) => {
    const response = await api.post('/builder/suggestions', {
      section,
      context
    });
    return response.data;
  }
};

// ==========================================
// Jobs API
// ==========================================

/**
 * Jobs API methods
 * 
 * Handles job recommendations, search, and applications.
 */
export const jobsAPI = {
  /**
   * Get personalized job recommendations
   * 
   * @param {number} limit - Max jobs to return
   * @param {number} minMatch - Minimum match score (0-100)
   * @returns {Promise} List of matched jobs with scores
   * 
   * @example
   * const jobs = await jobsAPI.getRecommendations(10, 70);
   */
  getRecommendations: async (limit = 10, minMatch = 50) => {
    const response = await api.get('/jobs/recommendations', {
      params: { limit, min_match: minMatch }
    });
    return response.data;
  },

  /**
   * Search jobs with filters
   * 
   * @param {Object} filters - Search filters
   * @param {string} filters.query - Search query
   * @param {string} filters.location - Location filter
   * @param {string} filters.level - Experience level
   * @param {boolean} filters.remote - Remote only
   * @returns {Promise} Filtered job list
   */
  search: async (filters = {}) => {
    const response = await api.get('/jobs/search', {
      params: {
        q: filters.query,
        location: filters.location,
        level: filters.level,
        remote: filters.remote
      }
    });
    return response.data;
  },

  /**
   * Apply to a job
   * 
   * @param {string} jobId - ID of job to apply for
   * @param {string} resumeId - ID of resume to use
   * @param {string} coverLetter - Optional cover letter
   * @returns {Promise} Application confirmation
   */
  apply: async (jobId, resumeId, coverLetter = '') => {
    const response = await api.post(`/jobs/apply/${jobId}`, {
      resume_id: resumeId,
      cover_letter: coverLetter
    });
    return response.data;
  },

  /**
   * Save/unsave a job
   * 
   * @param {string} jobId - ID of job to save
   * @returns {Promise} Save status
   */
  toggleSave: async (jobId) => {
    const response = await api.post(`/jobs/save/${jobId}`);
    return response.data;
  },

  /**
   * Get saved jobs
   * 
   * @returns {Promise} List of saved jobs
   */
  getSaved: async () => {
    const response = await api.get('/jobs/saved');
    return response.data;
  }
};

// Export default api instance for custom requests
export default api;