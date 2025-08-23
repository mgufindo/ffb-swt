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
import DriverManagement from "../organisms/DriverManagement";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchDrivers,
  addDriver,
  modifyDriver,
  removeDriver,
} from "../../services/api/drivers";

// Mock dependencies
vi.mock("../../../hooks/useAuth");
vi.mock("../../../services/api/drivers");

// Mock child components
vi.mock("../../molecules/DriverForm", () => ({
  default: ({ driver, onSubmit, onCancel, isOpen }) =>
    isOpen ? (
      <div data-testid="driver-form">
        {driver ? "Edit Driver Form" : "Add Driver Form"}
        <button onClick={() => onCancel()}>Cancel</button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (driver) {
              onSubmit({ name: "Updated Driver", licenseNumber: "UPD123" });
            } else {
              onSubmit({ name: "New Driver", licenseNumber: "NEW123" });
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
    if (loading) {
      return <div data-testid="data-table">Loading data...</div>;
    }

    if (data.length === 0) {
      return <div data-testid="data-table">{emptyMessage}</div>;
    }

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

// Mock data
const mockDrivers = [
  {
    id: "1",
    name: "John Doe",
    licenseNumber: "A12345",
    phoneNumber: "123-456-7890",
    status: "AVAILABLE",
    userId: "user-1",
  },
  {
    id: "2",
    name: "Jane Smith",
    licenseNumber: "B54321",
    phoneNumber: "098-765-4321",
    status: "ON_TRIP",
    userId: "user-1",
  },
  {
    id: "3",
    name: "Bob Johnson",
    licenseNumber: "C98765",
    phoneNumber: "555-123-4567",
    status: "OFF_DUTY",
    userId: "user-1",
  },
  {
    id: "4",
    name: "Alice Brown",
    licenseNumber: "D45678",
    phoneNumber: "444-987-6543",
    status: "OFF_DUTY",
    userId: "user-1",
  },
];

describe("DriverManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
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
    } as any);

    vi.mocked(fetchDrivers).mockResolvedValue({
      data: mockDrivers,
      total: mockDrivers.length,
    } as any);
  });

  test("renders loading state initially", async () => {
    vi.mocked(fetchDrivers).mockImplementation(() => new Promise(() => {}));

    render(<DriverManagement />);

    expect(screen.getByTestId("loading-spinner-lg")).toBeInTheDocument();
    expect(screen.getByText("Loading drivers...")).toBeInTheDocument();
  });

  test("loads and displays drivers on successful fetch", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(fetchDrivers).toHaveBeenCalledWith(1, 10, "", undefined);
    });

    expect(screen.getByText("Driver Management")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your drivers efficiently")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  test("displays error message when fetch fails", async () => {
    const errorMessage = "Failed to fetch drivers";
    vi.mocked(fetchDrivers).mockRejectedValue(new Error(errorMessage));

    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test("filters drivers based on search term", async () => {
    vi.mocked(fetchDrivers).mockResolvedValue({
      data: [mockDrivers[0]],
      total: 1,
    } as any);

    render(<DriverManagement />);

    await waitFor(() => {
      expect(fetchDrivers).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "John" } });

    await waitFor(() => {
      expect(fetchDrivers).toHaveBeenCalledTimes(2);
      expect(fetchDrivers).toHaveBeenLastCalledWith(1, 10, "John", undefined);
    });
  });

  test("opens add driver form when button is clicked", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add Driver");
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("driver-form")).toBeInTheDocument();
    });

    expect(screen.getByText("Add Driver Form")).toBeInTheDocument();
  });

  test("displays action buttons for each driver", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle("Edit driver");
    const deleteButtons = screen.getAllByTitle("Delete driver");

    expect(editButtons).toHaveLength(4);
    expect(deleteButtons).toHaveLength(4);
  });

  test("opens edit driver form when edit button is clicked", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle("Edit driver");
    await userEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("driver-form")).toBeInTheDocument();
    });

    expect(screen.getByText("Edit Driver Form")).toBeInTheDocument();
  });

  test("opens delete confirmation modal when delete button is clicked", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete driver");
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });

    expect(screen.getByText("Delete Driver")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete driver/)
    ).toBeInTheDocument();
  });

  test("calls delete API when confirmation is accepted", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete driver");
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByText("Delete");
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(removeDriver).toHaveBeenCalledWith("1");
    });
  });

  test("paginates through drivers", async () => {
    vi.mocked(fetchDrivers).mockResolvedValue({
      data: [mockDrivers[0]],
      total: 15,
    } as any);

    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    const nextButton = screen.getByText("Next");
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(fetchDrivers).toHaveBeenCalledWith(2, 10, "", undefined);
    });
  });

  test("does not show pagination when there is only one page", async () => {
    vi.mocked(fetchDrivers).mockResolvedValue({
      data: mockDrivers,
      total: 4,
    } as any);

    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  test("displays statistics correctly", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Drivers")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByText("Available")).toHaveLength(2);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  test("handles client role correctly", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "client1",
        role: "client",
        name: "Client User",
        email: "client@email.com",
      },
      isAuthenticated: true,
      loading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(<DriverManagement />);

    await waitFor(() => {
      expect(fetchDrivers).toHaveBeenCalledWith(1, 10, "", "client1");
    });
  });

  test("closes driver form when cancel is clicked", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add Driver");
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("driver-form")).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId("driver-form")).not.toBeInTheDocument();
    });
  });

  test("calls addDriver when form is submitted for new driver", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add Driver");
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("driver-form")).toBeInTheDocument();
    });

    const submitButton = screen.getByText("Submit");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(addDriver).toHaveBeenCalled();
    });
  });

  test("calls modifyDriver when form is submitted for editing", async () => {
    render(<DriverManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle("Edit driver");
    await userEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("driver-form")).toBeInTheDocument();
    });

    const submitButton = screen.getByText("Submit");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(modifyDriver).toHaveBeenCalled();
    });
  });
});
