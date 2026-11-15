import { mkdir, readFile, rename, rm, writeFile, appendFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fetchSenators, validateSenateDataset } from "../src/services/senate.ts";
export const senatorsPath = fileURLToPath(new URL("../public/data/senadores.json", import.meta.url));
export async function writeSenators(target, data) {
  await validateSenateDataset(data);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  try { await writeFile(temporary, `${JSON.stringify(data)}\n`, "utf8"); await validateSenateDataset(JSON.parse(await readFile(temporary, "utf8"))); await rename(temporary, target); }
  finally { await rm(temporary, { force: true }); }
}
export async function prepareSenators({ target = senatorsPath, eventName = "push", bootstrap = false, fetchPublished = fetch, collect = fetchSenators } = {}) {
  const response = await fetchPublished(`https://elias226.github.io/chat-dashboard-hub/data/senadores.json?publication=${encodeURIComponent(process.env.GITHUB_RUN_ID ?? Date.now())}`, { redirect: "error", cache: "no-cache", signal: AbortSignal.timeout(15000) });
  let baseline;
  if (response.status === 404 && eventName === "workflow_dispatch" && bootstrap) baseline = await validateSenateDataset(JSON.parse(await readFile(target, "utf8")));
  else { if (!response.ok) throw new Error(`Publicação anterior do Senado indisponível (HTTP ${response.status}).`); baseline = await validateSenateDataset(await response.json()); }
  let selected = baseline, refreshError = null;
  try {
    const candidate = await validateSenateDataset(await collect());
    if (Date.parse(candidate.fetchedAt) < Date.parse(baseline.fetchedAt) || candidate.referenceDate < baseline.referenceDate) throw new Error("Consulta anterior à publicação.");
    if (candidate.fetchedAt === baseline.fetchedAt && candidate.integrity.sha256 !== baseline.integrity.sha256) throw new Error("Conflito na mesma data.");
    selected = candidate;
  } catch (error) { refreshError = error instanceof Error ? error.message : String(error); }
  await writeSenators(target, selected);
  return { refreshed: !refreshError, records: selected.senators.length, fetchedAt: selected.fetchedAt, referenceDate: selected.referenceDate, refreshError };
}
async function main() {
  try {
    let result;
    if (process.argv.includes("--prepare")) result = await prepareSenators({ eventName: process.env.GITHUB_EVENT_NAME, bootstrap: process.env.ALLOW_INITIAL_DATA === "1" });
    else { const data = process.argv.includes("--validate") ? await validateSenateDataset(JSON.parse(await readFile(senatorsPath, "utf8"))) : await fetchSenators(); if (!process.argv.includes("--validate")) await writeSenators(senatorsPath, data); result = { records: data.senators.length, fetchedAt: data.fetchedAt, referenceDate: data.referenceDate, sha256: data.integrity.sha256 }; }
    console.log(JSON.stringify(result, null, 2));
    if (result.refreshError) console.warn(`::warning::Senado: preservada a última consulta completa. ${result.refreshError}`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Senado Federal\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
