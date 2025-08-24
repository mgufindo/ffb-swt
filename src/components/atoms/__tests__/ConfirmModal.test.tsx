import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmModal from "../ConfirmModal";

describe("ConfirmModal", () => {
  const defaultTitle = "Delete item";
  const defaultMessage = "Are you sure you want to delete this item?";
  const customConfirm = "Yes, delete";
  const customCancel = "No, keep";

  let onClose: ReturnType<typeof vi.fn>;
  let onConfirm: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onConfirm = vi.fn();
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
      />
    );

    expect(screen.queryByText(defaultTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /cancel/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirm/i })
    ).not.toBeInTheDocument();
  });

  it("renders with title, message, and default buttons when open", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
      />
    );

    expect(screen.getByText(defaultTitle)).toBeInTheDocument();
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i })
    ).toBeInTheDocument();
  });

  it("renders with custom confirm and cancel texts", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
        confirmText={customConfirm}
        cancelText={customCancel}
      />
    );

    expect(
      screen.getByRole("button", { name: customCancel })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: customConfirm })
    ).toBeInTheDocument();
  });

  it("invokes onClose when cancel is clicked", async () => {
    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("invokes onConfirm then onClose when confirm is clicked", async () => {
    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    // If supported by your Vitest version, verify invocation order:
    // onConfirm should be called BEFORE onClose
    const confirmOrder = onConfirm.mock.invocationCallOrder?.[0];
    const closeOrder = onClose.mock.invocationCallOrder?.[0];
    if (typeof confirmOrder === "number" && typeof closeOrder === "number") {
      expect(confirmOrder).toBeLessThan(closeOrder);
    }
  });

  it("applies warning variant styles to confirm button", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
        variant="warning"
      />
    );

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn.className).toContain("bg-yellow-600");
    expect(confirmBtn.className).toContain("hover:bg-yellow-700");
    expect(confirmBtn.className).toContain("focus:ring-yellow-500");
  });

  it("hides again when isOpen toggles from true to false", () => {
    const { rerender } = render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
      />
    );

    expect(screen.getByText(defaultTitle)).toBeInTheDocument();

    rerender(
      <ConfirmModal
        isOpen={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title={defaultTitle}
        message={defaultMessage}
      />
    );

    expect(screen.queryByText(defaultTitle)).not.toBeInTheDocument();
  });
});
