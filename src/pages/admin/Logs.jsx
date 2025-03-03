import { useState, useEffect } from 'react';
import { supabase, storage } from '../../services/supabase';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Logs = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 10;

  // Update current time every second to show elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch time logs
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('time_logs')
          .select(`
            id,
            punch_in,
            punch_out,
            created_at,
            drivers:users!time_logs_driver_id_fkey(id, name, email),
            vehicles(id, vehicle_number, make, model)
          `, { count: 'exact' })
          .order('punch_in', { ascending: false });
        
        // Apply date filter
        if (dateFilter === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          query = query.gte('punch_in', today.toISOString());
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query = query.gte('punch_in', weekAgo.toISOString());
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          query = query.gte('punch_in', monthAgo.toISOString());
        } else if (dateFilter === 'custom' && startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          query = query
            .gte('punch_in', start.toISOString())
            .lte('punch_in', end.toISOString());
        }
        
        // Calculate pagination
        const from = (currentPage - 1) * logsPerPage;
        const to = from + logsPerPage - 1;
        
        // Execute query with pagination
        const { data, error, count } = await query
          .range(from, to);
        
        if (error) throw error;
        
        setLogs(data || []);
        setTotalPages(Math.ceil((count || 0) / logsPerPage));
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load time logs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [dateFilter, startDate, endDate, currentPage]);

  // Generate PDF for a time log
  const generatePdf = async (log, type = 'punch-in') => {
    if (!log) return;
    
    setIsPdfGenerating(true);
    
    try {
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Set title and header
      const title = type === 'punch-in' 
        ? `Punch-In Report: ${new Date(log.punch_in).toLocaleString()}`
        : `Punch-Out Report: ${new Date(log.punch_out).toLocaleString()}`;
      
      doc.setFontSize(18);
      doc.text(title, pageWidth / 2, 15, { align: 'center' });
      
      // Add driver and vehicle info
      doc.setFontSize(12);
      doc.text(`Driver: ${log.drivers?.name || 'Unknown Driver'}`, 20, 30);
      doc.text(`Email: ${log.drivers?.email || 'Unknown'}`, 20, 38);
      doc.text(`Vehicle: ${log.vehicles?.vehicle_number || 'Unknown'} - ${log.vehicles ? `${log.vehicles.make} ${log.vehicles.model}` : ''}`, 20, 46);
      
      // Add time information
      doc.text(`Punch In: ${new Date(log.punch_in).toLocaleString()}`, 20, 60);
      
      if (log.punch_out) {
        doc.text(`Punch Out: ${new Date(log.punch_out).toLocaleString()}`, 20, 68);
        
        // Calculate duration
        const punchIn = new Date(log.punch_in);
        const punchOut = new Date(log.punch_out);
        const durationMs = punchOut - punchIn;
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        
        doc.text(`Duration: ${hours}h ${minutes}m ${seconds}s`, 20, 76);
      } else {
        doc.text(`Status: In Progress`, 20, 68);
      }
      
      // Try to fetch and add images
      try {
        // Get folder name based on type
        const folderPrefix = type === 'punch-in' ? 'PunchIn' : 'PunchOut';
        const folderPath = `${folderPrefix}-${log.vehicle_id}`;
        
        // List files in the folder
        const { data: files } = await storage.listFiles('vehicle_images', folderPath);
        
        if (files && files.length > 0) {
          doc.addPage();
          doc.text('Vehicle Inspection Images', pageWidth / 2, 15, { align: 'center' });
          
          // Add images to PDF (max 6 images to keep file size manageable)
          const imagesToInclude = files.slice(0, 6);
          let yPosition = 30;
          
          for (let i = 0; i < imagesToInclude.length; i++) {
            const file = imagesToInclude[i];
            const publicUrl = storage.getPublicUrl('vehicle_images', `${folderPath}/${file.name}`);
            
            try {
              // Only add image if we have enough space on the page
              if (yPosition > 240) {
                doc.addPage();
                yPosition = 30;
              }
              
              doc.text(`Image ${i+1}`, 20, yPosition);
              
              // Use a placeholder instead of actual image to keep things simple and fast
              doc.setDrawColor(200);
              doc.setFillColor(240);
              doc.rect(20, yPosition + 5, 170, 80, 'FD');
              doc.setFontSize(10);
              doc.text(`Vehicle image (${file.name})`, 105, yPosition + 45, { align: 'center' });
              
              yPosition += 90;
            } catch (imgErr) {
              console.error('Error adding image to PDF:', imgErr);
            }
          }
        }
      } catch (filesErr) {
        console.error('Error fetching images for PDF:', filesErr);
        // Continue without images if there's an error
      }
      
      // Add timestamp and footer
      const timestamp = new Date().toLocaleString();
      doc.setFontSize(10);
      doc.text(`Generated on: ${timestamp}`, 20, doc.internal.pageSize.getHeight() - 10);
      
      // Save the PDF
      doc.save(`${type === 'punch-in' ? 'PunchIn' : 'PunchOut'}_${log.id}.pdf`);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // View log details
  const handleViewLog = async (log) => {
    setSelectedLog(log);
    
    try {
      // Get both pre and post inspection images
      const preFolder = `PunchIn-${log.vehicle_id}`;
      const postFolder = `PunchOut-${log.vehicle_id}`;
      
      // Fetch inspection records
      const { data: inspections, error: inspError } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .or(`vehicle_id.eq.${log.vehicle_id},time_log_id.eq.${log.id}`);
      
      if (inspError) throw inspError;
      
      // Try to get images
      let images = [];
      
      try {
        // Pre images
        const { data: preFiles } = await storage.listFiles('vehicle_images', preFolder);
        if (preFiles && preFiles.length > 0) {
          const preImages = preFiles.map(file => ({
            name: file.name,
            type: 'pre',
            url: storage.getPublicUrl('vehicle_images', `${preFolder}/${file.name}`)
          }));
          images = [...images, ...preImages];
        }
        
        // Post images if log is completed
        if (log.punch_out) {
          const { data: postFiles } = await storage.listFiles('vehicle_images', postFolder);
          if (postFiles && postFiles.length > 0) {
            const postImages = postFiles.map(file => ({
              name: file.name,
              type: 'post',
              url: storage.getPublicUrl('vehicle_images', `${postFolder}/${file.name}`)
            }));
            images = [...images, ...postImages];
          }
        }
      } catch (imgErr) {
        console.log('Could not fetch images (this is normal if none exist):', imgErr);
      }
      
      // Update selected log with inspection data
      setSelectedLog({
        ...log,
        inspections: inspections || [],
        inspection_images: images
      });
      
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching log details:', err);
      // Still open modal but without images
      setIsModalOpen(true);
    }
  };

  // Calculate duration between punch in and punch out
  const calculateDuration = (punchIn, punchOut) => {
    const start = new Date(punchIn);
    let end;
    
    if (punchOut) {
      end = new Date(punchOut);
    } else {
      // For in-progress logs, use current time to show elapsed time
      end = currentTime;
    }
    
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format time as HH:MM:SS
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true  // Set to false if you want 24-hour format
    });
  };

  // Filter logs by search term
  const filteredLogs = logs.filter(log => {
    const driverName = log.drivers?.name || '';
    const vehicleNumber = log.vehicles?.vehicle_number || '';
    
    return (
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isLoading && logs.length === 0) {
    return <Loading.Page />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Time Logs</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by driver or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Date Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-medium text-gray-700 mb-3">Date Filter</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              dateFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              dateFilter === 'today'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              dateFilter === 'week'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Past Week
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              dateFilter === 'month'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Past Month
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              dateFilter === 'custom'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Custom Range
          </button>
        </div>
        
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  if (startDate && endDate) {
                    setCurrentPage(1);
                  } else {
                    alert('Please select both start and end dates');
                  }
                }}
              >
                Apply Filter
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Punch In
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Punch Out
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No logs match your search' : 'No time logs found for the selected period'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.drivers?.name || 'Unknown Driver'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.drivers?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.vehicles?.vehicle_number || 'Unknown Vehicle'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.vehicles ? `${log.vehicles.make} ${log.vehicles.model}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(log.punch_in)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(log.punch_in)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.punch_out ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {formatDate(log.punch_out)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(log.punch_out)}
                          </div>
                        </>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {calculateDuration(log.punch_in, null)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {calculateDuration(log.punch_in, log.punch_out)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewLog(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Log Detail Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Time Log Details</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedLog(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Driver</h4>
                  <p className="text-base font-medium">
                    {selectedLog.drivers?.name || 'Unknown Driver'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedLog.drivers?.email || ''}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h4>
                  <p className="text-base font-medium">
                    {selectedLog.vehicles?.vehicle_number || 'Unknown Vehicle'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedLog.vehicles ? `${selectedLog.vehicles.make} ${selectedLog.vehicles.model}` : ''}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Punch In</h4>
                  <p className="text-base font-medium">
                    {formatDate(selectedLog.punch_in)} at {formatTime(selectedLog.punch_in)}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Punch Out</h4>
                  {selectedLog.punch_out ? (
                    <p className="text-base font-medium">
                      {formatDate(selectedLog.punch_out)} at {formatTime(selectedLog.punch_out)}
                    </p>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {calculateDuration(selectedLog.punch_in, null)}
                    </span>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Duration</h4>
                  <p className="text-base font-medium">
                    {calculateDuration(selectedLog.punch_in, selectedLog.punch_out)}
                  </p>
                </div>
              </div>
              
              {/* Vehicle Images */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Vehicle Images</h4>
                
                {selectedLog.inspection_images && selectedLog.inspection_images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedLog.inspection_images.map((image, index) => (
                      <div key={index} className="relative border rounded-lg overflow-hidden">
                        <img 
                          src={image.url} 
                          alt={`Inspection ${index + 1}`} 
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                          {image.type === 'pre' ? 'Before Task' : 'After Task'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No images available for this time log.</p>
                )}
                
                {/* PDF Download Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => generatePdf(selectedLog, 'punch-in')}
                    disabled={isPdfGenerating}
                    className="px-3 py-2 bg-blue-500 text-white rounded flex items-center text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isPdfGenerating ? (
                      <>
                        <i className="ri-loader-2-line animate-spin mr-1"></i> Generating...
                      </>
                    ) : (
                      <>
                        <i className="ri-file-pdf-line mr-1"></i> Download Punch-In PDF
                      </>
                    )}
                  </button>
                  
                  {selectedLog.punch_out && (
                    <button
                      onClick={() => generatePdf(selectedLog, 'punch-out')}
                      disabled={isPdfGenerating}
                      className="px-3 py-2 bg-green-500 text-white rounded flex items-center text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                      {isPdfGenerating ? (
                        <>
                          <i className="ri-loader-2-line animate-spin mr-1"></i> Generating...
                        </>
                      ) : (
                        <>
                          <i className="ri-file-pdf-line mr-1"></i> Download Punch-Out PDF
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedLog(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;