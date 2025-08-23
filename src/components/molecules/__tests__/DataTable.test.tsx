import { render, screen, fireEvent } from "@testing-library/react";
import DataTable from "../DataTable";
import { describe, expect, it, vi } from "vitest";
import { performance } from "perf_hooks";

describe("DataTable", () => {
  const columns = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age", align: "right" },
  ];
  const data = [
    { id: 1, name: "Urwah", age: 23 },
    { id: 2, name: "Ali", age: 25 },
  ];

  it("renders rows", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Urwah")).toBeInTheDocument();
    expect(screen.getByText("Ali")).toBeInTheDocument();
  });

  it("shows empty message", () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="Tidak ada data" />
    );
    expect(screen.getByText("Tidak ada data")).toBeInTheDocument();
  });

  it("calls onRowClick", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    fireEvent.click(screen.getAllByTestId("data-row")[0]);
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it("renders row actions", () => {
    const rowActions = (row: any) => <button>Edit {row.name}</button>;
    render(<DataTable columns={columns} data={data} rowActions={rowActions} />);
    expect(screen.getByText("Edit Urwah")).toBeInTheDocument();
  });

  // Performance test: 10k rows under 2s
  it("renders 10k rows under 2 seconds", () => {
    const BIG = 10_000;
    const MAX_MS = 2000;

    const bigData = Array.from({ length: BIG }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
    }));

    const t0 = performance.now();
    const { container } = render(
      <DataTable columns={columns} data={bigData} />
    );
    const t1 = performance.now();

    const rows = container.querySelectorAll('[data-testid="data-row"]');
    expect(rows.length).toBe(BIG);

    const duration = t1 - t0;
    // Optional: log untuk debug lokal
    // console.log(`Render 10k rows took ${Math.round(duration)} ms`);

    expect(duration).toBeLessThan(MAX_MS);
  }, 5000); // beri timeout test sedikit lebih longgar, tetapi assert < 2000ms
});
