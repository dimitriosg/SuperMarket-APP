import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { envSchema, type HealthResponse } from '@shared/index';

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
