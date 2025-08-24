import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../../services/api/auth", () => ({ getAllClient: vi.fn() }));

import { useAuth } from "../../../hooks/useAuth";
import * as AuthApi from "../../../services/api/auth";
import DriverForm from "../DriverForm";

const setUseAuth = (u: any) =>
  (useAuth as any).mockReturnValue({ user: null, ...u });

describe("DriverForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks inputs as required", async () => {
    setUseAuth({ user: { id: "u1", role: "client" } });
    (AuthApi.getAllClient as any).mockResolvedValue({ data: [] });

    render(<DriverForm isOpen onCancel={vi.fn()} onSubmit={vi.fn()} />);

    // Gunakan findBy* agar sinkron dengan update async dan menghindari warning act()
    const name = await screen.findByLabelText(/full name/i);
    const license = await screen.findByLabelText(/license number/i);
    const phone = await screen.findByLabelText(/phone number/i);

    expect(name).toBeRequired();
    expect(license).toBeRequired();
    expect(phone).toBeRequired();
  });
});
