import { Elysia } from "elysia";
import { ekatanalotisService } from "../services/ekatanalotisService";
import { createRequestLogger, getRequestId } from "../utils/logger";

export const createAdminRoutes = () =>
  new Elysia({ prefix: "/admin" })
  .post("/sync-prices", ({ headers }) => {
    const requestId = getRequestId(headers);
    const reqLog = createRequestLogger({ requestId });

    reqLog.info("ADMIN_SYNC_TRIGGERED", { event: "ADMIN_SYNC_TRIGGERED", route: "POST /admin/sync-prices" });
    
    ekatanalotisService.syncAll().then((res) => {
        reqLog.info("BACKGROUND_SYNC_FINISHED", { event: "BACKGROUND_SYNC_FINISHED", module: "admin", result: res });
    }).catch(err => {
        reqLog.error("BACKGROUND_SYNC_CRASHED", {
          event: "BACKGROUND_SYNC_CRASHED",
          module: "admin",
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
