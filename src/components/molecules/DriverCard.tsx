// src/components/molecules/DriverCard.tsx
import React from "react";
import { Driver } from "../../types";

interface DriverCardProps {
  driver: Driver;
  onEdit?: () => void;
  onDelete?: () => void;
}

const DriverCard: React.FC<DriverCardProps> = ({
  driver,
  onEdit,
  onDelete,
}) => {
  const statusColors = {
    AVAILABLE: "bg-green-100 text-green-800",
    ON_TRIP: "bg-blue-100 text-blue-800",
    OFF_DUTY: "bg-yellow-100 text-yellow-800",
    SICK: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
          <p className="text-sm text-gray-500">{driver.licenseNumber}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[driver.status]
          }`}
        >
          {driver.status.replace("_", " ").toLowerCase()}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Phone:</span> {driver.phoneNumber}
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

export default DriverCard;
