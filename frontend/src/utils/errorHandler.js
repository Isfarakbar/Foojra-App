// Centralized error handling utility
export const handleApiError = (error, setError) => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    setError('Network error: Unable to connect to server. Please check your internet connection and try again.');
  } else {
    setError(error.message || 'An unexpected error occurred. Please try again.');
  }
};

export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }
  return response.json();
};

export const createApiRequest = (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });
};

export const createFormDataRequest = (url, formData) => {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
};