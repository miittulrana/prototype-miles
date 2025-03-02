import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import { isNotEmpty } from '../../utils/validation';

const ApiKeyGenerator = ({ 
  onGenerate,
  isLoading = false,
  className = '',
  ...props
}) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate description
    if (!isNotEmpty(description)) {
      setError('Please provide a description for the API key.');
      return;
    }
    
    // Generate API key
    if (onGenerate) {
      onGenerate(description);
    }
  };

  return (
    <Card className={className} {...props}>
      <Card.Header title="Generate New API Key" />
      <Card.Body>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <Input
            label="Key Description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Laravel Integration, Production API, etc."
            helper="Add a description to help you identify this key later."
            required
          />
          
          <Button
            type="submit"
            isFullWidth
            variant="primary"
            isLoading={isLoading}
            icon={<i className="ri-key-line"></i>}
          >
            Generate API Key
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
};

// Component to display newly generated API key
ApiKeyGenerator.Generated = ({
  apiKey,
  onDone,
  onCopy,
  className = '',
  ...props
}) => {
  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      if (onCopy) {
        onCopy();
      }
    }
  };
  
  return (
    <Card className={`bg-green-50 border border-green-200 ${className}`} {...props}>
      <Card.Body>
        <h3 className="font-semibold text-green-800 mb-2">
          API Key Generated Successfully
        </h3>
        
        <p className="text-sm text-green-700 mb-4">
          <strong>Important:</strong> Copy this key now. You won't be able to see it again!
        </p>
        
        <div className="bg-white p-3 rounded border border-green-200 flex items-center justify-between mb-4">
          <code className="text-sm break-all">{apiKey}</code>
          <button 
            onClick={handleCopy}
            className="ml-2 p-2 text-green-700 hover:text-green-900"
            title="Copy to Clipboard"
          >
            <i className="ri-clipboard-line"></i>
          </button>
        </div>
        
        <Button 
          onClick={onDone}
          variant="success"
        >
          Done
        </Button>
      </Card.Body>
    </Card>
  );
};

// Component to display API key list item
ApiKeyGenerator.KeyItem = ({
  id,
  description,
  key,
  createdAt,
  lastUsed,
  onDelete,
  className = '',
  ...props
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      if (onDelete) {
        await onDelete(id);
      }
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Never used';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div 
      className={`border-b last:border-b-0 py-4 px-6 hover:bg-gray-50 ${className}`}
      {...props}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-900 mb-1">{description}</div>
          <div className="text-sm text-gray-500 mb-2">
            API Key: ••••••••{key.slice(-4)}
          </div>
          <div className="flex text-xs text-gray-500">
            <div className="mr-4">
              <span className="font-medium">Created:</span> {formatDate(createdAt)}
            </div>
            <div>
              <span className="font-medium">Last used:</span> {formatDate(lastUsed)}
            </div>
          </div>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="text-red-600 hover:text-red-900 border-red-300 hover:border-red-500"
          >
            <i className="ri-delete-bin-line mr-1"></i> Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// Component to display API keys list
ApiKeyGenerator.KeysList = ({
  keys = [],
  onDelete,
  isLoading = false,
  className = '',
  ...props
}) => {
  return (
    <Card className={className} {...props}>
      <Card.Header title="Your API Keys" />
      
      {isLoading ? (
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-4 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading API keys...</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <div className="text-4xl mb-2">🔑</div>
          <p className="mb-1">You don't have any API keys yet.</p>
          <p className="text-sm">Generate a key above to integrate with external services.</p>
        </div>
      ) : (
        <div>
          {keys.map((key) => (
            <ApiKeyGenerator.KeyItem
              key={key.id}
              id={key.id}
              description={key.description}
              key={key.api_key}
              createdAt={key.created_at}
              lastUsed={key.last_used_at}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

// Component to display API key documentation
ApiKeyGenerator.Documentation = ({ className = '', ...props }) => {
  return (
    <Card className={className} {...props}>
      <Card.Header title="How to Use Your API Keys" />
      <Card.Body>
        <div className="prose max-w-none">
          <p>
            Use these API keys to integrate with your external applications. The API allows you to:
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
          
          <h3 className="font-medium mt-4 mb-2">Response Format</h3>
          
          <p>
            All API responses follow this standard format:
          </p>
          
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": [...],
  "meta": {
    "total": 25,
    "page": 1,
    "per_page": 10
  }
}`}
          </pre>
          
          <h3 className="font-medium mt-4 mb-2">Error Handling</h3>
          
          <p>
            If an error occurs, the response will follow this format:
          </p>
          
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "Invalid API key"
  }
}`}
          </pre>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="ri-information-line text-blue-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  For detailed API documentation, please refer to our developer portal or contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ApiKeyGenerator;