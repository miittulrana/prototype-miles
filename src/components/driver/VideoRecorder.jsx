import { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';

const VideoRecorder = ({
  maxDuration = 15,
  onRecordingComplete,
  title = 'Record Vehicle Video',
  instructions = 'Please record a 15-second video showing the vehicle condition.',
  className = '',
  ...props
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  // Request camera access and start recording
  const startRecording = async () => {
    setError(null);
    setRecordingComplete(false);
    
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      
      setStream(mediaStream);
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      // Create media recorder
      const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
      setMediaRecorder(recorder);
      
      chunksRef.current = [];
      
      // Listen for data
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      // Handle recording complete
      recorder.onstop = async () => {
        // Create a video blob
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Simulate upload progress
        simulateUpload(blob);
      };
      
      // Start recording
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Set timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          if (prevTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prevTime + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check your device permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    setIsRecording(false);
  };

  // Simulate upload progress
  const simulateUpload = (blob) => {
    // Create a FileReader to get the video data
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const videoData = reader.result;
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setRecordingComplete(true);
          
          // Call the callback with the blob and data URL
          if (onRecordingComplete) {
            onRecordingComplete({
              blob,
              dataUrl: URL.createObjectURL(blob),
              duration: recordingTime,
              timestamp: new Date().toISOString()
            });
          }
        }
      }, 150);
    };
    
    reader.readAsDataURL(blob);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        
        {!recordingComplete ? (
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
                  Recording... {formatTime(recordingTime)}/{formatTime(maxDuration)}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600 transition-all duration-1000"
                    style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
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
            ) : (
              <div className="text-center mb-4">
                <p className="text-gray-600 mb-2">
                  {instructions}
                </p>
                <p className="text-sm text-gray-500">
                  Walk around the vehicle and capture any existing damage or issues.
                </p>
              </div>
            )}
            
            <div className="flex justify-center">
              {!isRecording && uploadProgress === 0 ? (
                <Button
                  variant="primary"
                  onClick={startRecording}
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
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// Compact version with minimal UI
VideoRecorder.Compact = ({
  maxDuration = 15,
  onRecordingComplete,
  title = 'Record Video',
  className = '',
  ...props
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  // Request camera access and start recording
  const startRecording = async () => {
    setError(null);
    setRecordingComplete(false);
    
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      
      setStream(mediaStream);
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      // Create media recorder
      const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
      setMediaRecorder(recorder);
      
      chunksRef.current = [];
      
      // Listen for data
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      // Handle recording complete
      recorder.onstop = async () => {
        // Create a video blob
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        setRecordingComplete(true);
        
        // Call the callback with the blob
        if (onRecordingComplete) {
          onRecordingComplete({
            blob,
            dataUrl: URL.createObjectURL(blob),
            duration: recordingTime,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      // Start recording
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Set timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          if (prevTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prevTime + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    setIsRecording(false);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={className} {...props}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-sm mb-2">
          {error}
        </div>
      )}
      
      {!recordingComplete ? (
        <>
          <div className="bg-black rounded-md overflow-hidden aspect-video mb-2">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            ></video>
          </div>
          
          {isRecording && (
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{title}</span>
                <span className="text-red-600 font-medium">{formatTime(recordingTime)}/{formatTime(maxDuration)}</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-1000"
                  style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            {!isRecording ? (
              <Button
                variant="primary"
                size="sm"
                onClick={startRecording}
                icon={<i className="ri-record-circle-line"></i>}
              >
                Record
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={stopRecording}
                icon={<i className="ri-stop-circle-line"></i>}
              >
                Stop
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
          <div className="text-2xl text-green-500 mb-1">
            <i className="ri-check-line"></i>
          </div>
          <p className="text-sm text-green-700">
            Video recorded successfully!
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;