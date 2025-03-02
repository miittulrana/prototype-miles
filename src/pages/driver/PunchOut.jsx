import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, timeLogs, vehicles } from '../../services/supabase';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const PunchOut = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeLog, setActiveLog] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPunching, setIsPunching] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [workDuration, setWorkDuration] = useState('');
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const videoRef = useRef(null);
  
  // Fetch active time log
  useEffect(() => {
    const fetchActiveLog = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get active time log
        const { data: logData, error: logError } = await timeLogs.getActiveForDriver(user.id);
        
        if (logError) throw logError;
        
        if (!logData) {
          // No active log, redirect to vehicles page
          navigate('/driver/vehicles');
          return;
        }
        
        setActiveLog(logData);
        
        // Get vehicle data
        const { data: vehicleData, error: vehicleError } = await vehicles.getById(logData.vehicle_id);
        
        if (vehicleError) throw vehicleError;
        
        if (!vehicleData) {
          throw new Error('Vehicle not found');
        }
        
        setVehicle(vehicleData);
        
        // Calculate work duration
        const punchInTime = new Date(logData.punch_in);
        const currentTime = new Date();
        const durationMs = currentTime - punchInTime;
        
        // Format duration as HH:MM:SS
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        
        const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setWorkDuration(formattedDuration);
        
        // Update work duration every second
        const timer = setInterval(() => {
          const currentTime = new Date();
          const durationMs = currentTime - punchInTime;
          
          const hours = Math.floor(durationMs / 3600000);
          const minutes = Math.floor((durationMs % 3600000) / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          
          const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          setWorkDuration(formattedDuration);
        }, 1000);
        
        return () => clearInterval(timer);
      } catch (err) {
        console.error('Error fetching active log:', err);
        setError('Failed to load active task. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActiveLog();
  }, [user, navigate]);

  // Handle punch out
  const handlePunchOut = async () => {
    if (!videoUploaded) {
      document.getElementById('videoModal').classList.remove('hidden');
      return;
    }
    
    if (!activeLog) return;
    
    setIsPunching(true);
    setError(null);
    
    try {
      // Update time log with punch out time
      const { error } = await timeLogs.punchOut(activeLog.id);
      
      if (error) throw error;
      
      // Update vehicle status back to available
      await vehicles.updateStatus(activeLog.vehicle_id, 'available', null);
      
      // Show success message and redirect to home
      setTimeout(() => {
        navigate('/driver');
      }, 2000);
    } catch (err) {
      console.error('Error punching out:', err);
      setError('Failed to punch out. Please try again.');
      setIsPunching(false);
    }
  };

  // Request camera access and start recording
  const startVideoRecording = async () => {
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      // Create media recorder
      const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
      setMediaRecorder(recorder);
      setStream(mediaStream);
      
      const chunks = [];
      
      // Listen for data
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // Handle recording complete
      recorder.onstop = async () => {
        // Create a video blob
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        try {
          // Upload to Supabase storage
          const videoFileName = `vehicle-${activeLog.vehicle_id}-post-${Date.now()}.webm`;
          
          // Upload with progress tracking
          const { error } = await supabase.storage
            .from('videos')
            .upload(videoFileName, blob, {
              onUploadProgress: (progress) => {
                const percentage = Math.round((progress.loaded / progress.total) * 100);
                setUploadProgress(percentage);
              }
            });
          
          if (error) throw error;
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(videoFileName);
          
          // Create video record
          const { error: recordError } = await supabase
            .from('videos')
            .insert([{
              driver_id: user.id,
              vehicle_id: activeLog.vehicle_id,
              time_log_id: activeLog.id,
              type: 'post',
              video_url: publicUrl,
            }]);
          
          if (recordError) throw recordError;
          
          setVideoUploaded(true);
        } catch (err) {
          console.error('Error uploading video:', err);
          alert('Failed to upload video. Please try again.');
          setUploadProgress(0);
        }
      };
      
      // Start recording
      recorder.start();
      setIsRecording(true);
      
      // Set time limit (15 seconds)
      const timerId = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 15) {
            clearInterval(timerId);
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Failed to access camera. Please check your device permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setRecordingTime(0);
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 md:hidden">Punch Out</h2>
      
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
                    In Use
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Punch In Time:</span>
                <span className="font-medium">
                  {new Date(activeLog?.punch_in).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Video Check:</span>
                <span className={`font-medium ${videoUploaded ? 'text-success' : 'text-yellow-600'}`}>
                  {videoUploaded ? 'Completed' : 'Required'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Punch Out Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">Punch Out</h3>
          </div>
          
          <div className="card-body">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-1">
                Total Working Time
              </div>
              <div className="text-3xl font-bold mb-1">
                {workDuration}
              </div>
              <div className="text-xs text-gray-500">
                Since {new Date(activeLog?.punch_in).toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border mb-6">
              <p className="text-gray-700 text-sm">
                Before punching out, please:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li>Record a final 15-second video of the vehicle condition.</li>
                <li>Make sure the vehicle is parked safely and properly.</li>
                <li>Report any issues or incidents that occurred during usage.</li>
              </ul>
            </div>
            
            <Button
              isFullWidth
              variant={videoUploaded ? "primary" : "outline"}
              size="lg"
              isLoading={isPunching}
              onClick={handlePunchOut}
              icon={<i className="ri-logout-box-line"></i>}
              disabled={!videoUploaded && isPunching}
            >
              {videoUploaded ? "Punch Out Now" : "Record Video & Punch Out"}
            </Button>
            
            {isPunching && videoUploaded && (
              <div className="mt-4 text-center text-sm text-success">
                <i className="ri-check-line"></i> Successfully punched out. Redirecting...
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Recording Modal */}
      <div id="videoModal" className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg">Record Final Vehicle Inspection</h3>
            {!isRecording && !videoUploaded && uploadProgress === 0 && (
              <button 
                onClick={() => document.getElementById('videoModal').classList.add('hidden')}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            )}
          </div>
          
          <div className="p-6">
            {!videoUploaded ? (
              <>
                <div className="bg-black rounded-md overflow-hidden aspect-video mb-4">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  ></video>
                </div>
                
                {isRecording ? (
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      Recording... {recordingTime}/15s
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-600 transition-all duration-1000"
                        style={{ width: `${(recordingTime / 15) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : uploadProgress > 0 && uploadProgress < 100 ? (
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-primary mb-2">
                      Uploading... {uploadProgress}%
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : uploadProgress === 100 ? (
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-success mb-2">
                      Upload Complete!
                    </div>
                    <p className="text-gray-600">Your video has been uploaded successfully.</p>
                  </div>
                ) : (
                  <div className="text-center mb-4">
                    <p className="text-gray-600 mb-2">
                      Record a 15-second video showing the vehicle's final condition.
                    </p>
                    <p className="text-sm text-gray-500">
                      Walk around the vehicle and capture its current state.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-center">
                  {!isRecording && uploadProgress === 0 ? (
                    <Button
                      variant="primary"
                      onClick={startVideoRecording}
                      icon={<i className="ri-record-circle-line"></i>}
                    >
                      Start Recording
                    </Button>
                  ) : isRecording ? (
                    <Button
                      variant="danger"
                      onClick={stopRecording}
                      icon={<i className="ri-stop-circle-line"></i>}
                    >
                      Stop Recording
                    </Button>
                  ) : uploadProgress === 100 ? (
                    <Button
                      variant="success"
                      onClick={() => {
                        document.getElementById('videoModal').classList.add('hidden');
                        setVideoUploaded(true);
                      }}
                    >
                      Continue to Punch Out
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-5xl text-success mb-4">
                  <i className="ri-check-line"></i>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Video Uploaded Successfully</h4>
                <p className="text-gray-600">
                  Your final vehicle inspection video has been recorded and saved.
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => {
                    document.getElementById('videoModal').classList.add('hidden');
                    handlePunchOut();
                  }}
                >
                  Continue to Punch Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchOut;