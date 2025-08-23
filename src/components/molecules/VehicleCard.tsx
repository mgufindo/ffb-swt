// src/components/molecules/VehicleCard.tsx
import React from "react";
import { Vehicle } from "../../types";

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: () => void;
  onDelete?: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
}) => {
  const statusColors = {
    AVAILABLE: "bg-green-100 text-green-800",
    IN_USE: "bg-blue-100 text-blue-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    UNAVAILABLE: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {vehicle.plateNumber}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {vehicle.type.toLowerCase()}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[vehicle.status]
          }`}
        >
          {vehicle.status.replace("_", " ").toLowerCase()}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Capacity:</span> {vehicle.capacity} tons
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Driver:</span> {vehicle.driver.name}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">License:</span>{" "}
          {vehicle.driver.licenseNumber}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Phone:</span>{" "}
          {vehicle.driver.phoneNumber}
        </p>
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-4 flex space-x-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleCard;
