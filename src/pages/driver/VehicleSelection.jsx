import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicles } from '../../services/supabase';

const VehicleSelection = () => {
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await vehicles.getAvailable();
        
        if (error) throw error;
        
        setAvailableVehicles(data || []);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Failed to load vehicles. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVehicles();
  }, []);

  const handleSelectVehicle = (vehicleId) => {
    navigate(`/driver/agreement/${vehicleId}`);
  };

  // If loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
      </div>
    );
  }

  // If error
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // If no vehicles available
  if (availableVehicles.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🚗</div>
        <h2 className="text-2xl font-bold mb-2">No Vehicles Available</h2>
        <p className="text-gray-600">There are currently no vehicles available for selection.</p>
        <p className="text-gray-600 mt-2">Please check back later or contact an administrator.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 md:hidden">Select Vehicle</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableVehicles.map((vehicle) => (
          <div 
            key={vehicle.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="h-40 bg-gray-200 flex items-center justify-center">
              <i className="ri-car-line text-6xl text-gray-400"></i>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{vehicle.vehicle_number}</h3>
                <span className="bg-green-100 text-success text-xs px-2 py-1 rounded-full font-medium">
                  Available
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">
                {vehicle.make} {vehicle.model}
              </p>
              
              <button
                onClick={() => handleSelectVehicle(vehicle.id)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
              >
                Select Vehicle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleSelection;