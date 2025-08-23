// src/services/database/crud/collections.ts
import { getDatabase } from '../config';
import { Collection } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

export const getCollections = (limit = 100, offset = 0): Collection[] => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT c.* 
    FROM collections c
    ORDER BY c.timestamp DESC
    LIMIT ? OFFSET ?
  `);
  
  stmt.bind([limit, offset]);
  
  const collections: Collection[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    
    collections.push({
      id: row.id,
      tripId: row.tripId,
      millId: row.millId,
      timestamp: new Date(row.timestamp),
      weight: row.weight,
      status: row.status
    });
  }
  
  stmt.free();
  return collections;
};

export const getCollectionsByMillId = (millId: string, limit = 100, offset = 0): Collection[] => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT c.* 
    FROM collections c
    WHERE c.millId = ?
    ORDER BY c.timestamp DESC
    LIMIT ? OFFSET ?
  `);
  
  stmt.bind([millId, limit, offset]);
  
  const collections: Collection[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    
    collections.push({
      id: row.id,
      tripId: row.tripId,
      millId: row.millId,
      timestamp: new Date(row.timestamp),
      weight: row.weight,
      status: row.status
    });
  }
  
  stmt.free();
  return collections;
};

export const createCollection = (collectionData: Omit<Collection, 'id'>): string => {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO collections (id, tripId, millId, timestamp, weight, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.bind([
    id,
    collectionData.tripId,
    collectionData.millId,
    collectionData.timestamp.toISOString(),
    collectionData.weight,
    collectionData.status
  ]);
  
  
  stmt.step();
  stmt.free();
  
  return id;
};

export const addMillProduction = (millId: string, weight: number): string => {
  return createCollection({
    tripId: null,
    millId: millId,
    timestamp: new Date(),
    weight: weight,
    status: 'COMPLETED'
  });
};

export const getTodayCollectionsByMillId = (millId: string): Collection[] => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT c.* 
    FROM collections c
    WHERE c.millId = ? 
    AND date(c.timestamp) = date('now')
    ORDER BY c.timestamp DESC
  `);
  
  stmt.bind([millId]);
  
  const collections: Collection[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    collections.push({
      id: row.id,
      tripId: row.tripId,
      millId: row.millId,
      timestamp: new Date(row.timestamp),
      weight: row.weight,
      status: row.status
    });
  }
  
  stmt.free();
  return collections;
};

export const updateCollection = (id: string, updates: Partial<Omit<Collection, 'id'>>): boolean => {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (updates.weight !== undefined) {
    fields.push('weight = ?');
    values.push(updates.weight);
  }
  
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  
  if (updates.timestamp !== undefined) {
    fields.push('timestamp = ?');
    values.push(updates.timestamp.toISOString());
  }
  
  if (updates.tripId !== undefined) {
    fields.push('tripId = ?');
    values.push(updates.tripId);
  }
  
  if (updates.millId !== undefined) {
    fields.push('millId = ?');
    values.push(updates.millId);
  }
  
  if (fields.length === 0) return false;
  
  const stmt = db.prepare(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`);
  stmt.bind([...values, id]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  
  return changes > 0;
};

export const deleteCollection = (id: string): boolean => {
  const db = getDatabase();
  
  const stmt = db.prepare('DELETE FROM collections WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  
  return changes > 0;
};

export const getCollectionById = (id: string): Collection | null => {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM collections WHERE id = ?');
  stmt.bind([id]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  
  const row = stmt.getAsObject() as any;
  stmt.free();
  
  return {
    id: row.id,
    tripId: row.tripId,
    millId: row.millId,
    timestamp: new Date(row.timestamp),
    weight: row.weight,
    status: row.status
  };
};

export const getCollectionsCount = (): number => {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT COUNT(*) as count FROM collections');
  stmt.step();
  const result = stmt.getAsObject() as { count: number };
  stmt.free();
  
  return result.count;
};

export const getCollectionsByTripId = (tripId: string): Collection[] => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT c.* 
    FROM collections c
    WHERE c.tripId = ?
    ORDER BY c.timestamp DESC
  `);
  
  stmt.bind([tripId]);
  
  const collections: Collection[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    collections.push({
      id: row.id,
      tripId: row.tripId,
      millId: row.millId,
      timestamp: new Date(row.timestamp),
      weight: row.weight,
      status: row.status
    });
  }
  
  stmt.free();
  return collections;
};