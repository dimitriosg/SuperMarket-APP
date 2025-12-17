import { Prisma, prisma } from '../db';
import type { IngestedProductRow } from '@shared/ingestion';

export type IngestionResultSummary = {
  chainId: string;
  chainLabel: string;
  storeId: string;
  storeExternalId: string;
  storeName: string;
  totalRows: number;
  createdProducts: number;
  updatedProducts: number;
  createdSnapshots: number;
};

function getChainLabel(slug: string): string {
  switch (slug) {
    case 'wolt':
      return 'Wolt Market / Retail';
    default:
      return slug;
  }
}

export async function upsertChainStore(
  rows: IngestedProductRow[],
): Promise<{ chain: Prisma.ChainGetPayload<{}>; store: Prisma.StoreGetPayload<{}> }> {
  if (!rows.length) {
    throw new Error('No rows to ingest');
  }

  const first = rows[0];

  const chainLabel = getChainLabel(first.chain);

  const chain = await prisma.chain.upsert({
    where: { slug: first.chain },
    update: {
      label: chainLabel,
    },
    create: {
      slug: first.chain,
      label: chainLabel,
    },
  });

  const store = await prisma.store.upsert({
    where: {
      chainId_externalId: {
        chainId: chain.id,
        externalId: first.storeExternalId,
      },
    },
    update: {
      name: `DEBUG Store ${first.storeExternalId}`,
      city: first.storeCity ?? null,
      area: first.storeArea ?? null,
      latitude: first.storeLatitude ?? null,
      longitude: first.storeLongitude ?? null,
    },
    create: {
      chainId: chain.id,
      externalId: first.storeExternalId,
      name: `DEBUG Store ${first.storeExternalId}`,
      city: first.storeCity ?? null,
      area: first.storeArea ?? null,
      latitude: first.storeLatitude ?? null,
      longitude: first.storeLongitude ?? null,
    },
  });

  return { chain, store };
}

export async function ingestRows(rows: IngestedProductRow[]): Promise<IngestionResultSummary> {
  const { chain, store } = await upsertChainStore(rows);

  let createdProducts = 0;
  let updatedProducts = 0;
  let createdSnapshots = 0;

  for (const row of rows) {
    // Product is unique per (storeId, externalId) according to the Prisma schema.
    const product = await prisma.product.upsert({
      where: {
        storeId_externalId: {
          storeId: store.id,
          externalId: row.productExternalId,
        },
      },
      update: {
        name: row.name,
        brand: row.brand ?? null,
        quantity: row.quantity ?? null,
        ean: row.ean ?? null,
        imageUrl: row.imageUrl ?? null,
        isActive: row.isActive ?? true,
      },
      create: {
        storeId: store.id,
        externalId: row.productExternalId,
        name: row.name,
        brand: row.brand ?? null,
        quantity: row.quantity ?? null,
        ean: row.ean ?? null,
        imageUrl: row.imageUrl ?? null,
        isActive: row.isActive ?? true,
      },
    });

    // Simple heuristic: when a row is first created, createdAt == updatedAt.
    if (product.createdAt.getTime() === product.updatedAt.getTime()) {
      createdProducts++;
    } else {
      updatedProducts++;
    }

    await prisma.priceSnapshot.create({
      data: {
        productId: product.id,
        price: row.price,
        promoPrice: row.promoPrice ?? null,
        inStock: row.inStock,
        collectedAt: row.collectedAt,
      },
    });

    createdSnapshots++;
  }

  return {
    chainId: chain.id,
    chainLabel: chain.label,
    storeId: store.id,
    storeExternalId: store.externalId,
    storeName: store.name,
    totalRows: rows.length,
    createdProducts,
    updatedProducts,
    createdSnapshots,
  };
}

export { ingestRows as upsertIngestedRows };
