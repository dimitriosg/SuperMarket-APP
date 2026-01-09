import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { searchRoutes } from "./routes/search"; // <--- Αυτό φτιάξαμε πριν

const app = new Elysia()
  // 1. Ρύθμιση CORS για να μιλάει με το Frontend (Port 3000)
  .use(cors({
    origin: true // Επιτρέπει όλα τα origins για development
  }))

  // 2. Health Check (για να βλέπεις αν τρέχει)
  .get("/", () => "🚀 SuperMarket API is Running!")

  // 3. Σύνδεση του Search Route
  .use(searchRoutes)

  // 4. Εκκίνηση στην πόρτα 3001
  .listen(3001);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);