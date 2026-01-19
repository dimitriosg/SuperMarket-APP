// apps/api/src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { CronJob } from "cron";
import { ekatanalotisService } from "./services/ekatanalotisService";
import { searchRoutes } from "./routes/search"; 
import { basketController } from "./controllers/basket.controller"; 
import { adminRoutes } from "./routes/admin";
import { aiSuggestionsRoutes } from "./routes/ai-suggestions"; // ✅ Import as plugin


const app = new Elysia()
  .use(cors({ origin: true }))
  .get("/", () => "🚀 SuperMarket API is Running!")

  // ✅ Existing routes
  .use(searchRoutes)      
  .use(basketController)  
  .use(adminRoutes)
  
  // ✅ NEW: AI Suggestions routes (πριν το .onError)
  .use(aiSuggestionsRoutes)

  // ✅ Error handler
  .onError(({ error, code, set }) => {
    console.error(code, error);
    set.status = 500;
    return { error: "Internal Server Error" };
  })
  
  // ✅ Listen LAST
  .listen(process.env.PORT || 3001);


// ✅ Cron job
const job = new CronJob(
  '0 1 2 * * *', 
  async function() {
    console.log('⏰ Cron Job Triggered: Daily Price Sync');
    await ekatanalotisService.syncAll();
  },
  null,
  true,
  'Europe/Athens'
);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log("⏰ Daily Sync Job scheduled for 2:01 AM Athens time.");
