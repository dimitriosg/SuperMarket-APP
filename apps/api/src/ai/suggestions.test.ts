import { describe, it, expect } from "bun:test";
import { validateSuggestionsRequest } from "@/utils/validation";
import { generateFallbackSuggestions } from "@/ai/suggestions.service";

describe("AI Suggestions - Validation", () => {
  it("should validate correct request", () => {
    const result = validateSuggestionsRequest({
      items: ["γάλα", "ψωμί"],
      budget: 50,
      preferences: ["χωρίς γλουτένη"],
    });
    expect(result.isValid).toBe(true);
  });

  it("should reject empty items", () => {
    const result = validateSuggestionsRequest({ items: [] });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === "items")).toBe(true);
  });

  it("should reject items > 50", () => {
    const result = validateSuggestionsRequest({
      items: Array(51).fill("item"),
    });
    expect(result.isValid).toBe(false);
  });

  it("should reject budget > 1000", () => {
    const result = validateSuggestionsRequest({
      items: ["item"],
      budget: 1001,
    });
    expect(result.isValid).toBe(false);
  });

  it("should reject preferences > 5", () => {
    const result = validateSuggestionsRequest({
      items: ["item"],
      preferences: Array(6).fill("pref"),
    });
    expect(result.isValid).toBe(false);
  });
});

describe("AI Suggestions - Fallback", () => {
  it("should generate fallback suggestions", async () => {
    const suggestions = await generateFallbackSuggestions(["γάλα"]);
    expect(suggestions.length > 0).toBe(true);
    expect(suggestions.length <= 5).toBe(true);
  });

  it("should generate suggestions for unknown items", async () => {
    const suggestions = await generateFallbackSuggestions(["unknown123"]);
    expect(suggestions.length > 0).toBe(true);
    expect(suggestions.length <= 5).toBe(true);
  });

  it("should deduplicate suggestions", async () => {
    const suggestions = await generateFallbackSuggestions(["γάλα", "γάλα"]);
    const ids = new Set(suggestions.map((s) => s.id));
    expect(ids.size).toBe(suggestions.length);
  });
});
