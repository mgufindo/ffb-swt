// src/services/database/crud/trips.ts
import { getDatabase } from '../config';
import { Trip, TripStatus, Collection } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { tr } from 'date-fns/locale';

export const getTrips = (limit = 100, offset = 0, search = '', userId = ''): Trip[] => {
  const db = getDatabase();
  
  let query = `
    SELECT t.*, 
           v.id as vehicleId, v.plateNumber, v.type as vehicleType, v.capacity, v.status as vehicleStatus,
           d.id as driverId, d.name as driverName, d.licenseNumber, d.phoneNumber, d.status as driverStatus, u.id as userId
    FROM trips t
    JOIN vehicles v ON t.vehicleId = v.id
    JOIN drivers d ON t.driverId = d.id
    JOIN users u ON t.userId = u.id
  `;
  
  const params: any[] = [];
  
  let whereClauses: string[] = [];
  if (search) {
    whereClauses.push(`
      (t.id LIKE ? 
      OR v.plateNumber LIKE ? 
      OR d.name LIKE ? 
      OR d.phoneNumber LIKE ?
      OR t.status LIKE ?)
    `);
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (userId && userId.trim() !== '') {
    whereClauses.push(`t.userId = ?`);
    params.push(userId);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  
  const tripStmt = db.prepare(query);
  tripStmt.bind(params);
  
  const trips: Trip[] = [];
  while (tripStmt.step()) {
    const tripRow = tripStmt.getAsObject() as any;
    
    // Get mills for this trip
    const millStmt = db.prepare(`
      SELECT m.* 
      FROM trip_mills tm
      JOIN mills m ON tm.millId = m.id
      WHERE tm.tripId = ?
    `);
    
    millStmt.bind([tripRow.id]);
    const mills: any[] = [];
    while (millStmt.step()) {
      const millRow = millStmt.getAsObject() as any;
      mills.push({
        id: millRow.id,
        name: millRow.name,
        location: { lat: millRow.lat, lng: millRow.lng },
        contactPerson: millRow.contactPerson,
        phoneNumber: millRow.phoneNumber,
        avgDailyProduction: millRow.avgDailyProduction,
        
      });
    }
    millStmt.free();
    
    // Get collections for this trip
    const collectionStmt = db.prepare('SELECT * FROM collections WHERE tripId = ?');
    collectionStmt.bind([tripRow.id]);
    const collections: any[] = [];
    while (collectionStmt.step()) {
      const collectionRow = collectionStmt.getAsObject() as any;
      collections.push({
        id: collectionRow.id,
        tripId: collectionRow.tripId,
        millId: collectionRow.millId,
        timestamp: new Date(collectionRow.timestamp),
        weight: collectionRow.weight,
        status: collectionRow.status
      });
    }
    collectionStmt.free();
    
    trips.push({
      id: tripRow.id,
      vehicle: {
        id: tripRow.vehicleId,
        plateNumber: tripRow.plateNumber,
        type: tripRow.vehicleType,
        capacity: tripRow.capacity,
        driver: {
          id: tripRow.driverId,
          name: tripRow.driverName,
          licenseNumber: tripRow.licenseNumber,
          phoneNumber: tripRow.phoneNumber,
          status: tripRow.driverStatus
        },
        status: tripRow.vehicleStatus
      },
      driver: {
        id: tripRow.driverId,
        name: tripRow.driverName,
        licenseNumber: tripRow.licenseNumber,
        phoneNumber: tripRow.phoneNumber,
        status: tripRow.driverStatus
      },
      mills,
      scheduledDate: new Date(tripRow.scheduledDate),
      status: tripRow.status,
      collections,
      estimatedDuration: tripRow.estimatedDuration,
      userId: tripRow.userId
    });
  }
  
  tripStmt.free();
  return trips;
};

export const getTripsByMillIdCount = (millId: string): number => {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT COUNT(DISTINCT t.id) as count 
    FROM trips t
    JOIN trip_mills tm ON t.id = tm.tripId
    WHERE tm.millId = ?
  `);

  stmt.bind([millId]);

  let count = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as { count: number };
    count = row.count ?? 0;
  }

  stmt.free();
  return count;
};


export const getTripById = (id: string): Trip | null => {
  const db = getDatabase();
  
  const tripStmt = db.prepare(`
    SELECT t.*, 
           v.id as vehicleId, v.plateNumber, v.type as vehicleType, v.capacity, v.status as vehicleStatus,
           d.id as driverId, d.name as driverName, d.licenseNumber, d.phoneNumber, d.status as driverStatus
    FROM trips t
    JOIN vehicles v ON t.vehicleId = v.id
    JOIN drivers d ON t.driverId = d.id
    WHERE t.id = ?
  `);
  
  tripStmt.bind([id]);
  
  if (!tripStmt.step()) {
    tripStmt.free();
    return null;
  }
  
  const tripRow = tripStmt.getAsObject() as any;
  tripStmt.free();
  
  // Get mills for this trip
  const millStmt = db.prepare(`
    SELECT m.* 
    FROM trip_mills tm
    JOIN mills m ON tm.millId = m.id
    WHERE tm.tripId = ?
  `);
  
  millStmt.bind([id]);
  const mills: any[] = [];
  while (millStmt.step()) {
    const millRow = millStmt.getAsObject() as any;
    mills.push({
      id: millRow.id,
      name: millRow.name,
      location: { lat: millRow.lat, lng: millRow.lng },
      contactPerson: millRow.contactPerson,
      phoneNumber: millRow.phoneNumber,
      avgDailyProduction: millRow.avgDailyProduction
    });
  }
  millStmt.free();
  
  // Get collections for this trip
  const collectionStmt = db.prepare('SELECT * FROM collections WHERE tripId = ?');
  collectionStmt.bind([id]);
  const collections: any[] = [];
  while (collectionStmt.step()) {
    const collectionRow = collectionStmt.getAsObject() as any;
    collections.push({
      id: collectionRow.id,
      tripId: collectionRow.tripId,
      millId: collectionRow.millId,
      timestamp: new Date(collectionRow.timestamp),
      weight: collectionRow.weight,
      status: collectionRow.status
    });
  }
  collectionStmt.free();
  
  return {
    id: tripRow.id,
    vehicle: {
      id: tripRow.vehicleId,
      plateNumber: tripRow.plateNumber,
      type: tripRow.vehicleType,
      capacity: tripRow.capacity,
      driver: {
        id: tripRow.driverId,
        name: tripRow.driverName,
        licenseNumber: tripRow.licenseNumber,
        phoneNumber: tripRow.phoneNumber,
        status: tripRow.driverStatus
      },
      status: tripRow.vehicleStatus
    },
    driver: {
      id: tripRow.driverId,
      name: tripRow.driverName,
      licenseNumber: tripRow.licenseNumber,
      phoneNumber: tripRow.phoneNumber,
      status: tripRow.driverStatus
    },
    mills,
    scheduledDate: new Date(tripRow.scheduledDate),
    status: tripRow.status,
    collections,
    estimatedDuration: tripRow.estimatedDuration
  };
};

export const createTrip = (trip: Omit<any, 'id'>): string => {
  const db = getDatabase();
  const id = uuidv4();
  
  const insertTrip = db.prepare(`
    INSERT INTO trips (id, vehicleId, driverId, scheduledDate, status, estimatedDuration, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  
  insertTrip.bind([
    id,
    trip.vehicle.id,
    trip.driver.id,
    trip.scheduledDate.toISOString(),
    trip.status,
    trip.estimatedDuration,
    trip.userId
  ]);
  insertTrip.step();
  insertTrip.free();
  
  // Insert trip-mill relationships
  const insertTripMill = db.prepare(`
    INSERT INTO trip_mills (tripId, millId)
    VALUES (?, ?)
  `);
  
  for (const mill of trip.mills) {
    insertTripMill.bind([id, mill.id]);
    insertTripMill.step();
    insertTripMill.reset();
  }
  insertTripMill.free();
  
  // Insert collections
  const insertCollection = db.prepare(`
    INSERT INTO collections (id, tripId, millId, timestamp, weight, status, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const collection of trip.collections) {
    insertCollection.bind([
      uuidv4(),
      id,
      collection.millId,
      collection.timestamp.toISOString(),
      collection.weight,
      collection.status,
      collection.userId
    ]);
    insertCollection.step();
    insertCollection.reset();
  }
  insertCollection.free();
  
  return id;
};

export const updateTrip = (id: string, trip: Partial<Omit<Trip, 'id'>>): boolean => {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (trip.vehicle !== undefined) {
    fields.push('vehicleId = ?');
    values.push(trip.vehicle.id);
  }
  
  if (trip.driver !== undefined) {
    fields.push('driverId = ?');
    values.push(trip.driver.id);
  }
  
  if (trip.scheduledDate !== undefined) {
    fields.push('scheduledDate = ?');
    values.push(trip.scheduledDate.toISOString());
  }
  
  if (trip.status !== undefined) {
    fields.push('status = ?');
    values.push(trip.status);
  }
  
  if (trip.estimatedDuration !== undefined) {
    fields.push('estimatedDuration = ?');
    values.push(trip.estimatedDuration);
  }

  if (trip.userId !== undefined) {
    fields.push('userId = ?');
    values.push(trip.userId);
  }

  if (fields.length === 0) return false;
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  
  const stmt = db.prepare(`UPDATE trips SET ${fields.join(', ')} WHERE id = ?`);

  if (trip.vehicle !== undefined) {
    if (trip.status === 'IN_PROGRESS') {
      const vehicle = db.prepare('UPDATE vehicles SET status = ? WHERE id = ?');
      vehicle.bind(['IN_USE', trip.vehicle.id]);
      vehicle.step();
      vehicle.free();
    } else {
      const vehicle = db.prepare('UPDATE vehicles SET status = ? WHERE id = ?');
      vehicle.bind(['AVAILABLE', trip.vehicle.id]);
      vehicle.step();
      vehicle.free();
    }
  }

  stmt.bind([...values, id]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  
  return changes > 0;
};

export const deleteTrip = (id: string): boolean => {
  const db = getDatabase();
  
  // Delete related records first due to foreign key constraints
  const deleteCollections = db.prepare('DELETE FROM collections WHERE tripId = ?');
  deleteCollections.bind([id]);
  deleteCollections.step();
  deleteCollections.free();
  
  const deleteTripMills = db.prepare('DELETE FROM trip_mills WHERE tripId = ?');
  deleteTripMills.bind([id]);
  deleteTripMills.step();
  deleteTripMills.free();
  
  const deleteTrip = db.prepare('DELETE FROM trips WHERE id = ?');
  deleteTrip.bind([id]);
  deleteTrip.step();
  const changes = db.getRowsModified();
  deleteTrip.free();
  
  return changes > 0;
};

export const getTripsCount = (search = '', userId?: string): number => {
  const db = getDatabase();

  // base query
  let query = `
    SELECT COUNT(*) as count 
    FROM trips t
    JOIN vehicles v ON t.vehicleId = v.id
    JOIN drivers d ON t.driverId = d.id
  `;
  
  const params: any[] = [];
  const whereClauses: string[] = [];

  // handle search
  if (search.trim() !== '') {
    const searchPattern = `%${search}%`;
    whereClauses.push(`
      (t.id LIKE ? OR v.plateNumber LIKE ? OR d.name LIKE ? OR d.phoneNumber LIKE ? OR t.status LIKE ?)
    `);
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // handle user filter
  if (userId && userId.trim() !== '') {
    whereClauses.push(`t.userId = ?`);
    params.push(userId);
  }

  // append where
  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // prepare & bind
  const stmt = db.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }

  // execute
  let count = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as { count?: number };
    count = row.count ?? 0;
  }

  stmt.free();
  return count;
};
