import React, { useState, useEffect } from "react";
import { Vehicle, Driver, VehicleType, VehicleStatus, User } from "../../types";
import { fetchDrivers } from "../../services/api/drivers";
import { getAllClient } from "../../services/api/auth";
import { useAuth } from "../../contexts/AuthContext";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSubmit: (data: Omit<Vehicle, "id">) => void;
  onCancel: () => void;
  isOpen: boolean; // Tambahkan prop isOpen
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicle,
  onSubmit,
  onCancel,
  isOpen,
}) => {
  const { user } = useAuth();
  const [plateNumber, setPlateNumber] = useState(vehicle?.plateNumber || "");
  const [type, setType] = useState<VehicleType>(vehicle?.type || "TRUCK");
  const [capacity, setCapacity] = useState<number>(vehicle?.capacity || 12);
  const [status, setStatus] = useState<VehicleStatus>(
    vehicle?.status || "AVAILABLE"
  );
  const [driverId, setDriverId] = useState(vehicle?.driver.id || "");
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [clientId, setClientId] = useState(vehicle?.userId || "");
  const [Client, setClient] = useState<User[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDrivers();
      loadClient();
    }
  }, [isOpen]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetchDrivers(1, 100);
      setDrivers(response.data);
    } catch (error) {
      console.error("Error loading drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await getAllClient();
      setClient(response.data);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedDriver = drivers.find((d) => d.id === driverId);
    if (!selectedDriver) {
      alert("Please select a driver");
      return;
    }

    const selectedClient = Client.find((c) => c.id === clientId);

    onSubmit({
      plateNumber,
      type,
      capacity,
      status,
      driver: selectedDriver,
      userId:
        user?.role !== "admin" ? user?.id || "" : selectedClient?.id || "",
      users:
        user?.role !== "admin" ? user?.id || "" : selectedClient?.name || "",
    });
  };

  // Jangan render jika tidak open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">
          {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plate Number
            </label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VehicleType)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="TRUCK">Truck</option>
              <option value="VAN">Van</option>
              <option value="PICKUP">Pickup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (tons)
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VehicleStatus)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="AVAILABLE">Available</option>
              <option value="IN_USE">In Use</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver
            </label>
            {loading ? (
              <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                Loading drivers...
              </div>
            ) : (
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select a driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.licenseNumber})
                  </option>
                ))}
              </select>
            )}
          </div>

          {user?.role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              {loading ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                  Loading clients...
                </div>
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a client</option>
                  {Client.map((client) => (
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {vehicle ? "Update" : "Create"} Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm;
