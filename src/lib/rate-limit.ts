import { prisma } from "@/lib/prisma";

export type RateLimitResult = { allowed: boolean; remaining: number };

/** Janela fixa persistida no banco (serverless não compartilha memória entre instâncias). */
export async function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const resetAt = new Date(Date.now() + windowMs);
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count"
    `;
    const count = Number(rows[0]?.count ?? 1);
    return { allowed: count <= maxAttempts, remaining: Math.max(0, maxAttempts - count) };
  } catch (error) {
    // Falha aberta: indisponibilidade do banco não pode trancar todos os usuários.
    console.error("rateLimit falhou", error);
    return { allowed: true, remaining: maxAttempts };
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (error) {
    console.error("resetRateLimit falhou", error);
  }
}
