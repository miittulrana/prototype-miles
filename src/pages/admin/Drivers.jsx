import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const Drivers = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            phone,
            created_at,
            vehicles:vehicles(id, vehicle_number, make, model, status)
          `)
          .eq('role', 'driver')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        setDrivers(data || []);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError('Failed to load drivers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDrivers();
  }, []);

  // Add new driver
  const handleAddDriver = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      // Add user to the users table
      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name,
          email,
          phone,
          role: 'driver',
        }]);
      
      if (dbError) throw dbError;
      
      // Clear form and close modal
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setIsAddModalOpen(false);
      
      // Show success message
      setSuccess('Driver added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh driver list
      const { data } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          vehicles:vehicles(id, vehicle_number, make, model, status)
        `)
        .eq('role', 'driver')
        .order('name', { ascending: true });
      
      setDrivers(data || []);
    } catch (err) {
      console.error('Error adding driver:', err);
      setError(err.message || 'Failed to add driver. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update driver
  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    
    if (!selectedDriver) return;
    
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Name, email, and phone are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Update user in the users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          name,
          phone,
        })
        .eq('id', selectedDriver.id);
      
      if (dbError) throw dbError;
      
      // Clear form and close modal
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setIsEditModalOpen(false);
      setSelectedDriver(null);
      
      // Show success message
      setSuccess('Driver updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh driver list
      const { data } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          vehicles:vehicles(id, vehicle_number, make, model, status)
        `)
        .eq('role', 'driver')
        .order('name', { ascending: true });
      
      setDrivers(data || []);
    } catch (err) {
      console.error('Error updating driver:', err);
      setError(err.message || 'Failed to update driver. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete driver
  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update any assigned vehicles to available
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ 
          status: 'available',
          assigned_driver_id: null
        })
        .eq('assigned_driver_id', driverId);
      
      if (vehicleError) throw vehicleError;
      
      // Delete user from users table
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', driverId);
      
      if (dbError) throw dbError;
      
      // Delete user from auth (this might require admin privilege in production)
      // Note: For the prototype, we'll skip this step as it requires more setup
      
      // Show success message
      setSuccess('Driver deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Update driver list
      setDrivers(drivers.filter(driver => driver.id !== driverId));
    } catch (err) {
      console.error('Error deleting driver:', err);
      setError(err.message || 'Failed to delete driver. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit modal with driver data
  const openEditModal = (driver) => {
    setSelectedDriver(driver);
    setName(driver.name);
    setEmail(driver.email);
    setPhone(driver.phone || '');
    setIsEditModalOpen(true);
  };

  // Filter drivers by search term
  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone && driver.phone.includes(searchTerm))
  );

  if (isLoading && drivers.length === 0) {
    return <Loading.Page />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Driver Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon={<i className="ri-user-add-line"></i>}
          >
            Add Driver
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
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Vehicle
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
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No drivers match your search' : 'No drivers found'}
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => {
                  const assignedVehicle = driver.vehicles && driver.vehicles.length > 0 
                    ? driver.vehicles.find(v => v.status === 'in-use' && driver.id)
                    : null;
                    
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                            <i className="ri-user-line text-gray-500 text-lg"></i>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                            <div className="text-sm text-gray-500">Added {new Date(driver.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver.email}</div>
                        <div className="text-sm text-gray-500">{driver.phone || 'No phone number'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignedVehicle ? (
                          <div className="text-sm text-gray-900">
                            {assignedVehicle.vehicle_number} - {assignedVehicle.make} {assignedVehicle.model}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No vehicle assigned</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignedVehicle 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignedVehicle ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(driver)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Add New Driver</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddDriver}>
              <div className="px-6 py-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The driver will use this password for their first login.
                  </p>
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
                  Add Driver
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Driver Modal */}
      {isEditModalOpen && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Edit Driver</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedDriver(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleUpdateDriver}>
              <div className="px-6 py-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    disabled
                    title="Email cannot be changed"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Email address cannot be changed.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="edit-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Reset Password
                  </label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => alert('Password reset functionality would be implemented here')}
                      icon={<i className="ri-lock-unlock-line"></i>}
                    >
                      Send Reset Link
                    </Button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    This will send a password reset link to the driver's email.
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end space-x-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedDriver(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Update Driver
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;