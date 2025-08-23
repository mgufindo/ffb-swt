vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      role: "admin",
      name: "Test User",
      email: "test@email.com",
    },
    isAuthenticated: true,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../../../services/api/vehicles", () => ({
  fetchVehicles: vi.fn().mockResolvedValue({
    data: [
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
    ],
    total: 1,
  }),
}));

vi.mock("../../../services/api/mills", () => ({
  fetchMills: vi.fn().mockResolvedValue({
    data: [
      { id: "m1", name: "Palm Mill A", location: "Somewhere", userId: "u1" },
    ],
    total: 1,
  }),
}));

// PASTIKAN ini sesuai import TripForm (path dan nama fungsi harus sama persis)
vi.mock("../../../services/api/auth", () => ({
  getAllClient: vi.fn().mockResolvedValue({
    data: [{ id: "c1", name: "Client A" }],
    total: 1,
  }),
  login: vi.fn().mockResolvedValue({ token: "test-token" }),
}));

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripForm from "../TripForm";
import { vi, it, expect } from "vitest";

it("should show vehicle, mill, and client options", async () => {
  render(<TripForm onSubmit={() => {}} onCancel={() => {}} />);

  // Vehicle
  const vehicleSelect = await screen.findByLabelText(/vehicle/i);
  expect(
    await within(vehicleSelect).findByRole("option", { name: /B1234XYZ/i })
  ).toBeInTheDocument();
  await userEvent.selectOptions(vehicleSelect, "v1");
  expect((vehicleSelect as HTMLSelectElement).value).toBe("v1");

  // Mills
  expect(await screen.findByText(/Palm Mill A/i)).toBeInTheDocument();

  // Client
  const clientSelect = await screen.findByLabelText(/client/i);
  // Jika masih gagal, samakan mock dengan import TripForm
  expect(
    await within(clientSelect).findByRole("option", { name: /Client A/i })
  ).toBeInTheDocument();
  await userEvent.selectOptions(clientSelect, "c1");
  expect((clientSelect as HTMLSelectElement).value).toBe("c1");
});
