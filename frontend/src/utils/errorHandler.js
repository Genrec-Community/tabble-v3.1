/**
 * Production-ready error handling utilities
 * Provides consistent error handling across the application
 */

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network connection error. Please check your internet connection and try again.',
  [ERROR_TYPES.API]: 'Service temporarily unavailable. Please try again in a moment.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.AUTHENTICATION]: 'Authentication required. Please log in again.',
  [ERROR_TYPES.PERMISSION]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.SERVER]: 'Server error. Please try again later.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Determines error type based on error object
 */
export const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return ERROR_TYPES.NETWORK;
  }

  // HTTP status code based errors
  if (error.response?.status) {
    const status = error.response.status;
    if (status === 401) return ERROR_TYPES.AUTHENTICATION;
    if (status === 403) return ERROR_TYPES.PERMISSION;
    if (status === 404) return ERROR_TYPES.NOT_FOUND;
    if (status >= 400 && status < 500) return ERROR_TYPES.VALIDATION;
    if (status >= 500) return ERROR_TYPES.SERVER;
  }

  // API specific errors
  if (error.response?.data?.error || error.response?.data?.message) {
    return ERROR_TYPES.API;
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * Gets user-friendly error message
 */
export const getUserFriendlyMessage = (error, customMessage = null) => {
  if (customMessage) return customMessage;
  
  const errorType = getErrorType(error);
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
};

/**
 * Logs error details for debugging (only in development)
 */
export const logError = (error, context = '') => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error ${context ? `in ${context}` : ''}`);
    console.error('Error object:', error);
    console.error('Error type:', getErrorType(error));
    console.error('Stack trace:', error.stack);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.groupEnd();
  }
};

/**
 * Handles API errors consistently
 */
export const handleApiError = (error, context = '', customMessage = null) => {
  logError(error, context);
  
  const userMessage = getUserFriendlyMessage(error, customMessage);
  const errorType = getErrorType(error);
  
  return {
    message: userMessage,
    type: errorType,
    originalError: process.env.NODE_ENV === 'development' ? error : null
  };
};

/**
 * Shows user-friendly error in snackbar format
 */
export const showUserFriendlyError = (error, context = '', customMessage = null) => {
  const errorInfo = handleApiError(error, context, customMessage);
  
  return {
    open: true,
    message: errorInfo.message,
    severity: 'error'
  };
};

/**
 * Error boundary fallback component props
 */
export const getErrorBoundaryProps = (error, errorInfo) => {
  logError(error, 'Error Boundary');
  
  return {
    title: 'Something went wrong',
    message: process.env.NODE_ENV === 'production' 
      ? 'We apologize for the inconvenience. Please refresh the page or try again later.'
      : error.toString(),
    showDetails: process.env.NODE_ENV === 'development'
  };
};

/**
 * Retry mechanism for failed operations
 */
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logError(error, `Retry attempt ${attempt}/${maxRetries}`);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

/**
 * Safe async operation wrapper
 */
export const safeAsync = async (operation, fallbackValue = null, context = '') => {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    return fallbackValue;
  }
};

/**
 * Production error reporter (placeholder for external service integration)
 */
export const reportError = (error, context = '', userInfo = {}) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      error: error.toString(),
      stack: error.stack,
      context,
      userInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Example: Send to error reporting service
    // errorReportingService.captureException(errorReport);
    console.error('Production Error Report:', errorReport);
  }
};
