// API configuration for different environments
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL || 'https://foojra-app-production.up.railway.app'
  : 'http://localhost:5000';

/**
 * Creates a full API URL for the given endpoint
 * @param {string} endpoint - The API endpoint (e.g., 'api/shops/approved')
 * @returns {string} - The complete API URL
 */
export const createApiUrl = (endpoint) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, we need the full URL including the /api prefix
    const fullUrl = `${API_BASE_URL}/${endpoint}`;
    console.log('🔗 API URL being called:', fullUrl);
    return fullUrl;
  } else {
    // In development, use relative paths
    return `/${endpoint}`;
  }
};

// Temporary fallback to mock data for testing
export const createApiUrlWithFallback = (endpoint) => {
  // For now, let's try to use local mock data as fallback
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Using mock data fallback due to Railway deployment issues');
    return null; // This will trigger the component to use mock data
  }
  return createApiUrl(endpoint);
};

export default apiConfig;