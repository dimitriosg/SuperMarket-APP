// apps/api/src/routes/search.ts
import { Elysia, t } from "elysia";
import { productService } from "../services/productService";

export const searchRoutes = new Elysia({ prefix: "/products" })
  
  // Endpoint 1: Search (Υπάρχον)
  .get("/search", async ({ query, set }) => {
    const q = query.q;
    // Αν δεν έχει query, μην επιστρέφεις τίποτα (ή επέστρεψε empty array)
    if (!query.q) return []; 
    
    try {
      return await productService.searchProducts(q);
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "Internal Error" };
    }
  }, {
    query: t.Object({ q: t.String() })
  })

  // Endpoint 2: Suggestions (ΝΕΟ - Για το Sidebar)
  .get("/suggestions", async ({ set }) => {
    try {
      return await productService.getSuggestions();
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "Failed to get suggestions" };
    }
  });