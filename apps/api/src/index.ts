// apps/api/src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { CronJob } from "cron";
import { ekatanalotisService } from "./services/ekatanalotisService";
import { searchRoutes } from "./routes/search.route";
import { basketController } from "./routes/basket.route";
import { adminRoutes } from "./routes/admin.route";
import { aiSuggestionsRoutes } from "./routes/ai-suggestions.route"; // ✅ Import as plugin


const app = new Elysia()
  .use(cors({ origin: true }))
  .get("/", () => "🚀 SuperMarket API is Running!")

  // ✅ Existing routes
  .use(productRoutes)      
  .use(basketController)  
  .use(adminRoutes)
  
  // ✅ AI Suggestions routes (μόνο AI route plugin, πριν το .onError)
  .use(aiSuggestionsRoutes)

  // ✅ Error handler
  .onError(({ error, code, set }) => {
    const requestErrorCodes = new Set([
      "VALIDATION",
      "PARSE",
      "INVALID_COOKIE_SIGNATURE",
      "INVALID_COOKIE",
    ]);

    const isNotFound = code === "NOT_FOUND";
    const isRequestError = requestErrorCodes.has(code);

    const status = isNotFound ? 404 : isRequestError ? 400 : 500;
    set.status = status;

    if (status >= 500) {
      console.error(code, error);
    } else {
      console.warn(code, error);
    }

    const message =
      status >= 500
        ? "Internal Server Error"
        : isNotFound
          ? "Not Found"
          : error instanceof Error
            ? error.message
            : "Bad Request";

    const details =
      code === "VALIDATION" && error && typeof error === "object"
        ? ("all" in error ? (error as { all?: unknown }).all : undefined) ??
          ("errors" in error ? (error as { errors?: unknown }).errors : undefined)
        : undefined;

    return {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    };
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
