import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default size (md) and base classes", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();

    // base spinner classes
    expect(spinner.className).toContain("animate-spin");
    expect(spinner.className).toContain("rounded-full");
    expect(spinner.className).toContain("border-2");
    expect(spinner.className).toContain("border-gray-300");
    expect(spinner.className).toContain("border-t-blue-600");

    // default size md
    expect(spinner.className).toContain("h-8");
    expect(spinner.className).toContain("w-8");
  });

  it("applies small size classes when size='sm'", () => {
    render(<LoadingSpinner size="sm" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.className).toContain("h-4");
    expect(spinner.className).toContain("w-4");

    // should not contain other sizes
    expect(spinner.className).not.toContain("h-8");
    expect(spinner.className).not.toContain("w-8");
    expect(spinner.className).not.toContain("h-12");
    expect(spinner.className).not.toContain("w-12");
  });

  it("applies large size classes when size='lg'", () => {
    render(<LoadingSpinner size="lg" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.className).toContain("h-12");
    expect(spinner.className).toContain("w-12");

    // should not contain other sizes
    expect(spinner.className).not.toContain("h-8");
    expect(spinner.className).not.toContain("w-8");
    expect(spinner.className).not.toContain("h-4");
    expect(spinner.className).not.toContain("w-4");
  });

  it("forwards className to the wrapper container", () => {
    render(<LoadingSpinner className="mt-2 text-red-500" />);

    const spinner = screen.getByTestId("loading-spinner");
    const wrapper = spinner.parentElement as HTMLElement;

    // Wrapper has default layout classes
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("justify-center");
    expect(wrapper.className).toContain("items-center");

    // Wrapper receives custom classes
    expect(wrapper.className).toContain("mt-2");
    expect(wrapper.className).toContain("text-red-500");
  });
});
