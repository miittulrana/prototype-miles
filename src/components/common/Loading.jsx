import React from 'react';

const Loading = ({ 
  size = 'md', 
  color = 'primary',
  withText = false,
  text = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  // Color variants
  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    success: 'border-success',
    white: 'border-white'
  };

  const spinnerClasses = `
    inline-block rounded-full animate-spin 
    border-t-transparent
    ${sizeClasses[size] || sizeClasses.md}
    ${colorClasses[color] || colorClasses.primary}
    ${className}
  `;

  const content = (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen' : ''}`}>
      <div className={spinnerClasses}></div>
      {withText && (
        <p className={`mt-2 text-sm font-medium ${color === 'white' ? 'text-white' : 'text-gray-700'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Loading states for common components
Loading.Page = () => (
  <div className="flex justify-center items-center h-64">
    <Loading size="lg" withText={true} />
  </div>
);

Loading.Overlay = ({ children, isLoading, ...props }) => {
  if (!isLoading) return children;
  
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
        <Loading {...props} />
      </div>
    </div>
  );
};

Loading.Skeleton = ({ height = 'h-6', width = 'w-full', rounded = 'rounded-md', className = '' }) => (
  <div 
    className={`animate-pulse bg-gray-200 ${height} ${width} ${rounded} ${className}`}
  ></div>
);

export default Loading;