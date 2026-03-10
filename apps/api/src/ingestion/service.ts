import { prisma } from "../db";
import { IngestedProductRow } from "@supermarket/shared";
import { woltIngestionPlugin } from "./wolt-fallback/wolt";
import { sklavenitisIngestionPlugin } from "./sklavenitis/index";
import { abIngestionPlugin } from "./ab/index";
import { logger } from "../utils/logger";

export const upsertIngestedRows = async (
  chainName: string,
  storeExternalId: string,
  rows: IngestedProductRow[]
) => {
  logger.info("INGESTION_UPSERT_START", { event: "INGESTION_UPSERT_START", module: "ingestion/service", chainName, rowCount: rows.length });

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
    // Look up product by EAN if available, otherwise via StoreProductCode
    let product = row.ean
      ? await prisma.product.findUnique({ where: { ean: row.ean } })
      : null;

    if (!product) {
      const storeCode = await prisma.storeProductCode.findUnique({
        where: {
          storeId_externalCode: {
            storeId: store.id,
            externalCode: row.productExternalId,
          },
        },
        include: { product: true },
      });
      if (storeCode) product = storeCode.product;
    }

    // Determine a unique EAN: use provided EAN or synthesize from chain + externalId
    const ean = row.ean ?? `${chainName.toLowerCase()}-${row.productExternalId}`;

    if (!product) {
      product = await prisma.product.create({
        data: {
          ean,
          name: row.name,
          brand: row.brand,
          quantity: row.quantity,
          imageUrl: row.imageUrl,
          isActive: true,
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: row.imageUrl ?? product.imageUrl, name: row.name }
      });
    }

    // Ensure StoreProductCode link exists
    await prisma.storeProductCode.upsert({
      where: {
        storeId_externalCode: {
          storeId: store.id,
          externalCode: row.productExternalId,
        },
      },
      update: {},
      create: {
        storeId: store.id,
        productId: product.id,
        externalCode: row.productExternalId,
      },
    });

    await prisma.priceSnapshot.create({
      data: {
        productId: product.id,
        storeId: store.id,
        price: row.price,
        promoPrice: row.promoPrice ?? null,
        inStock: row.inStock,
        collectedAt: new Date(row.collectedAt),
      },
    });
  }
  logger.info("INGESTION_UPSERT_DONE", { event: "INGESTION_UPSERT_DONE", module: "ingestion/service", chainName, rowCount: rows.length });
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
    rows = await abIngestionPlugin(storeExternalId);
  } else if (chainName.toLowerCase() === "wolt") {
    rows = await woltIngestionPlugin.fetchStoreSnapshot(storeExternalId);
  }

  if (rows.length > 0) {
    await upsertIngestedRows(chainName, storeExternalId, rows);
  }
};