// src/services/api/drivers.ts
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriversCount
} from '../database/crud/drivers';
import { Driver } from '../../types';

export const fetchDrivers = async (
  page = 1, 
  limit = 50,
  searchTerm = '',
  userId?: string,
  status?: string
): Promise<{ data: Driver[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;
    const data = getDrivers(limit, offset, userId, searchTerm, status);
    const total = getDriversCount(searchTerm, userId);
    
    return { data, total };
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw new Error('Failed to fetch drivers');
  }
};

export const fetchDriver = async (id: string): Promise<Driver> => {
  try {
    const driver = getDriverById(id);
    if (!driver) {
      throw new Error('Driver not found');
    }
    return driver;
  } catch (error) {
    console.error('Error fetching driver:', error);
    throw new Error('Failed to fetch driver');
  }
};

export const addDriver = async (driver: Omit<Driver, 'id'>): Promise<string> => {
  try {
    
    return createDriver(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    throw new Error('Failed to create driver');
  }
};

export const modifyDriver = async (id: string, driver: Partial<Omit<Driver, 'id'>>): Promise<boolean> => {
  try {
    return updateDriver(id, driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    throw new Error('Failed to update driver');
  }
};

export const removeDriver = async (id: string): Promise<boolean> => {
  try {
    return deleteDriver(id);
  } catch (error) {
    console.error('Error deleting driver:', error);
    throw new Error('Failed to delete driver');
  }
};