import { describe, it, expect } from "bun:test";
import { ValidationError, validateSuggestionsRequest } from "@/utils/validation";
import { generateFallbackSuggestions } from "@/ai/suggestions.service";

describe("AI Suggestions - Validation", () => {
  it("should validate correct request", () => {
    const result = validateSuggestionsRequest({
      items: ["γάλα", "ψωμί"],
      budget: 50,
      preferences: ["χωρίς γλουτένη"],
    });
    expect(result.items).toEqual(["γάλα", "ψωμί"]);
  });

  it("should reject non-Greek items", () => {
    expect(() => validateSuggestionsRequest({ items: ["milk"] })).toThrow(ValidationError);
  });

  it("should reject duplicate items", () => {
    expect(() =>
      validateSuggestionsRequest({
        items: ["γάλα", "γάλα"],
      })
    ).toThrow(ValidationError);
  });

  it("should reject budget > 1000", () => {
    expect(() =>
      validateSuggestionsRequest({
        items: ["γάλα"],
        budget: 1001,
      })
    ).toThrow(ValidationError);
  });

  it("should reject preferences > 5", () => {
    expect(() =>
      validateSuggestionsRequest({
        items: ["γάλα"],
        preferences: Array(6).fill("χωρίς γλουτένη"),
      })
    ).toThrow(ValidationError);
  });

  it("should reject profanity in preferences", () => {
    expect(() =>
      validateSuggestionsRequest({
        items: ["γάλα"],
        preferences: ["μαλάκα"],
      })
    ).toThrow(ValidationError);
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
