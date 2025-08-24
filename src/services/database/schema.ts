// src/services/database/schema.ts
import { getDatabase } from './config';

export const initDatabaseSchema = (): void => {
  const db = getDatabase();
  
  console.log('Initializing database schema...');
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      licenseNumber TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      userId TEXT,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SICK')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      plateNumber TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('TRUCK', 'VAN', 'PICKUP')),
      capacity REAL NOT NULL,
      driverId TEXT NOT NULL,
      userId TEXT,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driverId) REFERENCES drivers (id)
    );
    
    CREATE TABLE IF NOT EXISTS mills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      contactPerson TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      avgDailyProduction REAL NOT NULL,
      userId TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      driverId TEXT NOT NULL,
      scheduledDate TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
      estimatedDuration INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS trip_mills (
      tripId TEXT NOT NULL,
      millId TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tripId, millId)
    );
    
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      tripId TEXT,
      millId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      weight REAL NOT NULL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('Database schema initialized successfully');
};