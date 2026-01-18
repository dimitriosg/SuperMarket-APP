// apps/api/src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { searchRoutes } from "./routes/search"; 
import { basketController } from "./controllers/basket.controller"; 


const app = new Elysia()
  .use(cors({ origin: true }))
  .get("/", () => "🚀 SuperMarket API is Running!")

  .use(searchRoutes)      
  .use(basketController)  
  
  .listen(3001);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);