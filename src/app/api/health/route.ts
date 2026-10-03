import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "ok" | "degraded" | "down" = "down";
  let databaseError: string | null = null;

  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    database = result && result.length > 0 ? "ok" : "degraded";
  } catch (error) {
    database = "down";
    databaseError = error instanceof Error ? error.message : "Database check failed";
  }

  return NextResponse.json({
    status: database === "ok" ? "ok" : "degraded",
    database,
    version: packageJson.version,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    ...(databaseError ? { databaseError } : {}),
  });
}
