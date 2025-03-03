import { useState, useEffect } from 'react';
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
    recentActivities: [],
    maintenanceActivities: []
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
        
        // Fetch recent activities (time logs only)
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
          
        // Fetch maintenance activities separately
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
          recentActivities: formattedLogs,
          maintenanceActivities: formattedMaintenance
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Stat card component for DRY code
  const StatCard = ({ icon, iconBg, iconColor, title, count, items }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className={`p-4 rounded-full ${iconBg} ${iconColor} mr-4`}>
            <i className={`${icon} text-2xl`}></i>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h2>
            <p className="text-3xl font-bold text-gray-800">{count}</p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          {items.map((item, index) => (
            <div key={index} className="text-center">
              <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Activity item component for DRY code
  const ActivityItem = ({ activity }) => {
    let statusClassName = 'bg-gray-100 text-gray-700';
    if (activity.status === 'completed' || activity.status === 'resolved') {
      statusClassName = 'bg-green-100 text-green-700';
    } else if (activity.status === 'in-progress') {
      statusClassName = 'bg-blue-100 text-blue-700';
    } else if (activity.status === 'sorted') {
      statusClassName = 'bg-yellow-100 text-yellow-700';
    }
    
    return (
      <div className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start">
          <div className="mr-4">
            <p className="font-medium text-gray-800">{activity.title}</p>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <span className="mr-2">{formatDate(activity.timestamp)}</span>
              <span>{formatTime(activity.timestamp)}</span>
            </div>
          </div>
          <span className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold uppercase ${statusClassName}`}>
            {activity.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Vehicle Stats */}
        <StatCard
          icon="ri-car-line"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Total Vehicles"
          count={stats.totalVehicles}
          items={[
            { value: stats.availableVehicles, label: 'Available', color: 'text-green-600' },
            { value: stats.inUseVehicles, label: 'In Use', color: 'text-blue-600' },
            { value: stats.maintenanceVehicles, label: 'Maintenance', color: 'text-yellow-600' }
          ]}
        />
        
        {/* Driver Stats */}
        <StatCard
          icon="ri-user-line"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          title="Total Drivers"
          count={stats.totalDrivers}
          items={[
            { value: stats.activeDrivers, label: 'Active Now', color: 'text-green-600' },
            { value: stats.totalDrivers - stats.activeDrivers, label: 'Inactive', color: 'text-gray-600' }
          ]}
        />
        
        {/* Maintenance Stats */}
        <StatCard
          icon="ri-tools-line"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          title="Maintenance Requests"
          count={stats.maintenanceRequests.total}
          items={[
            { value: stats.maintenanceRequests.sorted, label: 'Sorted', color: 'text-yellow-600' },
            { value: stats.maintenanceRequests.inProgress, label: 'In Progress', color: 'text-blue-600' },
            { value: stats.maintenanceRequests.resolved, label: 'Resolved', color: 'text-green-600' }
          ]}
        />
      </div>
      
      {/* Activity Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Trip Activity */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <i className="ri-time-line text-primary text-lg mr-2"></i>
              <h3 className="font-medium text-gray-800">Recent Trip Activity</h3>
            </div>
            <div className="px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-xs text-gray-600 font-medium">{stats.recentActivities.length} trips</span>
            </div>
          </div>
          <div>
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                  <i className="ri-information-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">No recent trip activity to display</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Maintenance Activity */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <i className="ri-tools-line text-yellow-600 text-lg mr-2"></i>
              <h3 className="font-medium text-gray-800">Recent Maintenance Activity</h3>
            </div>
            <div className="px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-xs text-gray-600 font-medium">{stats.maintenanceActivities.length} reports</span>
            </div>
          </div>
          <div>
            {stats.maintenanceActivities.length > 0 ? (
              stats.maintenanceActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                  <i className="ri-information-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">No recent maintenance activity to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;