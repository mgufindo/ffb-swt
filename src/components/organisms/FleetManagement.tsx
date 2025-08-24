import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchVehicles,
  addVehicle,
  modifyVehicle,
  removeVehicle,
} from "../../services/api/vehicles";
import { Vehicle } from "../../types";
import VehicleForm from "../molecules/VehicleForm";
import Pagination from "../atoms/Pagination";
import SearchBar from "../atoms/SearchBar";
import LoadingSpinner from "../atoms/LoadingSpinner";
import ConfirmModal from "../atoms/ConfirmModal";
import DataTable, { Column } from "../molecules/DataTable";
import { StatusBadge, TypeBadge } from "../atoms/Badges";

const FleetOverview: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    vehicle: Vehicle | null;
  }>({
    isOpen: false,
    vehicle: null,
  });
  const itemsPerPage = 10;

  useEffect(() => {
    loadVehicles();
  }, [currentPage, searchTerm]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const userId = user?.role === "client" ? user.id : undefined;

      const response = await fetchVehicles(
        currentPage,
        itemsPerPage,
        searchTerm,
        userId
      );

      let filteredVehicles = response.data;
      if (searchTerm) {
        filteredVehicles = response.data.filter(
          (vehicle) =>
            vehicle.plateNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            vehicle.driver.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            vehicle.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTotalVehicles(response.total);
      setVehicles(filteredVehicles);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (vehicleData: Omit<Vehicle, "id">) => {
    try {
      await addVehicle(vehicleData);
      setShowForm(false);
      loadVehicles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (
    id: string,
    vehicleData: Partial<Omit<Vehicle, "id">>
  ) => {
    try {
      await modifyVehicle(id, vehicleData);
      setEditingVehicle(null);
      loadVehicles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.vehicle) return;

    try {
      await removeVehicle(deleteConfirm.vehicle.id);
      setDeleteConfirm({ isOpen: false, vehicle: null });
      loadVehicles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Columns configuration for the table
  const columns: Column[] = [
    {
      key: "plateNumber",
      header: "Vehicle",
      render: (value, row: Vehicle) => (
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
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
      key: "driver",
      header: "Driver",
      render: (value: Vehicle["driver"]) => (
        <div>
          <div className="text-sm text-gray-900">{value.name}</div>
          <div className="text-sm text-gray-500">{value.phoneNumber}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (value) => <TypeBadge type={value} />,
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (value) => (
        <div className="text-sm text-gray-900">{value} tons</div>
      ),
      align: "center",
    },
    {
      key: "client",
      header: "Client",
      render: (_, row: Vehicle) => (
        <div>
          <div className="text-sm text-gray-900">{row.users}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value} type="vehicle" />,
      align: "center",
    },
  ];

  // Row actions for admin users
  const rowActions = (row: Vehicle) => (
    <div className="flex items-center justify-end space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditingVehicle(row);
        }}
        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded hover:bg-indigo-50"
        title="Edit vehicle"
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
          setDeleteConfirm({ isOpen: true, vehicle: row });
        }}
        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
        title="Delete vehicle"
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

  if (loading) {
    return (
      <div
        className="flex justify-center items-center py-12"
        data-testid="loading-spinner-lg"
      >
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading vehicles...</span>
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Fleet</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your vehicle fleet efficiently
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
          Add Vehicle
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Vehicles
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalVehicles}
              </p>
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p
                className="text-sm font-medium text-gray-600"
                data-testid="available-label"
              >
                Available
              </p>
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter((v) => v.status === "AVAILABLE").length}
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
              <p className="text-sm font-medium text-gray-600">In Use</p>
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter((v) => v.status === "IN_USE").length}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {vehicles.filter((v) => v.status === "MAINTENANCE").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        data-testid="search-bar"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search vehicles"
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        emptyMessage={'No vehicles found. Click "Add Vehicle" to create one.'}
        rowActions={rowActions}
        keyField="id"
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

      {/* Modals */}
      {(showForm || !!editingVehicle) && (
        <div data-testid="vehicle-form">
          <VehicleForm
            vehicle={editingVehicle || undefined}
            onSubmit={
              editingVehicle
                ? (data) => handleUpdate(editingVehicle.id, data)
                : handleCreate
            }
            onCancel={() => {
              setShowForm(false);
              setEditingVehicle(null);
            }}
            isOpen={true}
          />
        </div>
      )}

      {deleteConfirm.isOpen && (
        <div data-testid="confirm-modal">
          <ConfirmModal
            isOpen={deleteConfirm.isOpen}
            onClose={() => setDeleteConfirm({ isOpen: false, vehicle: null })}
            onConfirm={handleDelete}
            title="Delete Vehicle"
            message={`Are you sure you want to delete vehicle ${deleteConfirm.vehicle?.plateNumber}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
          />
        </div>
      )}
    </div>
  );
};

export default FleetOverview;
