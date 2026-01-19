import { Elysia } from "elysia";
import { ekatanalotisService } from "../services/ekatanalotisService";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .post("/sync-prices", () => {
    // ΔΕΝ βάζουμε await εδώ. Το αφήνουμε να τρέξει στο background.
    console.log("⚡ Admin Trigger received. Starting background task...");
    
    ekatanalotisService.syncAll().then((res) => {
        console.log("🏁 Background Sync Finished:", res);
    }).catch(err => {
        console.error("💥 Background Sync Crashed:", err);
    });

    // Απαντάμε αμέσως στον χρήστη/curl
    return {
      success: true,
      message: "Sync started in the background. Check server logs for progress."
    };
  });