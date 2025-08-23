// src/services/database/crud/drivers.ts
import { getDatabase } from '../config';
import { Driver, DriverStatus } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

export const getDrivers = (
  limit = 100,
  offset = 0,
  userId?: string,
  searchTerm = '',
  status?: string
): Driver[] => {
  const db = getDatabase();

  let query = `SELECT * FROM drivers WHERE 1=1`; // 1=1 supaya gampang nambah kondisi
  const params: any[] = [];

  // filter by userId kalau ada
  if (userId && userId.trim() !== '') {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  // search by name kalau ada
  if (searchTerm && searchTerm.trim() !== '') {
    query += ` AND name LIKE ?`;
    params.push(`%${searchTerm}%`);
  }

  if (status && status.trim() !== '') {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  stmt.bind(params);

  const results: Driver[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      name: row.name,
      licenseNumber: row.licenseNumber,
      phoneNumber: row.phoneNumber,
      status: row.status,
      userId: row.userId, // jangan lupa include userId biar keliatan relasi
    });
  }

  stmt.free();
  return results;
};


export const getDriverById = (id: string): Driver | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM drivers WHERE id = ?');
  
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
    licenseNumber: row.licenseNumber,
    phoneNumber: row.phoneNumber,
    status: row.status
  };
};

export const createDriver = (driver: Omit<Driver, 'id'>): string => {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO drivers (id, name, licenseNumber, phoneNumber, status, userId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.bind([id, driver.name, driver.licenseNumber, driver.phoneNumber, driver.status, driver.userId]);
  stmt.step();
  stmt.free();
  
  return id;
};

export const updateDriver = (id: string, driver: Partial<Omit<Driver, 'id'>>): boolean => {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (driver.name !== undefined) {
    fields.push('name = ?');
    values.push(driver.name);
  }
  
  if (driver.licenseNumber !== undefined) {
    fields.push('licenseNumber = ?');
    values.push(driver.licenseNumber);
  }
  
  if (driver.phoneNumber !== undefined) {
    fields.push('phoneNumber = ?');
    values.push(driver.phoneNumber);
  }
  
  if (driver.status !== undefined) {
    fields.push('status = ?');
    values.push(driver.status);
  }

  if (driver.userId !== undefined) {
    fields.push('userId = ?');
    values.push(driver.userId);
  }
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  
  const stmt = db.prepare(`UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`);
  stmt.bind([...values, id]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  
  return changes > 0;
};

export const deleteDriver = (id: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM drivers WHERE id = ?');
  
  stmt.bind([id]);
  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();
  
  return changes > 0;
};

export const getDriversCount = (searchTerm: string = "", userId?: string): number => {
  const db = getDatabase();

  let query = "SELECT COUNT(*) as count FROM drivers WHERE 1=1";
  const params: any[] = [];

  if (searchTerm) {
    query += " AND name LIKE ?";
    params.push(`%${searchTerm}%`);
  }

  if (userId) {
    query += " AND userId = ?";
    params.push(userId);
  }

  const stmt = db.prepare(query);
  stmt.bind(params);

  stmt.step();
  const result = stmt.getAsObject() as { count: number };
  stmt.free();

  return result.count;
};
