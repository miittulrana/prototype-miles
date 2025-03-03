import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import mainLogo from '../assets/mainlogo.png'; // Import the logo at the top

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/login');
    }
  };

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'ri-dashboard-line' },
    { name: 'Drivers', path: '/admin/drivers', icon: 'ri-user-line' },
    { name: 'Vehicles', path: '/admin/vehicles', icon: 'ri-car-line' },
    { name: 'Time Logs', path: '/admin/logs', icon: 'ri-time-line' },
    { name: 'Maintenance', path: '/admin/maintenance', icon: 'ri-tools-line' },
    { name: 'API Keys', path: '/admin/api-keys', icon: 'ri-key-line' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-secondary text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-16 border-b border-secondary-700">
          {/* Title only */}
          <h1 className="text-xl font-semibold">Admin Panel</h1>
        </div>

        <nav className="mt-5 px-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                  }`
                }
              >
                <i className={`${item.icon} text-lg leading-none mr-3`}></i>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        
        {/* Logo at the very bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 mt-auto">
          <img src={mainLogo} alt="Logo" className="h-10" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile menu button */}
            <button
              type="button"
              className="text-gray-500 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <i className="ri-menu-line text-2xl"></i>
            </button>

            {/* User dropdown */}
            <div className="ml-auto flex items-center">
              <div className="relative">
                <div className="flex items-center">
                  <span className="hidden md:inline-block mr-3 text-sm font-medium text-gray-700">
                    {user?.email || 'Admin'}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    <i className="ri-logout-box-line mr-2"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;