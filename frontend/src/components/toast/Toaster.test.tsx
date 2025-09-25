import { describe, it, expect, vi } from "vitest";
import { toast } from "sonner";
import { render, screen, cleanup } from "@testing-library/react";
import { Toaster } from "@/components/ui/sonner";

// JSDOM polyfill for Sonner's theme detection
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated API
      removeListener: vi.fn(), // deprecated API
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("Toaster", () => {
  it("renders a toast message", async () => {
    render(<Toaster richColors closeButton />);
    toast.success("Saved!");
    expect(await screen.findByText("Saved!")).toBeInTheDocument();
    cleanup();
  });
});
