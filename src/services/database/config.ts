// src/services/database/config.ts
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

export const initializeDatabase = async (): Promise<Database> => {
  if (db) return db;

  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // Try to load from localStorage
    const savedDb = localStorage.getItem('palm_oil_database');
    
    if (savedDb) {
      // Convert base64 back to Uint8Array
      const data = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
      db = new SQL.Database(data);
      console.log('Database loaded from localStorage');
    } else {
      // Create new database
      db = new SQL.Database();
      console.log('New database created');
      
      // Initialize schema for new database
      initializeSchema();
    }
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const resetDatabase = () => {
  localStorage.removeItem('palm_oil_database');
  db = null; // reset instance agar initializeDatabase() bikin baru lagi
  console.log('Database deleted from localStorage');
};

export const getDatabase = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

export const saveDatabase = (): void => {
  if (db) {
    // Export database to binary array
    const binaryArray = db.export();
    // Convert to base64 for localStorage
    const base64 = btoa(String.fromCharCode(...binaryArray));
    localStorage.setItem('palm_oil_database', base64);
    console.log('Database saved to localStorage');
  }
};

export const closeDatabase = (): void => {
  if (db) {
    saveDatabase(); // Save before closing
    db.close();
    db = null;
  }
};

// Initialize database schema
const initializeSchema = (): void => {
  if (!db) return;

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
      millId TEXT,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      licenseNumber TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SICK')),
    userId TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      plateNumber TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('TRUCK', 'VAN', 'PICKUP')),
      capacity REAL NOT NULL,
      driverId TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE')),
      userId TEXT NOT NULL,
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
      userId TEXT NOT NULL,
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
      userId TEXT NOT NULL,
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
      userId TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Export untuk backward compatibility
export const initDatabase = initializeDatabase;