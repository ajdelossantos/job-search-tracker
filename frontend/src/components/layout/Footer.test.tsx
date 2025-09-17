import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders the current year and author credit", () => {
    const year = new Date().getFullYear().toString();

    render(<Footer />);

    const footerText = screen.getByText(
      (content) => content.includes(year) && content.includes("By Alvin James"),
    );

    expect(footerText).toBeInTheDocument();
  });
});
