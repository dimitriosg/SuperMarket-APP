// apps/api/src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { searchRoutes } from "./routes/search"; 
// 1. IMPORT: Φέρνουμε τον νέο controller για το καλάθι
import { basketController } from "./controllers/basket.controller";

const app = new Elysia()
  // Ρύθμιση CORS (επιτρέπει στο frontend να μιλάει με το API)
  .use(cors({
    origin: true 
  }))

  // Health Check
  .get("/", () => "🚀 SuperMarket API is Running!")

  // 2. ROUTES: Συνδέουμε τα κομμάτια της εφαρμογής
  .use(searchRoutes)      // Αναζήτηση προϊόντων
  .use(basketController)  // Υπολογισμός Καλαθιού & Σύγκριση Τιμών

  .listen(3001);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);