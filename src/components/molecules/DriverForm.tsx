// src/components/molecules/DriverForm.tsx
import React, { useState, useEffect } from "react";
import { Driver, DriverStatus, User } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { getAllClient } from "../../services/api/auth";

interface DriverFormProps {
  driver?: Driver;
  onSubmit: (data: Omit<Driver, "id"> | Partial<Omit<Driver, "id">>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const DriverForm: React.FC<DriverFormProps> = ({
  driver,
  onSubmit,
  onCancel,
  isOpen,
}) => {
  const [clientId, setClientId] = useState(driver?.userId || "");
  const [Client, setClient] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    phoneNumber: "",
    status: "AVAILABLE" as DriverStatus,
    userId: user?.id || "",
  });

  useEffect(() => {
    // Fetch clients from API or context
    const fetchClients = async () => {
      setLoading(true);
      const clients = await getAllClient(); // Replace with your API call
      setClient(clients.data);
      setLoading(false);
    };

    fetchClients();
  }, []);

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || "",
        licenseNumber: driver.licenseNumber || "",
        phoneNumber: driver.phoneNumber || "",
        status: driver.status || "AVAILABLE",
        userId: driver.userId || user?.id || "",
      });
    } else {
      // Reset form when creating a new driver
      setFormData({
        name: "",
        licenseNumber: "",
        phoneNumber: "",
        status: "AVAILABLE",
        userId: user?.id || "",
      });
    }
  }, [driver, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectedClient = Client.find((c) => c.id === clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      userId:
        user?.role !== "admin" ? user?.id || "" : selectedClient?.id || "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {driver ? "Edit Driver" : "Add New Driver"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="licenseNumber"
              className="block text-sm font-medium text-gray-700"
            >
              License Number
            </label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SICK">Sick</option>
            </select>
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {driver ? "Update" : "Create"} Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverForm;
