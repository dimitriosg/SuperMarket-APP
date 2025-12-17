import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { envSchema, type HealthResponse } from '@shared/index';
import { prisma } from './db';
import { woltIngestionPlugin } from './ingestion/wolt';
import { upsertIngestedRows } from './ingestion/service';

dotenv.config();

const env = envSchema.parse(process.env);

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: true
});

app.get('/health', async (): Promise<HealthResponse> => ({
  ok: true,
  ts: new Date().toISOString()
}));

app.get('/debug/db', async (req, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1 AS "ok"`;
    reply.code(200).send({ ok: true });
  } catch (err) {
    req.log.error({ err }, 'DB debug failed');
    reply.code(500).send({ ok: false, error: 'db_error' });
  }
});

app.get('/debug/ingestion/wolt/:storeExternalId', async (req, reply) => {
  const { storeExternalId } = req.params as { storeExternalId: string };

  try {
    const rows = await woltIngestionPlugin.fetchStoreSnapshot(storeExternalId);
    const summary = await upsertIngestedRows(rows);

    return reply.send({
      ok: true,
      rows: rows.length,
      summary,
    });
  } catch (err) {
    req.log.error({ err }, 'Wolt ingestion debug failed');
    return reply.code(500).send({
      ok: false,
      error: 'ingestion_failed',
    });
  }
});

const port = env.API_PORT ?? 4000;
const host = '0.0.0.0';

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`API listening on http://${host}:${port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
