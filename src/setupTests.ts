import '@testing-library/jest-dom';
import { vi } from "vitest";
vi.mock("./services/database/config", () => ({
  initializeDatabase: vi.fn(),
  getDatabase: vi.fn(() => ({
    prepare: vi.fn(() => ({
      bind: vi.fn(), // <--- WAJIB ADA!
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

// Jika kamu belum pakai alias "@", kamu bisa juga tambah mock dengan path relatif absolut:
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