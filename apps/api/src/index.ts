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

// Get all products
server.get("/products", async (req, reply) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        priceSnapshots: {
          orderBy: {
            // Αυτό είναι το σωστό όνομα από το schema σου!
            collectedAt: "desc", 
          },
          take: 2,
        },
        store: true, 
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return products;
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: "Failed to fetch products" });
  }
});

// Debug Endpoint: Force Ingestion for AB
server.post("/debug/force-sync-ab", async (req, reply) => {
  const { products } = req.body as any;
  console.log(`📥 Λήφθηκαν ${products.length} προϊόντα από τον browser!`);

  const store = await prisma.store.findFirst({ 
    where: { name: { contains: "ab" } } 
  });
  
  if (!store) return reply.status(404).send({ error: "AB Store not found" });

  for (const item of products) {
    const price = item.price?.current?.value || item.price?.unitPrice || 0;
    
    const dbProduct = await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { 
        name: item.name, 
        imageUrl: item.images?.[0]?.url || item.image 
      },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: item.images?.[0]?.url || item.image,
      }
    });

    await prisma.priceSnapshot.create({
      data: { 
        productId: dbProduct.id, 
        price: price.toString(), 
        collectedAt: new Date() 
      }
    });
  }
  
  return { success: true, count: products.length };
});

server.post("/sync-ab", async (req, reply) => {
  const { products } = req.body as any;
  
  const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
  if (!store) return reply.status(404).send("Store not found");

  for (const item of products) {
    const priceValue = item.price?.current?.value || 0;
    
    const dbProduct = await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { name: item.name },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: item.images?.[0]?.url || ""
      }
    });

    await prisma.priceSnapshot.create({
      data: { productId: dbProduct.id, price: priceValue.toString() }
    });
  }
  return { success: true, count: products.length };
});



const start = async () => {
  try {
    // Χρησιμοποίησε 127.0.0.1 αντί για 0.0.0.0
    await server.listen({ port: 3001, host: "127.0.0.1" });
    console.log("🚀 API Server ready at http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();