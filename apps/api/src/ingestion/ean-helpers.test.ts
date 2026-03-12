import { describe, it, expect } from "bun:test";
import { isSyntheticEan } from "./service";

describe("isSyntheticEan", () => {
  it("returns true for a synthetic EAN", () => {
    expect(isSyntheticEan("NO_EAN:wolt:abc123")).toBe(true);
  });

  it("returns true for any NO_EAN: prefixed string", () => {
    expect(isSyntheticEan("NO_EAN:ab:product-42")).toBe(true);
    expect(isSyntheticEan("NO_EAN:sklavenitis:xyz")).toBe(true);
  });

  it("returns false for a real EAN barcode", () => {
    expect(isSyntheticEan("5200000000001")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isSyntheticEan("")).toBe(false);
  });

  it("returns false when NO_EAN appears elsewhere in the string", () => {
    expect(isSyntheticEan("some-NO_EAN:prefix")).toBe(false);
  });
});
