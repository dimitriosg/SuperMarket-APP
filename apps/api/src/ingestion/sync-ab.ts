import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function sync() {
  // Χρησιμοποιούμε absolute path για να μη χθούμε
  const filePath = path.resolve("C:/DEV/SuperMarket/SuperMarket-APP/apps/api/src/ingestion/ab-data.json");
  
  console.log(`📂 Ανάγνωση από: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error("❌ ΤΟ ΑΡΧΕΙΟ ΔΕΝ ΒΡΕΘΗΚΕ ΣΤΗ ΔΙΑΔΡΟΜΗ!");
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(rawData);
  const products = json.data?.categoryProductSearch?.products || [];

  const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
  if (!store) {
    console.error("❌ Δεν βρέθηκε το κατάστημα AB στη βάση. Τρέξε πρώτα το seed!");
    return;
  }

  console.log(`🚀 Συγχρονισμός ${products.length} προϊόντων...`);

  for (const item of products) {
    const priceValue = item.price?.value || 0;
    const imageUrl = item.images?.find((img: any) => img.format === "small")?.url || "";

    await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { 
        name: item.name,
        imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.ab.gr${imageUrl}`
      },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.ab.gr${imageUrl}`
      }
    });

    const dbProduct = await prisma.product.findFirst({ where: { externalId: item.code, storeId: store.id } });

    if (dbProduct) {
        await prisma.priceSnapshot.create({
          data: {
            productId: dbProduct.id,
            price: priceValue.toString(),
            collectedAt: new Date()
          }
        });
    }
  }

  console.log("✨ ΤΕΛΟΣ! Ο ΑΒ συγχρονίστηκε.");
}

sync().catch(console.error);