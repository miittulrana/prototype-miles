import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const Maintenance = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch maintenance requests
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query
        let query = supabase
          .from('maintenance_requests')
          .select(`
            id,
            description,
            severity,
            status,
            created_at,
            resolved_at,
            drivers:users(id, name, email),
            vehicles(id, vehicle_number, make, model)
          `)
          .order('created_at', { ascending: false });
        
        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching maintenance requests:', err);
        setError('Failed to load maintenance requests. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [statusFilter]);

  // Update request status
  const updateRequestStatus = async (requestId, newStatus) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updates = {
        status: newStatus,
      };
      
      // If marking as resolved, add timestamp
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : req.resolved_at } 
          : req
      ));
      
      // Show success message
      setSuccess(`Request status updated to ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Close modal if open
      if (isModalOpen) {
        setIsModalOpen(false);
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error('Error updating request status:', err);
      setError(err.message || 'Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // View request details
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'sorted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Sorted
          </span>
        );
      case 'in-progress':
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
  const getSeverityBadge = (severity) => {
    switch (severity) {
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

  // Filter requests by search term
  const filteredRequests = requests.filter(request => {
    const driverName = request.drivers?.name || '';
    const vehicleNumber = request.vehicles?.vehicle_number || '';
    const description = request.description || '';
    
    return (
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading && requests.length === 0) {
    return <Loading.Page />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Maintenance Requests</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
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
      
      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Requests
        </button>
        <button
          onClick={() => setStatusFilter('sorted')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'sorted'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          Sorted
        </button>
        <button
          onClick={() => setStatusFilter('in-progress')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusFilter === 'resolved'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          Resolved
        </button>
      </div>
      
      {/* Requests list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'No maintenance requests match your search or filter' 
              : 'No maintenance requests found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.vehicles?.vehicle_number || 'Unknown Vehicle'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.vehicles ? `${request.vehicles.make} ${request.vehicles.model}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.drivers?.name || 'Unknown Driver'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.drivers?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {request.description.length > 50 
                              ? `${request.description.substring(0, 50)}...` 
                              : request.description}
                          </div>
                          {getSeverityBadge(request.severity)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      
                      {request.status !== 'resolved' && (
                        <div className="inline-block relative group">
                          <button className="text-gray-600 hover:text-gray-900">
                            <i className="ri-more-2-fill"></i>
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                            {request.status === 'sorted' && (
                              <button
                                onClick={() => updateRequestStatus(request.id, 'in-progress')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Mark as In Progress
                              </button>
                            )}
                            
                            {request.status === 'in-progress' && (
                              <button
                                onClick={() => updateRequestStatus(request.id, 'resolved')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Mark as Resolved
                              </button>
                            )}
                            
                            {request.status === 'sorted' && (
                              <button
                                onClick={() => updateRequestStatus(request.id, 'resolved')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Mark as Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Request Detail Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Maintenance Request Details</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Request ID</h4>
                  <p className="text-sm text-gray-700">{selectedRequest.id}</p>
                </div>
                <div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h4>
                  <p className="text-base font-medium">
                    {selectedRequest.vehicles?.vehicle_number || 'Unknown Vehicle'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedRequest.vehicles 
                      ? `${selectedRequest.vehicles.make} ${selectedRequest.vehicles.model}` 
                      : ''
                    }
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Reported By</h4>
                  <p className="text-base font-medium">
                    {selectedRequest.drivers?.name || 'Unknown Driver'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedRequest.drivers?.email || ''}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Date Reported</h4>
                  <p className="text-base">
                    {new Date(selectedRequest.created_at).toLocaleDateString()} at {new Date(selectedRequest.created_at).toLocaleTimeString()}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Severity</h4>
                  <div>{getSeverityBadge(selectedRequest.severity)}</div>
                </div>
                
                {selectedRequest.status === 'resolved' && selectedRequest.resolved_at && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Resolved On</h4>
                    <p className="text-base">
                      {new Date(selectedRequest.resolved_at).toLocaleDateString()} at {new Date(selectedRequest.resolved_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Issue Description</h4>
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedRequest.description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-between">
              <div>
                {selectedRequest.status !== 'resolved' && (
                  <div className="flex space-x-2">
                    {selectedRequest.status === 'sorted' && (
                      <Button
                        variant="outline"
                        onClick={() => updateRequestStatus(selectedRequest.id, 'in-progress')}
                      >
                        Mark as In Progress
                      </Button>
                    )}
                    
                    <Button
                      variant="primary"
                      onClick={() => updateRequestStatus(selectedRequest.id, 'resolved')}
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedRequest(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;