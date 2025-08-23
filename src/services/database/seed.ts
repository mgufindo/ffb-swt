// src/services/database/seed.ts
import { getDatabase } from './config';
import { v4 as uuidv4 } from 'uuid';

export const seedInitialData = (): void => {
  const db = getDatabase();
  console.log('Seeding initial data...');

  // Check if already seeded
  const userResult = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount =
    userResult.length > 0 && userResult[0].values.length > 0
      ? userResult[0].values[0][0]
      : 0;

  if (userCount === 0) {
    // --- Users ---
    const adminId = uuidv4();
    const client1Id = uuidv4();
    const client2Id = uuidv4();

    db.exec(`
      INSERT INTO users (id, email, name, role, millId, password) VALUES
        ('${adminId}', 'admin@ffb.com', 'System Administrator', 'admin', NULL, 'admin123'),
        ('${client1Id}', 'client1@mill.com', 'Mill Client 1', 'client', 'mill-1', 'client123'),
        ('${client2Id}', 'client2@mill.com', 'Mill Client 2', 'client', 'mill-2', 'client123')
    `);

    // --- Mills ---
    db.exec(`
      INSERT INTO mills (id, name, lat, lng, contactPerson, phoneNumber, avgDailyProduction, userId) VALUES
        ('mill-1', 'Palm Oil Mill 1', 3.1390, 101.6869, 'Robert Johnson', '+1234567890', 240, '${adminId}'),
        ('mill-2', 'Palm Oil Mill 2', 3.0738, 101.5183, 'Sarah Williams', '+0987654321', 240, '${adminId}')
    `);

    // --- Drivers (bulk generate) ---
    const drivers: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const driverId = uuidv4();
      drivers.push(
        `('${driverId}', 'Driver ${i}', 'DL${1000 + i}', '+621234567${i}', 'AVAILABLE', '${adminId}')`
      );
    }
    db.exec(`
      INSERT INTO drivers (id, name, licenseNumber, phoneNumber, status, userId)
      VALUES ${drivers.join(',')}
    `);

    // --- Vehicles (bulk generate, 1:1 mapping dengan driver) ---
    const vehicles: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const vehicleId = uuidv4();
      vehicles.push(
        `('${vehicleId}', 'B ${1000 + i} XYZ', 'TRUCK', 12, NULL, 'AVAILABLE', '${adminId}')`
      );
    }
    db.exec(`
      INSERT INTO vehicles (id, plateNumber, type, capacity, driverId, status, userId)
      VALUES ${vehicles.join(',')}
    `);

    // --- Trips (optional seed sample trips for demo) ---
    const trips: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const tripId = uuidv4();
      trips.push(
        `('${tripId}', 'TRIP-${i}', '${new Date().toISOString()}', 'Scheduled', 90)`
      );
    }
    // NOTE: Pastikan tabel trips ada dengan kolom sesuai definisi
    try {
      db.exec(`
        INSERT INTO trips (id, code, scheduledDate, status, estimatedDuration)
        VALUES ${trips.join(',')}
      `);
    } catch (e) {
      console.log('Skipping trips seeding (table not ready)');
    }

    console.log('✅ Database seeded with initial data');
  } else {
    console.log('ℹ️ Database already contains data, skipping seeding');
  }
};
