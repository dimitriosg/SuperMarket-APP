import { prisma } from '../db';
import { runIngestionForStore } from './service';

type IngestionTarget = {
  chain: string;
  storeId: string;
};

const parseTargetsFromEnv = (): IngestionTarget[] => {
  const raw = process.env.INGESTION_TASKS;
  if (!raw) return [];

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [chain, storeId] = entry.split(':').map((part) => part.trim());
      return chain && storeId ? { chain, storeId } : null;
    })
    .filter((entry): entry is IngestionTarget => Boolean(entry));
};

const loadTargetsFromDb = async (): Promise<IngestionTarget[]> => {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: { chain: true }
  });

  return stores
    .map((store) => ({
      chain: store.chain.slug || store.chain.label,
      storeId: store.externalId
    }))
    .filter((target) => Boolean(target.chain && target.storeId));
};

const runIngestionCycle = async () => {
  const envTargets = parseTargetsFromEnv();
  const targets = envTargets.length > 0 ? envTargets : await loadTargetsFromDb();

  if (targets.length === 0) {
    console.warn('⚠️ Δεν βρέθηκαν stores για scheduled ingestion.');
    return;
  }

  for (const target of targets) {
    try {
      console.log(`🗓️ Scheduled ingestion για ${target.chain}:${target.storeId}`);
      await runIngestionForStore(target.chain, target.storeId);
    } catch (error) {
      console.error(`❌ Scheduled ingestion failed for ${target.chain}:${target.storeId}`, error);
    }
  }
};

export const startIngestionScheduler = () => {
  const enabled = process.env.INGESTION_AUTOMATION_ENABLED !== 'false';
  if (!enabled) {
    console.log('⏸️ Ingestion scheduler disabled μέσω env.');
    return;
  }

  const intervalMinutes = Number(process.env.INGESTION_INTERVAL_MINUTES || 360);
  const intervalMs = Math.max(intervalMinutes, 5) * 60 * 1000;
  let running = false;

  const schedule = async () => {
    if (running) return;
    running = true;
    try {
      await runIngestionCycle();
    } finally {
      running = false;
    }
  };

  schedule().catch(() => undefined);
  setInterval(schedule, intervalMs);
  console.log(`⏱️ Ingestion scheduler ενεργό (κάθε ${intervalMinutes} λεπτά).`);
};
