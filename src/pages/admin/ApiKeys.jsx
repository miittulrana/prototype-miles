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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Keys</h1>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {/* New API key generation form */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
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
              className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate API Key'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Newly generated key display */}
      {showNewKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg mb-6 p-6">
          <h3 className="font-semibold text-green-800 mb-2">
            API Key Generated Successfully
          </h3>
          
          <p className="text-sm text-green-700 mb-4">
            <strong>Important:</strong> Copy this key now. You won't be able to see it again!
          </p>
          
          <div className="bg-white p-3 rounded border border-green-200 flex items-center justify-between mb-4">
            <code className="text-sm break-all">{newGeneratedKey}</code>
            <button 
              onClick={handleCopyKey}
              className="ml-2 p-2 text-green-700 hover:text-green-900"
              title="Copy to Clipboard"
            >
              <i className="ri-clipboard-line"></i>
            </button>
          </div>
          
          <button 
            onClick={() => setShowNewKey(false)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Done
          </button>
        </div>
      )}
      
      {/* API Keys List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-800">Your API Keys</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-4 border-primary"></div>
            <p className="mt-2 text-gray-500">Loading API keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>You don't have any API keys yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {key.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        API Key: ••••••••{key.api_key.slice(-4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used_at 
                        ? new Date(key.last_used_at).toLocaleDateString() 
                        : 'Never used'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
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
      
      {/* Integration Information */}
      <div className="bg-white rounded-lg shadow mt-6 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">How to Use Your API Keys</h2>
        
        <div className="prose max-w-none">
          <p>
            Use these API keys to integrate with your Laravel application. The API allows you to:
          </p>
          
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Retrieve vehicle and driver information</li>
            <li>Access time logs and reports</li>
            <li>Get maintenance request statuses</li>
          </ul>
          
          <h3 className="font-medium mt-4 mb-2">Authentication</h3>
          
          <p>
            Include your API key in the request header:
          </p>
          
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Example using Axios in Laravel
$response = Http::withHeaders([
    'X-API-Key' => 'your-api-key-here',
])->get('https://your-app-url.com/api/vehicles');`}
          </pre>
          
          <h3 className="font-medium mt-4 mb-2">Available Endpoints</h3>
          
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><code>/api/vehicles</code> - List all vehicles</li>
            <li><code>/api/drivers</code> - List all drivers</li>
            <li><code>/api/logs</code> - Access time logs</li>
            <li><code>/api/maintenance</code> - Access maintenance requests</li>
          </ul>
          
          <p className="mt-4">
            For full API documentation, please refer to our documentation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;