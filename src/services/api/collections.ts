// src/services/api/collections.ts
import {
  getCollections,
  getCollectionsByMillId,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionsCount,
  getCollectionsByTripId,
  addMillProduction
} from '../database/crud/collections';
import { Collection } from '../../types';

// Re-export semua fungsi CRUD
export {
  addMillProduction
};

export const fetchCollections = async (
  page = 1, 
  limit = 50,
  millId?: string
): Promise<{ data: Collection[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;
    let data: Collection[];
    
    if (millId) {
      data = getCollectionsByMillId(millId, limit, offset);
    } else {
      data = getCollections(limit, offset);
    }
    
    const total = getCollectionsCount();
    
    return { data, total };
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw new Error('Failed to fetch collections');
  }
};

export const fetchCollection = async (id: string): Promise<Collection> => {
  try {
    const collection = getCollectionById(id);
    if (!collection) {
      throw new Error('Collection not found');
    }
    return collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw new Error('Failed to fetch collection');
  }
};

export const addCollection = async (collection: Omit<Collection, 'id'>): Promise<string> => {
  try {
    return createCollection(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    throw new Error('Failed to create collection');
  }
};

export const modifyCollection = async (id: string, collection: Partial<Omit<Collection, 'id'>>): Promise<boolean> => {
  try {
    return updateCollection(id, collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    throw new Error('Failed to update collection');
  }
};

export const removeCollection = async (id: string): Promise<boolean> => {
  try {
    return deleteCollection(id);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw new Error('Failed to delete collection');
  }
};

export const apiAddMillProduction = async (millId: string, weight: number): Promise<string> => {
  try {
    return addMillProduction(millId, weight);
  } catch (error) {
    console.error('Error adding mill production:', error);
    throw new Error('Failed to add mill production');
  }
};

export const fetchCollectionsByMill = async (
  millId: string, 
  page = 1, 
  limit = 50
): Promise<{ data: Collection[]; total: number }> => {
  try {
    const data = getCollectionsByMillId(millId);
    const total = data.length;
    
    // Manual pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);
    
    return { data: paginatedData, total };
  } catch (error) {
    console.error('Error fetching collections by mill:', error);
    throw new Error('Failed to fetch collections by mill');
  }
};

export const fetchCollectionsByTrip = async (tripId: string): Promise<Collection[]> => {
  try {
    return getCollectionsByTripId(tripId);
  } catch (error) {
    console.error('Error fetching collections by trip:', error);
    throw new Error('Failed to fetch collections by trip');
  }
};

export const fetchTodayCollectionsByMill = async (millId: string): Promise<Collection[]> => {
  try {
    // This would need date filtering implementation
    const allCollections = getCollectionsByMillId(millId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allCollections.filter(collection => {
      const collectionDate = new Date(collection.timestamp);
      collectionDate.setHours(0, 0, 0, 0);
      return collectionDate.getTime() === today.getTime();
    });
  } catch (error) {
    console.error('Error fetching today collections:', error);
    throw new Error('Failed to fetch today collections');
  }
};