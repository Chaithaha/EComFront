// Image Error Handler for Supabase Storage uploads

// Error types for image uploads
export const ImageUploadErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Class for handling image upload errors
export class ImageUploadError extends Error {
  constructor(message, type, severity, details = {}) {
    super(message);
    this.name = 'ImageUploadError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Analyze upload error and return appropriate error object
export const analyzeUploadError = (error, context = {}) => {
  console.error('Analyzing upload error:', error, 'Context:', context);
  
  if (!error) {
    return new ImageUploadError(
      'Unknown upload error',
      ImageUploadErrorTypes.UNKNOWN_ERROR,
      ErrorSeverity.MEDIUM
    );
  }
  
  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new ImageUploadError(
      'Network error: Unable to connect to the server',
      ImageUploadErrorTypes.NETWORK_ERROR,
      ErrorSeverity.HIGH,
      { originalError: error.message, context }
    );
  }
  
  // Handle authentication errors
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    return new ImageUploadError(
      'Authentication failed. Please log in again.',
      ImageUploadErrorTypes.AUTH_ERROR,
      ErrorSeverity.HIGH,
      { originalError: error.message, context }
    );
  }
  
  // Handle validation errors
  if (error.message?.includes('Invalid file') || error.message?.includes('validation')) {
    return new ImageUploadError(
      'Invalid file format or size',
      ImageUploadErrorTypes.VALIDATION_ERROR,
      ErrorSeverity.LOW,
      { originalError: error.message, context }
    );
  }
  
  // Handle storage errors
  if (error.message?.includes('storage') || error.message?.includes('bucket')) {
    return new ImageUploadError(
      'Storage service error. Please try again later.',
      ImageUploadErrorTypes.STORAGE_ERROR,
      ErrorSeverity.MEDIUM,
      { originalError: error.message, context }
    );
  }
  
  // Handle database errors
  if (error.message?.includes('database') || error.message?.includes('constraint')) {
    return new ImageUploadError(
      'Database error. Please try again later.',
      ImageUploadErrorTypes.DATABASE_ERROR,
      ErrorSeverity.MEDIUM,
      { originalError: error.message, context }
    );
  }
  
  // Handle Supabase specific errors
  if (error.code === 'PGRST116') {
    return new ImageUploadError(
      'Resource not found',
      ImageUploadErrorTypes.DATABASE_ERROR,
      ErrorSeverity.MEDIUM,
      { originalError: error.message, context }
    );
  }
  
  if (error.code === 'PGRST301') {
    return new ImageUploadError(
      'Row level security violation',
      ImageUploadErrorTypes.AUTH_ERROR,
      ErrorSeverity.HIGH,
      { originalError: error.message, context }
    );
  }
  
  // Default to unknown error
  return new ImageUploadError(
    error.message || 'Unknown upload error',
    ImageUploadErrorTypes.UNKNOWN_ERROR,
    ErrorSeverity.MEDIUM,
    { originalError: error.message, context }
  );
};

// Log error with appropriate level
export const logUploadError = (error, context = {}) => {
  const analyzedError = analyzeUploadError(error, context);
  
  // Log based on severity
  switch (analyzedError.severity) {
    case ErrorSeverity.LOW:
      console.warn(`[Image Upload Warning] ${analyzedError.message}`, {
        type: analyzedError.type,
        context,
        timestamp: analyzedError.timestamp
      });
      break;
    case ErrorSeverity.MEDIUM:
      console.error(`[Image Upload Error] ${analyzedError.message}`, {
        type: analyzedError.type,
        context,
        timestamp: analyzedError.timestamp
      });
      break;
    case ErrorSeverity.HIGH:
      console.error(`[Image Upload Critical] ${analyzedError.message}`, {
        type: analyzedError.type,
        context,
        timestamp: analyzedError.timestamp,
        stack: error.stack
      });
      // Optionally send to error tracking service
      break;
    case ErrorSeverity.CRITICAL:
      console.error(`[Image Upload Emergency] ${analyzedError.message}`, {
        type: analyzedError.type,
        context,
        timestamp: analyzedError.timestamp,
        stack: error.stack
      });
      // Critical errors should be sent to error tracking service immediately
      break;
  }
  
  return analyzedError;
};

// Get user-friendly error message
export const getUserFriendlyErrorMessage = (error) => {
  const analyzedError = analyzeUploadError(error);
  
  const errorMessages = {
    [ImageUploadErrorTypes.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
    [ImageUploadErrorTypes.AUTH_ERROR]: 'Authentication failed. Please log in and try again.',
    [ImageUploadErrorTypes.VALIDATION_ERROR]: 'Invalid file. Please check the file format and size requirements.',
    [ImageUploadErrorTypes.STORAGE_ERROR]: 'Storage service error. Please try again later.',
    [ImageUploadErrorTypes.DATABASE_ERROR]: 'Database error. Please try again later.',
    [ImageUploadErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
  };
  
  return errorMessages[analyzedError.type] || analyzedError.message;
};

// Retry upload with exponential backoff
export const retryUpload = async (uploadFunction, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting upload (attempt ${attempt}/${maxRetries})`);
      const result = await uploadFunction();
      
      if (result.success) {
        console.log(`Upload successful on attempt ${attempt}`);
        return result;
      }
      
      lastError = result.error;
      
      // If it's a validation error, don't retry
      if (result.error?.includes('Invalid file') || result.error?.includes('validation')) {
        break;
      }
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      console.log(`Upload failed, retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  console.error(`Upload failed after ${maxRetries} attempts`);
  return {
    success: false,
    error: lastError || 'Upload failed after multiple attempts'
  };
};

// Batch upload with error handling
export const batchUploadWithRetry = async (uploadFunction, files, options = {}) => {
  const { maxRetries = 2, batchSize = 3 } = options;
  const results = [];
  const successfulUploads = [];
  const failedUploads = [];
  
  console.log(`Starting batch upload of ${files.length} files with batch size ${batchSize}`);
  
  // Process files in batches
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}:`, batch.map(f => f.name));
    
    const batchResults = await Promise.allSettled(
      batch.map(file => retryUpload(() => uploadFunction(file), maxRetries))
    );
    
    batchResults.forEach((result, index) => {
      const file = batch[index];
      const uploadResult = result.status === 'fulfilled' ? result.value : 
        { success: false, error: result.reason?.message || 'Upload failed' };
      
      results.push(uploadResult);
      
      if (uploadResult.success) {
        successfulUploads.push({ file, ...uploadResult.data });
      } else {
        failedUploads.push({ file, error: uploadResult.error });
      }
    });
  }
  
  console.log(`Batch upload completed: ${successfulUploads.length} successful, ${failedUploads.length} failed`);
  
  return {
    success: failedUploads.length === 0,
    results,
    successfulUploads,
    failedUploads,
    summary: {
      total: files.length,
      successful: successfulUploads.length,
      failed: failedUploads.length
    }
  };
};

export default {
  ImageUploadError,
  ImageUploadErrorTypes,
  ErrorSeverity,
  analyzeUploadError,
  logUploadError,
  getUserFriendlyErrorMessage,
  retryUpload,
  batchUploadWithRetry
};