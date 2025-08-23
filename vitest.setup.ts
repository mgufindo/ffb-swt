import { vi } from "vitest";
vi.mock("../../services/database/config", () => ({
  initializeDatabase: vi.fn(),
  getDatabase: vi.fn(() => ({
    prepare: vi.fn(() => ({
      all: vi.fn(() => [/* data mock di sini */]),
      get: vi.fn(),
    })),
  })),
}));