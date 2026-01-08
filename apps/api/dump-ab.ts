// apps/api/dump-ab.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ΚΑΝΕ PASTE ΟΛΟ ΤΟ JSON ΠΟΥ ΑΝΤΙΓΡΑΨΕΣ ΜΕΣΑ ΣΤΑ BACKTICKS
const rawJson = ``;

async function dump() {
  const data = JSON.parse(rawJson);
  const products = data.data.categoryProductSearch.products;
  
  console.log(`🚀 Φορτώνω ${products.length} προϊόντα στη βάση...`);

  const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
  if (!store) return console.error("Δεν βρέθηκε ο ΑΒ στη βάση!");

  for (const item of products) {
    const price = item.price?.current?.value || item.price?.unitPrice || 0;
    const dbProduct = await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { name: item.name, imageUrl: item.images?.[0]?.url || item.image },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: item.images?.[0]?.url || item.image,
      }
    });

    await prisma.priceSnapshot.create({
      data: { productId: dbProduct.id, price: price.toString(), collectedAt: new Date() }
    });
  }
  console.log("✅ Τέλος! Κάνε refresh το frontend σου.");
}

dump();