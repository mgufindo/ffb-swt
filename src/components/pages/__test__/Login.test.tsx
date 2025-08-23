import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../Login";
import { MemoryRouter } from "react-router-dom"; // Import router

import { AuthContext } from "../../../contexts/AuthContext";
import { describe, expect, it, vi } from "vitest";

describe("Login page", () => {
  it("should show error if login failed", async () => {
    const loginImpl = vi.fn(() => Promise.reject(new Error("Login failed")));
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login: loginImpl }}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "admin@ffb.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    expect(await screen.findByText(/Login failed/i)).toBeInTheDocument();
  });

  // Test sukses juga sama, jangan lupa MemoryRouter
  it("should login successfully", async () => {
    const loginImpl = vi.fn(() => Promise.resolve());
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login: loginImpl }}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "admin@ffb.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "admin123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    // Tunggu tidak ada error
    await waitFor(() => {
      expect(screen.queryByText(/Login failed/i)).not.toBeInTheDocument();
    });
    expect(loginImpl).toHaveBeenCalledWith("admin@ffb.com", "admin123");
  });
});
