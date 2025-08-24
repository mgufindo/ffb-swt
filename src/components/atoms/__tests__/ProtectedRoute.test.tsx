import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock useAuth BEFORE importing the component under test.
// IMPORTANT: The path must resolve to the same module that ProtectedRoute imports.
// ProtectedRoute.tsx is at src/components/atoms/ProtectedRoute.tsx and imports "../../hooks/useAuth".
// From this test file (src/components/atoms/__tests__), the equivalent path is "../../../hooks/useAuth".
vi.mock("../../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../../hooks/useAuth";
import ProtectedRoute from "../ProtectedRoute";

type UseAuthReturn = {
  isAuthenticated: boolean;
  loading: boolean;
  user: { role: "admin" | "client"; [k: string]: any } | null;
};

const setUseAuth = (state: Partial<UseAuthReturn>) => {
  const defaults: UseAuthReturn = {
    isAuthenticated: false,
    loading: false,
    user: null,
  };
  (useAuth as unknown as vi.Mock).mockReturnValue({ ...defaults, ...state });
};

// Helper to render with routes
function renderWithRouter(ui: React.ReactNode, initialPath = "/protected") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={ui} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner and message when loading is true", () => {
    setUseAuth({ loading: true });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(
      screen.getByText(/Checking authentication\.\.\./i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    setUseAuth({ isAuthenticated: false, loading: false, user: null });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated and no requiredRole specified", () => {
    setUseAuth({
      isAuthenticated: true,
      loading: false,
      user: { role: "client" },
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Unauthorized Page")).not.toBeInTheDocument();
  });

  it("renders children when authenticated with matching requiredRole", () => {
    setUseAuth({
      isAuthenticated: true,
      loading: false,
      user: { role: "client" },
    });

    renderWithRouter(
      <ProtectedRoute requiredRole="client">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("allows admin to access any requiredRole", () => {
    setUseAuth({
      isAuthenticated: true,
      loading: false,
      user: { role: "admin" },
    });

    renderWithRouter(
      <ProtectedRoute requiredRole="client">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to /unauthorized when role does not match and not admin", () => {
    setUseAuth({
      isAuthenticated: true,
      loading: false,
      user: { role: "client" },
    });

    renderWithRouter(
      <ProtectedRoute requiredRole="admin">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
