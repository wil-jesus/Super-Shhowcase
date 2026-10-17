// Monitor de saúde: /api/health + últimos deploys + contagem de usuários. Uso: npm run health
// Env opcionais: HEALTH_URL, DATABASE_URL (contagem de usuários), VERCEL_TOKEN [+ VERCEL_PROJECT_ID, VERCEL_ORG_ID].
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import prismaPkg from "@prisma/client";

const BASE_URL = (process.env.HEALTH_URL ?? "https://showcase-two-eosin.vercel.app").replace(/\/$/, "");
let failed = false;

function section(title) {
  console.log(`\n== ${title}`);
}

async function checkHealth() {
  section(`Health (${BASE_URL}/api/health)`);
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(30_000) });
    const body = await res.json();
    console.log(`HTTP ${res.status} | status=${body.status} | database=${body.database} | schema=${body.schema ?? "n/d (versão antiga)"}`);
    console.log(`env=${body.env} | commit=${body.commit ?? "n/d"} | ${body.timestamp}`);
    if (body.databaseError) console.log(`databaseError: ${body.databaseError}`);
    if (body.schemaError) console.log(`schemaError: ${body.schemaError}`);
    if (!res.ok || body.status !== "ok") failed = true;
  } catch (error) {
    failed = true;
    console.log(`FALHA: ${error instanceof Error ? error.message : error}`);
  }
}

function readLinkedProject() {
  try {
    return JSON.parse(readFileSync(".vercel/project.json", "utf8"));
  } catch {
    return {};
  }
}

async function listDeployments() {
  section("Últimos deploys");
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    console.log("VERCEL_TOKEN ausente; usando a CLI logada (`vercel ls`).");
    const out = spawnSync("npx vercel ls", { shell: true, encoding: "utf8", timeout: 120_000 });
    const text = (out.stderr?.trim() || out.stdout?.trim() || "").trim();
    console.log(text ? text.split("\n").slice(0, 25).join("\n") : "Sem saída da CLI.");
    return;
  }

  const linked = readLinkedProject();
  const projectId = process.env.VERCEL_PROJECT_ID ?? linked.projectId;
  const teamId = process.env.VERCEL_ORG_ID ?? linked.orgId;
  if (!projectId) {
    failed = true;
    console.log("VERCEL_PROJECT_ID ausente.");
    return;
  }

  const query = new URLSearchParams({ projectId, limit: "5", target: "production" });
  if (teamId) query.set("teamId", teamId);

  try {
    const res = await fetch(`https://api.vercel.com/v6/deployments?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { deployments = [] } = await res.json();
    for (const d of deployments) {
      const sha = d.meta?.githubCommitSha?.slice(0, 7) ?? "-";
      console.log(`${new Date(d.created).toISOString()} | ${d.state} | ${sha} | https://${d.url}`);
    }
    if (deployments[0] && deployments[0].state !== "READY") failed = true;
  } catch (error) {
    failed = true;
    console.log(`FALHA: ${error instanceof Error ? error.message : error}`);
  }
}

async function countUsers() {
  section("Usuários");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL ausente; contagem ignorada.");
    console.log("Para produção: vercel env pull .env.production.local --environment=production");
    console.log("               node --env-file=.env.production.local scripts/health.mjs");
    return;
  }

  console.log(`Banco: ${new URL(url).host} (confirme que é o banco de produção; o .env local aponta para dev)`);
  const prisma = new prismaPkg.PrismaClient();
  try {
    const rows = await prisma.user.groupBy({ by: ["role", "status"], _count: { _all: true } });
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    console.log(`Total: ${total}`);
    for (const r of rows) console.log(`  ${r.role} / ${r.status}: ${r._count._all}`);
  } catch (error) {
    failed = true;
    console.log(`FALHA: ${error instanceof Error ? error.message.split("\n").pop() : error}`);
  } finally {
    await prisma.$disconnect();
  }
}

await checkHealth();
await listDeployments();
await countUsers();

console.log(failed ? "\nRESULTADO: ATENÇÃO (há falhas acima)" : "\nRESULTADO: OK");
process.exit(failed ? 1 : 0);
