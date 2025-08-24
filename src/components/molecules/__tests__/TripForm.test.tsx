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
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripForm from "../TripForm";

// Mock API vehicles
vi.mock("../../services/api/vehicles", () => ({
  fetchVehicles: vi.fn().mockResolvedValue({
    data: [
      {
        id: "v1",
        plateNumber: "B1234XYZ",
        type: "TRUCK",
        capacity: 12, // kapasitas kendaraan (tons)
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

// Mock API mills
vi.mock("../../services/api/mills", () => ({
  fetchMills: vi.fn().mockResolvedValue({
    data: [
      {
        id: "m1",
        name: "Palm Mill A",
        location: "Somewhere",
        userId: "u1",
        avgDailyProduction: 5, // opsional, hanya untuk tampilan
      },
    ],
    total: 1,
  }),
}));

// Mock API auth/clients
vi.mock("../../services/api/auth", () => ({
  getAllClient: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        email: "clienta@email.com",
        name: "Client A",
        role: "client",
      },
    ],
    total: 1,
  }),
  login: vi.fn().mockResolvedValue({ token: "test-token" }),
}));

describe("TripForm", () => {
  it("shows vehicle, mill, and client options and allows selection", async () => {
    render(<TripForm onSubmit={() => {}} onCancel={() => {}} />);

    // Vehicle select berisi opsi B1234XYZ
    const vehicleSelect = await screen.findByLabelText(/vehicle/i);
    expect(
      await within(vehicleSelect).findByRole("option", { name: /B1234XYZ/i })
    ).toBeInTheDocument();

    await userEvent.selectOptions(vehicleSelect, "v1");
    expect((vehicleSelect as HTMLSelectElement).value).toBe("v1");

    // Mill tampil
    expect(await screen.findByText(/Palm Mill A/i)).toBeInTheDocument();

    // Client select berisi Client A
    const clientSelect = await screen.findByLabelText(/client/i);
    expect(
      await within(clientSelect).findByRole("option", { name: /Client A/i })
    ).toBeInTheDocument();

    await userEvent.selectOptions(clientSelect, "1");
    expect((clientSelect as HTMLSelectElement).value).toBe("1");
  });

  it("disables submit and shows error when total weight exceeds vehicle capacity", async () => {
    render(<TripForm onSubmit={() => {}} onCancel={() => {}} />);

    // Pilih vehicle
    const vehicleSelect = await screen.findByLabelText(/vehicle/i);
    await userEvent.selectOptions(vehicleSelect, "v1");

    // Pilih satu mill (gunakan getByLabelText agar lebih robust terhadap nama aksesibel)
    const millCheckbox = await screen.findByLabelText(/Palm Mill A/i);
    await userEvent.click(millCheckbox);

    // Input weight > capacity (capacity=12) -> 13
    const weightInput = await screen.findByLabelText(/Weight:/i);
    fireEvent.change(weightInput, { target: { value: "13" } });

    // Isi field lain (agar form valid selain kapasitas)
    const dtInput = await screen.findByLabelText(/Scheduled Date & Time/i);
    fireEvent.change(dtInput, { target: { value: "2025-12-31T12:00" } });

    const durationInput = await screen.findByLabelText(
      /Estimated Duration \(minutes\)/i
    );
    fireEvent.change(durationInput, { target: { value: "60" } });

    const clientSelect = await screen.findByLabelText(/client/i);
    await userEvent.selectOptions(clientSelect, "1");

    // Tombol submit disabled dan pesan error muncul
    const submitBtn = screen.getByRole("button", { name: /Create\s*Trip/i });
    expect(submitBtn).toBeDisabled();

    expect(
      screen.getByText(/Total weight exceeds vehicle capacity/i)
    ).toBeInTheDocument();
  });

  it("submits when within capacity and required fields are filled", async () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} onCancel={() => {}} />);

    // Pilih vehicle
    const vehicleSelect = await screen.findByLabelText(/vehicle/i);
    await userEvent.selectOptions(vehicleSelect, "v1");

    // Pilih mill via label
    const millCheckbox = await screen.findByLabelText(/Palm Mill A/i);
    await userEvent.click(millCheckbox);

    // Weight <= capacity (10 <= 12)
    const weightInput = await screen.findByLabelText(/Weight:/i);
    fireEvent.change(weightInput, { target: { value: "10" } });

    // Isi tanggal & durasi
    const dtInput = await screen.findByLabelText(/Scheduled Date & Time/i);
    fireEvent.change(dtInput, { target: { value: "2025-12-31T12:00" } });

    const durationInput = await screen.findByLabelText(
      /Estimated Duration \(minutes\)/i
    );
    fireEvent.change(durationInput, { target: { value: "45" } });

    // Pilih client (admin)
    const clientSelect = await screen.findByLabelText(/client/i);
    await userEvent.selectOptions(clientSelect, "1");

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Create\s*Trip/i });
    expect(submitBtn).not.toBeDisabled();
    await userEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
