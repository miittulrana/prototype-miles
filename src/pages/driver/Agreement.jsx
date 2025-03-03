import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, vehicles, storage } from '../../services/supabase';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ImageCapture from '../../components/driver/ImageCapture';

const Agreement = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [imagesUploaded, setImagesUploaded] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);  // Added state for full driver info
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

  // Fetch driver's full information when component loads
  useEffect(() => {
    const fetchDriverInfo = async () => {
      if (user && user.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setDriverInfo(data);
          }
        } catch (err) {
          console.error('Error fetching driver details:', err);
        }
      }
    };
    
    fetchDriverInfo();
  }, [user]);

  // Generate agreement text
  const generateAgreementText = () => {
    if (!vehicle || !user) return '';
    
    const today = new Date().toLocaleDateString();
    
    // Use driverInfo's name if available, otherwise fallback to a default
    const driverName = driverInfo?.name || 'Driver';
    
    return `VEHICLE USAGE AGREEMENT

Date: ${today}

THIS AGREEMENT is made between:

Driver: ${driverName}
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

  // Handle image capture completion and upload
  const handleImageCaptureComplete = async (imageData) => {
    if (!vehicleId || !user) return;
    
    try {
      setUploadingImages(true);
      
      // Create the folder name for this inspection
      const folderName = `Agreement-${vehicleId}`;
      const bucketName = 'vehicle_images';
      
      // Loop through each image and upload it
      const uploadPromises = imageData.images.map(async (imageDataUrl, index) => {
        try {
          // Convert the data URL to a Blob
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          
          // Prepare the file name
          const imageFileName = `${folderName}/image-${index + 1}-${Date.now()}.jpg`;
          
          // Upload to Supabase storage
          const { data, error } = await storage.uploadImage(bucketName, imageFileName, blob);
          
          if (error) {
            console.error(`Error uploading image ${index + 1}:`, error);
            throw error;
          }
          
          return data;
        } catch (err) {
          console.error(`Error processing image ${index + 1}:`, err);
          throw err;
        }
      });
      
      // Update progress during uploads
      let completedUploads = 0;
      const totalUploads = imageData.images.length;
      
      // Process uploads one by one to track progress
      for (const uploadPromise of uploadPromises) {
        await uploadPromise;
        completedUploads++;
        const progress = Math.round((completedUploads / totalUploads) * 100);
        imageData.uploadProgress(progress);
      }
      
      // Create a record of the inspection
      const { error: recordError } = await supabase
        .from('vehicle_inspections')
        .insert([{
          driver_id: user.id,
          vehicle_id: vehicleId,
          inspection_type: 'pre',
          image_count: imageData.images.length,
          images_folder: folderName,
          timestamp: new Date().toISOString(),
        }]);
      
      if (recordError) throw recordError;
      
      // Mark as uploaded
      setImagesUploaded(true);
      document.getElementById('imageModal').classList.add('hidden');
      
    } catch (err) {
      console.error('Error details:', err);
      alert('Failed to upload images. Please check your connection and try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  // Proceed to next step
  const handleNext = async () => {
    if (!agreementSigned || !imagesUploaded) {
      alert('Please sign the agreement and take vehicle inspection images');
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
              
              <div className={`flex-1 p-3 rounded-md ${imagesUploaded ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-700'}`}>
                <div className="flex items-center">
                  <i className={`ri-camera-line mr-2 ${imagesUploaded ? 'text-success' : 'text-gray-500'}`}></i>
                  <span className="font-medium">Photos</span>
                </div>
                {imagesUploaded ? (
                  <span className="text-xs">Uploaded</span>
                ) : (
                  <span className="text-xs">Not taken</span>
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
            
            {!imagesUploaded ? (
              <Button
                isFullWidth
                variant={agreementSigned ? 'primary' : 'outline'} 
                disabled={!agreementSigned}
                onClick={() => document.getElementById('imageModal').classList.remove('hidden')}
                icon={<i className="ri-camera-line"></i>}
              >
                Take Vehicle Photos
              </Button>
            ) : (
              <Button
                isFullWidth
                variant="success"
                disabled
                icon={<i className="ri-check-line"></i>}
              >
                Photos Uploaded
              </Button>
            )}
            
            <Button
              isFullWidth
              variant={agreementSigned && imagesUploaded ? 'success' : 'outline'}
              disabled={!agreementSigned || !imagesUploaded}
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
      
      {/* Image Capture Modal */}
      <div id="imageModal" className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg">Vehicle Inspection Photos</h3>
            {!imagesUploaded && !uploadingImages && (
              <button 
                onClick={() => document.getElementById('imageModal').classList.add('hidden')}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            )}
          </div>
          
          <div className="p-6">
            <ImageCapture
              maxImages={6}
              title="Vehicle Inspection"
              instructions="Take photos of the vehicle from different angles (front, sides, rear, interior) and any existing damage."
              onCaptureComplete={handleImageCaptureComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agreement;