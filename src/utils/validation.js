/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
    if (!email) return false;
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @param {string} format - Expected format ('us', 'international', 'any')
   * @returns {boolean} Whether the phone number is valid
   */
  export const isValidPhone = (phone, format = 'any') => {
    if (!phone) return false;
    
    // Remove non-digit characters for validation
    const cleaned = phone.replace(/\D/g, '');
    
    if (format === 'us') {
      // US phone format (10 digits, or 11 digits starting with 1)
      return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
    }
    
    if (format === 'international') {
      // International format (at least 7 digits, maximum 15 digits)
      return cleaned.length >= 7 && cleaned.length <= 15;
    }
    
    // Any format (at least 7 digits)
    return cleaned.length >= 7;
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with strength and messages
   */
  export const validatePassword = (password) => {
    if (!password) {
      return {
        isValid: false,
        strength: 0,
        messages: ['Password is required']
      };
    }
    
    const messages = [];
    let strength = 0;
    
    // Check minimum length
    if (password.length < 8) {
      messages.push('Password should be at least 8 characters long');
    } else {
      strength += 1;
    }
    
    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      messages.push('Password should contain at least one lowercase letter');
    } else {
      strength += 1;
    }
    
    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      messages.push('Password should contain at least one uppercase letter');
    } else {
      strength += 1;
    }
    
    // Check for numbers
    if (!/\d/.test(password)) {
      messages.push('Password should contain at least one number');
    } else {
      strength += 1;
    }
    
    // Check for special characters
    if (!/[^A-Za-z0-9]/.test(password)) {
      messages.push('Password should contain at least one special character');
    } else {
      strength += 1;
    }
    
    return {
      isValid: messages.length === 0,
      strength, // 0-5 scale, 5 being strongest
      messages
    };
  };
  
  /**
   * Validate a name
   * @param {string} name - Name to validate
   * @returns {boolean} Whether the name is valid
   */
  export const isValidName = (name) => {
    if (!name) return false;
    
    // Name should be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-z\s'-]{2,}$/;
    return nameRegex.test(name.trim());
  };
  
  /**
   * Validate a vehicle number/ID
   * @param {string} vehicleNumber - Vehicle number to validate
   * @returns {boolean} Whether the vehicle number is valid
   */
  export const isValidVehicleNumber = (vehicleNumber) => {
    if (!vehicleNumber) return false;
    
    // Vehicle number should be at least 2 characters and contain only letters, numbers, spaces, and hyphens
    const vehicleRegex = /^[A-Za-z0-9\s-]{2,}$/;
    return vehicleRegex.test(vehicleNumber.trim());
  };
  
  /**
   * Validate that a field is not empty
   * @param {string} value - Value to validate
   * @returns {boolean} Whether the value is not empty
   */
  export const isNotEmpty = (value) => {
    if (value === undefined || value === null) return false;
    
    return value.toString().trim() !== '';
  };
  
  /**
   * Validate a number is within a range
   * @param {number} value - Number to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} Whether the number is within range
   */
  export const isInRange = (value, min, max) => {
    if (value === undefined || value === null) return false;
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) return false;
    
    return numValue >= min && numValue <= max;
  };
  
  /**
   * Validate a date is within a range
   * @param {Date|string} date - Date to validate
   * @param {Date|string} minDate - Minimum date
   * @param {Date|string} maxDate - Maximum date
   * @returns {boolean} Whether the date is within range
   */
  export const isDateInRange = (date, minDate, maxDate) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const minObj = minDate ? (typeof minDate === 'string' ? new Date(minDate) : minDate) : null;
    const maxObj = maxDate ? (typeof maxDate === 'string' ? new Date(maxDate) : maxDate) : null;
    
    if (isNaN(dateObj.getTime())) return false;
    
    if (minObj && dateObj < minObj) {
      return false;
    }
    
    if (maxObj && dateObj > maxObj) {
      return false;
    }
    
    return true;
  };
  
  /**
   * Validate a URL
   * @param {string} url - URL to validate
   * @returns {boolean} Whether the URL is valid
   */
  export const isValidUrl = (url) => {
    if (!url) return false;
    
    try {
      // Use URL constructor for validation
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Validate a file type
   * @param {File} file - File to validate
   * @param {string[]} allowedTypes - Array of allowed MIME types
   * @returns {boolean} Whether the file type is valid
   */
  export const isValidFileType = (file, allowedTypes) => {
    if (!file || !allowedTypes || !allowedTypes.length) return false;
    
    return allowedTypes.includes(file.type);
  };
  
  /**
   * Validate a file size
   * @param {File} file - File to validate
   * @param {number} maxSizeInBytes - Maximum file size in bytes
   * @returns {boolean} Whether the file size is valid
   */
  export const isValidFileSize = (file, maxSizeInBytes) => {
    if (!file || !maxSizeInBytes) return false;
    
    return file.size <= maxSizeInBytes;
  };
  
  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Whether the API key format is valid
   */
  export const isValidApiKey = (apiKey) => {
    if (!apiKey) return false;
    
    // API key should be at least 16 characters and contain only hex characters
    const apiKeyRegex = /^[a-f0-9]{16,}$/i;
    return apiKeyRegex.test(apiKey);
  };
  
  /**
   * Validate form fields
   * @param {Object} fields - Object with field values
   * @param {Object} validations - Object with validation rules
   * @returns {Object} Validation result with errors
   */
  export const validateForm = (fields, validations) => {
    const errors = {};
    let isValid = true;
    
    Object.keys(validations).forEach(field => {
      const value = fields[field];
      const rules = validations[field];
      
      // Required field
      if (rules.required && !isNotEmpty(value)) {
        errors[field] = 'This field is required';
        isValid = false;
        return;
      }
      
      // Skip other validations if field is empty and not required
      if (!isNotEmpty(value) && !rules.required) {
        return;
      }
      
      // Email validation
      if (rules.email && !isValidEmail(value)) {
        errors[field] = 'Please enter a valid email address';
        isValid = false;
      }
      
      // Phone validation
      if (rules.phone && !isValidPhone(value, rules.phoneFormat)) {
        errors[field] = 'Please enter a valid phone number';
        isValid = false;
      }
      
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `This field must be at least ${rules.minLength} characters`;
        isValid = false;
      }
      
      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `This field must be no more than ${rules.maxLength} characters`;
        isValid = false;
      }
      
      // Numeric
      if (rules.numeric && !/^\d+$/.test(value)) {
        errors[field] = 'This field must contain only numbers';
        isValid = false;
      }
      
      // Numeric range
      if (rules.min !== undefined && rules.max !== undefined && !isInRange(value, rules.min, rules.max)) {
        errors[field] = `This field must be between ${rules.min} and ${rules.max}`;
        isValid = false;
      }
      
      // Pattern match
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = rules.patternMessage || 'This field format is invalid';
        isValid = false;
      }
      
      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value, fields);
        if (customError) {
          errors[field] = customError;
          isValid = false;
        }
      }
    });
    
    return { isValid, errors };
  };