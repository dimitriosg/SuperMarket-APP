import { describe, expect, it } from "bun:test";
import { createApiApp } from "../index";

const getRoutePaths = () => {
  const app = createApiApp();
  return app.routes.map((route) => route.path);
};

describe("API route prefixes and aliases", () => {
  it("exposes canonical and legacy product search paths", () => {
    const paths = getRoutePaths();

    expect(paths.includes("/api/v1/products/search")).toBe(true);
    expect(paths.includes("/products/search")).toBe(true);
    expect(paths.includes("/api/products/search")).toBe(true);
  });

  it("keeps one product search route per mounted prefix", () => {
    const paths = getRoutePaths().filter((path) => path.endsWith("/products/search"));

    expect(paths).toEqual([
      "/api/v1/products/search",
      "/products/search",
      "/api/products/search",
    ]);
  });

  it("normalizes auth and ai routes under api v1 while keeping aliases", () => {
    const paths = getRoutePaths();

    expect(paths.includes("/api/v1/auth/login")).toBe(true);
    expect(paths.includes("/api/auth/login")).toBe(true);

    expect(paths.includes("/api/v1/ai/suggestions")).toBe(true);
    expect(paths.includes("/ai/suggestions")).toBe(true);
    expect(paths.includes("/api/ai/suggestions")).toBe(true);
  });
});
