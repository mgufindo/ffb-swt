import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "../Pagination";

function getPageButtonsTexts() {
  // Collect all buttons except Previous and Next
  const buttons = screen
    .getAllByRole("button")
    .filter((b) => b.textContent !== "Previous" && b.textContent !== "Next");
  return buttons.map((b) => b.textContent?.trim());
}

describe("Pagination", () => {
  it("renders Previous disabled on first page and Next disabled on last page", () => {
    const onPageChange = vi.fn();

    // First page
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    // Last page
    rerender(
      <Pagination currentPage={3} totalPages={3} onPageChange={onPageChange} />
    );
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("renders all pages without ellipses when totalPages <= maxVisiblePages", () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />
    );

    // Should render 1..5 with no ellipses
    expect(getPageButtonsTexts()).toEqual(["1", "2", "3", "4", "5"]);
    expect(screen.queryByText("...")).not.toBeInTheDocument();

    // Current page has highlight classes
    const currentBtn = screen.getByRole("button", { name: "2" });
    expect(currentBtn.className).toContain("bg-indigo-600");
    expect(currentBtn.className).toContain("text-white");
    expect(currentBtn.className).toContain("border-indigo-600");
  });

  it("centers visible pages and shows leading and trailing ellipses for middle page ranges", () => {
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />
    );

    // With maxVisiblePages=5 → 3..7 visible + first and last via ellipses blocks
    // Buttons (excluding Previous/Next) should include: 1, 3,4,5,6,7, 10 with two ellipses rendered
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();

    ["3", "4", "5", "6", "7"].forEach((p) => {
      expect(screen.getByRole("button", { name: p })).toBeInTheDocument();
    });

    const dots = screen.getAllByText("...");
    expect(dots).toHaveLength(2);

    // Current page 5 highlighted
    const currentBtn = screen.getByRole("button", { name: "5" });
    expect(currentBtn.className).toContain("bg-indigo-600");
  });

  it("shows only trailing ellipsis near the start", () => {
    render(
      <Pagination currentPage={2} totalPages={10} onPageChange={vi.fn()} />
    );

    // Expect 1..5 then ... 10, but no leading ellipsis
    ["1", "2", "3", "4", "5", "10"].forEach((p) => {
      expect(screen.getByRole("button", { name: p })).toBeInTheDocument();
    });
    const dots = screen.getAllByText("...");
    expect(dots).toHaveLength(1);
  });

  it("shows only leading ellipsis near the end", () => {
    render(
      <Pagination currentPage={9} totalPages={10} onPageChange={vi.fn()} />
    );

    // Expected: 1, ... , 6,7,8,9,10 (no trailing ellipsis)
    ["1", "6", "7", "8", "9", "10"].forEach((p) => {
      expect(screen.getByRole("button", { name: p })).toBeInTheDocument();
    });
    const dots = screen.getAllByText("...");
    expect(dots).toHaveLength(1);
  });

  it("calls onPageChange when clicking specific page, Previous, and Next", async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />
    );

    // Click numbered page
    await userEvent.click(screen.getByRole("button", { name: "7" }));
    expect(onPageChange).toHaveBeenCalledWith(7);

    // Click Previous (from 5 → 4)
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    // Click Next (from 5 → 6)
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it("does not call onPageChange when clicking disabled Previous/Next", async () => {
    const onPageChange = vi.fn();

    // First page: Previous disabled
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={10} onPageChange={onPageChange} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).not.toHaveBeenCalled();

    // Last page: Next disabled
    rerender(
      <Pagination
        currentPage={10}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("jumps to first/last page via edge buttons when ellipses are present", async () => {
    const onPageChange = vi.fn();

    // Middle position; should render a separate "1" and "10" buttons
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />
    );

    await userEvent.click(screen.getByRole("button", { name: "1" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await userEvent.click(screen.getByRole("button", { name: "10" }));
    expect(onPageChange).toHaveBeenCalledWith(10);
  });
});
