import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const productRoutes = new Elysia({ prefix: '/products' })
  .get('/:id/history', async ({ params: { id }, query }) => {
    const days = Number(query.days) || 30;
    
    // Υπολογισμός ημερομηνίας έναρξης
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch History
    const historyData = await prisma.priceHistory.findMany({
      where: {
        productId: id,
        date: { gte: startDate }
      },
      include: { store: true },
      orderBy: { date: 'asc' }
    });

    // Group by Store (Shape A - Per Store Series)
    const groupedHistory: Record<string, { store: string, points: any[] }> = {};

    historyData.forEach(record => {
      const storeName = record.store.name;
      
      if (!groupedHistory[storeName]) {
        groupedHistory[storeName] = {
          store: storeName,
          points: []
        };
      }

      groupedHistory[storeName].points.push({
        date: record.date.toISOString().split('T')[0], // YYYY-MM-DD
        price: Number(record.price)
      });
    });

    return {
      productId: id,
      days: days,
      histories: Object.values(groupedHistory)
    };

  }, {
    query: t.Object({ days: t.Optional(t.String()) })
});