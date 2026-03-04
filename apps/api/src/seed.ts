// apps/api/src/seed.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "./utils/logger";

const prisma = new PrismaClient();

// Αυτά είναι τα IDs που χρησιμοποιεί το e-katanalotis service
const DATA = [
  { id: "ab", name: "ΑΒ Βασιλόπουλος", slug: "ab-vasilopoulos" },
  { id: "bazaar", name: "Bazaar", slug: "bazaar" },
  { id: "efresh", name: "E-Fresh", slug: "efresh" },
  { id: "galaxias", name: "Γαλαξίας", slug: "galaxias" },
  { id: "kritikos", name: "Κρητικός", slug: "kritikos" },
  { id: "lidl", name: "Lidl", slug: "lidl" },
  { id: "marketin", name: "Market In", slug: "market-in" },
  { id: "masoutis", name: "Μασούτης", slug: "masoutis" },
  { id: "mymarket", name: "My Market", slug: "my-market" },
  { id: "sklavenitis", name: "Σκλαβενίτης", slug: "sklavenitis" },
  { id: "synka", name: "SYN.KA", slug: "synka" },
  { id: "xalkiadakis", name: "Χαλκιαδάκης", slug: "xalkiadakis" }
];

async function main() {
  logger.info("SEED_STARTED", { event: "SEED_STARTED", module: "seed" });

  for (const item of DATA) {
    // 1. Δημιουργία ή Εύρεση της Αλυσίδας (Chain)
    const chain = await prisma.chain.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        slug: item.slug,
        label: item.name
      }
    });

    // 2. Δημιουργία του Καταστήματος (Store) συνδεδεμένο με την Αλυσίδα
    // Χρησιμοποιούμε το ID (π.χ. "sklavenitis") για να το βρίσκει το sync service
    await prisma.store.upsert({
      where: { id: item.id },
      update: { 
        name: item.name,
        chainId: chain.id 
      },
      create: {
        id: item.id,            // Εδώ ορίζουμε το ID που θέλουμε (π.χ. "sklavenitis")
        name: item.name,
        externalId: item.id,    // Υποχρεωτικό πεδίο στο schema σου
        chainId: chain.id,      // Σύνδεση με την αλυσίδα
        isActive: true
      }
    });

    logger.info("SEED_CREATED", { event: "SEED_CREATED", module: "seed", name: item.name });
  }
}

main()
  .catch((e) => {
    logger.error("SEED_FAILED", { event: "SEED_FAILED", module: "seed", message: e instanceof Error ? e.message : String(e) });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });