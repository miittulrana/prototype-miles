import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, timeLogs, vehicles, storage, pdfService } from '../../services/supabase';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ImageCapture from '../../components/driver/ImageCapture';

const PunchOut = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeLog, setActiveLog] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPunching, setIsPunching] = useState(false);
  const [imagesUploaded, setImagesUploaded] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [workDuration, setWorkDuration] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  
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
    if (!imagesUploaded) {
      document.getElementById('imageModal').classList.remove('hidden');
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
      
      // Generate PDF report
      if (pdfUrl) {
        // PDF was already generated during image upload
        console.log('Using already generated PDF:', pdfUrl);
      }
      
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

  // Handle image capture completion and upload
  const handleImageCaptureComplete = async (imageData) => {
    if (!activeLog || !user) return;
    
    try {
      setUploadingImages(true);
      
      // Create folder name for storage
      const folderName = `PunchOut-${activeLog.vehicle_id}-${activeLog.id}`;
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
      
      // Create a record of the inspection with PDF generation
      const inspectionRecord = {
        driver_id: user.id,
        vehicle_id: activeLog.vehicle_id,
        time_log_id: activeLog.id,
        inspection_type: 'post',
        image_count: imageData.images.length,
        images_folder: folderName,
        timestamp: new Date().toISOString(),
      };
      
      const { data: inspectionData, error: recordError } = await supabase
        .from('vehicle_inspections')
        .insert([inspectionRecord])
        .select();
      
      if (recordError) throw recordError;
      
      // Generate PDF for the inspection
      const { success, pdfUrl: generatedPdfUrl, data: pdfData } = await pdfService.generateInspectionPdf(
        activeLog.id,
        activeLog.vehicle_id,
        imageData.images,
        imageData.timestamp
      );
      
      if (success && generatedPdfUrl) {
        setPdfUrl(generatedPdfUrl);
        
        // Update the inspection record with PDF URL
        await supabase
          .from('vehicle_inspections')
          .update({ pdf_url: generatedPdfUrl })
          .eq('id', inspectionData[0].id);
      }
      
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
                <span className="text-gray-600">Photos:</span>
                <span className={`font-medium ${imagesUploaded ? 'text-success' : 'text-yellow-600'}`}>
                  {imagesUploaded ? 'Uploaded' : 'Required'}
                </span>
              </div>
              
              {pdfUrl && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Inspection Report:</span>
                  <Link to={`/pdf/${pdfUrl.split('/').pop()}`} className="text-primary hover:underline">
                    View PDF
                  </Link>
                </div>
              )}
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
                <li>Take photos of the vehicle condition (front, sides, rear).</li>
                <li>Make sure the vehicle is parked safely and properly.</li>
                <li>Report any issues or incidents that occurred during usage.</li>
              </ul>
            </div>
            
            <Button
              isFullWidth
              variant={imagesUploaded ? "primary" : "outline"}
              size="lg"
              isLoading={isPunching}
              onClick={handlePunchOut}
              icon={<i className="ri-logout-box-line"></i>}
              disabled={!imagesUploaded && isPunching}
            >
              {imagesUploaded ? "Punch Out Now" : "Take Photos & Punch Out"}
            </Button>
            
            {isPunching && imagesUploaded && (
              <div className="mt-4 text-center text-sm text-success">
                <i className="ri-check-line"></i> Successfully punched out. Redirecting...
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Capture Modal */}
      <div id="imageModal" className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg">Final Vehicle Inspection</h3>
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
              title="Final Vehicle Inspection"
              instructions="Take photos of the vehicle from different angles (front, sides, rear, interior) and any damage."
              onCaptureComplete={handleImageCaptureComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchOut;