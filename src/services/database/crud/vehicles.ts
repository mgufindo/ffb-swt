// src/services/database/crud/vehicles.ts
import { getDatabase } from '../config';
import { Vehicle, VehicleType, VehicleStatus } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

export const getVehicles = (limit = 100, offset = 0, userId = ''): Vehicle[] => {
  const db = getDatabase();

  let query = `
    SELECT v.*, 
           d.id as driverId, 
           d.name as driverName, 
           d.licenseNumber, 
           d.phoneNumber, 
           d.status as driverStatus,
           u.name as userName,
           u.id as userId
    FROM vehicles v
    JOIN drivers d ON v.driverId = d.id
    JOIN users u ON v.userId = u.id
  `;

  const params: any[] = [];

  if (userId && userId.trim() !== '') {
    query += ` WHERE v.userId = ? `;
    params.push(userId);
  }

  query += ` LIMIT ? OFFSET ? `;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  stmt.bind(params);

  const rows: Vehicle[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;

    rows.push({
      id: row.id,
      plateNumber: row.plateNumber,
      type: row.type as VehicleType,
      capacity: row.capacity,
      users: row.userName,
      userId: row.userId,
      driver: {
        id: row.driverId,
        name: row.driverName,
        licenseNumber: row.licenseNumber,
        phoneNumber: row.phoneNumber,
        status: row.driverStatus as any,
        userId: row.driverUserId
      },
      status: row.status as VehicleStatus
    });
  }

  stmt.free();
  return rows;
};

export const getVehicleById = (id: string): Vehicle | null => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT v.*, d.id as driverId, d.name as driverName, d.licenseNumber, d.phoneNumber, d.status as driverStatus
    FROM vehicles v
    JOIN drivers d ON v.driverId = d.id
    WHERE v.id = ?
  `);
  
  const row = stmt.get([id]) as any;
  return row ? {
    id: row[0],
    plateNumber: row[1],
    type: row[2] as VehicleType,
    capacity: row[3],
    driver: {
      id: row[4],
      name: row[5],
      licenseNumber: row[6],
      phoneNumber: row[7],
      status: row[8] as any
    },
    status: row[9] as VehicleStatus
  } : null;
};

export const createVehicle = (vehicle: Omit<any, "id">): string => {
  const db = getDatabase();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO vehicles (id, plateNumber, type, capacity, driverId, status, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    id,
    vehicle.plateNumber,
    vehicle.type,
    vehicle.capacity,
    vehicle.driver?.id ?? null, // kalau driver opsional
    vehicle.status,
    vehicle.userId
  ]);

  const updateDriver = db.prepare(`
    UPDATE drivers
    SET status = ?
    WHERE id = ?
  `);

  updateDriver.run(['ON_TRIP', vehicle.driver?.id]);

  return id;
};

export const updateVehicle = (id: string, vehicle: Partial<Omit<Vehicle, 'id'>>): boolean => {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (vehicle.plateNumber !== undefined) {
    fields.push('plateNumber = ?');
    values.push(vehicle.plateNumber);
  }
  
  if (vehicle.type !== undefined) {
    fields.push('type = ?');
    values.push(vehicle.type);
  }
  
  if (vehicle.capacity !== undefined) {
    fields.push('capacity = ?');
    values.push(vehicle.capacity);
  }
  
  if (vehicle.status !== undefined) {
    fields.push('status = ?');
    values.push(vehicle.status);
  }
  
  if (vehicle.driver !== undefined) {
    fields.push('driverId = ?');
    values.push(vehicle.driver.id);
  }
  
  if (fields.length === 0) {
    return false;
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  
  const stmt = db.prepare(`
    UPDATE vehicles 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  const result = stmt.run(...values, id);
  return result.changes > 0;
};

export const deleteVehicle = (id: string): boolean => {
  const db = getDatabase();
  const selectStmt = db.prepare('SELECT driverId FROM vehicles WHERE id = ?');
  const vehicle = selectStmt.get([id]);

  const updateStmt = db.prepare(`
      UPDATE drivers 
      SET status = 'AVAILABLE'
      WHERE id = ?
  `);
  updateStmt.run([vehicle[0]]);

  const stmt = db.prepare('DELETE FROM vehicles WHERE id = ?');
  const result = stmt.run([id]);
  return result.changes > 0;
};

export const getVehiclesCount = (): number => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM vehicles');

  let count = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as { count: number };
    count = row.count;
  }

  stmt.free(); // penting biar gak memory leak
  return count;
};