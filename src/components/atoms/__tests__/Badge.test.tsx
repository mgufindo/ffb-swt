import React from "react";
import { render, screen } from "@testing-library/react";
import { StatusBadge, TypeBadge } from "../Badges";
import { describe, expect, it } from "vitest";

describe("StatusBadge", () => {
  it("shows correct label and color for vehicle status", () => {
    render(<StatusBadge status="AVAILABLE" type="vehicle" />);
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Available")).toHaveClass(
      "bg-green-100 text-green-800"
    );
  });

  it("shows correct label and color for driver status", () => {
    render(<StatusBadge status="ON_TRIP" type="driver" />);
    expect(screen.getByText("On Trip")).toBeInTheDocument();
    expect(screen.getByText("On Trip")).toHaveClass(
      "bg-blue-100 text-blue-800"
    );
  });

  it("shows status as label when unknown", () => {
    render(<StatusBadge status="UNKNOWN_STATUS" type="vehicle" />);
    expect(screen.getByText("UNKNOWN_STATUS")).toBeInTheDocument();
  });
});

describe("TypeBadge", () => {
  it("shows correct label and color for TRUCK", () => {
    render(<TypeBadge type="TRUCK" />);
    expect(screen.getByText("Truck")).toBeInTheDocument();
    expect(screen.getByText("Truck")).toHaveClass(
      "bg-purple-100 text-purple-800"
    );
  });

  it("shows correct label and color for VAN", () => {
    render(<TypeBadge type="VAN" />);
    expect(screen.getByText("Van")).toBeInTheDocument();
    expect(screen.getByText("Van")).toHaveClass(
      "bg-indigo-100 text-indigo-800"
    );
  });

  it("shows type as label when unknown", () => {
    render(<TypeBadge type="MOTOR" />);
    expect(screen.getByText("MOTOR")).toBeInTheDocument();
    expect(screen.getByText("MOTOR")).toHaveClass("bg-gray-100 text-gray-800");
  });
});
