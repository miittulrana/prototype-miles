import { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { supabase } from '../../services/supabase';

const ImageCapture = ({
  maxImages = 6,
  onCaptureComplete,
  title = 'Vehicle Inspection Images',
  instructions = 'Please take photos showing the vehicle condition from different angles.',
  className = '',
  ...props
}) => {
  const [images, setImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  const [flashMode, setFlashMode] = useState('off'); // 'off', 'on', or 'auto'
  const [hasFlash, setHasFlash] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup function
  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  // Check if flash is supported
  const checkFlashSupport = async (currentStream) => {
    if (!currentStream) return;
    
    try {
      const track = currentStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        setHasFlash(true);
      } else {
        setHasFlash(false);
        setFlashMode('off');
      }
    } catch (err) {
      console.error("Error checking flash support:", err);
      setHasFlash(false);
      setFlashMode('off');
    }
  };

  // Toggle flash
  const toggleFlash = async () => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      
      if (flashMode === 'off') {
        await track.applyConstraints({
          advanced: [{ torch: true }]
        });
        setFlashMode('on');
      } else {
        await track.applyConstraints({
          advanced: [{ torch: false }]
        });
        setFlashMode('off');
      }
    } catch (err) {
      console.error("Error toggling flash:", err);
      setError("Failed to toggle flash. Your device may not support this feature.");
    }
  };

  // Flip camera (switch between front and back)
  const flipCamera = async () => {
    // First, clean up the current stream
    cleanup();
    
    // Toggle facing mode
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    // Request camera access with new facing mode
    try {
      await startCamera(newFacingMode);
    } catch (err) {
      console.error("Error flipping camera:", err);
      setError("Failed to switch camera. Your device may not support this feature.");
      
      // Try to revert to the previous camera if switching fails
      try {
        await startCamera(facingMode);
      } catch (revertErr) {
        console.error("Error reverting camera:", revertErr);
      }
    }
  };

  // Request camera access
  const startCamera = async (mode = facingMode) => {
    setError(null);
    
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      // Check if flash is supported
      await checkFlashSupport(mediaStream);
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setIsCapturing(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check your device permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    cleanup();
    setIsCapturing(false);
  };

  // Compress image with improved quality control
  const compressImage = async (dataUrl, quality = 0.6, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize large images to improve compression
        if (width > maxWidth) {
          height = Math.floor(height * (maxWidth / width));
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get compressed image with lower quality to reduce size
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Check compressed size (rough estimate)
        const estimatedBytes = Math.ceil((compressedDataUrl.length * 3) / 4) - 
                             (compressedDataUrl.endsWith('==') ? 2 : (compressedDataUrl.endsWith('=') ? 1 : 0));
        
        const estimatedKB = estimatedBytes / 1024;
        console.log(`Compressed image size: ~${Math.round(estimatedKB)}KB`);
        
        // If still too large, compress more
        if (estimatedKB > 500 && quality > 0.3) {
          // Recursively compress with lower quality
          resolve(compressImage(dataUrl, quality - 0.1, maxWidth));
        } else {
          resolve(compressedDataUrl);
        }
      };
    });
  };

  // Capture an image
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image as data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); 
      
      // Compress the image more aggressively to keep file size small
      const compressedImage = await compressImage(imageDataUrl, 0.6, 800);
      
      // Add to images array
      setImages(prevImages => [...prevImages, compressedImage]);
      
      // Add timestamp and angle info
      const timestamp = new Date().toISOString();
      const imageCount = images.length + 1;
      let angle = "Front";
      
      switch(imageCount) {
        case 1: angle = "Front"; break;
        case 2: angle = "Driver Side"; break;
        case 3: angle = "Rear"; break;
        case 4: angle = "Passenger Side"; break;
        case 5: angle = "Interior"; break;
        case 6: angle = "Other"; break;
        default: angle = `View ${imageCount}`;
      }
      
      // Play a capture sound if available
      if ('Audio' in window) {
        try {
          const captureSound = new Audio();
          captureSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//uQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADpgCFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYX///7kAAAAAKuWAAAAAAAADcGQAAAGkGRvb3IAAfQEAAIDcmVjeQAAAABsaXN0AAAAFm1kYXQAAAGTYXJ0cwAAAABhcnRzAAAAAGFydHMAAAAAYXJ0cwAAAABhcnRzAAAAAGFydGX////+5AMMMDk3hv6l9BO76O/4P4qTVMjYQZbh79p8oXr+QN/Vq/qm/XrYPVyqr7Xo/h5b1ZLT6kK7xX9Hs9xY+XcGzE5f2+u6HUZmM8y9FX8ZObNXF7qf46b2T2r8ljvudzzMV7zeeWPDvnzf+cN/23w34f+H/g/5jn/+JU/5+pXHbl1VtPq/0Zd+tQ5Jb8vOT578u6yjkKSQDKwAaKgnK1E8IQDcxNS4MQ/0kkAUWfIDAMDJ7cO/sH9g3+tl/ffrg/a3VDWmP1h73Z7QUX08/FW4dLX+OqxLPx0vLXRfJ6fD9T8qWvLJvU1a1+Iqslfz/J4WkuU/ycXYEchPCRnKFwFDCiOuOTDU1sPvR5X7d/q/UfSHvT9UR6iFe+qKBqmlRLpj2JVZpUOTtMpZGrppkf5GLH3p0U8pZR9qidVbFyE5mRpO0pkkLs+hnkqPuXJcZOCEOyBwqANMZSGHFAYXCSNZGaOj//uSZIAAA/UyTvs5YAA8wamvPSAARtTDNC0x7eDYDCY9lDwAp+3Rvdll6y+QnlLFU0xrJSk1UtP3nrClILlI1h1j1D89P6TXudbBc5VxMxNOkQDmLhMl2QkAzISARIeEiw5IUKBCYCwD6Nq5U0lP3/+h92W2Km3a8tP+zIZv01VPUfN1OlX3IWXIVGxnpmEodGQzIZf0zdJjPLJlqS2nXqXVTZ/VFkdT1S2S3R///3Rqe0Vd/RP/9H9VVVVTEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkEA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';
          captureSound.play().catch(e => {
            // Ignore errors playing audio, this is non-critical
            console.log('Audio play error (non-critical):', e);
          });
        } catch (audioErr) {
          // Ignore audio errors
        }
      }
      
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image. Please try again.');
    }
  };

  // Process and upload images
  const handleUpload = async () => {
    if (images.length === 0) {
      setError('Please capture at least one image before uploading.');
      return;
    }
    
    try {
      setUploadProgress(10); // Start progress
      
      // Forward the captured images to the parent component
      if (onCaptureComplete) {
        const result = await onCaptureComplete({
          images,
          timestamp: new Date().toISOString(),
          uploadProgress: setUploadProgress
        });
        
        if (result && result.error) {
          throw new Error(result.error);
        }
        
        // If no update to progress was made, assume success
        if (uploadProgress < 100) {
          setUploadProgress(100);
        }
      } else {
        // No handler provided, just show success
        setUploadProgress(100);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images: ' + (err.message || 'Unknown error'));
      setUploadProgress(0);
    }
  };

  // Delete an image
  const deleteImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  return (
    <Card className={className} {...props}>
      <Card.Header title={title} />
      
      <Card.Body>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        {/* Camera preview or captured images */}
        {isCapturing ? (
          <div className="relative bg-black rounded-md overflow-hidden aspect-video mb-4">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            ></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            {/* Camera control buttons */}
            <div className="absolute bottom-3 right-3 flex space-x-2">
              <button
                onClick={flipCamera}
                className="bg-white bg-opacity-70 rounded-full p-2 text-gray-800 hover:bg-opacity-100"
                title="Flip Camera"
              >
                <i className="ri-camera-switch-line text-xl"></i>
              </button>
              
              {hasFlash && (
                <button
                  onClick={toggleFlash}
                  className={`bg-white bg-opacity-70 rounded-full p-2 text-gray-800 hover:bg-opacity-100 ${flashMode === 'on' ? 'text-yellow-500' : ''}`}
                  title="Toggle Flash"
                >
                  <i className={`ri-${flashMode === 'on' ? 'flashlight-fill' : 'flashlight-line'} text-xl`}></i>
                </button>
              )}
            </div>
          </div>
        ) : images.length > 0 ? (
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img 
                    src={img} 
                    alt={`Capture ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <button
                    onClick={() => deleteImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                    aria-label="Delete image"
                  >
                    <i className="ri-delete-bin-line text-xs"></i>
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                    {index === 0 ? "Front" : 
                     index === 1 ? "Driver Side" :
                     index === 2 ? "Rear" :
                     index === 3 ? "Passenger Side" :
                     index === 4 ? "Interior" : "Other"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-md overflow-hidden aspect-video mb-4 flex items-center justify-center">
            <div className="text-center p-4">
              <i className="ri-camera-line text-4xl text-gray-400 mb-2"></i>
              <p className="text-gray-500">Camera preview will appear here</p>
            </div>
          </div>
        )}
        
        {/* Instructions and progress */}
        {!isCapturing && images.length === 0 && (
          <div className="text-center mb-4">
            <p className="text-gray-600 mb-2">
              {instructions}
            </p>
            <p className="text-sm text-gray-500">
              Take photos of front, sides, rear, and any existing damage.
            </p>
          </div>
        )}
        
        {uploadProgress > 0 && uploadProgress < 100 && (
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
        )}
        
        {/* Status information */}
        {images.length > 0 && !isCapturing && (
          <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-sm text-blue-700">
              <span className="font-medium">{images.length}</span> of <span className="font-medium">{maxImages}</span> images captured
              {images.length >= maxImages && ' (maximum reached)'}
            </p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {!isCapturing ? (
            <>
              <Button
                variant="primary"
                onClick={() => startCamera()}
                icon={<i className="ri-camera-line"></i>}
                disabled={images.length >= maxImages || uploadProgress > 0}
              >
                {images.length > 0 ? "Capture More" : "Start Camera"}
              </Button>
              
              {images.length > 0 && (
                <Button
                  variant="success"
                  onClick={handleUpload}
                  isLoading={uploadProgress > 0 && uploadProgress < 100}
                  icon={<i className="ri-upload-2-line"></i>}
                >
                  Upload Images
                </Button>
              )}
            </>
          ) : (
            <div className="flex flex-wrap justify-center gap-3 w-full">
              <Button
                variant="primary"
                onClick={captureImage}
                icon={<i className="ri-camera-line"></i>}
                disabled={images.length >= maxImages}
              >
                Capture Image
              </Button>
              
              <Button
                variant="outline"
                onClick={stopCamera}
                icon={<i className="ri-close-line"></i>}
              >
                Close Camera
              </Button>
            </div>
          )}
        </div>
        
        {uploadProgress === 100 && (
          <div className="text-center mt-4 p-4 bg-green-50 rounded-md border border-green-100">
            <div className="text-3xl text-success mb-2">
              <i className="ri-check-line"></i>
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-1">Images Uploaded Successfully</h4>
            <p className="text-gray-600">
              Your vehicle inspection images have been saved.
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// Compact version with minimal UI
ImageCapture.Compact = ({
  maxImages = 6,
  onCaptureComplete,
  title = 'Vehicle Images',
  className = '',
  ...props
}) => {
  const [images, setImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flashMode, setFlashMode] = useState('off');
  const [hasFlash, setHasFlash] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup function
  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  // Check if flash is supported
  const checkFlashSupport = async (currentStream) => {
    if (!currentStream) return;
    
    try {
      const track = currentStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        setHasFlash(true);
      } else {
        setHasFlash(false);
        setFlashMode('off');
      }
    } catch (err) {
      console.error("Error checking flash support:", err);
      setHasFlash(false);
      setFlashMode('off');
    }
  };

  // Toggle flash
  const toggleFlash = async () => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      
      if (flashMode === 'off') {
        await track.applyConstraints({
          advanced: [{ torch: true }]
        });
        setFlashMode('on');
      } else {
        await track.applyConstraints({
          advanced: [{ torch: false }]
        });
        setFlashMode('off');
      }
    } catch (err) {
      console.error("Error toggling flash:", err);
      setError("Failed to toggle flash.");
    }
  };

  // Flip camera
  const flipCamera = async () => {
    cleanup();
    
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    try {
      await startCamera(newFacingMode);
    } catch (err) {
      console.error("Error flipping camera:", err);
      setError("Failed to switch camera.");
      
      try {
        await startCamera(facingMode);
      } catch (revertErr) {
        console.error("Error reverting camera:", revertErr);
      }
    }
  };

  // Request camera access
  const startCamera = async (mode = facingMode) => {
    setError(null);
    
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      // Check if flash is supported
      await checkFlashSupport(mediaStream);
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setIsCapturing(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    cleanup();
    setIsCapturing(false);
  };

  // Compress image
  const compressImage = async (dataUrl, quality = 0.6, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize large images to improve compression
        if (width > maxWidth) {
          height = Math.floor(height * (maxWidth / width));
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get compressed image with lower quality for mobile
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Check size and potentially compress more if needed
        const estimatedBytes = Math.ceil((compressedDataUrl.length * 3) / 4) - 
                            (compressedDataUrl.endsWith('==') ? 2 : (compressedDataUrl.endsWith('=') ? 1 : 0));
        
        const estimatedKB = estimatedBytes / 1024;
        
        // If still too large, compress more
        if (estimatedKB > 500 && quality > 0.3) {
          // Recursively compress with lower quality
          resolve(compressImage(dataUrl, quality - 0.1, maxWidth));
        } else {
          resolve(compressedDataUrl);
        }
      };
    });
  };

  // Capture an image
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image as data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Compress the image more aggressively to keep file size small
      const compressedImage = await compressImage(imageDataUrl, 0.6, 800);
      
      // Add to images array
      setImages(prevImages => [...prevImages, compressedImage]);
      
      // If we have at least one image, automatically trigger upload on image capture in compact mode
      if (images.length >= maxImages - 1) {
        setTimeout(() => {
          stopCamera();
          // Only attempt upload after camera is closed to avoid resource conflicts
          setTimeout(() => {
            if (onCaptureComplete) {
              onCaptureComplete({
                images: [...images, compressedImage],
                timestamp: new Date().toISOString(),
                uploadProgress: (percent) => setUploadProgress(percent)
              });
            }
          }, 500);
        }, 1000);
      }
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image.');
    }
  };

  // Process and upload images
  const handleUpload = async () => {
    if (images.length === 0) {
      setError('Please capture at least one image first');
      return;
    }
    
    try {
      setUploadProgress(10); // Start progress
      
      // Forward the captured images to the parent component
      if (onCaptureComplete) {
        await onCaptureComplete({
          images,
          timestamp: new Date().toISOString(),
          uploadProgress: setUploadProgress
        });
      } else {
        // No handler provided, just show success
        setUploadProgress(100);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images. Please try again.');
      setUploadProgress(0);
    }
  };

  // Delete an image
  const deleteImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  return (
    <div className={className} {...props}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-sm mb-2">
          {error}
        </div>
      )}
      
      {isCapturing ? (
        <div className="relative bg-black rounded-md overflow-hidden aspect-video mb-2">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          ></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          
          {/* Camera control buttons */}
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <button
              onClick={flipCamera}
              className="bg-white bg-opacity-70 rounded-full p-1 text-gray-800 hover:bg-opacity-100"
              title="Flip Camera"
            >
              <i className="ri-camera-switch-line text-lg"></i>
            </button>
            
            {hasFlash && (
              <button
                onClick={toggleFlash}
                className={`bg-white bg-opacity-70 rounded-full p-1 text-gray-800 hover:bg-opacity-100 ${flashMode === 'on' ? 'text-yellow-500' : ''}`}
                title="Toggle Flash"
              >
                <i className={`ri-${flashMode === 'on' ? 'flashlight-fill' : 'flashlight-line'} text-lg`}></i>
              </button>
            )}
          </div>
        </div>
      ) : images.length > 0 ? (
        <div className="mb-2">
          <div className="grid grid-cols-3 gap-1">
            {images.map((img, index) => (
              <div key={index} className="relative">
                <img 
                  src={img} 
                  alt={`Capture ${index + 1}`} 
                  className="w-full h-20 object-cover rounded"
                />
                <button
                  onClick={() => deleteImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label="Delete image"
                >
                  <i className="ri-close-line text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Uploading</span>
            <span className="text-primary font-medium">{uploadProgress}%</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {uploadProgress === 100 ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
          <div className="text-2xl text-green-500 mb-1">
            <i className="ri-check-line"></i>
          </div>
          <p className="text-sm text-green-700">
            Images uploaded successfully!
          </p>
        </div>
      ) : (
        <div className="flex justify-end flex-wrap gap-2">
          {!isCapturing ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => startCamera()}
                disabled={images.length >= maxImages || uploadProgress > 0}
                icon={<i className="ri-camera-line"></i>}
              >
                {images.length === 0 ? "Take Photos" : "Add More"}
              </Button>
              
              {images.length > 0 && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleUpload}
                  isLoading={uploadProgress > 0 && uploadProgress < 100}
                  icon={<i className="ri-upload-2-line"></i>}
                >
                  Upload ({images.length})
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={captureImage}
                disabled={images.length >= maxImages}
                icon={<i className="ri-camera-line"></i>}
              >
                Capture
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={stopCamera}
                icon={<i className="ri-close-line"></i>}
              >
                Close
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCapture;