import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ 
  isOpen, 
  onToggle,
  isMobile = false 
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [activeMenu, setActiveMenu] = useState(null);

  // Update active menu based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) {
      setActiveMenu('dashboard');
    } else if (path.includes('/admin/drivers')) {
      setActiveMenu('drivers');
    } else if (path.includes('/admin/vehicles')) {
      setActiveMenu('vehicles');
    } else if (path.includes('/admin/logs')) {
      setActiveMenu('logs');
    } else if (path.includes('/admin/maintenance')) {
      setActiveMenu('maintenance');
    } else if (path.includes('/admin/api-keys')) {
      setActiveMenu('api-keys');
    }
  }, [location]);

  // Navigation items
  const navItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard',
      path: '/admin/dashboard', 
      icon: 'ri-dashboard-line',
      description: 'System overview and statistics'
    },
    { 
      id: 'drivers', 
      name: 'Drivers',
      path: '/admin/drivers', 
      icon: 'ri-user-line',
      description: 'Manage driver accounts'
    },
    { 
      id: 'vehicles', 
      name: 'Vehicles',
      path: '/admin/vehicles', 
      icon: 'ri-car-line',
      description: 'Manage vehicle fleet'
    },
    { 
      id: 'logs', 
      name: 'Time Logs',
      path: '/admin/logs', 
      icon: 'ri-time-line',
      description: 'View driver activity logs'
    },
    { 
      id: 'maintenance', 
      name: 'Maintenance',
      path: '/admin/maintenance', 
      icon: 'ri-tools-line',
      description: 'Manage vehicle maintenance requests'
    },
    { 
      id: 'api-keys', 
      name: 'API Keys',
      path: '/admin/api-keys', 
      icon: 'ri-key-line',
      description: 'Manage API integrations'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-secondary text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-secondary-700">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 4.5c-5.524 0-10 4.476-10 10 0 3.937 2.274 7.336 5.576 8.955 0.2-0.371 0.424-0.72 0.663-1.041-2.945-1.408-4.988-4.397-4.988-7.873 0-4.812 3.897-8.709 8.709-8.709s8.709 3.897 8.709 8.709c0 3.476-2.043 6.465-4.988 7.873 0.239 0.321 0.463 0.67 0.663 1.041 3.302-1.618 5.576-5.017 5.576-8.955 0-5.524-4.476-10-10-10z"/>
                <path d="M11.786 22.266c0 1.631 1.079 3.073 2.688 3.792 0.389 0.174 0.801 0.262 1.209 0.262 1.435 0 2.792-0.85 3.362-2.215l0.072-0.172c0.227-0.538 0.342-1.105 0.342-1.691 0-1.631-1.079-3.073-2.688-3.792-0.389-0.174-0.801-0.262-1.209-0.262-1.435 0-2.792 0.85-3.362 2.215l-0.072 0.172c-0.227 0.538-0.342 1.105-0.342 1.691zM16.686 21.034c0.608 0.272 1.018 0.834 1.018 1.232 0 0.2-0.043 0.396-0.129 0.609l-0.072 0.172c-0.23 0.546-0.809 0.953-1.417 0.953-0.162 0-0.326-0.032-0.484-0.102-0.608-0.272-1.018-0.834-1.018-1.232 0-0.2 0.043-0.396 0.129-0.609l0.072-0.172c0.23-0.546 0.809-0.953 1.417-0.953 0.162 0 0.326 0.032 0.484 0.102z"/>
                <path d="M19.572 17.75h-7.144c-2.003 0-3.634 1.476-3.634 3.291s1.63 3.291 3.634 3.291h7.144c2.003 0 3.634-1.476 3.634-3.291s-1.63-3.291-3.634-3.291zM19.572 22.782h-7.144c-1.185 0-2.147-0.783-2.147-1.745s0.962-1.745 2.147-1.745h7.144c1.185 0 2.147 0.783 2.147 1.745s-0.962 1.745-2.147 1.745z"/>
              </svg>
              <span className="ml-2 text-xl font-semibold">VMS Admin</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
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
                  <div>
                    <div>{item.name}</div>
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                </NavLink>
              ))}
            </div>
          </nav>
          
          {/* User info footer */}
          <div className="p-4 border-t border-secondary-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-lg font-semibold">
                    {user?.name ? user.name[0].toUpperCase() : 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;