import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { apiKeys } from '../../services/supabase';

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState('');
  const { user } = useAuthStore();

  // Fetch existing API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await apiKeys.getAllForUser(user.id);
        
        if (error) throw error;
        
        setKeys(data || []);
      } catch (err) {
        console.error('Error fetching API keys:', err);
        setError('Failed to load API keys. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiKeys();
  }, [user]);

  // Generate a new API key
  const handleGenerateKey = async (e) => {
    e.preventDefault();
    
    if (!newKeyDescription.trim()) {
      setError('Please provide a description for the API key.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { apiKey, error } = await apiKeys.generate(user.id, newKeyDescription);
      
      if (error) throw error;
      
      // Success - show the new key
      setNewGeneratedKey(apiKey);
      setShowNewKey(true);
      setNewKeyDescription('');
      
      // Refresh the list of keys
      const { data } = await apiKeys.getAllForUser(user.id);
      setKeys(data || []);
    } catch (err) {
      console.error('Error generating API key:', err);
      setError('Failed to generate API key. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete an API key
  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await apiKeys.delete(keyId);
      
      if (error) throw error;
      
      // Remove from local state
      setKeys(keys.filter(key => key.id !== keyId));
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key. Please try again.');
    }
  };

  // Copy API key to clipboard
  const handleCopyKey = () => {
    navigator.clipboard.writeText(newGeneratedKey);
    alert('API key copied to clipboard!');
  };

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">API Keys</h1>
        <p className="text-sm text-gray-600">
          Securely integrate your applications with our API
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm mb-6">
          <div className="flex items-start">
            <i className="ri-error-warning-line text-xl mr-2"></i>
            <div>
              <strong className="font-bold">Error!</strong>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* New API key generation form */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 mb-6 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center">
              <i className="ri-key-line text-primary mr-2"></i>
              <h2 className="font-semibold text-gray-800">Generate New API Key</h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleGenerateKey}>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Key Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Laravel Integration"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Add a description to help you identify this key later.
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 inline-flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="ri-add-line mr-1"></i> Generate API Key
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {/* Newly generated key display */}
          {showNewKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg shadow-md mb-6 p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="ri-check-line text-green-600"></i>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-green-800">
                    API Key Generated Successfully
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    <strong>Important:</strong> Copy this key now. You won't be able to see it again!
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-md border border-green-200 flex items-center justify-between mb-4">
                <code className="text-sm text-gray-800 break-all font-mono">{newGeneratedKey}</code>
                <button 
                  onClick={handleCopyKey}
                  className="ml-3 p-2 text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                  title="Copy to Clipboard"
                >
                  <i className="ri-clipboard-line"></i>
                </button>
              </div>
              
              <button 
                onClick={() => setShowNewKey(false)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          )}
          
          {/* API Keys List */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center">
                <i className="ri-key-2-line text-primary mr-2"></i>
                <h2 className="font-semibold text-gray-800">Your API Keys</h2>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {keys.length} {keys.length === 1 ? 'key' : 'keys'}
              </span>
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-primary border-r-4 border-r-transparent"></div>
                <p className="mt-3 text-gray-500">Loading API keys...</p>
              </div>
            ) : keys.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                  <i className="ri-key-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">You don't have any API keys yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Generate your first key using the form above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {keys.map((key) => (
                      <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {key.description}
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600 font-mono">
                              •••••••••••••{key.api_key.slice(-4)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(key.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(key.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {key.last_used_at ? (
                            <>
                              <div className="text-sm text-gray-900">
                                {new Date(key.last_used_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(key.last_used_at).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                              Never used
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full text-sm transition-colors inline-flex items-center"
                          >
                            <i className="ri-delete-bin-line mr-1"></i>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Documentation Sidebar */}
        <div className="lg:col-span-1">
          {/* Integration Information */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 sticky top-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center">
              <i className="ri-book-open-line text-primary mr-2"></i>
              <h2 className="font-semibold text-gray-800">API Documentation</h2>
            </div>
            
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Using Your API Keys</h3>
                
                <p className="text-gray-600 mb-4">
                  These API keys allow secure access to the Vehicle Management System API. You can use them to:
                </p>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <i className="ri-checkbox-circle-line text-green-600 mt-0.5 mr-2"></i>
                    <span>Access vehicle and driver data</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-checkbox-circle-line text-green-600 mt-0.5 mr-2"></i>
                    <span>Retrieve time logs and reports</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-checkbox-circle-line text-green-600 mt-0.5 mr-2"></i>
                    <span>Manage maintenance requests</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-checkbox-circle-line text-green-600 mt-0.5 mr-2"></i>
                    <span>Generate usage analytics</span>
                  </li>
                </ul>
                
                <div className="mb-6">
                  <h4 className="text-base font-medium text-gray-800 mb-2">Authentication</h4>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Include your API key in the request header:</p>
                    <pre className="bg-gray-800 text-gray-200 p-3 rounded-md text-xs overflow-x-auto">
{`// Example using Axios
axios.get('https://api.vehicle-mgmt.com/v1/vehicles', {
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
})`}
                    </pre>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-base font-medium text-gray-800 mb-2">Available Endpoints</h4>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                      <div className="flex items-center mb-1">
                        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-md mr-2">GET</span>
                        <code className="text-sm text-blue-700">/api/v1/vehicles</code>
                      </div>
                      <p className="text-xs text-gray-600">List all vehicles with status and location</p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-md border border-green-100">
                      <div className="flex items-center mb-1">
                        <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-md mr-2">GET</span>
                        <code className="text-sm text-green-700">/api/v1/drivers</code>
                      </div>
                      <p className="text-xs text-gray-600">List all drivers with their current status</p>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-md border border-purple-100">
                      <div className="flex items-center mb-1">
                        <span className="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-md mr-2">GET</span>
                        <code className="text-sm text-purple-700">/api/v1/logs</code>
                      </div>
                      <p className="text-xs text-gray-600">Access time logs with filtering options</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                      <div className="flex items-center mb-1">
                        <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-md mr-2">GET</span>
                        <code className="text-sm text-yellow-700">/api/v1/maintenance</code>
                      </div>
                      <p className="text-xs text-gray-600">Access maintenance requests and status</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-base font-medium text-gray-800 mb-2">Rate Limits</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    API requests are limited to:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• 100 requests per minute</li>
                    <li>• 5,000 requests per day</li>
                  </ul>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-xs text-blue-800">
                    <i className="ri-information-line mr-1"></i>
                    For full API documentation, visit our <a href="#" className="underline font-medium">Salt Script Portal</a>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;