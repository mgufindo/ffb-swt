// src/services/database/crud/mills.ts
import { getDatabase } from '../config';
import { Mill, Trip } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { getTripsByMillIdCount } from './trips';

export const getMills = (limit = 100, offset = 0, searchTerm = '', userId = ''): Mill[] => {
  const db = getDatabase();

  let query = `
    SELECT * FROM mills 
    WHERE 1=1
  `;
  
  const params: any[] = [];

  // Add search condition if searchTerm is provided
  if (searchTerm && searchTerm.trim() !== '') {
    const searchPattern = `%${searchTerm}%`;
    
    query += ` AND (
      name LIKE ? OR 
      contactPerson LIKE ? OR 
      phoneNumber LIKE ? OR
      CAST(lat AS TEXT) LIKE ? OR
      CAST(lng AS TEXT) LIKE ?
    )`;
    
    params.push(
      searchPattern, 
      searchPattern, 
      searchPattern, 
      searchPattern, 
      searchPattern
    );
  }
  
  if (userId && userId.trim() !== '') {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  query += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  
  // Bind parameters
  stmt.bind(params);

  const results: Mill[] = [];
  
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    
    results.push({
      id: row.id,
      name: row.name,
      location: { 
        lat: Number(row.lat),
        lng: Number(row.lng)
      },
      contactPerson: row.contactPerson,
      phoneNumber: row.phoneNumber,
      avgDailyProduction: row.avgDailyProduction
    });
  }

  stmt.free();
  
  return results;
};

export const getMillById = (id: string): Mill | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM mills WHERE id = ?');
  
  stmt.bind([id]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  
  const row = stmt.getAsObject() as any;
  stmt.free();
  
  return {
    id: row.id,
    name: row.name,
    location: { lat: Number(row.lat), lng: Number(row.lng) },
    contactPerson: row.contactPerson,
    phoneNumber: row.phoneNumber,
    avgDailyProduction: row.avgDailyProduction
  };
};

export const createMill = (mill: Omit<Mill, 'id'>): string => {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO mills (id, name, lat, lng, contactPerson, phoneNumber, avgDailyProduction, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.bind([
    id, 
    mill.name, 
    mill.location.lat, 
    mill.location.lng, 
    mill.contactPerson, 
    mill.phoneNumber, 
    mill.avgDailyProduction,
    mill.userId
  ]);
  
  stmt.step();
  stmt.free();
  
  return id;
};

export const getTripsByMillId = (millId: string, limit = 100, offset = 0): Trip[] => {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT 
      t.*,
      v.plateNumber as vehiclePlateNumber,
      v.type as vehicleType,
      d.name as driverName,
      d.licenseNumber as driverLicense,
      d.phoneNumber as driverPhone,
      m.name as millName,
      m.lat as millLat,
      m.lng as millLng,
      m.contactPerson as millContactPerson,
      m.phoneNumber as millPhoneNumber,
      m.avgDailyProduction as millAvgDailyProduction,
      json_group_array(
        json_object(
          'id', c.id,
          'timestamp', c.timestamp,
          'weight', c.weight,
          'status', c.status
        )
      ) as collectionsData
    FROM trip_mills tm
    INNER JOIN trips t ON tm.tripId = t.id
    INNER JOIN vehicles v ON t.vehicleId = v.id
    INNER JOIN drivers d ON t.driverId = d.id
    INNER JOIN mills m ON tm.millId = m.id
    LEFT JOIN collections c ON t.id = c.tripId AND c.millId = tm.millId
    WHERE tm.millId = ?
    GROUP BY t.id
    LIMIT ? OFFSET ?
  `);

  stmt.bind([millId, limit, offset]);

  const results: Trip[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    
    // Parse collections data
    const collections = row.collectionsData ? JSON.parse(row.collectionsData) : [];
    
    results.push({
      id: row.id,
      vehicle: {
        id: row.vehicleId,
        plateNumber: row.vehiclePlateNumber,
        type: row.vehicleType
      },
      driver: {
        id: row.driverId,
        name: row.driverName,
        licenseNumber: row.driverLicense,
        phoneNumber: row.driverPhone,
        status: 'AVAILABLE' // You might need to get this from the drivers table
      },
      mills: [{
        id: millId,
        name: row.millName,
        location: { 
          lat: Number(row.millLat),
          lng: Number(row.millLng)
        },
        contactPerson: row.millContactPerson,
        phoneNumber: row.millPhoneNumber,
        avgDailyProduction: row.millAvgDailyProduction
      }],
      scheduledDate: new Date(row.scheduledDate),
      status: row.status,
      estimatedDuration: row.estimatedDuration,
      collections: collections.filter((c: any) => c.id !== null) // Filter out null collections
    });
  }

  console.log('Trips with collections:', results);
  
  stmt.free();
  return results;
};

// Alternative version if SQLite doesn't support json_group_array
export const getTripsByMillIdAlternative = (millId: string, limit = 100, offset = 0): Trip[] => {
  const db = getDatabase();

  // First get the trips
  const tripStmt = db.prepare(`
    SELECT 
      t.*,
      v.plateNumber as vehiclePlateNumber,
      v.type as vehicleType,
      d.name as driverName,
      d.licenseNumber as driverLicense,
      d.phoneNumber as driverPhone,
      m.name as millName,
      m.lat as millLat,
      m.lng as millLng,
      m.contactPerson as millContactPerson,
      m.phoneNumber as millPhoneNumber,
      m.avgDailyProduction as millAvgDailyProduction
    FROM trip_mills tm
    INNER JOIN trips t ON tm.tripId = t.id
    INNER JOIN vehicles v ON t.vehicleId = v.id
    INNER JOIN drivers d ON t.driverId = d.id
    INNER JOIN mills m ON tm.millId = m.id
    WHERE tm.millId = ?
    LIMIT ? OFFSET ?
  `);

  tripStmt.bind([millId, limit, offset]);

  const results: Trip[] = [];
  while (tripStmt.step()) {
    const row = tripStmt.getAsObject() as any;
    
    // Get collections for this trip
    const collectionStmt = db.prepare(`
      SELECT * FROM collections 
      WHERE tripId = ? AND millId = ?
      ORDER BY timestamp DESC
    `);
    
    collectionStmt.bind([row.id, millId]);
    
    const collections: Collection[] = [];
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
    
    results.push({
      id: row.id,
      vehicle: {
        id: row.vehicleId,
        plateNumber: row.vehiclePlateNumber,
        type: row.vehicleType
      },
      driver: {
        id: row.driverId,
        name: row.driverName,
        licenseNumber: row.driverLicense,
        phoneNumber: row.driverPhone,
        status: 'AVAILABLE'
      },
      mills: [{
        id: millId,
        name: row.millName,
        location: { 
          lat: Number(row.millLat),
          lng: Number(row.millLng)
        },
        contactPerson: row.millContactPerson,
        phoneNumber: row.millPhoneNumber,
        avgDailyProduction: row.millAvgDailyProduction
      }],
      scheduledDate: new Date(row.scheduledDate),
      status: row.status,
      estimatedDuration: row.estimatedDuration,
      collections: collections
    });
  }

  tripStmt.free();
  console.log('Trips with collections (alternative):', results);
  return results;
};


export const getTripsCountByMillId = (millId: string): number => {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT COUNT(*) as total FROM trip_mills 
    WHERE millId = ?
  `);

  stmt.bind([millId]);

  let total = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    total = row.total;
  }

  stmt.free();

  return total;
};

