// apps/api/src/routes/search.route.ts
import { Elysia } from "elysia";
import { productService } from "../services/productService";
import { createRequestLogger, getRequestId } from "../utils/logger";

export const createSearchRoutes = () =>
  new Elysia({ prefix: "/products" }).get("/suggestions", async ({ set, headers }) => {
    try {
      return await productService.getSuggestions();
    } catch (error) {
      const requestId = getRequestId(headers);
      const reqLog = createRequestLogger({ requestId });
      reqLog.error("SUGGESTIONS_FAILED", {
        route: "GET /products/suggestions",
        message: error instanceof Error ? error.message : String(error),
      });
      set.status = 500;
      return { error: { code: "SUGGESTIONS_FAILED", message: "Failed to get suggestions", requestId } };
    }
  });

export const searchRoutes = createSearchRoutes();
