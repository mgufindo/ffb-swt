import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("./services/database/config", () => ({
  initializeDatabase: vi.fn(),
  getDatabase: vi.fn(() => ({
    prepare: vi.fn(() => ({
      bind: vi.fn(),
      get: vi.fn(),
      all: vi.fn(() => [
        {
          id: "1",
          plateNumber: "B1234ABC",
          type: "TRUCK",
          capacity: 8,
          status: "AVAILABLE",
          driver: {
            id: "d1",
            name: "John Driver",
            licenseNumber: "SIM A12345",
            phoneNumber: "08123456789",
          },
          users: "Client A",
        },
        {
          id: "2",
          plateNumber: "B5678XYZ",
          type: "PICKUP",
          capacity: 2,
          status: "IN_USE",
          driver: {
            id: "d2",
            name: "Jane Driver",
            licenseNumber: "SIM B67890",
            phoneNumber: "08987654321",
          },
          users: "Client B",
        },
      ]),
      run: vi.fn(),
      free: vi.fn(),
      step: vi.fn(),
      reset: vi.fn(),
    })),
    exec: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}));

// Vehicles CRUD mock (varian 1)
vi.mock("./services/database/crud/vehicles", () => ({
  getVehicles: vi.fn(() => [
    {
      id: "v1",
      plateNumber: "B1234XYZ",
      type: "TRUCK",
      capacity: 12,
      users: "User A",
      userId: "u1",
      driver: {
        id: "d1",
        name: "John Doe",
        licenseNumber: "D98765",
        phoneNumber: "08123456789",
        status: "AVAILABLE",
        userId: "u1",
      },
      status: "AVAILABLE",
    },
  ]),
  getVehiclesCount: vi.fn(() => 1),
  getVehicleById: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
}));

// Vehicles CRUD mock (varian 2)
vi.mock("./src/services/database/crud/vehicles", () => ({
  getVehicles: vi.fn(() => [
    {
      id: "v1",
      plateNumber: "B1234XYZ",
      type: "TRUCK",
      capacity: 12,
      users: "User A",
      userId: "u1",
      driver: {
        id: "d1",
        name: "John Doe",
        licenseNumber: "D98765",
        phoneNumber: "08123456789",
        status: "AVAILABLE",
        userId: "u1",
      },
      status: "AVAILABLE",
    },
  ]),
  getVehiclesCount: vi.fn(() => 1),
  getVehicleById: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
}));

// Mills CRUD mock (varian 1) — row format with lat/lng (string) to match mapper
vi.mock("./services/database/crud/mills", () => ({
  getMills: vi.fn(() => [
    {
      id: "m1",
      name: "Palm Mill A",
      lat: "-6.2000",
      lng: "106.8000",
      contactPerson: "Jane Doe",
      phoneNumber: "081234567890",
      avgDailyProduction: 5,
      userId: "u1",
    },
    {
      id: "m2",
      name: "Palm Mill B",
      lat: "-6.3000",
      lng: "106.9000",
      contactPerson: "Budi",
      phoneNumber: "081298765432",
      avgDailyProduction: 7.5,
      userId: "u1",
    },
  ]),
  getMillsCount: vi.fn(() => 2),
  getMillById: vi.fn(),
  createMill: vi.fn(),
  updateMill: vi.fn(),
  deleteMill: vi.fn(),
}));

// Mills CRUD mock (varian 2)
vi.mock("./src/services/database/crud/mills", () => ({
  getMills: vi.fn(() => [
    {
      id: "m1",
      name: "Palm Mill A",
      lat: "-6.2000",
      lng: "106.8000",
      contactPerson: "Jane Doe",
      phoneNumber: "081234567890",
      avgDailyProduction: 5,
      userId: "u1",
    },
    {
      id: "m2",
      name: "Palm Mill B",
      lat: "-6.3000",
      lng: "106.9000",
      contactPerson: "Budi",
      phoneNumber: "081298765432",
      avgDailyProduction: 7.5,
      userId: "u1",
    },
  ]),
  getMillsCount: vi.fn(() => 2),
  getMillById: vi.fn(),
  createMill: vi.fn(),
  updateMill: vi.fn(),
  deleteMill: vi.fn(),
}));

// ===== Users/Clients CRUD mock (berdasarkan mapping "users.push({...})") =====

// Varian 1 (tanpa prefix src)
vi.mock("./services/database/crud/auth", () => ({
  // Kembalikan "row" ala DB; mapper di layer atas akan mengubah ke shape final
  getUsers: vi.fn(() => [
    {
      id: 1,
      email: "clienta@email.com",
      name: "Client A",
      role: "client",
    },
    {
      id: 2,
      email: "admin@email.com",
      name: "Admin User",
      role: "admin",
    },
  ]),
  getUsersCount: vi.fn(() => 2),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  // Jika ada helper spesifik untuk clients
  getAllClients: vi.fn(() => [
    {
      id: 1,
      email: "clienta@email.com",
      name: "Client A",
      role: "client",
    },
  ]),
  getClientsCount: vi.fn(() => 1),
}));

// Varian 2 (dengan prefix src)
vi.mock("./src/services/database/crud/auth", () => ({
  getUsers: vi.fn(() => [
    {
      id: 1,
      email: "clienta@email.com",
      name: "Client A",
      role: "client",
    },
    {
      id: 2,
      email: "admin@email.com",
      name: "Admin User",
      role: "admin",
    },
  ]),
  getUsersCount: vi.fn(() => 2),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getAllClients: vi.fn(() => [
    {
      id: 1,
      email: "clienta@email.com",
      name: "Client A",
      role: "client",
    },
  ]),
  getClientsCount: vi.fn(() => 1),
}));