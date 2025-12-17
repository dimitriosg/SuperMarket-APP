import { Prisma, prisma } from '../db';
import type { IngestedProductRow } from '@shared/ingestion';
import { SUPPORTED_CHAINS } from '@shared/chains';

function getChainName(slug: string): string {
  const meta = SUPPORTED_CHAINS.find((c) => c.slug === slug);
  return meta?.label ?? slug;
}

export interface IngestionResultSummary {
  chainId: number;
  storeId: number;
  productsUpserted: number;
  priceSnapshotsCreated: number;
}

export async function upsertIngestedRows(rows: IngestedProductRow[]): Promise<IngestionResultSummary> {
  if (rows.length === 0) {
    throw new Error('No rows to ingest');
  }

  const first = rows[0];

  // 1) Upsert chain
  const chain = await prisma.chain.upsert({
    where: { slug: first.chain },
    update: {},
    create: {
      slug: first.chain,
      name: getChainName(first.chain),
    },
  });

  // 2) Upsert store
  const store = await prisma.store.upsert({
    where: { externalId: first.storeExternalId },
    update: {},
    create: {
      externalId: first.storeExternalId,
      name: `DEBUG Store ${first.storeExternalId}`,
      chainId: chain.id,
    },
  });

  let productsUpserted = 0;
  let priceSnapshotsCreated = 0;

  for (const row of rows) {
    // 3) Upsert product (by EAN when available, otherwise by name+brand+size)
    let product = null;

    if (row.ean) {
      product = await prisma.product.upsert({
        where: { ean: row.ean },
        update: {
          name: row.name,
          brand: row.brand,
          size: row.quantity,
        },
        create: {
          ean: row.ean,
          name: row.name,
          brand: row.brand,
          size: row.quantity,
        },
      });
    } else {
      product =
        (await prisma.product.findFirst({
          where: {
            name: row.name,
            brand: row.brand ?? undefined,
            size: row.quantity ?? undefined,
          },
        })) ??
        (await prisma.product.create({
          data: {
            name: row.name,
            brand: row.brand,
            size: row.quantity,
          },
        }));
    }

    productsUpserted += 1;

    // 4) Upsert store product
    const storeProduct = await prisma.storeProduct.upsert({
      where: {
        storeId_externalProductId: {
          storeId: store.id,
          externalProductId: row.productExternalId,
        },
      },
      update: {
        name: row.name,
        unitSize: row.quantity,
        imageUrl: row.imageUrl,
        productId: product.id,
      },
      create: {
        storeId: store.id,
        externalProductId: row.productExternalId,
        name: row.name,
        unitSize: row.quantity,
        imageUrl: row.imageUrl,
        productId: product.id,
      },
    });

    // 5) Create price snapshot
    await prisma.priceSnapshot.create({
      data: {
        storeProductId: storeProduct.id,
        price: new Prisma.Decimal(row.price),
        promoPrice: row.promoPrice != null ? new Prisma.Decimal(row.promoPrice) : undefined,
        inStock: row.inStock,
        currency: 'EUR',
        collectedAt: new Date(row.collectedAt),
      },
    });

    priceSnapshotsCreated += 1;
  }

  return {
    chainId: chain.id,
    storeId: store.id,
    productsUpserted,
    priceSnapshotsCreated,
  };
}
