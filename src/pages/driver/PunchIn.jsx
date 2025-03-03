import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, vehicles, timeLogs } from '../../services/supabase';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const PunchIn = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [error, setError] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch vehicle, agreement, and inspection data
  useEffect(() => {
    const fetchData = async () => {
      if (!vehicleId || !user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get vehicle data
        const { data: vehicleData, error: vehicleError } = await vehicles.getById(vehicleId);
        
        if (vehicleError) throw vehicleError;
        
        if (!vehicleData) {
          throw new Error('Vehicle not found');
        }
        
        setVehicle(vehicleData);
        
        // Check if there's a signed agreement for this vehicle
        const { data: agreementData, error: agreementError } = await supabase
          .from('agreements')
          .select('*')
          .eq('driver_id', user.id)
          .eq('vehicle_id', vehicleId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (agreementError && agreementError.code !== 'PGRST116') {
          // PGRST116 is the error code for "no rows returned" which we can ignore
          throw agreementError;
        }
        
        setAgreement(agreementData);
        
        // Check if there's an inspection record for this vehicle
        const { data: inspectionData, error: inspectionError } = await supabase
          .from('vehicle_inspections')
          .select('*')
          .eq('driver_id', user.id)
          .eq('vehicle_id', vehicleId)
          .eq('inspection_type', 'pre')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (inspectionError && inspectionError.code !== 'PGRST116') {
          throw inspectionError;
        }
        
        setInspection(inspectionData);
        
        // Check if driver already has an active time log
        const { data: activeLog, error: logError } = await timeLogs.getActiveForDriver(user.id);
        
        if (logError && logError.code !== 'PGRST116') {
          throw logError;
        }
        
        if (activeLog) {
          // Driver already has an active log, redirect to punch out
          navigate('/driver/punch-out');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [vehicleId, user, navigate]);

  // Handle punch in
  const handlePunchIn = async () => {
    if (!user || !vehicleId) return;
    
    setIsPunching(true);
    setError(null);
    
    try {
      // Create time log record
      const { data, error } = await timeLogs.punchIn(user.id, vehicleId);
      
      if (error) throw error;
      
      // Show success message then redirect to home
      setTimeout(() => {
        navigate('/driver');
      }, 2000);
    } catch (err) {
      console.error('Error punching in:', err);
      setError('Failed to punch in. Please try again.');
      setIsPunching(false);
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Format date as Month DD, YYYY
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return <Loading.Page />;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          onClick={() => navigate('/driver/vehicles')}
        >
          Go Back
        </button>
      </div>
    );
  }

  // If no agreement found or no inspection, redirect to agreement page
  if (!agreement || !inspection) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-2xl font-bold mb-2">Agreement and Photos Required</h2>
        <p className="text-gray-600 mb-4">You need to sign an agreement and take inspection photos before punching in.</p>
        <Button
          variant="primary"
          onClick={() => navigate(`/driver/agreement/${vehicleId}`)}
        >
          Complete Requirements
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 md:hidden">Punch In</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">Vehicle Information</h3>
          </div>
          
          <div className="card-body">
            <div className="flex items-start mb-4">
              <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center mr-4">
                <i className="ri-car-line text-3xl text-gray-400"></i>
              </div>
              
              <div>
                <h4 className="text-lg font-bold">{vehicle?.vehicle_number}</h4>
                <p className="text-gray-600">{vehicle?.make} {vehicle?.model}</p>
                <div className="mt-1">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Selected
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Agreement Signed:</span>
                <span className="font-medium">
                  {new Date(agreement.signed_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Inspection Photos:</span>
                <span className="font-medium text-success">Completed ({inspection.image_count})</span>
              </div>
              
              {inspection.pdf_url && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Inspection Report:</span>
                  <Link to={`/pdf/${inspection.pdf_url.split('/').pop()}`} className="text-primary hover:underline">
                    View PDF
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Punch In Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">Punch In</h3>
          </div>
          
          <div className="card-body">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold mb-1">
                {formatTime(currentDateTime)}
              </div>
              <div className="text-gray-500">
                {formatDate(currentDateTime)}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border mb-6">
              <p className="text-gray-700 text-sm">
                By punching in, you confirm that:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li>You have inspected the vehicle and taken photos.</li>
                <li>The vehicle is in good working condition.</li>
                <li>You will follow all traffic rules and safety guidelines.</li>
                <li>You will report any issues or incidents immediately.</li>
              </ul>
            </div>
            
            <Button
              isFullWidth
              variant="primary"
              size="lg"
              isLoading={isPunching}
              onClick={handlePunchIn}
              icon={<i className="ri-login-box-line"></i>}
            >
              Punch In Now
            </Button>
            
            {isPunching && (
              <div className="mt-4 text-center text-sm text-success">
                <i className="ri-check-line"></i> Successfully punched in. Redirecting...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchIn;