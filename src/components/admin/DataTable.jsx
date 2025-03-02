import { useState, useEffect } from 'react';
import Button from '../common/Button';

const DataTable = ({
  columns,
  data,
  isLoading = false,
  pagination = false,
  itemsPerPageOptions = [10, 25, 50, 100],
  defaultItemsPerPage = 10,
  searchable = false,
  searchPlaceholder = 'Search...',
  selectable = false,
  onRowClick,
  onSelectionChange,
  actions,
  emptyStateMessage = 'No data available',
  className = '',
  ...props
}) => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  // State for selected rows
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data?.length, searchTerm]);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedRows([]);
    setSelectAll(false);
  }, [data]);

  // Notify parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRows);
    }
  }, [selectedRows, onSelectionChange]);

  // Filter data based on search term
  const filteredData = searchTerm && data
    ? data.filter(item => {
        return columns.some(column => {
          if (!column.searchable) return false;
          
          const value = column.accessor 
            ? (typeof column.accessor === 'function' ? column.accessor(item) : item[column.accessor])
            : '';
            
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      })
    : data || [];

  // Sort data
  const sortedData = sortConfig.key 
    ? [...filteredData].sort((a, b) => {
        const column = columns.find(col => col.accessor === sortConfig.key);
        
        let aValue = column.accessor 
          ? (typeof column.accessor === 'function' ? column.accessor(a) : a[column.accessor])
          : '';
          
        let bValue = column.accessor 
          ? (typeof column.accessor === 'function' ? column.accessor(b) : b[column.accessor])
          : '';
        
        // Handle nullable values
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        
        // Custom sorting function
        if (column.sortFunction) {
          return column.sortFunction(aValue, bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        
        // Default sorting behavior
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        
        return (aValue > bValue ? 1 : -1) * (sortConfig.direction === 'asc' ? 1 : -1);
      })
    : filteredData;

  // Paginate data
  const paginatedData = pagination 
    ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedData;

  // Total pages for pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle sort
  const handleSort = (key) => {
    const column = columns.find(col => col.accessor === key);
    if (column?.sortable === false) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key 
        ? (prevConfig.direction === 'asc' ? 'desc' : 'asc')
        : 'asc'
    }));
  };

  // Handle item selection
  const handleSelectRow = (id) => {
    setSelectedRows(prevSelected => {
      const isSelected = prevSelected.includes(id);
      
      if (isSelected) {
        setSelectAll(false);
        return prevSelected.filter(rowId => rowId !== id);
      } else {
        const newSelection = [...prevSelected, id];
        if (newSelection.length === sortedData.length) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(sortedData.map(row => row.id));
    }
    setSelectAll(!selectAll);
  };

  // Get row ID
  const getRowId = (row) => {
    return row.id || row._id;
  };

  // Check if row is selected
  const isRowSelected = (id) => {
    return selectedRows.includes(id);
  };

  // Get sort direction indicator
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <i className="ri-arrow-up-down-line text-gray-400 ml-1"></i>;
    }
    
    return sortConfig.direction === 'asc' 
      ? <i className="ri-arrow-up-line text-primary ml-1"></i>
      : <i className="ri-arrow-down-line text-primary ml-1"></i>;
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`} {...props}>
      {/* Table controls */}
      {(searchable || actions || pagination) && (
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex flex-1 items-center">
            {searchable && (
              <div className="relative max-w-xs">
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="ri-close-line text-gray-400 hover:text-gray-500"></i>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {actions && (
            <div className="flex space-x-3">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th scope="col" className="px-6 py-3 w-px">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable !== false && handleSort(column.accessor)}
                  style={column.width ? { width: column.width } : {}}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable !== false && getSortIcon(column.accessor)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                    <p>Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyStateMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const selected = isRowSelected(rowId);
                
                return (
                  <tr 
                    key={rowId || rowIndex} 
                    className={`hover:bg-gray-50 ${selected ? 'bg-primary/5' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {selectable && (
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            checked={selected}
                            onChange={() => handleSelectRow(rowId)}
                          />
                        </div>
                      </td>
                    )}
                    
                    {columns.map((column, colIndex) => {
                      const cellValue = column.accessor 
                        ? (typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor])
                        : '';
                      
                      return (
                        <td 
                          key={`${rowId || rowIndex}-${column.accessor || colIndex}`} 
                          className={`px-6 py-4 ${column.cellClassName || ''}`}
                        >
                          {column.Cell ? column.Cell({ value: cellValue, row }) : cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className="px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, sortedData.length)}</span>
              {' '} to {' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span>
              {' '} of {' '}
              <span className="font-medium">{sortedData.length}</span> results
            </span>
            
            <div className="ml-4">
              <select
                className="form-select rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <i className="ri-arrow-left-double-line"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="ri-arrow-left-line"></i>
            </Button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = idx + 1;
                } else if (currentPage <= 3) {
                  pageNumber = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + idx;
                } else {
                  pageNumber = currentPage - 2 + idx;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNumber
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="ri-arrow-right-line"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <i className="ri-arrow-right-double-line"></i>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;