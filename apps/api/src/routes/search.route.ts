// apps/api/src/routes/search.route.ts
import { Elysia } from "elysia";
import { productService } from "../services/productService";

export const createSearchRoutes = () =>
  new Elysia({ prefix: "/products" }).get("/suggestions", async ({ set }) => {
    try {
      return await productService.getSuggestions();
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "Failed to get suggestions" };
    }
  });

export const searchRoutes = createSearchRoutes();
