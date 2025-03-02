/**
 * Format a date as a string with standard date format
 * @param {Date|string} date - The date to format
 * @param {Object} options - Additional options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return dateObj.toLocaleDateString(undefined, mergedOptions);
  };
  
  /**
   * Format a date as a time string
   * @param {Date|string} date - The date to format
   * @param {Object} options - Additional options
   * @returns {string} Formatted time string
   */
  export const formatTime = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return dateObj.toLocaleTimeString(undefined, mergedOptions);
  };
  
  /**
   * Format a date with both date and time
   * @param {Date|string} date - The date to format
   * @param {Object} options - Additional options
   * @returns {string} Formatted date and time string
   */
  export const formatDateTime = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return dateObj.toLocaleString(undefined, mergedOptions);
  };
  
  /**
   * Calculate duration between two dates
   * @param {Date|string} start - Start date
   * @param {Date|string} end - End date (optional, defaults to now)
   * @param {string} format - Output format ('hours', 'minutes', 'seconds', 'formatted')
   * @returns {number|string} Duration in specified format
   */
  export const calculateDuration = (start, end = new Date(), format = 'formatted') => {
    if (!start) return format === 'formatted' ? '0:00:00' : 0;
    
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    
    const durationMs = endDate - startDate;
    
    if (format === 'hours') {
      return durationMs / 3600000;
    }
    
    if (format === 'minutes') {
      return durationMs / 60000;
    }
    
    if (format === 'seconds') {
      return durationMs / 1000;
    }
    
    // Default: formatted as HH:MM:SS
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * Format a duration in milliseconds to a human-readable string
   * @param {number} milliseconds - Duration in milliseconds
   * @param {boolean} verbose - Whether to use verbose format (e.g., '2 hours 3 minutes' vs '2h 3m')
   * @returns {string} Formatted duration string
   */
  export const formatDuration = (milliseconds, verbose = false) => {
    if (!milliseconds || isNaN(milliseconds)) return verbose ? '0 seconds' : '0s';
    
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    
    const parts = [];
    
    if (days > 0) {
      parts.push(verbose ? `${days} ${days === 1 ? 'day' : 'days'}` : `${days}d`);
    }
    
    if (hours > 0) {
      parts.push(verbose ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : `${hours}h`);
    }
    
    if (minutes > 0) {
      parts.push(verbose ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : `${minutes}m`);
    }
    
    if (seconds > 0 || parts.length === 0) {
      parts.push(verbose ? `${seconds} ${seconds === 1 ? 'second' : 'seconds'}` : `${seconds}s`);
    }
    
    return parts.join(verbose ? ' ' : ' ');
  };
  
  /**
   * Check if a date is today
   * @param {Date|string} date - The date to check
   * @returns {boolean} Whether the date is today
   */
  export const isToday = (date) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };
  
  /**
   * Get relative time (e.g., "2 hours ago", "yesterday", etc.)
   * @param {Date|string} date - The date
   * @returns {string} Relative time string
   */
  export const getRelativeTime = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now - dateObj;
    
    // If in the future
    if (diffMs < 0) {
      return 'in the future';
    }
    
    // Less than a minute
    if (diffMs < 60000) {
      return 'just now';
    }
    
    // Less than an hour
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diffMs < 604800000) {
      const days = Math.floor(diffMs / 86400000);
      
      if (days === 1) {
        return 'yesterday';
      }
      
      return `${days} days ago`;
    }
    
    // Less than a month
    if (diffMs < 2592000000) {
      const weeks = Math.floor(diffMs / 604800000);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Less than a year
    if (diffMs < 31536000000) {
      const months = Math.floor(diffMs / 2592000000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // More than a year
    const years = Math.floor(diffMs / 31536000000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };
  
  /**
   * Get the start and end of a time period
   * @param {string} period - The period ('day', 'week', 'month', 'year')
   * @param {Date} date - The reference date (defaults to today)
   * @returns {Object} Object with start and end dates
   */
  export const getTimePeriod = (period, date = new Date()) => {
    const referenceDate = new Date(date);
    
    if (period === 'day') {
      const start = new Date(referenceDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(referenceDate);
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    }
    
    if (period === 'week') {
      const start = new Date(referenceDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    }
    
    if (period === 'month') {
      const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    }
    
    if (period === 'year') {
      const start = new Date(referenceDate.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(referenceDate.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    }
    
    throw new Error('Invalid time period. Use "day", "week", "month", or "year".');
  };
  
  /**
   * Add time to a date
   * @param {Date|string} date - The base date
   * @param {number} amount - Amount to add
   * @param {string} unit - Unit ('seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years')
   * @returns {Date} New date with added time
   */
  export const addTime = (date, amount, unit) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    
    switch (unit) {
      case 'seconds':
        dateObj.setSeconds(dateObj.getSeconds() + amount);
        break;
      case 'minutes':
        dateObj.setMinutes(dateObj.getMinutes() + amount);
        break;
      case 'hours':
        dateObj.setHours(dateObj.getHours() + amount);
        break;
      case 'days':
        dateObj.setDate(dateObj.getDate() + amount);
        break;
      case 'weeks':
        dateObj.setDate(dateObj.getDate() + (amount * 7));
        break;
      case 'months':
        dateObj.setMonth(dateObj.getMonth() + amount);
        break;
      case 'years':
        dateObj.setFullYear(dateObj.getFullYear() + amount);
        break;
      default:
        throw new Error('Invalid time unit. Use "seconds", "minutes", "hours", "days", "weeks", "months", or "years".');
    }
    
    return dateObj;
  };
  
  /**
   * Subtract time from a date
   * @param {Date|string} date - The base date
   * @param {number} amount - Amount to subtract
   * @param {string} unit - Unit ('seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years')
   * @returns {Date} New date with subtracted time
   */
  export const subtractTime = (date, amount, unit) => {
    return addTime(date, -amount, unit);
  };
  
  /**
   * Get readable time from seconds
   * @param {number} totalSeconds - Total seconds
   * @returns {string} Formatted time string (HH:MM:SS)
   */
  export const getTimeFromSeconds = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };