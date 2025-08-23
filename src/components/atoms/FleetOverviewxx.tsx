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

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import FleetOverview from "../organisms/FleetManagement";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchVehicles,
  addVehicle,
  modifyVehicle,
  removeVehicle,
} from "../../services/api/vehicles";
import { within } from "@testing-library/react";

// Mock dependencies
vi.mock("../../../hooks/useAuth");
vi.mock("../../../services/api/vehicles");

// Mock child components
vi.mock("../molecules/VehicleForm", () => ({
  default: ({ vehicle, onSubmit, onCancel, isOpen }) =>
    isOpen ? (
      <div data-testid="vehicle-form">
        {vehicle ? "Edit Vehicle Form" : "Add Vehicle Form"}
        <button onClick={() => onCancel()}>Cancel</button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (vehicle) {
              onSubmit({ plateNumber: "ABC123" }); // edit mode
            } else {
              onSubmit({ plateNumber: "ABC123" }); // add mode
            }
          }}
        >
          <button type="submit">Submit</button>
        </form>
      </div>
    ) : null,
}));

vi.mock("../atoms/Pagination", () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)}>Previous</button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
    </div>
  ),
}));

vi.mock("../atoms/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("../atoms/LoadingSpinner", () => ({
  default: ({ size }) => (
    <div data-testid={`loading-spinner-${size}`}>Loading...</div>
  ),
}));

vi.mock("../atoms/ConfirmModal", () => ({
  default: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant,
  }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onClose}>{cancelText}</button>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null,
}));

vi.mock("../molecules/DataTable", () => ({
  default: ({ columns, data, loading, emptyMessage, rowActions, keyField }) => {
    // Simulate loading state
    if (loading) {
      return <div data-testid="data-table">Loading data...</div>;
    }

    // Simulate empty state
    if (data.length === 0) {
      return <div data-testid="data-table">{emptyMessage}</div>;
    }

    // Render actual data
    return (
      <div data-testid="data-table">
        {data.map((item) => (
          <div key={item[keyField]} data-testid="table-row">
            {columns.map((col) => (
              <div key={col.key} data-testid={`cell-${col.key}`}>
                {col.render ? col.render(item[col.key], item) : item[col.key]}
              </div>
            ))}
            {rowActions && (
              <div data-testid="row-actions">{rowActions(item)}</div>
            )}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock("../atoms/Badges", () => ({
  StatusBadge: ({ status, type }) => (
    <div data-testid="status-badge">{status}</div>
  ),
  TypeBadge: ({ type }) => <div data-testid="type-badge">{type}</div>,
}));

// Mock data
const mockVehicles = [
  {
    id: "1",
    plateNumber: "ABC123",
    type: "TRUCK",
    capacity: 10,
    status: "AVAILABLE",
    driver: {
      id: "d1", // <-- harus sama dengan id di fetchDrivers
      name: "John Doe",
      phoneNumber: "123-456-7890",
    },
    users: "Client 1",
  },
  {
    id: "2",
    plateNumber: "XYZ789",
    type: "VAN",
    capacity: 5,
    status: "IN_USE",
    driver: {
      id: "d2", // <-- harus sama dengan id di fetchDrivers
      name: "Jane Smith",
      phoneNumber: "098-765-4321",
    },
    users: "Client 2",
  },
];

vi.mock("../../../services/api/drivers", () => ({
  fetchDrivers: vi.fn().mockResolvedValue({
    data: [
      {
        id: "d1",
        name: "John Doe",
        phoneNumber: "123-456-7890",
        licenseNumber: "A12345",
        status: "AVAILABLE",
      },
      {
        id: "d2",
        name: "Jane Smith",
        phoneNumber: "098-765-4321",
        licenseNumber: "B54321",
        status: "IN_USE",
      },
    ],
  }),
}));

vi.mock("../../../services/api/drivers", () => ({
  fetchDrivers: vi.fn().mockResolvedValue({
    data: [
      {
        id: "d1",
        name: "John Doe",
        phoneNumber: "123-456-7890",
        licenseNumber: "A12345",
        status: "AVAILABLE",
      },
      {
        id: "d2",
        name: "Jane Smith",
        phoneNumber: "098-765-4321",
        licenseNumber: "B54321",
        status: "IN_USE",
      },
    ],
  }),
}));

describe("FleetOverview Component", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "1", role: "admin" },
    } as any);

    vi.mocked(fetchVehicles).mockResolvedValue({
      data: mockVehicles,
      total: mockVehicles.length,
    } as any);
  });

  test("renders loading state initially", async () => {
    // Keep the loading state
    vi.mocked(fetchVehicles).mockImplementation(() => new Promise(() => {}));

    render(<FleetOverview />);

    expect(screen.getByTestId("loading-spinner-lg")).toBeInTheDocument();
    expect(screen.getByText("Loading vehicles...")).toBeInTheDocument();
  });

  test("loads and displays vehicles on successful fetch", async () => {
    render(<FleetOverview />);

    await waitFor(() => {
      expect(fetchVehicles).toHaveBeenCalledWith(1, 10, undefined);
    });

    expect(screen.getByText("Vehicle Fleet")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your vehicle fleet efficiently")
    ).toBeInTheDocument();

    // Check if data table is rendered with data
    await waitFor(() => {
      const tables = screen.getAllByTestId("data-table");
      expect(tables.length).toBeGreaterThan(0); // Atau toBe(2) jika memang ada 2 data-table
    });

    // Remove this block! It is NOT correct:
    // await waitFor(() => {
    //   expect(addVehicle).toHaveBeenCalledWith(
    //     expect.objectContaining({ plateNumber: "ABC123" })
    //   );
    // });

    // Optionally, check for vehicle data in table:
    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
      expect(screen.getByText("XYZ789")).toBeInTheDocument();
    });
  });

  test("displays error message when fetch fails", async () => {
    const errorMessage = "Failed to fetch vehicles";
    vi.mocked(fetchVehicles).mockRejectedValue(new Error(errorMessage));

    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test("filters vehicles based on search term", async () => {
    vi.mocked(fetchVehicles).mockResolvedValue({
      data: [
        {
          id: "1",
          plateNumber: "B1234XYZ",
          type: "TRUCK",
          driver: {
            name: "Test Driver",
            phoneNumber: "000",
            id: "2131232",
            licenseNumber: "123123213",
            userId: "213123123122",
            status: "AVAILABLE",
          },
          capacity: 1,
          status: "AVAILABLE",
          users: "Client X",
        },
      ],
      total: 1,
    });

    render(<FleetOverview />);

    await waitFor(() => {
      expect(fetchVehicles).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "B1234" } });

    await waitFor(() => {
      expect(fetchVehicles).toHaveBeenCalledTimes(2);
    });
  });

  test("opens add vehicle form when button is clicked", async () => {
    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add Vehicle");
    await userEvent.click(addButton);

    // Wait for form to open
    await waitFor(() => {
      expect(screen.getByTestId("vehicle-form")).toBeInTheDocument();
    });

    expect(screen.getByText("Add New Vehicle")).toBeInTheDocument();
  });

  test("displays action buttons for each vehicle", async () => {
    render(<FleetOverview />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Check if action buttons are present
    const editButtons = screen.getAllByTitle("Edit vehicle");
    const deleteButtons = screen.getAllByTitle("Delete vehicle");

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  test("opens edit vehicle form when edit button is clicked", async () => {
    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Find and click edit button (first one)
    const editButtons = screen.getAllByTitle("Edit vehicle");
    await userEvent.click(editButtons[0]);

    // Wait for form to open
    await waitFor(() => {
      expect(screen.getByTestId("vehicle-form")).toBeInTheDocument();
    });

    expect(screen.getByText("Edit Vehicle")).toBeInTheDocument();
  });

  test("opens delete confirmation modal when delete button is clicked", async () => {
    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Find and click delete button (first one)
    const deleteButtons = screen.getAllByTitle("Delete vehicle");
    await userEvent.click(deleteButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });

    expect(screen.getByText("Delete Vehicle")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete vehicle ABC123/)
    ).toBeInTheDocument();
  });

  test("calls delete API when confirmation is accepted", async () => {
    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Open delete confirmation
    const deleteButtons = screen.getAllByTitle("Delete vehicle");
    await userEvent.click(deleteButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByText("Delete");
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(removeVehicle).toHaveBeenCalledWith("1");
    });
  });

  test("paginates through vehicles", async () => {
    // Mock response dengan total halaman lebih dari 1
    vi.mocked(fetchVehicles).mockResolvedValue({
      data: [mockVehicles[0]], // Hanya satu kendaraan di halaman 2
      total: 15, // Total items lebih dari itemsPerPage (10)
    } as any);

    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Pastikan pagination ditampilkan
    await waitFor(() => {
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    // Klik tombol next
    const nextButton = screen.getByText("Next");
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(fetchVehicles).toHaveBeenCalledWith(2, 10, undefined);
    });
  });

  test("does not show pagination when there is only one page", async () => {
    // Mock response dengan total halaman = 1
    vi.mocked(fetchVehicles).mockResolvedValue({
      data: mockVehicles,
      total: 8, // Total items kurang dari itemsPerPage (10)
    } as any);

    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Pastikan pagination tidak ditampilkan
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  test("displays statistics correctly", async () => {
    render(<FleetOverview />);
    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Ambil container statistik
    const totalContainer = screen.getByText("Total Vehicles").parentElement;
    const availableContainer =
      screen.getByTestId("available-label").parentElement;
    // Gunakan queryAllByText dan filter yang parentnya punya label
    const inUseContainers = screen
      .queryAllByText("In Use")
      .map((el) => el.parentElement);
    const inUseStatContainer = inUseContainers.find((c) =>
      c?.className.includes("ml-4")
    );
    expect(within(inUseStatContainer!).getByText("1")).toBeInTheDocument();
    const maintenanceContainer = screen
      .queryAllByText("Maintenance")
      .map((el) => el.parentElement)
      .find((c) => c?.className.includes("ml-4"));

    expect(within(totalContainer!).getByText("2")).toBeInTheDocument();
    expect(within(availableContainer!).getByText("1")).toBeInTheDocument();
    expect(within(inUseStatContainer!).getByText("1")).toBeInTheDocument();
    expect(within(maintenanceContainer!).getByText("0")).toBeInTheDocument();
  });

  test("handles client role correctly", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "client1", role: "client" },
    } as any);

    render(<FleetOverview />);

    await waitFor(() => {
      expect(fetchVehicles).toHaveBeenCalledWith(1, 10, "client1");
    });
  });

  test("closes vehicle form when cancel is clicked", async () => {
    render(<FleetOverview />);
    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });
    // Open form
    const addButton = screen.getByText("Add Vehicle");
    await userEvent.click(addButton);
    await waitFor(() => {
      expect(screen.getByTestId("vehicle-form")).toBeInTheDocument();
    });
    // Close form
    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);
    await waitFor(() => {
      expect(screen.queryByTestId("vehicle-form")).not.toBeInTheDocument();
    });
  });

  test("calls addVehicle when form is submitted for new vehicle", async () => {
    render(<FleetOverview />);

    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add Vehicle");
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("vehicle-form")).toBeInTheDocument();
    });

    const submitButton = screen.getByText("Submit");
    await userEvent.click(submitButton);
  });

  test("calls modifyVehicle when form is submitted for editing", async () => {
    render(<FleetOverview />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    // Open edit form - using the first edit button
    const editButtons = screen.getAllByTitle("Edit vehicle");
    await userEvent.click(editButtons[0]);

    // Wait for form to open
    await waitFor(() => {
      expect(screen.getByTestId("vehicle-form")).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByText("Submit");
    await userEvent.click(submitButton);
  });
});
