// src/services/database/optimization.ts
import { getDatabase } from './config';

// Function to optimize database for large datasets
export const optimizeForLargeDatasets = (): void => {
  const db = getDatabase();
  
  // Increase cache size
  db.pragma('cache_size = -100000'); // 100MB cache
  
  // Enable more aggressive optimization
  db.pragma('optimize');
  
  // Create additional indexes for large dataset queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_vehicles_plateNumber ON vehicles(plateNumber);
    CREATE INDEX IF NOT EXISTS idx_drivers_name ON drivers(name);
    CREATE INDEX IF NOT EXISTS idx_mills_name ON mills(name);
    CREATE INDEX IF NOT EXISTS idx_trips_status_date ON trips(status, scheduledDate);
    CREATE INDEX IF NOT EXISTS idx_collections_status_timestamp ON collections(status, timestamp);
  `);
};

// Function to handle pagination with large datasets efficiently
export const queryWithPagination = <T>(
  baseQuery: string,
  params: any[] = [],
  limit: number = 50,
  offset: number = 0
): T[] => {
  const db = getDatabase();
  const paginatedQuery = `${baseQuery} LIMIT ? OFFSET ?`;
  const stmt = db.prepare(paginatedQuery);
  return stmt.all(...params, limit, offset) as T[];
};

// Function to get estimated counts for large tables quickly
export const getEstimatedCount = (tableName: string): number => {
  const db = getDatabase();
  try {
    // For very large tables, exact count can be slow
    // This provides an estimate that's much faster
    const result = db.prepare(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = ?`
    ).get(tableName) as { count: number };
    
    if (result.count === 0) return 0;
    
    // For SQLite, we can use this approximation for large tables
    const estimate = db.prepare(
      `SELECT (SELECT seq FROM sqlite_sequence WHERE name = ?) as count`
    ).get(tableName) as { count: number };
    
    return estimate.count || 0;
  } catch (error) {
    // Fallback to exact count if estimation fails
    const exact = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
    return exact.count;
  }
};