import { prisma } from "../db";
import { IngestedProductRow } from "@repo/shared";
import { woltIngestionPlugin } from "./wolt-fallback/wolt";
import { sklavenitisIngestionPlugin } from "./sklavenitis/index";
import { abIngestionPlugin } from "./ab/index";

export const upsertIngestedRows = async (
  chainName: string,
  storeExternalId: string,
  rows: IngestedProductRow[]
) => {
  console.log(`📦 Upserting ${rows.length} items for ${chainName}...`);

  let chain = await prisma.chain.findFirst({
    where: { OR: [{ slug: chainName.toLowerCase() }, { label: chainName }] },
  });

  if (!chain) {
    chain = await prisma.chain.create({
        data: {
            slug: chainName.toLowerCase(),
            label: chainName,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    });
  }

  let store = await prisma.store.findFirst({
    where: { chainId: chain.id, externalId: storeExternalId },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        chainId: chain.id,
        externalId: storeExternalId,
        name: `${chainName} Store (${storeExternalId})`,
        city: "Athens",
        isActive: true
      },
    });
  }

  for (const row of rows) {
    let product = await prisma.product.findFirst({
      where: { storeId: store.id, externalId: row.externalId },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          storeId: store.id,
          externalId: row.externalId,
          name: row.name,
          imageUrl: row.image,
          isActive: true
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: row.image, name: row.name }
      });
    }

    await prisma.priceSnapshot.create({
      data: {
        productId: product.id,
        price: row.price,
        promoPrice: row.isOffer ? row.offerPrice : null, 
        inStock: true,
        collectedAt: new Date(),
      },
    });
  }
  console.log(`✅ Finished upserting ${rows.length} products for ${chainName}.`);
};

// "Τροχονόμος" συναρτηση
export const runIngestionForStore = async (
  chainName: string, 
  storeExternalId: string
) => {
  let rows: IngestedProductRow[] = [];

  if (chainName.toLowerCase() === "sklavenitis") {
    rows = await sklavenitisIngestionPlugin(storeExternalId);
  } else if (chainName.toLowerCase() === "ab" || chainName.toLowerCase() === "ab vassilopoulos") {
    // ΚΑΛΕΣΜΑ ΤΟΥ AB PLUGIN
    rows = await abIngestionPlugin(storeExternalId);
  } else if (chainName.toLowerCase() === "wolt") {
    rows = await woltIngestionPlugin(storeExternalId);
  }

  if (rows.length > 0) {
    await upsertIngestedRows(chainName, storeExternalId, rows);
  }
};