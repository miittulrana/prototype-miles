/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (amount === null || amount === undefined) return '';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  /**
   * Format number with commas
   * @param {number} number - The number to format
   * @param {number} decimals - Number of decimal places (default: 0)
   * @param {string} locale - Locale for formatting (default: en-US)
   * @returns {string} Formatted number string
   */
  export const formatNumber = (number, decimals = 0, locale = 'en-US') => {
    if (number === null || number === undefined) return '';
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  };
  
  /**
   * Format percentage
   * @param {number} value - The value to format (e.g., 0.25 for 25%)
   * @param {number} decimals - Number of decimal places (default: 0)
   * @param {string} locale - Locale for formatting (default: en-US)
   * @returns {string} Formatted percentage string
   */
  export const formatPercentage = (value, decimals = 0, locale = 'en-US') => {
    if (value === null || value === undefined) return '';
    
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };
  
  /**
   * Format a phone number
   * @param {string} phoneNumber - The phone number to format
   * @param {string} format - Format type ('default', 'international', 'national')
   * @returns {string} Formatted phone number
   */
  export const formatPhoneNumber = (phoneNumber, format = 'default') => {
    if (!phoneNumber) return '';
    
    // Remove non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (format === 'international') {
      // Check if phone number starts with country code
      if (cleaned.length === 10) {
        return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (cleaned.length > 10) {
        // Assuming the first 1-3 digits are country code
        const countryCode = cleaned.length === 11 ? '+' + cleaned.slice(0, 1) : '+' + cleaned.slice(0, cleaned.length - 10);
        const remainder = cleaned.slice(cleaned.length - 10);
        return `${countryCode} (${remainder.slice(0, 3)}) ${remainder.slice(3, 6)}-${remainder.slice(6)}`;
      }
    } else if (format === 'national') {
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
    }
    
    // Default format
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // If not a standard format, return as is with hyphens every 3 digits
    return cleaned.replace(/(\d{3})(?=\d)/g, '$1-');
  };
  
  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} Formatted file size string
   */
  export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };
  
  /**
   * Truncate text to a specific length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length (default: 100)
   * @param {string} suffix - String to append after truncation (default: '...')
   * @returns {string} Truncated text
   */
  export const truncateText = (text, length = 100, suffix = '...') => {
    if (!text) return '';
    
    if (text.length <= length) {
      return text;
    }
    
    return text.substring(0, length).trim() + suffix;
  };
  
  /**
   * Format name (first letter uppercase, rest lowercase)
   * @param {string} name - Name to format
   * @returns {string} Formatted name
   */
  export const formatName = (name) => {
    if (!name) return '';
    
    // Split by spaces, hyphens, and apostrophes
    return name
      .trim()
      .split(/[ -']/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };
  
  /**
   * Convert snake_case or kebab-case to Title Case
   * @param {string} text - Text to format
   * @returns {string} Formatted text in Title Case
   */
  export const toTitleCase = (text) => {
    if (!text) return '';
    
    // Replace snake_case and kebab-case with spaces
    return text
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  /**
   * Format an email address
   * @param {string} email - Email to format
   * @param {boolean} hideUser - Whether to hide the user part (default: false)
   * @returns {string} Formatted email
   */
  export const formatEmail = (email, hideUser = false) => {
    if (!email) return '';
    
    if (hideUser) {
      const [username, domain] = email.split('@');
      if (!domain) return email;
      
      if (username.length <= 2) {
        return '*'.repeat(username.length) + '@' + domain;
      }
      
      return username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1) + '@' + domain;
    }
    
    return email.toLowerCase();
  };
  
  /**
   * Format vehicle status
   * @param {string} status - Vehicle status
   * @returns {string} Formatted status
   */
  export const formatVehicleStatus = (status) => {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'available':
        return 'Available';
      case 'in-use':
      case 'inuse':
        return 'In Use';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  /**
   * Format maintenance request status
   * @param {string} status - Request status
   * @returns {string} Formatted status
   */
  export const formatMaintenanceStatus = (status) => {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'sorted':
        return 'Sorted';
      case 'in-progress':
      case 'inprogress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  /**
   * Format severity level
   * @param {string} severity - Severity level
   * @returns {string} Formatted severity
   */
  export const formatSeverity = (severity) => {
    if (!severity) return '';
    
    switch (severity.toLowerCase()) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'critical':
        return 'Critical';
      default:
        return severity.charAt(0).toUpperCase() + severity.slice(1);
    }
  };
  
  /**
   * Format plate number
   * @param {string} plateNumber - Vehicle plate number
   * @returns {string} Formatted plate number
   */
  export const formatPlateNumber = (plateNumber) => {
    if (!plateNumber) return '';
    
    // Remove spaces and convert to uppercase
    return plateNumber.replace(/\s/g, '').toUpperCase();
  };
  
  /**
   * Create initials from name
   * @param {string} name - Full name
   * @param {number} maxInitials - Maximum number of initials (default: 2)
   * @returns {string} Initials
   */
  export const getInitials = (name, maxInitials = 2) => {
    if (!name) return '';
    
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, maxInitials)
      .join('');
  };