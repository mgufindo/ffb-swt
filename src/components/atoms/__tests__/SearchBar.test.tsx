import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../SearchBar";
import React from "react";

describe("SearchBar", () => {
  it("renders with default placeholder and provided value", () => {
    render(<SearchBar value="" onChange={() => {}} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.placeholder).toBe("Search...");
    expect(input.value).toBe("");
  });

  it("renders with a custom placeholder", () => {
    render(
      <SearchBar value="" onChange={() => {}} placeholder="Find mills..." />
    );

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.placeholder).toBe("Find mills...");
  });

  it("calls onChange with cumulative values as user types when controlled by parent", async () => {
    const onChange = vi.fn();

    function Wrapper() {
      const [value, setValue] = React.useState("");
      const handleChange = (v: string) => {
        onChange(v); // record what child passes
        setValue(v); // make it a truly controlled input
      };
      return <SearchBar value={value} onChange={handleChange} />;
    }

    render(<Wrapper />);
    const input = screen.getByTestId("search-input") as HTMLInputElement;

    await userEvent.type(input, "Palm");

    const calls = onChange.mock.calls.map((args) => args[0]);
    expect(calls).toEqual(["P", "Pa", "Pal", "Palm"]);
  });

  it("updates the displayed value when controlled by parent", async () => {
    function Wrapper() {
      const [value, setValue] = React.useState("");
      return <SearchBar value={value} onChange={setValue} />;
    }

    render(<Wrapper />);
    const input = screen.getByTestId("search-input") as HTMLInputElement;

    await userEvent.type(input, "Sumatra");
    expect(input.value).toBe("Sumatra");

    await userEvent.clear(input);
    expect(input.value).toBe("");
  });

  it("can be found by role textbox", () => {
    render(<SearchBar value="abc" onChange={() => {}} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("abc");
  });
});