export const updateMill = (id: string, mill: Partial<Omit<Mill, 'id'>>): boolean => {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (mill.name !== undefined) {
    fields.push('name = ?');
    values.push(mill.name);
  }
  
  if (mill.location !== undefined) {
    fields.push('lat = ?, lng = ?');
    values.push(mill.location.lat, mill.location.lng);
  }
  
  if (mill.contactPerson !== undefined) {
    fields.push('contactPerson = ?');
    values.push(mill.contactPerson);
  }
  
  if (mill.phoneNumber !== undefined) {
    fields.push('phoneNumber = ?');
    values.push(mill.phoneNumber);
  }
  
  if (mill.avgDailyProduction !== undefined) {
    fields.push('avgDailyProduction = ?');
    values.push(mill.avgDailyProduction);
  }
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  
  const stmt = db.prepare(`UPDATE mills SET ${fields.join(', ')} WHERE id = ?`);
  stmt.bind([...values, id]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  
  return changes > 0;
};

export const deleteMill = (id: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM mills WHERE id = ?');
  
  stmt.bind([id]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  
  return changes > 0;
};

export const getMillsCount = (searchTerm = '', userId?: string): number => {
  const db = getDatabase();

  let query = `SELECT COUNT(*) as total FROM mills WHERE 1=1`;
  const params: any[] = [];

  if (searchTerm && searchTerm.trim() !== '') {
    const searchPattern = `%${searchTerm}%`;
    
    query += ` AND (
      name LIKE ? OR 
      contactPerson LIKE ? OR 
      phoneNumber LIKE ? OR
      CAST(lat AS TEXT) LIKE ? OR
      CAST(lng AS TEXT) LIKE ?
    )`;
    
    params.push(
      searchPattern, 
      searchPattern, 
      searchPattern, 
      searchPattern, 
      searchPattern
    );
  }

  if (userId && userId.trim() !== '') {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  const stmt = db.prepare(query);
  
  if (params.length > 0) {
    stmt.bind(params);
  }

  let total = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    total = row.total;
  }

  stmt.free();
  
  return total;
};