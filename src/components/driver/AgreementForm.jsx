import { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import useAuthStore from '../../store/authStore';

const AgreementForm = ({
  vehicleData,
  onSignComplete,
  className = '',
  ...props
}) => {
  const [isAgreementSigned, setIsAgreementSigned] = useState(false);
  const { user } = useAuthStore();
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

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
    if (canvasRef.current) {
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
  }, [canvasRef.current]);

  // Reset signature pad on vehicle change
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsAgreementSigned(false);
    }
  }, [vehicleData?.id]);

  // Generate agreement text
  const generateAgreementText = () => {
    if (!vehicleData || !user) return '';
    
    const today = new Date().toLocaleDateString();
    
    return `VEHICLE USAGE AGREEMENT

Date: ${today}

THIS AGREEMENT is made between:

Driver: ${user.name || user.email}
Vehicle: ${vehicleData.make} ${vehicleData.model} (Vehicle #${vehicleData.vehicle_number})

Terms and Conditions:

1. The Driver agrees to use the Vehicle for business purposes only.
2. The Driver acknowledges receipt of the Vehicle in good working condition.
3. The Driver agrees to return the Vehicle in the same condition, normal wear and tear excepted.
4. The Driver agrees to report any maintenance issues promptly.
5. The Driver agrees to follow all traffic laws and regulations.
6. The Driver assumes responsibility for any tickets or fines incurred during usage.

By signing below, the Driver acknowledges having read, understood, and agreed to the terms and conditions set forth above.`;
  };

  // Handle signature submission
  const handleSignAgreement = async () => {
    if (!signaturePadRef.current) return;
    
    try {
      if (signaturePadRef.current.isEmpty()) {
        alert('Please sign the agreement');
        return;
      }
      
      // Get signature as data URL
      const signatureDataUrl = signaturePadRef.current.getDataURL();
      
      setIsAgreementSigned(true);
      
      if (onSignComplete) {
        onSignComplete({
          signatureDataUrl,
          agreementText: generateAgreementText(),
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error processing signature:', err);
      alert('There was an error processing your signature. Please try again.');
    }
  };

  // Clear signature
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <Card className={className} {...props}>
      <Card.Header 
        title="Vehicle Agreement" 
        subtitle={vehicleData ? `${vehicleData.make} ${vehicleData.model} - ${vehicleData.vehicle_number}` : ''}
      />
      
      <Card.Body>
        {isAgreementSigned ? (
          <div className="text-center py-4">
            <div className="text-5xl text-green-500 mb-4">
              <i className="ri-check-line"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Agreement Signed</h3>
            <p className="text-gray-600 mb-4">
              The vehicle usage agreement has been signed successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 p-4 rounded border mb-6 max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {generateAgreementText()}
              </pre>
            </div>
            
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
            
            <Button
              isFullWidth
              variant="primary"
              onClick={handleSignAgreement}
            >
              Sign Agreement
            </Button>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// Compact version that shows just the signature area
AgreementForm.Compact = ({
  onSignComplete,
  className = '',
  ...props
}) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

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
    if (canvasRef.current) {
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
  }, [canvasRef.current]);

  // Handle signature submission
  const handleSubmit = () => {
    if (!signaturePadRef.current) return;
    
    try {
      if (signaturePadRef.current.isEmpty()) {
        alert('Please sign the agreement');
        return;
      }
      
      // Get signature as data URL
      const signatureDataUrl = signaturePadRef.current.getDataURL();
      
      if (onSignComplete) {
        onSignComplete({
          signatureDataUrl,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error processing signature:', err);
      alert('There was an error processing your signature. Please try again.');
    }
  };

  // Clear signature
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <div className={className} {...props}>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sign Here
        </label>
        <div className="border rounded-md p-1 bg-white">
          <canvas 
            ref={canvasRef}
            className="w-full h-32 touch-none"
            style={{ touchAction: 'none' }}
          ></canvas>
        </div>
        <div className="flex justify-end mt-1">
          <button
            onClick={clearSignature}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={clearSignature}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
        >
          Submit Signature
        </Button>
      </div>
    </div>
  );
};

export default AgreementForm;