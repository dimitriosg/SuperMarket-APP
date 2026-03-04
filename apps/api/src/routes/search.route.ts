// apps/api/src/routes/search.route.ts
import { Elysia } from "elysia";
import { productService } from "../services/productService";
import { getRequestId } from "../utils/logger";

export const createSearchRoutes = () =>
  new Elysia({ prefix: "/products" }).get("/suggestions", async ({ set, headers }) => {
    try {
      return await productService.getSuggestions();
    } catch (error) {
      console.error(error);
      const requestId = getRequestId(headers);
      set.status = 500;
      return { error: { code: "SUGGESTIONS_FAILED", message: "Failed to get suggestions", requestId } };
    }
  });

export const searchRoutes = createSearchRoutes();
