import { mkdir, readFile, rename, rm, writeFile, appendFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { proposalPages, proposalDetail, normalizeProposal, recentProposalUrl } from "../src/services/camaraProposals.ts";
import { withCamaraBudget } from "../src/services/camaraHttp.ts";
import { createProposalsDataset, validateProposalsDataset } from "../src/services/proposalsDataset.ts";

export const proposalsPath = fileURLToPath(new URL("../public/data/proposicoes.json", import.meta.url));
export function referenceDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export async function collectProposals(end = referenceDay()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end) || !Number.isFinite(Date.parse(end))) throw new Error("Data de referência inválida.");
  const start = new Date(Date.parse(end) - 6 * 86400000).toISOString().slice(0, 10);
  const url = recentProposalUrl(start, end), controller = new AbortController();
  try {
    return await withCamaraBudget(url, 300000, controller.signal, async budget => {
      const { rows, pages, expected } = await proposalPages(url, budget, true);
      const unique = new Map();
      for (const raw of rows) {
        const record = normalizeProposal(raw);
        if (unique.has(record.id) && JSON.stringify(unique.get(record.id)) !== JSON.stringify(record)) throw new Error("Registros duplicados conflitantes.");
        unique.set(record.id, record);
      }
      if (unique.size !== expected) throw new Error("Total único difere do total oficial; coleta recusada.");
      const list = [...unique.values()], records = [];
      let cursor = 0, failure = false;
      const workers = await Promise.allSettled(Array.from({ length: 3 }, async () => {
        while (!failure && cursor < list.length) {
          const item = list[cursor++];
          try {
            const detail = await proposalDetail(item.id, budget);
            if (detail.siglaTipo !== item.siglaTipo || detail.numero !== item.numero || detail.ano !== item.ano) throw new Error("Identificação mudou durante a coleta.");
            records.push(detail);
          } catch (error) { failure = true; throw error; }
        }
      }));
      const rejected = workers.find(result => result.status === "rejected");
      if (rejected) throw rejected.reason;
      return createProposalsDataset({ schemaVersion: 1, complete: true, fetchedAt: new Date().toISOString(), coverage: { start, end, types: ["PL", "PEC", "PLP"] }, source: url, collection: { expectedCount: expected, pages }, records });
    });
  } finally { controller.abort(); }
}
export async function writeProposals(target, value) {
  const data = await validateProposalsDataset(value);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(data)}\n`, "utf8");
    await validateProposalsDataset(JSON.parse(await readFile(temporary, "utf8")));
    await rename(temporary, target);
  } finally { await rm(temporary, { force: true }); }
}
export async function prepareProposals({ target = proposalsPath, eventName = "push", bootstrap = false, fetchPublished = fetch, collect = collectProposals } = {}) {
  const response = await fetchPublished(`https://elias226.github.io/chat-dashboard-hub/data/proposicoes.json?publication=${encodeURIComponent(process.env.GITHUB_RUN_ID ?? Date.now())}`, { redirect: "error", cache: "no-cache", signal: AbortSignal.timeout(15000) });
  // Reuse the project's explicit manual bootstrap, only on an actual 404.
  // Network failures and corrupted remote files never bootstrap.
  let baseline;
  if (response.status === 404 && eventName === "workflow_dispatch" && bootstrap) baseline = await validateProposalsDataset(JSON.parse(await readFile(target, "utf8")));
  else {
    if (!response.ok) throw new Error(`Publicação anterior de proposições indisponível (HTTP ${response.status}).`);
    baseline = await validateProposalsDataset(await response.json());
  }
  let selected = baseline, refreshError = null;
  try {
    const candidate = await validateProposalsDataset(await collect());
    if (Date.parse(candidate.fetchedAt) < Date.parse(baseline.fetchedAt) || candidate.coverage.end < baseline.coverage.end) throw new Error("Coleta anterior ao conjunto publicado.");
    if (candidate.fetchedAt === baseline.fetchedAt && candidate.integrity.sha256 !== baseline.integrity.sha256) throw new Error("Conflito na mesma data de consulta.");
    selected = candidate;
  } catch (error) { refreshError = error instanceof Error ? error.message : String(error); }
  await writeProposals(target, selected);
  return { refreshed: !refreshError, fetchedAt: selected.fetchedAt, coverage: selected.coverage, records: selected.records.length, refreshError };
}
async function main() {
  try {
    let result;
    if (process.argv.includes("--prepare")) result = await prepareProposals({ eventName: process.env.GITHUB_EVENT_NAME, bootstrap: process.env.ALLOW_INITIAL_DATA === "1" });
    else {
      const data = process.argv.includes("--validate") ? await validateProposalsDataset(JSON.parse(await readFile(proposalsPath, "utf8"))) : await collectProposals(process.argv.find(arg => arg.startsWith("--date="))?.slice(7));
      if (!process.argv.includes("--validate")) await writeProposals(proposalsPath, data);
      result = { fetchedAt: data.fetchedAt, coverage: data.coverage, records: data.records.length, sha256: data.integrity.sha256 };
    }
    console.log(JSON.stringify(result, null, 2));
    if (result.refreshError) console.warn(`::warning::Atualização das proposições falhou; preservado o último recorte completo. ${result.refreshError}`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Proposições oficiais\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
