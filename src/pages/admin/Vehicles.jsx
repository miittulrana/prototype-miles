import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const Vehicles = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form states
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState('available');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vehicles and drivers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select(`
            id,
            vehicle_number,
            make,
            model,
            status,
            assigned_driver_id,
            created_at,
            drivers:users(id, name, email)
          `)
          .order('vehicle_number', { ascending: true });
        
        if (vehiclesError) throw vehiclesError;
        
        setVehicles(vehiclesData || []);
        
        // Fetch all drivers
        const { data: driversData, error: driversError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('role', 'driver')
          .order('name', { ascending: true });
        
        if (driversError) throw driversError;
        
        setDrivers(driversData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Add new vehicle
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    if (!vehicleNumber.trim() || !make.trim() || !model.trim()) {
      setError('Vehicle number, make, and model are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create new vehicle
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          vehicle_number: vehicleNumber,
          make,
          model,
          status,
          assigned_driver_id: assignedDriverId || null,
        }])
        .select();
      
      if (error) throw error;
      
      // Clear form and close modal
      setVehicleNumber('');
      setMake('');
      setModel('');
      setStatus('available');
      setAssignedDriverId('');
      setIsAddModalOpen(false);
      
      // Show success message
      setSuccess('Vehicle added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh vehicle list
      const { data: updatedVehicles } = await supabase
        .from('vehicles')
        .select(`
          id,
          vehicle_number,
          make,
          model,
          status,
          assigned_driver_id,
          created_at,
          drivers:users(id, name, email)
        `)
        .order('vehicle_number', { ascending: true });
      
      setVehicles(updatedVehicles || []);
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setError(err.message || 'Failed to add vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update vehicle
  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicle) return;
    
    if (!vehicleNumber.trim() || !make.trim() || !model.trim()) {
      setError('Vehicle number, make, and model are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Update vehicle
      const { error } = await supabase
        .from('vehicles')
        .update({
          vehicle_number: vehicleNumber,
          make,
          model,
          status,
          assigned_driver_id: assignedDriverId || null,
        })
        .eq('id', selectedVehicle.id);
      
      if (error) throw error;
      
      // Clear form and close modal
      setVehicleNumber('');
      setMake('');
      setModel('');
      setStatus('available');
      setAssignedDriverId('');
      setIsEditModalOpen(false);
      setSelectedVehicle(null);
      
      // Show success message
      setSuccess('Vehicle updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh vehicle list
      const { data: updatedVehicles } = await supabase
        .from('vehicles')
        .select(`
          id,
          vehicle_number,
          make,
          model,
          status,
          assigned_driver_id,
          created_at,
          drivers:users(id, name, email)
        `)
        .order('vehicle_number', { ascending: true });
      
      setVehicles(updatedVehicles || []);
    } catch (err) {
      console.error('Error updating vehicle:', err);
      setError(err.message || 'Failed to update vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete vehicle
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
      
      if (error) throw error;
      
      // Show success message
      setSuccess('Vehicle deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Update vehicle list
      setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setError(err.message || 'Failed to delete vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit modal with vehicle data
  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleNumber(vehicle.vehicle_number);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setStatus(vehicle.status);
    setAssignedDriverId(vehicle.assigned_driver_id || '');
    setIsEditModalOpen(true);
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Available
          </span>
        );
      case 'in-use':
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

  // Filter vehicles by search term and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.drivers && vehicle.drivers.name && vehicle.drivers.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading && vehicles.length === 0) {
    return <Loading.Page />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Vehicle Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon={<i className="ri-add-line"></i>}
          >
            Add Vehicle
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('available')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'available'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setStatusFilter('in-use')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'in-use'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}
        >
          In Use
        </button>
        <button
          onClick={() => setStatusFilter('maintenance')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'maintenance'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          Maintenance
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'No vehicles match your search' : 'No vehicles found'}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                          <i className="ri-car-line text-gray-500 text-lg"></i>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vehicle.vehicle_number}</div>
                          <div className="text-sm text-gray-500">Added {new Date(vehicle.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vehicle.make}</div>
                      <div className="text-sm text-gray-500">{vehicle.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.drivers ? (
                        <div className="text-sm text-gray-900">
                          {vehicle.drivers.name}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Not assigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vehicle.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(vehicle)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Add New Vehicle</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddVehicle}>
              <div className="px-6 py-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="vehicle-number" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    id="vehicle-number"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                    Make
                  </label>
                  <input
                    type="text"
                    id="make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input"
                  >
                    <option value="available">Available</option>
                    <option value="in-use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="driver" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Driver
                  </label>
                  <select
                    id="driver"
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className="input"
                  >
                    <option value="">Not Assigned</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end space-x-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Add Vehicle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Vehicle Modal */}
      {isEditModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Edit Vehicle</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedVehicle(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleUpdateVehicle}>
              <div className="px-6 py-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="edit-vehicle-number" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    id="edit-vehicle-number"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-make" className="block text-sm font-medium text-gray-700 mb-1">
                    Make
                  </label>
                  <input
                    type="text"
                    id="edit-make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-model" className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    id="edit-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input"
                  >
                    <option value="available">Available</option>
                    <option value="in-use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-driver" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Driver
                  </label>
                  <select
                    id="edit-driver"
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className="input"
                  >
                    <option value="">Not Assigned</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end space-x-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedVehicle(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Update Vehicle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;