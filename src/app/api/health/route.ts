import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Check = "ok" | "degraded" | "down";
type SchemaCheck = "ok" | "missing_migrations" | "error" | "skipped";

export async function GET() {
  let database: Check = "down";
  let schema: SchemaCheck = "skipped";
  let databaseError: string | null = null;
  let schemaError: string | null = null;

  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    database = result && result.length > 0 ? "ok" : "degraded";
  } catch (error) {
    databaseError = error instanceof Error ? error.message : "Database check failed";
  }

  if (database === "ok") {
    try {
      await prisma.user.count();
      schema = "ok";
    } catch (error) {
      // P2021/P2022: tabela ou coluna ausente, ou seja, migrations não aplicadas.
      const missing =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2021" || error.code === "P2022");
      schema = missing ? "missing_migrations" : "error";
      schemaError = missing
        ? "Tabela/coluna ausente: rode `prisma migrate deploy` neste banco."
        : "Falha ao consultar a tabela User";
    }
  }

  const healthy = database === "ok" && schema === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      schema,
      version: packageJson.version,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
      ...(databaseError ? { databaseError } : {}),
      ...(schemaError ? { schemaError } : {}),
    },
    { status: healthy ? 200 : 503 }
  );
}
