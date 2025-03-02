import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    inUseVehicles: 0,
    maintenanceVehicles: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    maintenanceRequests: {
      total: 0,
      sorted: 0,
      inProgress: 0,
      resolved: 0
    },
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch vehicle statistics
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('*');
          
        const availableVehicles = vehicles?.filter(v => v.status === 'available') || [];
        const inUseVehicles = vehicles?.filter(v => v.status === 'in-use') || [];
        const maintenanceVehicles = vehicles?.filter(v => v.status === 'maintenance') || [];
        
        // Fetch driver statistics
        const { data: drivers } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'driver');
          
        const { data: activeLogs } = await supabase
          .from('time_logs')
          .select('driver_id')
          .is('punch_out', null);
          
        const activeDriverIds = [...new Set(activeLogs?.map(log => log.driver_id) || [])];
        
        // Fetch maintenance requests
        const { data: maintenanceRequests } = await supabase
          .from('maintenance_requests')
          .select('*')
          .order('created_at', { ascending: false });
          
        const sorted = maintenanceRequests?.filter(r => r.status === 'sorted') || [];
        const inProgress = maintenanceRequests?.filter(r => r.status === 'in-progress') || [];
        const resolved = maintenanceRequests?.filter(r => r.status === 'resolved') || [];
        
        // Fetch recent activities (combined from logs and maintenance)
        const { data: recentLogs } = await supabase
          .from('time_logs')
          .select(`
            id,
            driver_id,
            vehicle_id,
            punch_in,
            punch_out,
            users:driver_id (name),
            vehicles:vehicle_id (vehicle_number)
          `)
          .order('punch_in', { ascending: false })
          .limit(5);
          
        const { data: recentMaintenance } = await supabase
          .from('maintenance_requests')
          .select(`
            id,
            driver_id,
            vehicle_id,
            created_at,
            status,
            users:driver_id (name),
            vehicles:vehicle_id (vehicle_number)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
          
        // Format data for recent activities
        const formattedLogs = recentLogs?.map(log => ({
          id: `log-${log.id}`,
          type: 'time_log',
          title: `${log.users?.name || 'Driver'} ${log.punch_out ? 'completed' : 'started'} a trip with vehicle ${log.vehicles?.vehicle_number || 'Unknown'}`,
          timestamp: log.punch_out || log.punch_in,
          status: log.punch_out ? 'completed' : 'in-progress'
        })) || [];
        
        const formattedMaintenance = recentMaintenance?.map(request => ({
          id: `maint-${request.id}`,
          type: 'maintenance',
          title: `${request.users?.name || 'Driver'} reported an issue with vehicle ${request.vehicles?.vehicle_number || 'Unknown'}`,
          timestamp: request.created_at,
          status: request.status
        })) || [];
        
        // Combine and sort activities
        const recentActivities = [...formattedLogs, ...formattedMaintenance]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
          
        // Update state
        setStats({
          totalVehicles: vehicles?.length || 0,
          availableVehicles: availableVehicles.length,
          inUseVehicles: inUseVehicles.length,
          maintenanceVehicles: maintenanceVehicles.length,
          totalDrivers: drivers?.length || 0,
          activeDrivers: activeDriverIds.length,
          maintenanceRequests: {
            total: maintenanceRequests?.length || 0,
            sorted: sorted.length,
            inProgress: inProgress.length,
            resolved: resolved.length
          },
          recentActivities
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Vehicle Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <i className="ri-car-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Vehicles</p>
              <p className="text-2xl font-bold">{stats.totalVehicles}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-green-500 font-medium">{stats.availableVehicles}</span> Available
            </div>
            <div>
              <span className="text-blue-500 font-medium">{stats.inUseVehicles}</span> In Use
            </div>
            <div>
              <span className="text-yellow-500 font-medium">{stats.maintenanceVehicles}</span> Maintenance
            </div>
          </div>
        </div>
        
        {/* Driver Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <i className="ri-user-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Drivers</p>
              <p className="text-2xl font-bold">{stats.totalDrivers}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-green-500 font-medium">{stats.activeDrivers}</span> Active Now
            </div>
            <div>
              <span className="text-gray-500 font-medium">{stats.totalDrivers - stats.activeDrivers}</span> Inactive
            </div>
          </div>
        </div>
        
        {/* Maintenance Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
              <i className="ri-tools-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Maintenance Requests</p>
              <p className="text-2xl font-bold">{stats.maintenanceRequests.total}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-yellow-500 font-medium">{stats.maintenanceRequests.sorted}</span> Sorted
            </div>
            <div>
              <span className="text-blue-500 font-medium">{stats.maintenanceRequests.inProgress}</span> In Progress
            </div>
            <div>
              <span className="text-green-500 font-medium">{stats.maintenanceRequests.resolved}</span> Resolved
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              to="/admin/drivers" 
              className="block py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              <i className="ri-user-add-line mr-2"></i> Add New Driver
            </Link>
            <Link 
              to="/admin/vehicles" 
              className="block py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              <i className="ri-car-line mr-2"></i> Add New Vehicle
            </Link>
            <Link 
              to="/admin/maintenance" 
              className="block py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              <i className="ri-tools-line mr-2"></i> View Maintenance Requests
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-medium text-gray-700">Recent Activity</h3>
        </div>
        <div className="divide-y">
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' || activity.status === 'resolved' 
                      ? 'bg-green-100 text-green-800' 
                      : activity.status === 'in-progress' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No recent activity to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;