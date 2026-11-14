import { readFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { datasetPath, writeDeputiesDataset } from "./update-deputies.mjs";
import { fetchDeputies } from "../src/services/camaraDeputies.ts";
import { createDeputiesDataset, validateDeputiesDataset } from "../src/services/deputiesDataset.ts";

const publishedUrl = "https://elias226.github.io/chat-dashboard-hub/data/deputados.json";

/** Read the deployed snapshot, never treating network/validation errors as first deployment. */
export async function readPublishedDeputies({ fetchPublished = fetch, bootstrap = false, target = datasetPath } = {}) {
  // Fixed project URL; no token, user-controlled origin or redirected downloads.
  const response = await fetchPublished(`${publishedUrl}?publication=${encodeURIComponent(process.env.GITHUB_RUN_ID ?? Date.now())}`, {
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    redirect: "error", signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404 && bootstrap) {
    return { data: await validateDeputiesDataset(JSON.parse(await readFile(target, "utf8"))), origin: "explicit-initial-snapshot" };
  }
  if (!response.ok) throw new Error(`Não foi possível recuperar o conjunto publicado (HTTP ${response.status}). Não será usado um snapshot mais antigo automaticamente.`);
  return { data: await validateDeputiesDataset(await response.json()), origin: "published-site" };
}

export async function preparePublication({ target = datasetPath, eventName = "push", bootstrap = false, fetchPublished = fetch, collect = () => fetchDeputies(undefined, { verifyTotal: true }) } = {}) {
  const baseline = await readPublishedDeputies({ fetchPublished, bootstrap: eventName === "workflow_dispatch" && bootstrap, target });
  let selected = baseline.data;
  let refreshError = null;
  let refreshed = false;
  try {
    const candidate = await createDeputiesDataset(await collect());
    if (Date.parse(candidate.fetchedAt) < Date.parse(baseline.data.fetchedAt)) throw new Error("A coleta retornou data anterior à publicação. O conjunto publicado foi preservado.");
    if (candidate.fetchedAt === baseline.data.fetchedAt && candidate.integrity.sha256 !== baseline.data.integrity.sha256) throw new Error("Há conjuntos conflitantes com a mesma data. O conjunto publicado foi preservado.");
    selected = candidate;
    refreshed = true;
  } catch (error) {
    refreshError = { message: error.message, url: error.url, status: error.status, kind: error.kind };
  }
  // Commit exactly one fully validated choice; partial API results never reach this point.
  await writeDeputiesDataset(target, selected);
  return { refreshed, deployAllowed: refreshed || eventName !== "schedule", origin: refreshed ? "official-api" : baseline.origin, fetchedAt: selected.fetchedAt, records: selected.deputies.length, sha256: selected.integrity.sha256, refreshError };
}

async function main() {
  try {
    const result = await preparePublication({ eventName: process.env.GITHUB_EVENT_NAME, bootstrap: process.env.ALLOW_INITIAL_DATA === "1" });
    console.log(JSON.stringify(result, null, 2));
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `refreshed=${result.refreshed}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Dados da publicação\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`);
    if (result.refreshError) console.warn("A coleta oficial falhou; publicação de código usará o último conjunto completo validado, com sua data original.");
    if (!result.deployAllowed) process.exitCode = 1;
  } catch (error) {
    console.error(`Publicação interrompida: ${error.message}`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, "### Dados da publicação\n\nFalha ao recuperar ou validar o conjunto publicado. Nenhum deploy autorizado por esta execução.\n");
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
