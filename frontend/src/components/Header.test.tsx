import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Header from "./Header";

describe("Header", () => {
  it("renders the application title", () => {
    render(<Header />);

    expect(screen.getByText("Job Search Tracker")).toBeInTheDocument();
  });
});
