import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TimezoneProvider from "../timezone/TimezoneProvider";

import Header from "./Header";

describe("Header", () => {
  it("renders the application title", () => {
    render(
      <TimezoneProvider>
        <Header />
      </TimezoneProvider>,
    );

    expect(screen.getByText("Job Search Tracker")).toBeInTheDocument();
  });
});
