import React from 'react';
import { VehicleStatus, VehicleType, DriverStatus, TripStatus, CollectionStatus } from '../../types';

interface StatusBadgeProps {
  status: VehicleStatus | DriverStatus | TripStatus | CollectionStatus | string;
  type?: 'vehicle' | 'driver' | 'trip' | 'collection';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'vehicle' }) => {
  const getConfig = () => {
    const configs = {
      vehicle: {
        AVAILABLE: { color: 'bg-green-100 text-green-800', label: 'Available' },
        IN_USE: { color: 'bg-blue-100 text-blue-800', label: 'In Use' },
        MAINTENANCE: { color: 'bg-yellow-100 text-yellow-800', label: 'Maintenance' },
        UNAVAILABLE: { color: 'bg-red-100 text-red-800', label: 'Unavailable' }
      },
      driver: {
        AVAILABLE: { color: 'bg-green-100 text-green-800', label: 'Available' },
        ON_TRIP: { color: 'bg-blue-100 text-blue-800', label: 'On Trip' },
        OFF_DUTY: { color: 'bg-gray-100 text-gray-800', label: 'Off Duty' },
        SICK: { color: 'bg-red-100 text-red-800', label: 'Sick' }
      },
      trip: {
        SCHEDULED: { color: 'bg-gray-100 text-gray-800', label: 'Scheduled' },
        IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
        COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
        CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
      },
      collection: {
        PENDING: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
        COLLECTED: { color: 'bg-blue-100 text-blue-800', label: 'Collected' },
        DELIVERED: { color: 'bg-green-100 text-green-800', label: 'Delivered' }
      }
    };

    return configs[type][status as any] || { color: 'bg-gray-100 text-gray-800', label: status };
  };

  const config = getConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

interface TypeBadgeProps {
  type: VehicleType | string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const typeConfig = {
    TRUCK: { color: 'bg-purple-100 text-purple-800', label: 'Truck' },
    VAN: { color: 'bg-indigo-100 text-indigo-800', label: 'Van' },
    PICKUP: { color: 'bg-gray-100 text-gray-800', label: 'Pickup' }
  };

  const config = typeConfig[type as VehicleType] || { color: 'bg-gray-100 text-gray-800', label: type };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};