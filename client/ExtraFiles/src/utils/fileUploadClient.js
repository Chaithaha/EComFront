const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to get the current authentication token
const getAuthToken = () => {
  try {
    // Try multiple possible locations where Supabase might store the token
    const possibleKeys = ['supabase.auth.token', 'supabase.session', 'auth:token'];
    
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        try {
          const parsedToken = JSON.parse(token);
          // Try different possible structures for the access token
          if (parsedToken?.currentSession?.access_token) {
            console.log(`Found token from ${key}:`, parsedToken.currentSession.access_token.substring(0, 20) + '...');
            return parsedToken.currentSession.access_token;
          }
          if (parsedToken?.access_token) {
            console.log(`Found token from ${key}:`, parsedToken.access_token.substring(0, 20) + '...');
            return parsedToken.access_token;
          }
          if (parsedToken?.session?.access_token) {
            console.log(`Found token from ${key}:`, parsedToken.session.access_token.substring(0, 20) + '...');
            return parsedToken.session.access_token;
          }
        } catch (parseError) {
          console.log(`Failed to parse token from ${key}:`, parseError);
        }
      }
    }
    
    // Also check for direct access token storage
    const directToken = localStorage.getItem('access_token');
    if (directToken) {
      console.log(`Found direct token:`, directToken.substring(0, 20) + '...');
      return directToken;
    }
    
    console.log('No auth token found in localStorage');
    
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix to get just the base64 data
      const base64 = reader.result.split(',')[1];
      resolve({
        base64: base64,
        mimetype: file.type,
        originalname: file.name,
        size: file.size
      });
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

const fileUploadClient = {
  async upload(endpoint, formData, options = {}) {
    try {
      const headers = {};
      
      // Add authorization header if token exists
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Don't set Content-Type header for FormData - let the browser set it with boundary
      // Only set it if explicitly provided in options
      if (options.contentType) {
        headers['Content-Type'] = options.contentType;
      }
      
      console.log('Uploading to:', `${API_URL}${endpoint}`);
      console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) =>
        key === 'images' ? `${key}: [File]` : `${key}: ${value}`
      ));
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (like some multer error responses)
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: text || 'Upload failed with unknown error' };
        }
      }
      
      console.log('Upload response status:', response.status);
      console.log('Upload response data:', data);
      
      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: response.ok ? null : data.error || data.message || 'Upload failed'
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Network error. Please try again later.'
      };
    }
  },

  async uploadMultipleFormData(endpoint, formDataArray, options = {}) {
    const results = [];
    const successfulUploads = [];
    const failedUploads = [];
    
    for (let i = 0; i < formDataArray.length; i++) {
      const formData = formDataArray[i];
      const result = await this.upload(endpoint, formData, options);
      results.push(result);
      
      if (result.success) {
        successfulUploads.push(result.data);
      } else {
        failedUploads.push({
          index: i + 1,
          error: result.error
        });
        console.error(`Upload ${i + 1} failed:`, result.error);
      }
    }
    
    // Return aggregated results
    return {
      success: failedUploads.length === 0,
      results,
      successfulUploads,
      failedUploads,
      summary: {
        total: formDataArray.length,
        successful: successfulUploads.length,
        failed: failedUploads.length
      }
    };
  },

  // Single upload method for better error handling (updated for Supabase Storage)
  async uploadSingle(endpoint, file, postData = {}, options = {}) {
    try {
      console.log('Uploading single file:', file.name);
      console.log('Endpoint:', `${API_URL}${endpoint}`);
      
      // Convert file to base64 for Supabase Storage upload
      const fileData = await fileToBase64(file);
      
      // Prepare the payload for Supabase Storage upload
      const uploadPayload = {
        files: [fileData],
        ...postData
      };
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(uploadPayload),
      });
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: text || 'Upload failed with unknown error' };
        }
      }
      
      console.log('Upload response status:', response.status);
      console.log('Upload response data:', data);
      
      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: response.ok ? null : data.error || data.message || 'Upload failed'
      };
    } catch (error) {
      console.error('Single upload error:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Network error. Please try again later.'
      };
    }
  },

  // Multiple upload method for Supabase Storage
  async uploadMultipleFiles(endpoint, files, postData = {}, options = {}) {
    try {
      console.log(`Uploading ${files.length} files to:`, `${API_URL}${endpoint}`);
      
      // Convert all files to base64
      const fileDataPromises = files.map(file => fileToBase64(file));
      const filesData = await Promise.all(fileDataPromises);
      
      // Prepare the payload for Supabase Storage upload
      const uploadPayload = {
        files: filesData,
        ...postData
      };
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(uploadPayload),
      });
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: text || 'Upload failed with unknown error' };
        }
      }
      
      console.log('Upload response status:', response.status);
      console.log('Upload response data:', data);
      
      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: response.ok ? null : data.error || data.message || 'Upload failed'
      };
    } catch (error) {
      console.error('Multiple upload error:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Network error. Please try again later.'
      };
    }
  }
};

export default fileUploadClient;