import React from 'react';
import Loading from './Loading';

const Card = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header component
Card.Header = ({
  children,
  title,
  subtitle,
  icon,
  actions,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  ...props
}) => {
  return (
    <div
      className={`px-6 py-4 border-b ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && (
            <div className="mr-3 text-gray-500">{icon}</div>
          )}
          <div>
            {title && (
              <h3 className={`font-medium text-gray-800 ${titleClassName}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`text-sm text-gray-500 ${subtitleClassName}`}>
                {subtitle}
              </p>
            )}
            {!title && !subtitle && children}
          </div>
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Card Body component
Card.Body = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Footer component
Card.Footer = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-6 py-4 border-t ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Loading state wrapper
Card.Loading = ({
  children,
  isLoading = false,
  className = '',
  ...props
}) => {
  return (
    <Loading.Overlay isLoading={isLoading}>
      <Card className={className} {...props}>
        {children}
      </Card>
    </Loading.Overlay>
  );
};

// Stats Card variant
Card.Stats = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  trendLabel,
  className = '',
  ...props
}) => {
  // Calculate trend color
  const getTrendColor = () => {
    if (!trend) return '';
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? (
      <i className="ri-arrow-up-line mr-1"></i>
    ) : (
      <i className="ri-arrow-down-line mr-1"></i>
    );
  };

  return (
    <Card className={className} {...props}>
      <Card.Body>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-500">{title}</h4>
          {icon && (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-end">
          <div className="text-2xl font-bold">{value}</div>
          {trend && trendValue && (
            <div className={`ml-2 flex items-center text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              {trendValue}
            </div>
          )}
        </div>
        {trendLabel && (
          <div className="text-xs text-gray-500 mt-1">{trendLabel}</div>
        )}
      </Card.Body>
    </Card>
  );
};

// Card with tabs
Card.Tabs = ({
  tabs,
  activeTab,
  setActiveTab,
  children,
  className = '',
  ...props
}) => {
  return (
    <Card className={className} {...props}>
      <div className="border-b">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        {children}
      </div>
    </Card>
  );
};

// Empty state card
Card.Empty = ({
  icon,
  title,
  description,
  action,
  className = '',
  ...props
}) => {
  return (
    <Card className={className} {...props}>
      <Card.Body>
        <div className="text-center py-8">
          {icon && (
            <div className="text-4xl text-gray-400 mb-3">{icon}</div>
          )}
          {title && (
            <h3 className="text-lg font-medium text-gray-800 mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-gray-500 mb-4">{description}</p>
          )}
          {action && (
            <div>{action}</div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default Card;