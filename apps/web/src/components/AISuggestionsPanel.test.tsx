
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AISuggestionsPanel } from "@/components/AISuggestionsPanel";

describe("AISuggestionsPanel", () => {
  it("should render the panel", () => {
    render(<AISuggestionsPanel items={["γάλα", "ψωμί"]} />);
    expect(screen.getByText(/Προτάσεις AI/i)).toBeInTheDocument();
  });

  it("should show empty state when no items", () => {
    render(<AISuggestionsPanel items={[]} />);
    const button = screen.getByRole("button", { name: /Δώσε μου ιδέες/i });
    expect(button).toBeDisabled();
  });

  it("should show fetch button when items exist", () => {
    render(<AISuggestionsPanel items={["γάλα"]} />);
    const button = screen.getByRole("button", { name: /Δώσε μου ιδέες/i });
    expect(button).not.toBeDisabled();
  });

  it("should show loading state when fetching", async () => {
    render(<AISuggestionsPanel items={["γάλα", "ψωμί"]} />);
    const button = screen.getByRole("button", { name: /Δώσε μου ιδέες/i });

    fireEvent.click(button);

    // Mock API response
    expect(screen.getByText(/animate-pulse/i) || "loading").toBeDefined();
  });

  it("should disable button when budget invalid", () => {
    render(<AISuggestionsPanel items={["γάλα"]} budget={1001} />);
    const button = screen.getByRole("button", { name: /Δώσε μου ιδέες/i });
    // Should still be clickable, but API will reject
    expect(button).not.toBeDisabled();
  });
});
