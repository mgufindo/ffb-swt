// src/services/api/trips.ts
import {
  getTrips,
  getTripsByMillId,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripsCount,
  getTripsByMillIdCount
} from '../database/crud/trips';
import { Trip } from '../../types';

export const fetchTrips = async (
  page = 1, 
  limit = 50,
  search = '',
  userId?: string
): Promise<{ data: Trip[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;
    const data = getTrips(limit, offset, search, userId);

    const total = getTripsCount(search, userId);

    return { data, total };
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw new Error('Failed to fetch trips');
  }
};


export const fetchTrip = async (id: string): Promise<Trip> => {
  try {
    const trip = getTripById(id);
    if (!trip) {
      throw new Error('Trip not found');
    }
    return trip;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw new Error('Failed to fetch trip');
  }
};

export const addTrip = async (trip: Omit<Trip, 'id'>): Promise<string> => {
  try {
    return createTrip(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    throw new Error('Failed to create trip');
  }
};

export const modifyTrip = async (id: string, trip: Partial<Omit<Trip, 'id'>>): Promise<boolean> => {
  try {
    return updateTrip(id, trip);
  } catch (error) {
    console.error('Error updating trip:', error);
    throw new Error('Failed to update trip');
  }
};

export const removeTrip = async (id: string): Promise<boolean> => {
  try {
    return deleteTrip(id);
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw new Error('Failed to delete trip');
  }
};