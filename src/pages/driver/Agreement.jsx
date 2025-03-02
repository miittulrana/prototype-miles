import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, vehicles } from '../../services/supabase';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const Agreement = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDone, setRecordingDone] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await vehicles.getById(vehicleId);
        
        if (error) throw error;
        
        if (!data) {
          throw new Error('Vehicle not found');
        }
        
        setVehicle(data);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError(err.message || 'Failed to load vehicle data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVehicle();
  }, [vehicleId]);

  // Generate agreement text
  const generateAgreementText = () => {
    if (!vehicle || !user) return '';
    
    const today = new Date().toLocaleDateString();
    
    return `VEHICLE USAGE AGREEMENT

Date: ${today}

THIS AGREEMENT is made between:

Driver: ${user.name || user.email}
Vehicle: ${vehicle.make} ${vehicle.model} (Vehicle #${vehicle.vehicle_number})

Terms and Conditions:

1. The Driver agrees to use the Vehicle for business purposes only.
2. The Driver acknowledges receipt of the Vehicle in good working condition.
3. The Driver agrees to return the Vehicle in the same condition, normal wear and tear excepted.
4. The Driver agrees to report any maintenance issues promptly.
5. The Driver agrees to follow all traffic laws and regulations.
6. The Driver assumes responsibility for any tickets or fines incurred during usage.

By signing below, the Driver acknowledges having read, understood, and agreed to the terms and conditions set forth above.`;
  };

  // Make sure canvas has proper dimensions
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      
      // Make sure canvas has proper dimensions
      const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth || 300;
        canvas.height = canvas.offsetHeight || 150;
      };
      
      // Initial resize
      resizeCanvas();
      
      // Set up resize observer to handle size changes
      const resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(canvas);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [canvasRef.current]);

  // Initialize signature pad
  useEffect(() => {
    if (!agreementSigned && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas to be responsive
      canvas.width = canvas.offsetWidth || 300;
      canvas.height = canvas.offsetHeight || 150;
      
      // Set drawing style
      context.strokeStyle = '#000000';
      context.lineWidth = 2;
      
      // Drawing state
      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;
      
      // Mouse events
      const startDrawing = (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [lastX, lastY] = [
          e.clientX - rect.left,
          e.clientY - rect.top
        ];
      };
      
      const draw = (e) => {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(x, y);
        context.stroke();
        
        [lastX, lastY] = [x, y];
      };
      
      const stopDrawing = () => {
        isDrawing = false;
      };
      
      // Touch events
      const touchStart = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        [lastX, lastY] = [
          touch.clientX - rect.left,
          touch.clientY - rect.top
        ];
        isDrawing = true;
      };
      
      const touchMove = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(x, y);
        context.stroke();
        
        [lastX, lastY] = [x, y];
      };
      
      // Add event listeners
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
      
      // Touch support
      canvas.addEventListener('touchstart', touchStart);
      canvas.addEventListener('touchmove', touchMove);
      canvas.addEventListener('touchend', stopDrawing);
      
      // Save reference to clear function
      signaturePadRef.current = {
        clear: () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
        },
        isEmpty: () => {
          // Make sure canvas has dimensions before checking
          if (canvas.width === 0 || canvas.height === 0) {
            // Re-set dimensions if they're 0
            canvas.width = canvas.offsetWidth || 300;
            canvas.height = canvas.offsetHeight || 150;
            return true; // Consider it empty if we just had to reset dimensions
          }
          
          try {
            const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;
            for (let i = 3; i < pixelData.length; i += 4) {
              if (pixelData[i] > 0) {
                return false;
              }
            }
            return true;
          } catch (err) {
            console.error("Error checking if canvas is empty:", err);
            return true; // If we can't check, assume it's empty to prevent errors
          }
        },
        getDataURL: () => {
          // Ensure canvas has dimensions before getting data URL
          if (canvas.width === 0 || canvas.height === 0) {
            canvas.width = canvas.offsetWidth || 300;
            canvas.height = canvas.offsetHeight || 150;
          }
          return canvas.toDataURL('image/png');
        }
      };
      
      // Cleanup
      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
        canvas.removeEventListener('touchstart', touchStart);
        canvas.removeEventListener('touchmove', touchMove);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }
  }, [agreementSigned, canvasRef.current]);

  // Handle signature submission
  const handleSignAgreement = async () => {
    if (!signaturePadRef.current || !vehicle || !user) return;
    
    try {
      if (signaturePadRef.current.isEmpty()) {
        alert('Please sign the agreement');
        return;
      }
      
      setIsLoading(true);
      
      // Get signature as data URL
      const signatureDataUrl = signaturePadRef.current.getDataURL();
      
      // Create an agreement record
      const { data, error } = await supabase
        .from('agreements')
        .insert([{
          driver_id: user.id,
          vehicle_id: vehicleId,
          content: generateAgreementText(),
          signature: signatureDataUrl,
          signed_at: new Date().toISOString(),
        }]);
      
      if (error) throw error;
      
      setAgreementSigned(true);
      document.getElementById('agreementModal').classList.add('hidden');
    } catch (err) {
      console.error('Error saving agreement:', err);
      alert('Failed to save agreement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert blob to smaller size (compress)
  const compressVideo = async (blob) => {
    // For simplicity, this just checks if the blob is too large and warns the user
    // A real compression would require a video processing library
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    
    if (blob.size > MAX_SIZE) {
      console.warn(`Video size (${(blob.size / (1024 * 1024)).toFixed(2)}MB) exceeds 5MB limit. Attempting upload anyway.`);
      // In a production app, you'd compress here
    }
    
    return blob;
  };

  // Request camera access and start recording
  const startVideoRecording = async () => {
    try {
      // Clear any previous recording
      setRecordedChunks([]);
      setRecordingDone(false);
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },  // Reduce resolution for smaller file size
          height: { ideal: 480 } 
        }, 
        audio: true 
      });
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      // Create media recorder with lower quality settings for smaller files
      const options = { 
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 600000  // Lower bitrate for smaller file
      };
      
      const recorder = new MediaRecorder(mediaStream, options);
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
      recorder.onstop = () => {
        // Save the chunks for later processing
        setRecordedChunks(chunks);
        setRecordingDone(true);
      };
      
      // Start recording
      recorder.start(1000); // Collect data in 1-second chunks for better handling
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
  };

  // Handle save video button click
  const handleSaveVideo = async () => {
    if (recordedChunks.length === 0) {
      alert('No recording available to save.');
      return;
    }
    
    try {
      setUploadProgress(1);
      
      // Create a blob from the recorded chunks
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      
      // Try to compress the video (if needed)
      const compressedBlob = await compressVideo(blob);
      
      // Prepare the file name and path - store in the appropriate folder
      const videoFileName = `Punch-In/vehicle-${vehicleId}-pre-${Date.now()}.webm`;
      
      // Upload to Supabase storage with progress tracking
      const { error } = await supabase.storage
        .from('videos')
        .upload(videoFileName, compressedBlob, {
          onUploadProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percentage);
          }
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);
      
      // Create video record
      const { error: recordError } = await supabase
        .from('videos')
        .insert([{
          driver_id: user.id,
          vehicle_id: vehicleId,
          type: 'pre',
          video_url: publicUrl,
        }]);
      
      if (recordError) throw recordError;
      
      // Mark as uploaded and clear recorded chunks to free memory
      setVideoUploaded(true);
      setRecordedChunks([]);
      setRecordingDone(false);
      document.getElementById('videoModal').classList.add('hidden');
      
    } catch (err) {
      console.error('Error details:', err);
      alert('Failed to upload video. Please try again.');
      setUploadProgress(0);
    }
  };

  // Proceed to next step
  const handleNext = async () => {
    if (!agreementSigned || !videoUploaded) {
      alert('Please sign the agreement and record a vehicle inspection video');
      return;
    }
    
    try {
      // Update vehicle status to in-use
      const { error } = await vehicles.updateStatus(vehicleId, 'in-use', user.id);
      
      if (error) throw error;
      
      // Navigate to punch-in page
      navigate(`/driver/punch-in/${vehicleId}`);
    } catch (err) {
      console.error('Error updating vehicle status:', err);
      alert('Failed to update vehicle status. Please try again.');
    }
  };

  // Clear signature
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  if (isLoading && !vehicle) {
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
      <h2 className="text-2xl font-bold mb-6 md:hidden">Sign Agreement</h2>
      
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
                  <span className="inline-block bg-green-100 text-success text-xs px-2 py-1 rounded-full">
                    Available
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <div className={`flex-1 p-3 rounded-md ${agreementSigned ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-700'}`}>
                <div className="flex items-center">
                  <i className={`ri-file-text-line mr-2 ${agreementSigned ? 'text-success' : 'text-gray-500'}`}></i>
                  <span className="font-medium">Agreement</span>
                </div>
                {agreementSigned ? (
                  <span className="text-xs">Signed</span>
                ) : (
                  <span className="text-xs">Not signed</span>
                )}
              </div>
              
              <div className={`flex-1 p-3 rounded-md ${videoUploaded ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-700'}`}>
                <div className="flex items-center">
                  <i className={`ri-video-line mr-2 ${videoUploaded ? 'text-success' : 'text-gray-500'}`}></i>
                  <span className="font-medium">Video Check</span>
                </div>
                {videoUploaded ? (
                  <span className="text-xs">Uploaded</span>
                ) : (
                  <span className="text-xs">Not uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">Required Actions</h3>
          </div>
          
          <div className="card-body space-y-4">
            {!agreementSigned ? (
              <Button
                isFullWidth
                variant="primary" 
                onClick={() => document.getElementById('agreementModal').classList.remove('hidden')}
                icon={<i className="ri-file-text-line"></i>}
              >
                Sign Agreement
              </Button>
            ) : (
              <Button
                isFullWidth
                variant="success"
                disabled
                icon={<i className="ri-check-line"></i>}
              >
                Agreement Signed
              </Button>
            )}
            
            {!videoUploaded ? (
              <Button
                isFullWidth
                variant={agreementSigned ? 'primary' : 'outline'} 
                disabled={!agreementSigned}
                onClick={() => document.getElementById('videoModal').classList.remove('hidden')}
                icon={<i className="ri-video-line"></i>}
              >
                Record Vehicle Check Video
              </Button>
            ) : (
              <Button
                isFullWidth
                variant="success"
                disabled
                icon={<i className="ri-check-line"></i>}
              >
                Video Uploaded
              </Button>
            )}
            
            <Button
              isFullWidth
              variant={agreementSigned && videoUploaded ? 'success' : 'outline'}
              disabled={!agreementSigned || !videoUploaded}
              onClick={handleNext}
              icon={<i className="ri-arrow-right-line"></i>}
            >
              Proceed to Punch In
            </Button>
          </div>
        </div>
      </div>
      
      {/* Agreement Modal */}
      <div id="agreementModal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg">Vehicle Usage Agreement</h3>
            <button 
              onClick={() => document.getElementById('agreementModal').classList.add('hidden')}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
          
          <div className="p-6">
            {/* Agreement Text */}
            <div className="bg-gray-50 p-4 rounded border mb-6 max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {generateAgreementText()}
              </pre>
            </div>
            
            {/* Signature Pad */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sign Below
              </label>
              <div className="border rounded-md p-1 bg-white">
                <canvas 
                  ref={canvasRef}
                  className="w-full h-40 touch-none"
                  style={{ touchAction: 'none' }}
                ></canvas>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={clearSignature}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Signature
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => document.getElementById('agreementModal').classList.add('hidden')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSignAgreement}
              isLoading={isLoading}
            >
              Sign Agreement
            </Button>
          </div>
        </div>
      </div>
      
      {/* Video Recording Modal */}
      <div id="videoModal" className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg">Record Vehicle Inspection</h3>
            {!isRecording && !recordingDone && uploadProgress === 0 && !videoUploaded && (
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
                ) : recordingDone ? (
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      Recording Complete!
                    </div>
                    <p className="text-gray-600">Please save your video to continue.</p>
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
                      Record a 15-second video showing the vehicle condition.
                    </p>
                    <p className="text-sm text-gray-500">
                      Walk around the vehicle and capture any existing damage or issues.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-center">
                  {!isRecording && !recordingDone && uploadProgress === 0 ? (
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
                  ) : recordingDone ? (
                    <Button
                      variant="success"
                      onClick={handleSaveVideo}
                      icon={<i className="ri-save-line"></i>}
                    >
                      Click Save
                    </Button>
                  ) : uploadProgress > 0 && uploadProgress < 100 ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">Uploading video...</p>
                    </div>
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
                  Your vehicle inspection video has been recorded and saved.
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => document.getElementById('videoModal').classList.add('hidden')}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agreement;