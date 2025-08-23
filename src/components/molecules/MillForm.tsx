// src/components/molecules/MillForm.tsx
import React, { useEffect, useState } from "react";
import { Mill, User } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { getAllClient } from "../../services/api/auth";

interface MillFormProps {
  mill?: Mill;
  onSubmit: (data: Omit<Mill, "id">) => void;
  onCancel: () => void;
}

const MillForm: React.FC<MillFormProps> = ({ mill, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [name, setName] = useState(mill?.name || "");
  const [lat, setLat] = useState(mill?.location.lat.toString() || "");
  const [lng, setLng] = useState(mill?.location.lng.toString() || "");
  const [contactPerson, setContactPerson] = useState(mill?.contactPerson || "");
  const [phoneNumber, setPhoneNumber] = useState(mill?.phoneNumber || "");
  const [avgDailyProduction, setAvgDailyProduction] = useState(
    mill?.avgDailyProduction.toString() || ""
  );
  const [clientId, setClientId] = useState(mill?.userId || "");
  const [Client, setClient] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = Client.find((c) => c.id === clientId);

    onSubmit({
      name,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      contactPerson,
      phoneNumber,
      avgDailyProduction: parseFloat(avgDailyProduction),
      userId:
        user?.role !== "admin" ? user?.id || "" : selectedClient?.id || "",
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">
          {mill ? "Edit Mill" : "Add New Mill"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mill Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Average Daily Production (tons)
            </label>
            <input
              type="number"
              step="0.1"
              value={avgDailyProduction}
              onChange={(e) => setAvgDailyProduction(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {user?.role == "admin" && (
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {mill ? "Update" : "Create"} Mill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MillForm;
