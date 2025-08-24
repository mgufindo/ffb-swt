import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DriverCard from "../DriverCard";
import type { Driver } from "../../../types";

const baseDriver: Driver = {
  id: "d1",
  name: "John Driver",
  licenseNumber: "SIM A12345",
  phoneNumber: "08123456789",
  status: "AVAILABLE",
  userId: "u1",
};

describe("DriverCard", () => {
  it("renders driver name, license number, and phone", () => {
    render(<DriverCard driver={baseDriver} />);

    expect(screen.getByText(/John Driver/i)).toBeInTheDocument();
    expect(screen.getByText(/SIM A12345/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone:/i)).toBeInTheDocument();
    expect(screen.getByText(/08123456789/i)).toBeInTheDocument();
  });

  it.each([
    {
      status: "AVAILABLE",
      text: "available",
      classes: ["bg-green-100", "text-green-800"],
    },
    {
      status: "ON_TRIP",
      text: "on trip",
      classes: ["bg-blue-100", "text-blue-800"],
    },
    {
      status: "OFF_DUTY",
      text: "off duty",
      classes: ["bg-yellow-100", "text-yellow-800"],
    },
    { status: "SICK", text: "sick", classes: ["bg-red-100", "text-red-800"] },
  ] as const)(
    "shows status badge for $status with proper styles and text",
    ({ status, text, classes }) => {
      const driver = { ...baseDriver, status } as Driver;
      render(<DriverCard driver={driver} />);

      const badge = screen.getByText(text);
      expect(badge).toBeInTheDocument();

      // style classes applied
      const className = (badge as HTMLElement).className;
      classes.forEach((c) => expect(className).toContain(c));
    }
  );

  it("does not render Edit/Delete buttons when handlers are not provided", () => {
    render(<DriverCard driver={baseDriver} />);

    expect(
      screen.queryByRole("button", { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  it("renders Edit/Delete buttons when handlers provided and triggers them on click", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <DriverCard driver={baseDriver} onEdit={onEdit} onDelete={onDelete} />
    );

    const editBtn = screen.getByRole("button", { name: /edit/i });
    const deleteBtn = screen.getByRole("button", { name: /delete/i });

    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    await userEvent.click(editBtn);
    await userEvent.click(deleteBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
