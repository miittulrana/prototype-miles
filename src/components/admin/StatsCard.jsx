import React from 'react';

const StatsCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  onClick,
  className = '',
  ...props
}) => {
  // Get change color based on type
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get change icon based on type
  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <i className="ri-arrow-up-line mr-1"></i>;
      case 'negative':
        return <i className="ri-arrow-down-line mr-1"></i>;
      case 'warning':
        return <i className="ri-alert-line mr-1"></i>;
      case 'info':
        return <i className="ri-information-line mr-1"></i>;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {icon && (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {change && (
        <div className={`flex items-center text-sm ${getChangeColor()}`}>
          {getChangeIcon()}
          {change}
        </div>
      )}
    </div>
  );
};

// Variant with details
StatsCard.WithDetails = ({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  details = [],
  onClick,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-500">{title}</div>
          {icon && (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`flex items-center text-sm ${
            changeType === 'positive' ? 'text-green-500' : 
            changeType === 'negative' ? 'text-red-500' : 
            changeType === 'warning' ? 'text-yellow-500' : 
            'text-gray-500'
          }`}>
            {changeType === 'positive' && <i className="ri-arrow-up-line mr-1"></i>}
            {changeType === 'negative' && <i className="ri-arrow-down-line mr-1"></i>}
            {change}
          </div>
        )}
      </div>
      
      {details.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <div className="grid grid-cols-2 gap-4">
            {details.map((detail, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-500">{detail.label}</div>
                <div className="font-semibold">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Progress variant
StatsCard.Progress = ({
  title,
  value,
  total,
  icon,
  percentage,
  color = 'primary',
  onClick,
  className = '',
  ...props
}) => {
  // Calculate percentage if not provided
  const calculatedPercentage = percentage || (total ? Math.round((value / total) * 100) : 0);
  
  // Get color classes
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-secondary';
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-primary';
    }
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {icon && (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between mb-2">
        <div className="text-2xl font-bold">{value}</div>
        {total && (
          <div className="text-gray-500">
            of {total} ({calculatedPercentage}%)
          </div>
        )}
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColorClasses()}`}
          style={{ width: `${calculatedPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Group of stats cards
StatsCard.Group = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default StatsCard;