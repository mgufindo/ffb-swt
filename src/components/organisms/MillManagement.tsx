// src/components/organisms/MillManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchMills, addMill, modifyMill, removeMill } from '../../services/api/mills';
import { Mill } from '../../types';
import MillForm from '../molecules/MillForm';
import Pagination from '../atoms/Pagination';
import SearchBar from '../atoms/SearchBar';
import LoadingSpinner from '../atoms/LoadingSpinner';
import ConfirmModal from '../atoms/ConfirmModal';

// Define column interface for DataTable
interface Column {
  key: string;
  header: string;
  render?: (value: any, row: Mill) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

const MillManagement: React.FC = () => {
  const { user } = useAuth();
  const [mills, setMills] = useState<Mill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMill, setEditingMill] = useState<Mill | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; mill: Mill | null }>({
    isOpen: false,
    mill: null
  });
  const itemsPerPage = 10;

  useEffect(() => {
    loadMills();
  }, [currentPage, searchTerm]);

  const loadMills = async () => {
    try {
      setLoading(true);
      const userId = user?.role === 'client' ? user.id : undefined;
      const response = await fetchMills(currentPage, itemsPerPage, searchTerm, userId);
      
      setMills(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load mills');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (millData: Omit<Mill, 'id'>) => {
    try {
      await addMill(millData);
      setShowForm(false);
      loadMills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id: string, millData: Partial<Omit<Mill, 'id'>>) => {
    try {
      await modifyMill(id, millData);
      setEditingMill(null);
      loadMills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.mill) return;
    
    try {
      await removeMill(deleteConfirm.mill.id);
      setDeleteConfirm({ isOpen: false, mill: null });
      loadMills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = mills.length;
    const totalProduction = mills.reduce((sum, mill) => sum + mill.avgDailyProduction, 0);
    const avgProduction = mills.length ? totalProduction / mills.length : 0;
    
    return { total, totalProduction, avgProduction };
  }, [mills]);

  // Columns configuration for the table
  const columns: Column[] = [
    {
      key: 'name',
      header: 'Mill',
      render: (value, row: Mill) => (
        <div className="flex items-center">
          <div className="bg-orange-100 p-2 rounded-lg">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
            </svg>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">ID: {row.id.slice(0, 8)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (value) => <div className="text-sm text-gray-900">Lat: {value.lat}, Lng: {value.lng}</div>
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (value) => <div className="text-sm text-gray-900">{value}</div>
    },
    {
      key: 'phoneNumber',
      header: 'Phone Number',
      render: (value) => <div className="text-sm text-gray-900">{value}</div>
    },
    {
      key: 'avgDailyProduction',
      header: 'Daily Production',
      render: (value) => (
        <div className="text-sm text-gray-900 font-medium">
          {value} tons
        </div>
      ),
      align: 'center'
    }
  ];

  // Row actions for admin users
  const rowActions = (row: Mill) => (
    <div className="flex items-center justify-end space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditingMill(row);
        }}
        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded hover:bg-indigo-50"
        title="Edit mill"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDeleteConfirm({ isOpen: true, mill: row });
        }}
        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
        title="Delete mill"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  // Simple DataTable component implementation
  const DataTable: React.FC<{
    columns: Column[];
    data: Mill[];
    loading?: boolean;
    emptyMessage?: string;
    rowActions?: (row: Mill) => React.ReactNode;
    onRowClick?: (row: Mill) => void;
  }> = ({ columns, data, loading, emptyMessage, rowActions, onRowClick }) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Loading mills...</span>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No mills found</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {rowActions && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr 
                key={row.id} 
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row[column.key as keyof Mill], row) : row[column.key as keyof Mill]}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading && mills.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading mills...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mill Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage palm oil mills efficiently</p>
        </div>
        <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center shadow-md transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Mill
          </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Mills</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Production</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalProduction} tons/day</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Production</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgProduction.toFixed(1)} tons/day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <SearchBar 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search mills by name, location, or contact..."
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={mills}
        loading={loading}
        emptyMessage={'No mills found. Click "Add Mill" to create one.'}
        rowActions={rowActions}
        onRowClick={(mill) => setEditingMill(mill)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals - Auto-open when editing or adding */}
      {(showForm || editingMill) && (
        <MillForm
          mill={editingMill || undefined}
          onSubmit={editingMill ? 
            (data) => handleUpdate(editingMill.id, data) : 
            handleCreate
          }
          onCancel={() => {
            setShowForm(false);
            setEditingMill(null);
          }}
          isOpen={true}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, mill: null })}
        onConfirm={handleDelete}
        title="Delete Mill"
        message={`Are you sure you want to delete mill ${deleteConfirm.mill?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default MillManagement;