import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import useAuthStore from '../../store/authStore';

const MaintenanceForm = ({
  vehicles = [],
  onSubmit,
  isLoading = false,
  className = '',
  ...props
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user } = useAuthStore();
  
  // Reset success state when form values change
  useEffect(() => {
    if (success) {
      setSuccess(false);
    }
  }, [selectedVehicle, description, severity]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }
    
    if (!description.trim()) {
      setError('Please describe the issue');
      return;
    }
    
    // Create maintenance request data
    const requestData = {
      driver_id: user?.id,
      vehicle_id: selectedVehicle,
      description,
      severity,
      status: 'sorted', // Initial status
    };
    
    // Submit form
    if (onSubmit) {
      try {
        await onSubmit(requestData);
        
        // Reset form
        setSelectedVehicle('');
        setDescription('');
        setSeverity('medium');
        setSuccess(true);
        
        // Reset success after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } catch (err) {
        setError(err.message || 'Failed to submit maintenance request. Please try again.');
      }
    }
  };

  return (
    <Card className={className} {...props}>
      <Card.Header title="Report Maintenance Issue" />
      
      <Card.Body>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">Maintenance request submitted successfully!</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <Input.Select
            label="Select Vehicle"
            id="vehicle"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            required
          >
            <option value="">Select a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </Input.Select>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('low')}
                className={`py-2 px-4 rounded-md text-sm font-medium border ${
                  severity === 'low'
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setSeverity('medium')}
                className={`py-2 px-4 rounded-md text-sm font-medium border ${
                  severity === 'medium'
                    ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setSeverity('high')}
                className={`py-2 px-4 rounded-md text-sm font-medium border ${
                  severity === 'high'
                    ? 'bg-red-100 border-red-500 text-red-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                High
              </button>
            </div>
          </div>
          
          <Input.Textarea
            label="Describe the Issue"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about the issue..."
            required
            rows={5}
          />
          
          <Button
            type="submit"
            isFullWidth
            variant="primary"
            isLoading={isLoading}
            icon={<i className="ri-send-plane-line"></i>}
          >
            Submit Maintenance Request
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
};

// Compact version of the maintenance form
MaintenanceForm.Compact = ({
  vehicles = [],
  onSubmit,
  isLoading = false,
  className = '',
  ...props
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }
    
    if (!description.trim()) {
      setError('Please describe the issue');
      return;
    }
    
    // Create maintenance request data
    const requestData = {
      driver_id: user?.id,
      vehicle_id: selectedVehicle,
      description,
      severity,
      status: 'sorted', // Initial status
    };
    
    // Submit form
    if (onSubmit) {
      onSubmit(requestData);
    }
  };

  return (
    <div className={className} {...props}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-sm mb-2">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="compactVehicle" className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle
          </label>
          <select
            id="compactVehicle"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          >
            <option value="">Select a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Severity
          </label>
          <div className="flex space-x-2">
            <label 
              className={`flex-1 flex items-center justify-center py-1 border rounded-md text-xs cursor-pointer ${
                severity === 'low'
                  ? 'bg-green-100 border-green-500 text-green-800'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <input 
                type="radio" 
                className="sr-only" 
                name="severity" 
                value="low" 
                checked={severity === 'low'} 
                onChange={() => setSeverity('low')} 
              />
              Low
            </label>
            <label 
              className={`flex-1 flex items-center justify-center py-1 border rounded-md text-xs cursor-pointer ${
                severity === 'medium'
                  ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <input 
                type="radio" 
                className="sr-only" 
                name="severity" 
                value="medium" 
                checked={severity === 'medium'} 
                onChange={() => setSeverity('medium')} 
              />
              Medium
            </label>
            <label 
              className={`flex-1 flex items-center justify-center py-1 border rounded-md text-xs cursor-pointer ${
                severity === 'high'
                  ? 'bg-red-100 border-red-500 text-red-800'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <input 
                type="radio" 
                className="sr-only" 
                name="severity" 
                value="high" 
                checked={severity === 'high'} 
                onChange={() => setSeverity('high')} 
              />
              High
            </label>
          </div>
        </div>
        
        <div>
          <label htmlFor="compactDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Description
          </label>
          <textarea
            id="compactDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            rows={3}
            placeholder="Describe the maintenance issue..."
            required
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </div>
  );
};

// Past maintenance request card
MaintenanceForm.RequestCard = ({
  id,
  vehicleNumber,
  vehicleMake,
  vehicleModel,
  description,
  severity,
  status,
  createdAt,
  resolvedAt,
  className = '',
  ...props
}) => {
  // Get status badge
  const getStatusBadge = () => {
    switch (status.toLowerCase()) {
      case 'sorted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Sorted
          </span>
        );
      case 'in-progress':
      case 'inprogress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Resolved
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
  
  // Get severity badge
  const getSeverityBadge = () => {
    switch (severity.toLowerCase()) {
      case 'low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Low
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Medium
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            High
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {severity}
          </span>
        );
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`p-4 border rounded-lg ${className}`} {...props}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">
            {vehicleNumber} - {vehicleMake} {vehicleModel}
          </h4>
          <p className="text-sm text-gray-500 mb-1">
            Reported on {formatDate(createdAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          {getStatusBadge()}
          {getSeverityBadge()}
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-2 line-clamp-2">
        {description}
      </p>
      
      {resolvedAt && (
        <p className="text-xs text-gray-500">
          Resolved on {formatDate(resolvedAt)}
        </p>
      )}
    </div>
  );
};

export default MaintenanceForm;