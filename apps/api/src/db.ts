// apps/api/src/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["info", "error", "warn"], // Για να βλέπουμε τι γίνεται
  });

// ✅ Add alias for consistency
export const db = prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;