import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import mainLogo from '../assets/mainlogo.png'; // Import the logo at the top

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    const { success, role, error } = await login(email, password);
    
    if (success) {
      navigate(role === 'admin' ? '/admin/dashboard' : '/driver/vehicles');
    } else {
      setError(error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Side - Branding & Info */}
      <div className="md:w-1/2 bg-secondary flex flex-col justify-center p-8 md:p-16">
        <div className="mb-8 flex items-center justify-center md:justify-start">
          <img src={mainLogo} alt="Company Logo" className="h-16" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Vehicle Management System
        </h1>
        
        <p className="text-gray-200 text-lg mb-6">
          Manage your fleet efficiently with our comprehensive vehicle tracking solution.
        </p>
        
        <div className="hidden md:block mt-8">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-2">
              <i className="ri-car-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-white font-medium">Fleet Management</h3>
              <p className="text-gray-200 text-sm">Track and manage all your vehicles in real-time</p>
            </div>
          </div>
          
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-2">
              <i className="ri-user-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-white font-medium">Driver Management</h3>
              <p className="text-gray-200 text-sm">Monitor driver activity and performance</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-2">
              <i className="ri-tools-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-white font-medium">Maintenance Tracking</h3>
              <p className="text-gray-200 text-sm">Stay on top of vehicle maintenance schedules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-600 mt-1">Sign in to your account</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md flex items-start">
                <i className="ri-error-warning-line text-red-500 mr-3 mt-0.5"></i>
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-gray-400"></i>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary-dark transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="ri-login-box-line mr-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Having trouble logging in? Contact your system administrator</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Salt Script Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;