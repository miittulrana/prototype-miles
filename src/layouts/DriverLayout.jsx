import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { timeLogs } from '../services/supabase';
import mainLogo from '../assets/mainlogo.png'; // Import the logo

const DriverLayout = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if driver has an active time log
  useEffect(() => {
    const checkActiveTimeLog = async () => {
      if (user) {
        const { data } = await timeLogs.getActiveForDriver(user.id);
        setActiveTimeLog(data);
      }
    };

    checkActiveTimeLog();
  }, [user, location.pathname]);

  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/login');
    }
  };

  // Get current route name for title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('vehicles')) return 'Select Vehicle';
    if (path.includes('agreement')) return 'Sign Agreement';
    if (path.includes('punch-in')) return 'Punch In';
    if (path.includes('punch-out')) return 'Punch Out';
    if (path.includes('maintenance')) return 'Maintenance Report';
    return 'Driver Panel';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-secondary text-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b border-secondary-700 px-4">
          <img src={mainLogo} alt="Logo" className="h-10" />
        </div>
        
        <div className="flex flex-col justify-between flex-1 overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-1">
            <NavLink
              to="/driver/vehicles"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                }`
              }
            >
              <i className="ri-car-line text-lg leading-none mr-3"></i>
              <span>Select Vehicle</span>
            </NavLink>
            
            {activeTimeLog && (
              <NavLink
                to="/driver/punch-out"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                  }`
                }
              >
                <i className="ri-logout-box-line text-lg leading-none mr-3"></i>
                <span>Punch Out</span>
              </NavLink>
            )}
            
            <NavLink
              to="/driver/maintenance"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                }`
              }
            >
              <i className="ri-tools-line text-lg leading-none mr-3"></i>
              <span>Report Maintenance</span>
            </NavLink>
          </nav>
          
          {/* Logout button at bottom of sidebar */}
          <div className="p-4 border-t border-secondary-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-md text-red-300 hover:bg-secondary-800 transition-colors"
            >
              <i className="ri-logout-box-line text-lg leading-none mr-3"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header and content */}
      <div className="md:pl-64 flex flex-col flex-1 w-full">
        {/* Top navbar - mobile only */}
        <header className="bg-secondary text-white shadow-md md:hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-16">
              {/* Logo centered */}
              <div className="flex items-center">
                <img src={mainLogo} alt="Logo" className="h-8" />
              </div>
            </div>
          </div>
        </header>

        {/* Add page title below logo for mobile */}
        <div className="bg-white md:hidden">
          <h1 className="text-xl font-bold text-center py-3">
            {getPageTitle()}
          </h1>
        </div>

        {/* Desktop header */}
        <header className="hidden md:block bg-white shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
            <div className="flex items-center">
              <span className="mr-3 text-sm font-medium text-gray-700">
                {user?.email || 'Driver'}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>

        {/* Bottom navigation - visible on mobile */}
        <nav className="bg-secondary text-white md:hidden">
          <div className="grid grid-cols-4 h-16">
            <NavLink
              to="/driver/vehicles"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center ${
                  isActive ? 'bg-primary' : ''
                }`
              }
            >
              <i className="ri-car-line text-xl"></i>
              <span className="text-xs mt-1">Vehicles</span>
            </NavLink>
            
            {activeTimeLog ? (
              <NavLink
                to="/driver/punch-out"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center ${
                    isActive ? 'bg-primary' : ''
                  }`
                }
              >
                <i className="ri-logout-box-line text-xl"></i>
                <span className="text-xs mt-1">Punch Out</span>
              </NavLink>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-50">
                <i className="ri-logout-box-line text-xl"></i>
                <span className="text-xs mt-1">Punch Out</span>
              </div>
            )}
            
            <NavLink
              to="/driver/maintenance"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center ${
                  isActive ? 'bg-primary' : ''
                }`
              }
            >
              <i className="ri-tools-line text-lg"></i>
              <span className="text-xs mt-1">Maintenance</span>
            </NavLink>
            
            {/* Added Logout button to footer */}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center text-red-300"
            >
              <i className="ri-logout-circle-r-line text-lg"></i>
              <span className="text-xs mt-1">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default DriverLayout;