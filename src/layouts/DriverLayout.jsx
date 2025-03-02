import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { timeLogs } from '../services/supabase';

const DriverLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Top navbar */}
      <header className="bg-secondary text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="h-8" />
              <span className="ml-2 text-lg font-semibold">VMS</span>
            </div>

            {/* Page title - center */}
            <h1 className="text-xl font-bold hidden md:block">
              {getPageTitle()}
            </h1>

            {/* Mobile menu button */}
            <button
              type="button"
              className="p-2 rounded-md text-white hover:bg-secondary-700 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-2xl`}></i>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="bg-secondary text-white py-2 px-4 md:hidden">
          <nav className="space-y-1">
            <NavLink
              to="/driver/vehicles"
              className={({ isActive }) =>
                `block py-2 px-3 rounded-md ${
                  isActive ? 'bg-primary' : 'hover:bg-secondary-700'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Select Vehicle
            </NavLink>
            {activeTimeLog && (
              <NavLink
                to="/driver/punch-out"
                className={({ isActive }) =>
                  `block py-2 px-3 rounded-md ${
                    isActive ? 'bg-primary' : 'hover:bg-secondary-700'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Punch Out
              </NavLink>
            )}
            <NavLink
              to="/driver/maintenance"
              className={({ isActive }) =>
                `block py-2 px-3 rounded-md ${
                  isActive ? 'bg-primary' : 'hover:bg-secondary-700'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Report Maintenance
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full text-left block py-2 px-3 rounded-md text-red-300 hover:bg-secondary-700"
            >
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom navigation - visible on mobile */}
      <nav className="bg-secondary text-white md:hidden">
        <div className="grid grid-cols-3 h-16">
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
            <i className="ri-tools-line text-xl"></i>
            <span className="text-xs mt-1">Maintenance</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default DriverLayout;