// src/services/api/mills.ts
import {
  getMills,
  getMillById,
  createMill,
  updateMill,
  deleteMill,
  getMillsCount,
  getTripsByMillId,
  getTripsCountByMillId
} from '../database/crud/mills';
import { Mill } from '../../types';

export const fetchMills = async (
  page = 1, 
  limit = 50,
  search = '',
  userId?: string,
): Promise<{ data: Mill[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;
    const data = getMills(limit, offset, search, userId);
    const total = getMillsCount(userId);
    
    return { data, total };
  } catch (error) {
    console.error('Error fetching mills:', error);
    throw new Error('Failed to fetch mills');
  }
};

export const fetchTripsByMillId = async (millId: string, page = 1, limit = 50): Promise<{ data: Trip[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;
    const data = getTripsByMillId(millId, limit, offset);
    const total = getTripsCountByMillId(millId);

    return { data, total };
  } catch (error) {
    console.error('Error fetching trips by mill ID:', error);
    throw new Error('Failed to fetch trips by mill ID');
  }
};

export const fetchMill = async (id: string): Promise<Mill> => {
  try {
    const mill = getMillById(id);
    if (!mill) {
      throw new Error('Mill not found');
    }
    return mill;
  } catch (error) {
    console.error('Error fetching mill:', error);
    throw new Error('Failed to fetch mill');
  }
};

export const addMill = async (mill: Omit<Mill, 'id'>): Promise<string> => {
  try {
    return createMill(mill);
  } catch (error) {
    console.error('Error creating mill:', error);
    throw new Error('Failed to create mill');
  }
};

export const modifyMill = async (id: string, mill: Partial<Omit<Mill, 'id'>>): Promise<boolean> => {
  try {
    return updateMill(id, mill);
  } catch (error) {
    console.error('Error updating mill:', error);
    throw new Error('Failed to update mill');
  }
};

export const removeMill = async (id: string): Promise<boolean> => {
  try {
    return deleteMill(id);
  } catch (error) {
    console.error('Error deleting mill:', error);
    throw new Error('Failed to delete mill');
  }
};