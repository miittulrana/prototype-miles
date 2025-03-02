import { forwardRef } from 'react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isFullWidth = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  // Variant styles
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-white focus:ring-primary',
    secondary: 'bg-secondary hover:bg-secondary/90 text-white focus:ring-secondary',
    success: 'bg-success hover:bg-success/90 text-white focus:ring-success',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  // Size styles
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  // Width styles
  const widthClasses = isFullWidth ? 'w-full' : '';
  
  // Base classes that are always applied
  const baseClasses = 'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors inline-flex items-center justify-center';
  
  // Disabled styles
  const disabledClasses = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${widthClasses}
    ${disabledClasses}
    ${className}
  `;

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;