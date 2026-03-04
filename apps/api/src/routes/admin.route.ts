import { Elysia } from "elysia";
import { ekatanalotisService } from "../services/ekatanalotisService";
import { logger } from "../utils/logger";

export const createAdminRoutes = () =>
  new Elysia({ prefix: "/admin" })
  .post("/sync-prices", () => {
    logger.info("ADMIN_SYNC_TRIGGERED", { route: "POST /admin/sync-prices" });
    
    ekatanalotisService.syncAll().then((res) => {
        logger.info("BACKGROUND_SYNC_FINISHED", { route: "POST /admin/sync-prices", result: res });
    }).catch(err => {
        logger.error("BACKGROUND_SYNC_CRASHED", {
          route: "POST /admin/sync-prices",
          message: err instanceof Error ? err.message : String(err),
        });
    });

    // Απαντάμε αμέσως στον χρήστη/curl
    return {
      success: true,
      message: "Sync started in the background. Check server logs for progress."
    };
  });

export const adminRoutes = createAdminRoutes();
