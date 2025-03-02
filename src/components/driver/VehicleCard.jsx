import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

const VehicleCard = ({
  id,
  vehicleNumber,
  make,
  model,
  status = 'available',
  onSelect,
  className = '',
  ...props
}) => {
  // Get status badge classes
  const getStatusBadge = () => {
    switch (status.toLowerCase()) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Available
          </span>
        );
      case 'in-use':
      case 'inuse':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Use
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Check if vehicle is available
  const isAvailable = status.toLowerCase() === 'available';

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}
      {...props}
    >
      <div className="h-40 bg-gray-200 flex items-center justify-center">
        <i className="ri-car-line text-6xl text-gray-400"></i>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold">{vehicleNumber}</h3>
          {getStatusBadge()}
        </div>
        
        <p className="text-gray-600 mb-4">
          {make} {model}
        </p>
        
        {onSelect ? (
          <Button
            onClick={() => onSelect(id)}
            isFullWidth
            variant={isAvailable ? "primary" : "outline"}
            disabled={!isAvailable}
          >
            {isAvailable ? "Select Vehicle" : "Unavailable"}
          </Button>
        ) : (
          <Link to={`/driver/agreement/${id}`}>
            <Button
              isFullWidth
              variant={isAvailable ? "primary" : "outline"}
              disabled={!isAvailable}
            >
              {isAvailable ? "Select Vehicle" : "Unavailable"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

// Skeleton loading state for vehicle card
VehicleCard.Skeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="h-40 bg-gray-200 animate-pulse"></div>
    
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      
      <div className="h-4 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
      
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

// Grid layout for vehicle cards
VehicleCard.Grid = ({ children, isLoading = false, count = 6, className = '', ...props }) => {
  // If loading, show skeleton cards
  if (isLoading) {
    return (
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
        {...props}
      >
        {[...Array(count)].map((_, i) => (
          <VehicleCard.Skeleton key={i} />
        ))}
      </div>
    );
  }
  
  // If no children, show empty state
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🚗</div>
        <h2 className="text-2xl font-bold mb-2">No Vehicles Available</h2>
        <p className="text-gray-600">There are currently no vehicles available for selection.</p>
        <p className="text-gray-600 mt-2">Please check back later or contact an administrator.</p>
      </div>
    );
  }
  
  // Otherwise, show the grid with children
  return (
    <div 
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Vehicle details variant
VehicleCard.Details = ({
  id,
  vehicleNumber,
  make,
  model,
  status = 'available',
  assignedDriver,
  lastUsed,
  maintenanceStatus,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      {...props}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center mr-4">
            <i className="ri-car-line text-3xl text-gray-400"></i>
          </div>
          
          <div>
            <h3 className="text-xl font-bold">{vehicleNumber}</h3>
            <p className="text-gray-600">{make} {model}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            {status.toLowerCase() === 'available' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Available
              </span>
            ) : status.toLowerCase() === 'in-use' || status.toLowerCase() === 'inuse' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                In Use
              </span>
            ) : status.toLowerCase() === 'maintenance' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Maintenance
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {status}
              </span>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Assigned Driver</p>
            <p className="font-medium">
              {assignedDriver || 'Not assigned'}
            </p>
          </div>
          
          {lastUsed && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Used</p>
              <p className="font-medium">
                {typeof lastUsed === 'string' ? lastUsed : new Date(lastUsed).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {maintenanceStatus && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Maintenance Status</p>
              {maintenanceStatus.toLowerCase() === 'none' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  No Issues
                </span>
              ) : maintenanceStatus.toLowerCase() === 'pending' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              ) : maintenanceStatus.toLowerCase() === 'in-progress' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  In Progress
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {maintenanceStatus}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;