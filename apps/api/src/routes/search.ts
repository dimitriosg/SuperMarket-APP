// apps/api/src/routes/search.ts
import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchRoutes = new Elysia({ prefix: '/search' })
  .get('/', async ({ query }) => {
    const searchTerm = query.q as string;
    if (!searchTerm) return [];

    const products = await prisma.product.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      include: {
        PriceSnapshot: { 
          orderBy: { collectedAt: 'desc' },
          take: 1
        },
        store: true // Βεβαιώσου ότι στο schema.prisma υπάρχει το: store Store @relation(...)
      }
    });

    // Χρησιμοποιούμε map με explicit typing για να δει το store και το PriceSnapshot
    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.PriceSnapshot?.[0]?.price || "0",
      store: p.store?.name || "Άγνωστο",
      image: p.imageUrl
    }));
  }, {
    query: t.Object({
      q: t.String()
    })
  });