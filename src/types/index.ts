// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  millId?: string;
  password?: string; // Hanya untuk internal use
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export type VehicleType = 'TRUCK' | 'VAN' | 'PICKUP';
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SICK';
export type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type CollectionStatus = 'PENDING' | 'COLLECTED' | 'DELIVERED';

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  capacity: number;
  driver: Driver;
  userId: string; // Client ID
  users: string; // Client name
  status: VehicleStatus;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  userId: string; // Client ID
  status: DriverStatus;
}

export interface Mill {
  id: string;
  name: string;
  location: GeoLocation;
  contactPerson: string;
  phoneNumber: string;
  userId: string; // Client ID
  avgDailyProduction: number;
}

export interface Collection {
  id: string;
  tripId: string;
  millId: string;
  timestamp: Date;
  weight: number;
  status: CollectionStatus;
}

export interface Trip {
  id: string;
  vehicle: Vehicle;
  driver: Driver;
  mills: Mill[];
  scheduledDate: Date;
  status: TripStatus;
  collections: Collection[];
  estimatedDuration: number;
  userId: string; // Client ID
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AppState {
  vehicles: Vehicle[];
  drivers: Driver[];
  mills: Mill[];
  trips: Trip[];
  collections: Collection[];
  loading: boolean;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}