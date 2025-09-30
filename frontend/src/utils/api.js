// API configuration for different environments
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://foojra-app-production.up.railway.app'
  : '';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};

// Helper function to create full API URLs
export const createApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (process.env.NODE_ENV === 'production') {
    // For production, we need to use the full URL since we can't rely on proxy
    return `${API_BASE_URL}/${cleanEndpoint}`;
  }
  
  // In development, use relative URLs (proxy handles this)
  return `/${cleanEndpoint}`;
};

// Fallback to mock data if API fails
export const createApiUrlWithFallback = (endpoint) => {
  const apiUrl = createApiUrl(endpoint);
  console.log('API URL:', apiUrl); // Debug log
  return apiUrl;
};

export default apiConfig;