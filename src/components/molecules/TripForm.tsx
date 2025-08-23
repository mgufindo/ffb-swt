import React, { useState, useEffect } from "react";
import {
  Trip,
  Vehicle,
  Mill,
  Collection,
  CollectionStatus,
  User,
} from "../../types";
import { fetchVehicles } from "../../services/api/vehicles";
import { fetchMills } from "../../services/api/mills";
import { getAllClient } from "../../services/api/auth";
import { useAuth } from "../../hooks/useAuth";

interface TripFormProps {
  trip?: Trip;
  onSubmit: (data: Omit<Trip, "id">) => void;
  onCancel: () => void;
}

interface MillWithWeight extends Mill {
  estimatedWeight: number;
}

// Helper function to calculate estimated number of trips needed
const calculateEstimatedTrips = (
  totalWeight: number,
  vehicleCapacity: number
): number => {
  if (vehicleCapacity <= 0) return 0;
  return Math.ceil(vehicleCapacity / totalWeight);
};

const TripForm: React.FC<TripFormProps> = ({ trip, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [vehicleId, setVehicleId] = useState(trip?.vehicle.id || "");
  const [selectedMills, setSelectedMills] = useState<MillWithWeight[]>(
    trip?.mills.map((mill) => ({
      ...mill,
      estimatedWeight:
        trip.collections?.find((c) => c.millId === mill.id)?.weight || 0,
    })) || []
  );
  const [scheduledDate, setScheduledDate] = useState(
    trip?.scheduledDate.toISOString().slice(0, 16) || ""
  );
  const [estimatedDuration, setEstimatedDuration] = useState(
    trip?.estimatedDuration || 0
  );
  const [status, setStatus] = useState(trip?.status || "SCHEDULED");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allMills, setAllMills] = useState<Mill[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(trip?.userId || "");
  const [clients, setClients] = useState<User[]>([]);
  const [estimatedTrips, setEstimatedTrips] = useState(1);

  useEffect(() => {
    loadData();
    getClient();
  }, []);

  // Calculate estimated trips whenever selected mills or vehicle changes
  useEffect(() => {
    if (vehicleId) {
      const millCapacityTotal = selectedMills.reduce(
        (total, mill) => total + (mill.avgDailyProduction || 0),
        0
      );

      const totalWeight = getTotalWeight();
      const trips = calculateEstimatedTrips(totalWeight, millCapacityTotal);
      setEstimatedTrips(trips);
    }
  }, [selectedMills, vehicleId]);

  const getClient = async () => {
    try {
      setLoading(true);
      const response = await getAllClient();
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const vehiclesResponse = await fetchVehicles(1, 100);
      const millsResponse = await fetchMills(1, 100);

      setVehicles(
        vehiclesResponse.data.filter(
          (vehicle) =>
            vehicle.status && vehicle.status.toUpperCase() === "AVAILABLE"
        )
      );
      setAllMills(millsResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
    const selectedClient = clients.find((c) => c.id === clientId);

    if (!selectedVehicle || selectedMills.length === 0) {
      alert("Please select a vehicle and at least one mill");
      return;
    }

    // Create collections for each selected mill with their weights
    const collections: Omit<Collection, "id">[] = selectedMills.map((mill) => ({
      tripId: trip?.id || "temp",
      millId: mill.id,
      timestamp: new Date(scheduledDate),
      weight: mill.estimatedWeight,
      status: "PENDING" as CollectionStatus,
      userId:
        user?.role === "admin"
          ? selectedClient?.id ?? user.id ?? ""
          : user?.id ?? "",
    }));

    onSubmit({
      vehicle: selectedVehicle,
      driver: selectedVehicle.driver,
      mills: selectedMills,
      scheduledDate: new Date(scheduledDate),
      status: status as any,
      collections,
      estimatedDuration,
      userId:
        user?.role === "admin"
          ? selectedClient?.id ?? user.id ?? ""
          : user?.id ?? "",
    });
  };

  const toggleMillSelection = (mill: Mill) => {
    setSelectedMills((prev) => {
      const isSelected = prev.some((m) => m.id === mill.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== mill.id);
      } else {
        return [
          ...prev,
          { ...mill, estimatedWeight: mill.avgDailyProduction || 0 },
        ];
      }
    });
  };

  const updateMillWeight = (millId: string, weight: number) => {
    setSelectedMills((prev) =>
      prev.map((mill) =>
        mill.id === millId ? { ...mill, estimatedWeight: weight } : mill
      )
    );
  };

  const getTotalWeight = () => {
    return selectedMills.reduce(
      (total, mill) => total + (mill.estimatedWeight || 0),
      0
    );
  };

  const getVehicleCapacity = () => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.capacity || 0;
  };

  const isOverCapacity = getTotalWeight() > getVehicleCapacity();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {trip ? "Edit Trip" : "Plan New Trip"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="vehicle-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Vehicle
            </label>
            <select
              id="vehicle-select"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber} - {vehicle.driver.name}
                  (Capacity: {vehicle.capacity} tons)
                </option>
              ))}
            </select>
          </div>

          <div>
            {/* Capacity Information */}
            {vehicleId && (
              <div className="mb-3 space-y-2">
                {/* Trip Estimation */}
                <div className="p-2 bg-yellow-50 text-yellow-800 rounded-md">
                  <p className="text-sm">
                    Estimated trips needed: <strong>{estimatedTrips}</strong>
                    {estimatedTrips > 1 && (
                      <span className="ml-2">
                        (Consider splitting into multiple trips or selecting a
                        larger vehicle)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div
              data-testid="mill-checkbox-grid"
              className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md"
            >
              {allMills.map((mill) => {
                const isSelected = selectedMills.some((m) => m.id === mill.id);
                const selectedMill = selectedMills.find(
                  (m) => m.id === mill.id
                );

                return (
                  <div
                    key={mill.id}
                    className="flex items-center justify-between p-2 border-b border-gray-100"
                  >
                    <label
                      htmlFor={`mill-checkbox-${mill.id}`}
                      className="flex items-center flex-1"
                    >
                      <input
                        id={`mill-checkbox-${mill.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMillSelection(mill)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm flex-1">
                        {mill.name}
                        <span className="text-xs text-gray-500 ml-2">
                          (Avg: {mill.avgDailyProduction || 0} tons)
                        </span>
                      </span>
                    </label>

                    {isSelected && (
                      <div className="ml-4 flex items-center">
                        <label
                          htmlFor={`weight-input-${mill.id}`}
                          className="text-xs text-gray-600 mr-2"
                        >
                          Weight:
                        </label>
                        <input
                          id={`weight-input-${mill.id}`}
                          type="number"
                          value={selectedMill?.estimatedWeight || 0}
                          onChange={(e) =>
                            updateMillWeight(mill.id, Number(e.target.value))
                          }
                          className="w-20 p-1 border border-gray-300 rounded-md text-sm"
                          min="0"
                          step="0.1"
                          placeholder="Tons"
                        />
                        <span className="text-xs text-gray-600 ml-1">tons</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="scheduled-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Scheduled Date & Time
              </label>
              <input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label
                htmlFor="estimated-duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Estimated Duration (minutes)
              </label>
              <input
                id="estimated-duration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {user?.role == "admin" && (
            <div>
              <label
                htmlFor="client-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Client
              </label>
              {loading ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                  Loading clients...
                </div>
              ) : (
                <select
                  id="client-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isOverCapacity}
              className={`px-4 py-2 rounded-md ${
                isOverCapacity
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {trip ? "Update" : "Create"} Trip
            </button>
          </div>

          {isOverCapacity && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Warning!</strong> Total weight exceeds vehicle capacity.
              Please reduce the weight or select a different vehicle.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TripForm;
