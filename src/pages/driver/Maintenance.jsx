import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const Maintenance = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [previousRequests, setPreviousRequests] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [success, setSuccess] = useState(false);

  // Fetch vehicles and previous maintenance requests
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('vehicle_number', { ascending: true });
        
        if (vehiclesError) throw vehiclesError;
        
        setVehicles(vehiclesData || []);
        
        // Fetch previous maintenance requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('maintenance_requests')
          .select(`
            id, 
            description, 
            status, 
            created_at,
            vehicles(vehicle_number, make, model)
          `)
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false });
        
        if (requestsError) throw requestsError;
        
        setPreviousRequests(requestsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Submit maintenance request
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }
    
    if (!description.trim()) {
      setError('Please describe the issue');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit maintenance request
      const { error } = await supabase
        .from('maintenance_requests')
        .insert([{
          driver_id: user.id,
          vehicle_id: selectedVehicle,
          description,
          severity,
          status: 'sorted', // Initial status
        }]);
      
      if (error) throw error;
      
      // Clear form and show success message
      setSelectedVehicle('');
      setDescription('');
      setSeverity('medium');
      setSuccess(true);
      
      // Fetch updated requests
      const { data: requestsData } = await supabase
        .from('maintenance_requests')
        .select(`
          id, 
          description, 
          status, 
          created_at,
          vehicles(vehicle_number, make, model)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });
      
      setPreviousRequests(requestsData || []);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting maintenance request:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'sorted':
        return (
          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            Sorted
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return <Loading.Page />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 md:hidden">Maintenance Report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Request Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">Report Maintenance Issue</h3>
          </div>
          
          <div className="card-body">
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
              <div className="mb-4">
                <label 
                  htmlFor="vehicle" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select Vehicle
                </label>
                <select
                  id="vehicle"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="input"
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
              
              <div className="mb-4">
                <label 
                  htmlFor="severity" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
              
              <div className="mb-4">
                <label 
                  htmlFor="description" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Describe the Issue
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[120px]"
                  placeholder="Please provide details about the issue..."
                  required
                ></textarea>
              </div>
              
              <Button
                type="submit"
                isFullWidth
                variant="primary"
                isLoading={isSubmitting}
                icon={<i className="ri-send-plane-line"></i>}
              >
                Submit Maintenance Request
              </Button>
            </form>
          </div>
        </div>
        
        {/* Previous Reports */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">Previous Maintenance Reports</h3>
          </div>
          
          <div className="p-0">
            {previousRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">🔧</div>
                <p>You haven't submitted any maintenance requests yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {previousRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">
                          {request.vehicles?.vehicle_number} - {request.vehicles?.make} {request.vehicles?.model}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleString()}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-gray-700 text-sm">
                      {request.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;