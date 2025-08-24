// src/services/api/vehicles.ts
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesCount
} from '../database/crud/vehicles';
import { Vehicle } from '../../types'; // Pastikan import ini benar

export const fetchVehicles = async (
  page = 1, 
  limit = 10,
  search = "",
  userId?: string
): Promise<{ data: Vehicle[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;
    const data = getVehicles(limit, offset, userId, search);
    
    const total = getVehiclesCount();
    
    return { data, total };
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw new Error('Failed to fetch vehicles');
  }
};

export const fetchVehicle = async (id: string): Promise<Vehicle> => {
  try {
    const vehicle = getVehicleById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    return vehicle;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw new Error('Failed to fetch vehicle');
  }
};

export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<string> => {
  try {
    
    return createVehicle(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw new Error('Failed to create vehicle');
  }
};

export const modifyVehicle = async (id: string, vehicle: Partial<Omit<Vehicle, 'id'>>): Promise<boolean> => {
  try {
    return updateVehicle(id, vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw new Error('Failed to update vehicle');
  }
};

export const removeVehicle = async (id: string): Promise<boolean> => {
  try {
    return deleteVehicle(id);
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw new Error('Failed to delete vehicle');
  }
};