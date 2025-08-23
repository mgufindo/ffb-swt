// src/components/organisms/TripManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchTrips, addTrip, modifyTrip, removeTrip } from '../../services/api/trips';
import { Trip, TripStatus } from '../../types';
import TripForm from '../molecules/TripForm';
import Pagination from '../atoms/Pagination';
import SearchBar from '../atoms/SearchBar';
import LoadingSpinner from '../atoms/LoadingSpinner';
import ConfirmModal from '../atoms/ConfirmModal';
import DataTable, { Column } from '../molecules/DataTable';

const TripManagement: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; trip: Trip | null }>({
    isOpen: false,
    trip: null
  });
  const itemsPerPage = 10;

  useEffect(() => {
    loadTrips();
  }, [currentPage, searchTerm]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const userId = user?.role === 'admin' ? undefined : user?.id;
      const response = await fetchTrips(currentPage, itemsPerPage, searchTerm, userId);

      setTrips(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (tripData: Omit<Trip, 'id'>) => {
    try {
      await addTrip(tripData);
      setShowForm(false);
      await loadTrips();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id: string, tripData: Partial<Omit<Trip, 'id'>>) => {
    try {
      await modifyTrip(id, tripData);
      setEditingTrip(null);
      await loadTrips();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.trip) return;
    
    try {
      await removeTrip(deleteConfirm.trip.id);
      setDeleteConfirm({ isOpen: false, trip: null });
      await loadTrips();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = trips.length;
    const scheduled = trips.filter(t => t.status === 'SCHEDULED').length;
    const inProgress = trips.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = trips.filter(t => t.status === 'COMPLETED').length;
    
    return { total, scheduled, inProgress, completed };
  }, [trips]);

  // Status badge component
  const StatusBadge: React.FC<{ status: TripStatus }> = ({ status }) => {
    const statusConfig = {
      SCHEDULED: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.SCHEDULED;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Columns configuration for the table
  const columns: Column[] = [
    {
      key: 'vehicle',
      header: 'Trip Details',
      render: (value, row: Trip) => (
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">Trip #{row.id.slice(0, 8)}</div>
            <div className="text-sm text-gray-500">{row.vehicle.plateNumber} • {row.vehicle.type}</div>
          </div>
        </div>
      )
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (value) => (
        <div>
          <div className="text-sm text-gray-900">{value.name}</div>
          <div className="text-sm text-gray-500">{value.phoneNumber}</div>
        </div>
      )
    },
    {
      key: 'mills',
      header: 'Mills',
      render: (value: Trip['mills']) => (
        <div>
          {value.map((mill, index) => (
            <div key={mill.id} className="text-sm text-gray-900">
              {index + 1}. {mill.name}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'scheduledDate',
      header: 'Schedule',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />,
      align: 'center'
    }
  ];

  // Row actions for admin users
  const rowActions = (row: Trip) => (
    <div className="flex items-center justify-end space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditingTrip(row);
        }}
        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded hover:bg-indigo-50"
        title="Edit trip"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDeleteConfirm({ isOpen: true, trip: row });
        }}
        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
        title="Delete trip"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12M9 6h6m-3-3v3m-3 0h6m-6 0H9m0 0V3m3 0h3m-3 0H9m0 0H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V9a2 2 0 00-2-2H9z" />
        </svg>
      </button>
    </div>
  );

  if (loading && trips.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading trips...</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage evacuation trips efficiently</p>
        </div>
        
        <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center shadow-md transition-all duration-200"
          >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            
            Plan Trip
          </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
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
              placeholder="Search trips by vehicle, driver, or mill..."
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={trips}
        loading={loading}
        emptyMessage={'No trips found. Click "Plan Trip" to create one.'}
        rowActions={rowActions}
        onRowClick={(trip) => setEditingTrip(trip)}
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
      {(showForm || editingTrip) && (
        <TripForm
          trip={editingTrip || undefined}
          onSubmit={editingTrip ? 
            (data) => handleUpdate(editingTrip.id, data) : 
            handleCreate
          }
          onCancel={() => {
            setShowForm(false);
            setEditingTrip(null);
          }}
          isOpen={true}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, trip: null })}
        onConfirm={handleDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete trip #${deleteConfirm.trip?.id.slice(0, 8)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TripManagement;