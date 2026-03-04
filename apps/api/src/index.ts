// apps/api/src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { CronJob } from "cron";
import { ekatanalotisService } from "./services/ekatanalotisService";
import { createSearchRoutes } from "./routes/search.route";
import { createBasketRoutes } from "./routes/basket.route";
import { createAdminRoutes } from "./routes/admin.route";
import { createAiSuggestionsRoutes } from "./routes/ai-suggestions.route";
import { createProductRoutes } from "./routes/products.route";
import { createAuthRoutes } from "./routes/auth.route";
import { createRequestLogger, getRequestId, logger, resolveUserId } from "./utils/logger";

const withPrefix = (prefix: string) =>
  new Elysia({ prefix })
    .use(createProductRoutes())
    .use(createSearchRoutes())
    .use(createBasketRoutes())
    .use(createAdminRoutes())
    .use(createAuthRoutes())
    .use(createAiSuggestionsRoutes());

export const createApiApp = () =>
  new Elysia()
    .use(cors({ origin: true }))
    .get("/", () => "🚀 SuperMarket API is Running!")

    // Canonical API v1 routes
    .use(withPrefix("/api/v1"))

    // Backward-compatible aliases
    .use(withPrefix(""))
    .use(withPrefix("/api"))

    .onError(({ error, code, set, request }) => {
      const requestErrorCodes = new Set([
        "VALIDATION",
        "PARSE",
        "INVALID_COOKIE_SIGNATURE",
        "INVALID_COOKIE",
      ]);

      const isNotFound = code === "NOT_FOUND";
      const isRequestError = requestErrorCodes.has(code.toString());

      const status = isNotFound ? 404 : isRequestError ? 400 : 500;
      set.status = status;

      const requestId = getRequestId(request?.headers);
      const userId = resolveUserId(request?.headers);
      const requestLogger = createRequestLogger({ requestId, userId });

      if (status >= 500) {
        requestLogger.error("REQUEST_ERROR", {
          event: "REQUEST_ERROR",
          error_type: code,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } else {
        requestLogger.warn("REQUEST_ERROR", {
          event: "REQUEST_ERROR",
          error_type: code,
          message: error instanceof Error ? error.message : "Unknown error",
        });
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
          ? (("all" in error ? (error as { all?: unknown }).all : undefined) ??
            ("errors" in error ? (error as { errors?: unknown }).errors : undefined))
          : undefined;

      return {
        error: {
          code,
          message,
          ...(details ? { details } : {}),
        },
      };
    });

export const app = createApiApp();

if (import.meta.main) {
  app.listen(process.env.PORT || 3001);

  const job = new CronJob(
    '0 1 2 * * *',
    async function () {
      logger.info("CRON_DAILY_PRICE_SYNC_TRIGGERED", {
        event: "CRON_DAILY_PRICE_SYNC_TRIGGERED",
      });
      await ekatanalotisService.syncAll();
    },
    null,
    true,
    'Europe/Athens'
  );

  logger.info("API_SERVER_STARTED", {
    event: "API_SERVER_STARTED",
    host: app.server?.hostname,
    port: app.server?.port,
  });
  logger.info("CRON_DAILY_SYNC_SCHEDULED", {
    event: "CRON_DAILY_SYNC_SCHEDULED",
    timezone: "Europe/Athens",
  });

  void job;
}
