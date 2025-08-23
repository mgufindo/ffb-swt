// src/components/organisms/DriverManagement.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchDrivers,
  addDriver,
  modifyDriver,
  removeDriver,
} from "../../services/api/drivers";
import { Driver, DriverStatus } from "../../types";
import DriverForm from "../molecules/DriverForm";
import Pagination from "../atoms/Pagination";
import SearchBar from "../atoms/SearchBar";
import LoadingSpinner from "../atoms/LoadingSpinner";
import ConfirmModal from "../atoms/ConfirmModal";
import DataTable, { Column } from "../molecules/DataTable";

const DriverManagement: React.FC = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    driver: Driver | null;
  }>({
    isOpen: false,
    driver: null,
  });
  const itemsPerPage = 10;

  useEffect(() => {
    loadDrivers();
  }, [currentPage, searchTerm]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const userId = user?.role === "client" ? user.id : undefined;
      const response = await fetchDrivers(
        currentPage,
        itemsPerPage,
        searchTerm,
        userId
      );

      setDrivers(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (driverData: Omit<Driver, "id">) => {
    try {
      await addDriver(driverData);
      setShowForm(false);
      await loadDrivers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (
    id: string,
    driverData: Partial<Omit<Driver, "id">>
  ) => {
    try {
      await modifyDriver(id, driverData);
      setEditingDriver(null);
      await loadDrivers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.driver) return;

    try {
      await removeDriver(deleteConfirm.driver.id);
      setDeleteConfirm({ isOpen: false, driver: null });
      await loadDrivers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.status === "AVAILABLE").length;
    const onTrip = drivers.filter((d) => d.status === "ON_TRIP").length;
    const offDuty = drivers.filter(
      (d) => d.status === "OFF_DUTY" || d.status === "SICK"
    ).length;

    return { total, available, onTrip, offDuty };
  }, [drivers]);

  // Status badge component
  const StatusBadge: React.FC<{ status: DriverStatus }> = ({ status }) => {
    const statusConfig = {
      AVAILABLE: { color: "bg-green-100 text-green-800", label: "Available" },
      ON_TRIP: { color: "bg-blue-100 text-blue-800", label: "On Trip" },
      OFF_DUTY: { color: "bg-yellow-100 text-yellow-800", label: "Off Duty" },
      SICK: { color: "bg-red-100 text-red-800", label: "Sick" },
    };

    const config = statusConfig[status] || statusConfig.AVAILABLE;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Columns configuration for the table
  const columns: Column[] = [
    {
      key: "name",
      header: "Driver",
      render: (value, row: Driver) => (
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              ID: {row.id.slice(0, 8)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "licenseNumber",
      header: "License Number",
      render: (value) => <div className="text-sm text-gray-900">{value}</div>,
    },
    {
      key: "phoneNumber",
      header: "Phone Number",
      render: (value) => <div className="text-sm text-gray-900">{value}</div>,
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value} />,
      align: "center",
    },
  ];

  // Row actions for admin users
  const rowActions = (row: Driver) => (
    <div className="flex items-center justify-end space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditingDriver(row);
        }}
        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded hover:bg-indigo-50"
        title="Edit driver"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDeleteConfirm({ isOpen: true, driver: row });
        }}
        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
        title="Delete driver"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );

  if (loading && drivers.length === 0) {
    return (
      <div
        className="flex justify-center items-center py-12"
        data-testid="loading-spinner-lg"
      >
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading drivers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0118 0z"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Driver Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your drivers efficiently
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center shadow-md transition-all duration-200"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Driver
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.available}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On Trip</p>
              <p className="text-2xl font-bold text-blue-600">{stats.onTrip}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Off Duty</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.offDuty}
              </p>
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
              placeholder="Search drivers by name, license, or phone..."
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={drivers}
        loading={loading}
        emptyMessage={'No drivers found. Click "Add Driver" to create one.'}
        rowActions={rowActions}
        onRowClick={(driver) => setEditingDriver(driver)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          data-testid="pagination"
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals - Auto-open when editing or adding */}
      {(showForm || editingDriver) && (
        <DriverForm
          driver={editingDriver || undefined}
          onSubmit={
            editingDriver
              ? (data) => handleUpdate(editingDriver.id, data)
              : handleCreate
          }
          onCancel={() => {
            setShowForm(false);
            setEditingDriver(null);
          }}
          isOpen={true}
        />
      )}
      {deleteConfirm.isOpen && (
        <div data-testid="confirm-modal">
          <ConfirmModal
            isOpen={deleteConfirm.isOpen}
            onClose={() => setDeleteConfirm({ isOpen: false, driver: null })}
            onConfirm={handleDelete}
            title="Delete Driver"
            message={`Are you sure you want to delete driver ${deleteConfirm.driver?.name}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
          />
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
