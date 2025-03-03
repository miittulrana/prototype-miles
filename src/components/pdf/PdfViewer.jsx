import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, pdfService } from '../../services/supabase';
import Button from '../common/Button';
import Loading from '../common/Loading';

const PdfViewer = () => {
  const { pdfId } = useParams();
  const navigate = useNavigate();
  const [pdfData, setPdfData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchPdf = async () => {
      if (!pdfId) return;
      
      setIsLoading(true);
      try {
        // Try to get data from inspection_pdfs first
        const { data, error } = await pdfService.getPdfById(pdfId);
        
        if (error || !data) {
          // If not found in inspection_pdfs, try vehicle_inspections
          const { data: inspection, error: inspectionError } = await supabase
            .from('vehicle_inspections')
            .select(`
              id,
              driver_id,
              vehicle_id,
              time_log_id,
              inspection_type,
              images_folder,
              timestamp,
              image_count,
              drivers:users(name, email),
              vehicles(vehicle_number, make, model),
              time_logs(punch_in, punch_out)
            `)
            .eq('id', pdfId)
            .single();
            
          if (inspectionError) {
            // Also try by time_log_id
            const { data: byTimeLog, error: timeLogError } = await supabase
              .from('vehicle_inspections')
              .select(`
                id,
                driver_id,
                vehicle_id,
                time_log_id,
                inspection_type,
                images_folder,
                timestamp,
                image_count,
                drivers:users(name, email),
                vehicles(vehicle_number, make, model),
                time_logs(punch_in, punch_out)
              `)
              .eq('time_log_id', pdfId)
              .single();
              
            if (timeLogError) throw new Error('Inspection record not found');
            
            setPdfData(byTimeLog);
            await fetchImages(byTimeLog.images_folder);
          } else {
            setPdfData(inspection);
            await fetchImages(inspection.images_folder);
          }
        } else {
          setPdfData(data);
          if (data.images && data.images.length > 0) {
            setImages(data.images.map(img => ({
              url: img.image_url,
              label: img.label
            })));
          }
        }
      } catch (err) {
        console.error('Error loading PDF data:', err);
        setError(err.message || 'Failed to load inspection report');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchImages = async (folderPath) => {
      if (!folderPath) return;
      
      try {
        const { data: imageFiles } = await supabase.storage
          .from('vehicle_images')
          .list(folderPath);
        
        if (imageFiles && imageFiles.length > 0) {
          const imageUrls = await Promise.all(
            imageFiles.map(async (file, index) => {
              const { data } = supabase.storage
                .from('vehicle_images')
                .getPublicUrl(`${folderPath}/${file.name}`);
              
              // Determine label based on file name or index
              let label = 'Image';
              if (file.name.includes('1-')) label = 'Front';
              else if (file.name.includes('2-')) label = 'Driver Side';
              else if (file.name.includes('3-')) label = 'Rear';
              else if (file.name.includes('4-')) label = 'Passenger Side';
              else if (file.name.includes('5-')) label = 'Interior';
              else label = `Image ${index + 1}`;
              
              return {
                url: data.publicUrl,
                label
              };
            })
          );
          
          setImages(imageUrls);
        }
      } catch (err) {
        console.error('Error fetching images:', err);
      }
    };
    
    fetchPdf();
  }, [pdfId]);

  if (isLoading) {
    return <Loading.Page />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-lg shadow">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-lg shadow text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-4">PDF Not Found</h2>
        <p className="mb-6">The requested PDF could not be found.</p>
        <Button
          variant="primary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  // Determine inspection type
  const inspectionType = pdfData.inspection_type || 
                         (pdfData.time_logs?.punch_out ? 'post' : 'pre');

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-lg shadow">
      <div className="text-center mb-6 pb-6 border-b">
        <h1 className="text-2xl font-bold mb-2">
          Vehicle Inspection Report - {inspectionType === 'post' ? 'Punch Out' : 'Punch In'}
        </h1>
        <p className="text-gray-600">
          {pdfData.vehicles?.vehicle_number} - {pdfData.vehicles?.make} {pdfData.vehicles?.model} | 
          {pdfData.drivers?.name || pdfData.driver_info} | 
          {new Date(pdfData.inspection_time || pdfData.timestamp || pdfData.created_at).toLocaleString()}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Vehicle Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Vehicle Number:</p>
            <p className="font-medium">{pdfData.vehicles?.vehicle_number}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Make/Model:</p>
            <p className="font-medium">{pdfData.vehicles?.make} {pdfData.vehicles?.model}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Inspection Type:</p>
            <p className="font-medium">
              {inspectionType === 'post' ? 'Post-Trip (Punch Out)' : 'Pre-Trip (Punch In)'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Inspection Time:</p>
            <p className="font-medium">
              {new Date(pdfData.inspection_time || pdfData.timestamp || pdfData.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-3">Driver Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Name:</p>
            <p className="font-medium">{pdfData.drivers?.name || pdfData.driver_info}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Email:</p>
            <p className="font-medium">{pdfData.drivers?.email || pdfData.users?.email}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Punch In Time:</p>
            <p className="font-medium">
              {new Date(pdfData.time_logs?.punch_in || '').toLocaleString()}
            </p>
          </div>
          {pdfData.time_logs?.punch_out && (
            <div>
              <p className="text-gray-600 text-sm">Punch Out Time:</p>
              <p className="font-medium">
                {new Date(pdfData.time_logs.punch_out).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Inspection Images</h2>
      {images && images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {images.map((image, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-2 border-b font-medium">
                {image.label || `Image ${index + 1}`}
              </div>
              <div className="p-2">
                <img 
                  src={image.url} 
                  alt={`Vehicle inspection ${image.label || index + 1}`}
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg text-center mb-6">
          <p className="text-gray-600">No inspection images available</p>
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          onClick={() => window.print()}
          icon={<i className="ri-printer-line"></i>}
        >
          Print Report
        </Button>
      </div>
    </div>
  );
};

export default PdfViewer;