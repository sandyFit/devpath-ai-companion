import { useCallback } from 'react';

export default function useApiError(setError) {
  return useCallback((error, context) => {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const errorCode = error.response?.status;

    console.error(`API Error in ${context}:`, {
      message: errorMessage,
      status: errorCode,
      url: error.config?.url,
      method: error.config?.method
    });

    let userMessage = errorMessage;
    switch (errorCode) {
      case 404:
        userMessage = `${context} not found`;
        break;
      case 403:
        userMessage = `Access denied to ${context}`;
        break;
      case 500:
        userMessage = `Server error while loading ${context}`;
        break;
      case 429:
        userMessage = `Too many requests. Please wait a moment before trying again.`;
        break;
      default:
        userMessage = `Failed to load ${context}: ${errorMessage}`;
    }

    setError(userMessage);
    return userMessage;
  }, [setError]);
}
