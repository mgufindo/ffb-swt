import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock modules BEFORE importing the component
vi.mock("../../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Component imports getAllClient from services/api/auth
vi.mock("../../../services/api/auth", () => ({
  getAllClient: vi.fn(),
}));

import { useAuth } from "../../../hooks/useAuth";
import * as AuthApi from "../../../services/api/auth";
import DriverForm from "../DriverForm";

type AuthUser = { id: string; role: "admin" | "client" };
type UseAuthReturn = {
  user: AuthUser | null;
  isAuthenticated?: boolean;
  loading?: boolean;
};

const setUseAuth = (state: Partial<UseAuthReturn>) => {
  const defaults: UseAuthReturn = {
    user: null,
    isAuthenticated: true,
    loading: false,
  };
  (useAuth as unknown as vi.Mock).mockReturnValue({ ...defaults, ...state });
};

// Align client data with provided setup (id, email, name, role)
const mockGetAllClient = (
  data: Array<{
    id: string;
    email: string;
    name: string;
    role: "client" | "admin";
  }>
) => {
  (AuthApi.getAllClient as unknown as vi.Mock).mockResolvedValue({ data });
};

describe("DriverForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    setUseAuth({ user: { id: "u1", role: "client" } });
    mockGetAllClient([]);

    const { container } = render(
      <DriverForm isOpen={false} onCancel={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders creation form for client (non-admin) without client selector, submits with userId from auth", async () => {
    setUseAuth({ user: { id: "u-client", role: "client" } });
    mockGetAllClient([
      { id: "1", email: "clienta@email.com", name: "Client A", role: "client" },
    ]);

    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<DriverForm isOpen onCancel={onCancel} onSubmit={onSubmit} />);

    // Title and submit button label for creation
    expect(screen.getByText("Add New Driver")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create driver/i })
    ).toBeInTheDocument();

    // Client selector should NOT be present for non-admin
    expect(screen.queryByText("Client")).not.toBeInTheDocument();

    // Fill inputs
    await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
    await userEvent.type(screen.getByLabelText(/license number/i), "SIM A123");
    await userEvent.type(screen.getByLabelText(/phone number/i), "08123456789");
    await userEvent.selectOptions(screen.getByLabelText(/status/i), "SICK");

    await userEvent.click(
      screen.getByRole("button", { name: /create driver/i })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toEqual({
      name: "John Doe",
      licenseNumber: "SIM A123",
      phoneNumber: "08123456789",
      status: "SICK",
      userId: "u-client",
    });
  });

  it("renders client selector for admin, loads clients, and submits with selected clientId", async () => {
    setUseAuth({ user: { id: "admin-1", role: "admin" } });
    mockGetAllClient([
      { id: "1", email: "clienta@email.com", name: "Client A", role: "client" },
      { id: "3", email: "clientb@email.com", name: "Client B", role: "client" },
    ]);

    const onSubmit = vi.fn();

    render(<DriverForm isOpen onCancel={vi.fn()} onSubmit={onSubmit} />);

    // Shows loading then selector
    expect(screen.getByText(/loading clients/i)).toBeInTheDocument();

    // Wait for options to load, then find the select via one of its options
    const clientBOption = await screen.findByRole("option", {
      name: "Client B",
    });
    const clientSelect = clientBOption.parentElement as HTMLSelectElement;

    // Must have default option plus clients
    expect(
      screen.getByRole("option", { name: /select a client/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Client A" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Client B" })
    ).toBeInTheDocument();

    // Fill form
    await userEvent.type(screen.getByLabelText(/full name/i), "Driver Admin");
    await userEvent.type(screen.getByLabelText(/license number/i), "SIM B999");
    await userEvent.type(screen.getByLabelText(/phone number/i), "0899999999");
    await userEvent.selectOptions(screen.getByLabelText(/status/i), "ON_TRIP");

    // Select Client B (id "3")
    await userEvent.selectOptions(clientSelect, "3");
    expect(clientSelect.value).toBe("3");

    await userEvent.click(
      screen.getByRole("button", { name: /create driver/i })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toEqual({
      name: "Driver Admin",
      licenseNumber: "SIM B999",
      phoneNumber: "0899999999",
      status: "ON_TRIP",
      userId: "3", // selected client id
    });
  });

  it("prefills values when editing and keeps existing clientId for admin if not changed", async () => {
    setUseAuth({ user: { id: "admin-1", role: "admin" } });
    mockGetAllClient([
      { id: "1", email: "clienta@email.com", name: "Client A", role: "client" },
      { id: "3", email: "clientb@email.com", name: "Client B", role: "client" },
    ]);

    const onSubmit = vi.fn();

    const driver = {
      id: "d1",
      name: "Jane Driver",
      licenseNumber: "SIM X777",
      phoneNumber: "0800000000",
      status: "OFF_DUTY",
      userId: "1", // existing client id
    };

    render(
      <DriverForm
        driver={driver}
        isOpen
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    // Edit mode labels
    expect(screen.getByText("Edit Driver")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update driver/i })
    ).toBeInTheDocument();

    // Prefilled fields
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Driver");
    expect(screen.getByLabelText(/license number/i)).toHaveValue("SIM X777");
    expect(screen.getByLabelText(/phone number/i)).toHaveValue("0800000000");
    expect(screen.getByLabelText(/status/i)).toHaveValue("OFF_DUTY");

    // Wait for clients select to appear and ensure default selected is driver's userId
    const clientAOption = await screen.findByRole("option", {
      name: "Client A",
    });
    const clientSelect = clientAOption.parentElement as HTMLSelectElement;

    await waitFor(() => {
      expect(clientSelect.value).toBe("1");
    });

    // Submit without changing client selection
    await userEvent.click(
      screen.getByRole("button", { name: /update driver/i })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toEqual({
      name: "Jane Driver",
      licenseNumber: "SIM X777",
      phoneNumber: "0800000000",
      status: "OFF_DUTY",
      userId: "1",
    });
  });

  it("calls onCancel when Cancel is clicked", async () => {
    setUseAuth({ user: { id: "u1", role: "client" } });
    mockGetAllClient([]);

    const onCancel = vi.fn();

    render(<DriverForm isOpen onCancel={onCancel} onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("marks inputs as required", () => {
    setUseAuth({ user: { id: "u1", role: "client" } });
    mockGetAllClient([]);

    render(<DriverForm isOpen onCancel={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/full name/i)).toBeRequired();
    expect(screen.getByLabelText(/license number/i)).toBeRequired();
    expect(screen.getByLabelText(/phone number/i)).toBeRequired();
  });
});
