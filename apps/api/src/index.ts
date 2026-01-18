// apps/api/src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { CronJob } from "cron"; // <--- Import Cron
import { ekatanalotisService } from "./services/ekatanalotisService"; // <--- Import Service
import { searchRoutes } from "./routes/search"; 
import { basketController } from "./controllers/basket.controller"; 
import { adminRoutes } from "./routes/admin";


const app = new Elysia()
  .use(cors({ origin: true }))
  .get("/", () => "🚀 SuperMarket API is Running!")

  .use(searchRoutes)      
  .use(basketController)  
  .use(adminRoutes)
  
  .listen(3001);

  // --- AUTOMATION ---
  // Τρέχει κάθε μέρα στις 12:00 το πρωί
  // Format: Seconds Minutes Hours DayOfMonth Month DayOfWeek
  const job = new CronJob(
    '0 1 2 * * *', 
    async function() {
      console.log('⏰ Cron Job Triggered: Daily Price Sync');
      await ekatanalotisService.syncAll();
    },
    null,
    true, // Start immediately
    'Europe/Athens' // Timezone
  );

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

console.log("⏰ Daily Sync Job scheduled for 12:00 PM Athens time.");