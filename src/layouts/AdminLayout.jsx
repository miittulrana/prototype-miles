import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
    <div className="flex h-screen bg-gray-100">
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
        <div className="flex items-center justify-center h-16 px-4 border-b border-secondary-700">
          <img src="/logo.svg" alt="Logo" className="h-8" />
          <span className="ml-2 text-xl font-semibold">Admin Panel</span>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                  }`
                }
              >
                <i className={`${item.icon} mr-3 text-lg`}></i>
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Mobile menu button */}
            <button
              type="button"
              className="text-gray-500 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="ri-menu-line text-2xl"></i>
            </button>

            {/* User dropdown */}
            <div className="ml-auto flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-700">
                    {user?.email || 'Admin'}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="ml-2 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;