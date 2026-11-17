import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  agentGuardPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.agentGuardPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.agentGuardPrisma = prisma;
}
