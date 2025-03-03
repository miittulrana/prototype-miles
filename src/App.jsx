import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layouts
import DriverLayout from './layouts/DriverLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Login from './pages/Login';

// Driver Pages
import VehicleSelection from './pages/driver/VehicleSelection';
import Agreement from './pages/driver/Agreement';
import PunchIn from './pages/driver/PunchIn';
import PunchOut from './pages/driver/PunchOut';
import DriverMaintenance from './pages/driver/Maintenance';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Drivers from './pages/admin/Drivers';
import Vehicles from './pages/admin/Vehicles';
import Logs from './pages/admin/Logs';
import AdminMaintenance from './pages/admin/Maintenance';
import ApiKeys from './pages/admin/ApiKeys';

// PDF Viewer
import PdfViewer from './components/pdf/PdfViewer';

function App() {
  const { checkAuthState, user, role, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Protected route component
  const ProtectedRoute = ({ children, allowedRole }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" />;
    }

    if (allowedRole && role !== allowedRole) {
      return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/driver/vehicles'} />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Driver Routes */}
        <Route path="/driver" element={
          <ProtectedRoute allowedRole="driver">
            <DriverLayout />
          </ProtectedRoute>
        }>
          <Route path="vehicles" element={<VehicleSelection />} />
          <Route path="agreement/:vehicleId" element={<Agreement />} />
          <Route path="punch-in/:vehicleId" element={<PunchIn />} />
          <Route path="punch-out" element={<PunchOut />} />
          <Route path="maintenance" element={<DriverMaintenance />} />
          <Route index element={<Navigate to="vehicles" />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="logs" element={<Logs />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route index element={<Navigate to="dashboard" />} />
        </Route>
        
        {/* PDF Viewer Route */}
        <Route path="/pdf/:pdfId" element={<PdfViewer />} />
        
        {/* Redirect root to login or appropriate dashboard */}
        <Route path="/" element={
          user ? (
            <Navigate to={role === 'admin' ? '/admin/dashboard' : '/driver/vehicles'} />
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;