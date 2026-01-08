// api/src/index.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./db";
import { runIngestionForStore } from "./ingestion/service";
import { discoverAbCategories } from "./ingestion/ab/discovery";

const server = Fastify({ logger: true });

server.register(cors, {
  origin: "*", // Allow all origins for dev
});

// Health Check
server.get("/health", async () => {
  return { status: "ok", timestamp: new Date() };
});

// Debug Endpoint: Trigger Ingestion Manually
// Usage: http://localhost:3001/debug/ingestion/sklavenitis/AUTO
server.get("/debug/ingestion/:chain/:storeId", async (req, reply) => {
  const { chain, storeId } = req.params as { chain: string; storeId: string };
  
  try {
    // Run the scraper
    // Note: We don't await this if we want it to run in background, 
    // but for debug let's await to see errors.
    await runIngestionForStore(chain, storeId);
    
    return { 
      success: true, 
      message: `Ingestion triggered for ${chain}` 
    };
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ error: "Ingestion failed", details: error });
  }
});

server.get("/debug/ingestion/ab/DISCOVERY", async () => {
  const categories = await discoverAbCategories();
  return { 
    message: "AB Discovery finished. Check your terminal for the table.",
    count: categories.length,
    categories 
  };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: "0.0.0.0" });
    console.log("🚀 Server running at http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();