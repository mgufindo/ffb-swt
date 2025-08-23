// src/components/pages/MillProductionPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchMills, fetchTripsByMillId } from "../../services/api/mills";
import { addMillProduction } from "../../services/database/crud/collections";
import { Mill, Trip, Collection } from "../../types";
import MillProductionForm from "../molecules/MillProductionForm";
import DataTable, { Column } from "../molecules/DataTable";
import Pagination from "../atoms/Pagination";
import SearchBar from "../atoms/SearchBar";
import LoadingSpinner from "../atoms/LoadingSpinner";
import { StatusBadge } from "../atoms/Badges";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const MillProductionPage: React.FC = () => {
  const { user } = useAuth();
  const [mills, setMills] = useState<Mill[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedMillId, setSelectedMillId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    loadMills();
  }, []);

  useEffect(() => {
    if (selectedMillId) {
      loadTrips();
    }
  }, [selectedMillId, currentPage, searchTerm]);

  const loadMills = async () => {
    try {
      setLoading(true);
      const userId = user?.role === "admin" ? undefined : user?.id;
      const response = await fetchMills(
        currentPage,
        itemsPerPage,
        undefined,
        userId
      );

      setMills(response.data);
      if (response.data.length > 0 && !selectedMillId) {
        setSelectedMillId(response.data[0].id);
      }
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await fetchTripsByMillId(
        selectedMillId,
        currentPage,
        itemsPerPage
      );

      let filteredTrips = response.data;
      if (searchTerm) {
        filteredTrips = response.data.filter(
          (trip) =>
            trip.vehicle.plateNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            trip.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trip.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTrips(filteredTrips);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduction = async (millId: string, weight: number) => {
    try {
      await addMillProduction(millId, weight);
      setShowProductionForm(false);
      loadTrips(); // Reload to show updated data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getTotalCollected = (trip: Trip) => {
    return trip.collections.reduce(
      (total, collection) => total + collection.weight,
      0
    );
  };

  // Columns for Trips Table
  // Columns for Trips Table - PERBAIKI BAGIAN INI
  const tripColumns: Column[] = [
    {
      key: "vehicle",
      header: "Vehicle & Driver",
      render: (value: Trip["vehicle"], row: Trip) => (
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg">
            <svg
              className="w-5 h-5 text-blue-600"
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
            <div className="text-sm font-medium text-gray-900">
              {value.plateNumber}
            </div>
            <div className="text-sm text-gray-500">{row.driver.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "scheduledDate",
      header: "Schedule",
      render: (value: Date) => {
        try {
          // ✅ PERBAIKAN: Handle invalid dates safely
          if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
            return (
              <div>
                <div className="text-sm text-gray-900">-</div>
                <div className="text-sm text-gray-500">No date</div>
              </div>
            );
          }

          return (
            <div>
              <div className="text-sm text-gray-900">
                {format(value, "dd MMM yyyy", { locale: id })}
              </div>
              <div className="text-sm text-gray-500">
                {format(value, "HH:mm", { locale: id })}
              </div>
            </div>
          );
        } catch (error) {
          console.error("Date formatting error:", error, value);
          return (
            <div>
              <div className="text-sm text-gray-900">Date Error</div>
              <div className="text-xs text-gray-500">Check format</div>
            </div>
          );
        }
      },
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value} type="trip" />,
      align: "center",
    },
    {
      key: "collections",
      header: "Collection",
      render: (value: Collection[], row: Trip) => (
        <div className="text-center">
          <div className="text-sm font-bold text-gray-900">
            {getTotalCollected(row).toFixed(1)} tons
          </div>
          <div className="text-xs text-gray-500">
            {value.length} collections
          </div>
        </div>
      ),
      align: "center",
    },
    {
      key: "mills",
      header: "Mills Visited",
      render: (value: Mill[]) => (
        <div className="text-center">
          <div className="text-sm text-gray-900">{value.length}</div>
          <div className="text-xs text-gray-500">mills</div>
        </div>
      ),
      align: "center",
    },
  ];

  // Columns for Production History - PERBAIKI JUGA
  const productionColumns: Column[] = [
    {
      key: "timestamp",
      header: "Date & Time",
      render: (value: Date) => {
        try {
          // ✅ PERBAIKAN: Handle invalid dates safely
          if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
            return (
              <div>
                <div className="text-sm font-medium text-gray-900">-</div>
                <div className="text-sm text-gray-500">No date</div>
              </div>
            );
          }

          return (
            <div>
              <div className="text-sm font-medium text-gray-900">
                {format(value, "dd MMM yyyy", { locale: id })}
              </div>
              <div className="text-sm text-gray-500">
                {format(value, "HH:mm:ss", { locale: id })}
              </div>
            </div>
          );
        } catch (error) {
          console.error("Date formatting error:", error, value);
          return (
            <div>
              <div className="text-sm font-medium text-red-900">Error</div>
              <div className="text-xs text-red-500">Invalid date</div>
            </div>
          );
        }
      },
    },
    {
      key: "weight",
      header: "Weight",
      render: (value: number) => (
        <div className="text-center">
          <span className="text-sm font-bold text-green-600">
            {value?.toFixed(2) || "0.00"}
          </span>
          <span className="text-sm text-gray-500 ml-1">tons</span>
        </div>
      ),
      align: "center",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value} type="collection" />,
      align: "center",
    },
    {
      key: "tripId",
      header: "Type",
      render: (value: string | null) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            value ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Trip" : "Manual"}
        </span>
      ),
      align: "center",
    },
  ];

  if (loading && mills.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading mills...</span>
      </div>
    );
  }

  const selectedMill = mills.find((mill) => mill.id === selectedMillId);
  const allCollections = trips.flatMap((trip) => trip.collections);
  const todayCollections = allCollections.filter((collection) => {
    try {
      const collectionDate = new Date(collection.timestamp);
      if (isNaN(collectionDate.getTime())) return false;

      return collectionDate.toDateString() === new Date().toDateString();
    } catch {
      return false;
    }
  });

  const totalProductionToday = todayCollections.reduce(
    (total, collection) => total + collection.weight,
    0
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Mill Production</h1>
          <p className="text-sm text-gray-600 mt-1">
            {selectedMill
              ? `Managing: ${selectedMill.name}`
              : "Select a mill to manage production"}
          </p>
        </div>
      </div>

      {/* Mill Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Mill
        </label>
        <select
          value={selectedMillId}
          onChange={(e) => setSelectedMillId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a mill</option>
          {mills.map((mill) => (
            <option key={mill.id} value={mill.id}>
              {mill.name} - {mill.contactPerson} ({mill.avgDailyProduction || 0}{" "}
              tons/day)
            </option>
          ))}
        </select>
      </div>

      {selectedMill && (
        <>
          {/* Production Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Daily Target
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMill.avgDailyProduction?.toFixed(1) || 0} tons
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
                  <p className="text-sm font-medium text-gray-600">
                    Today's Production
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalProductionToday.toFixed(1)} tons
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600"
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
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.max(
                      0,
                      (selectedMill.avgDailyProduction || 0) -
                        totalProductionToday
                    ).toFixed(1)}{" "}
                    tons
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Trips
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {trips.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search trips, vehicles, or drivers..."
            />
          </div>

          {/* Trips Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Trips
            </h2>
            <DataTable
              columns={tripColumns}
              data={trips}
              loading={loading}
              emptyMessage="No trips found for this mill."
              keyField="id"
            />
          </div>

          {/* Production History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Production History
            </h2>
            <DataTable
              columns={productionColumns}
              data={allCollections.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )}
              loading={loading}
              emptyMessage="No production records found."
              keyField="id"
            />
          </div>

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
        </>
      )}
    </div>
  );
};

export default MillProductionPage;
