import { mkdir, readFile, rename, rm, writeFile, appendFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fetchDeputies } from "../src/services/camaraDeputies.ts";
import { createDeputiesDataset, validateDeputiesDataset } from "../src/services/deputiesDataset.ts";

export const datasetPath = fileURLToPath(new URL("../public/data/deputados.json", import.meta.url));

/** A failed collection/validation never writes the target. Rename is the final step. */
export async function updateDeputies(target = datasetPath, collect = () => fetchDeputies(undefined, { verifyTotal: true })) {
  const candidate = await createDeputiesDataset(await collect());
  await writeDeputiesDataset(target, candidate);
  return candidate;
}

export async function writeDeputiesDataset(target, candidate) {
  await validateDeputiesDataset(candidate);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    await validateDeputiesDataset(JSON.parse(await readFile(temporary, "utf8")));
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function main() {
  let report;
  try {
    const data = process.argv.includes("--validate")
      ? await validateDeputiesDataset(JSON.parse(await readFile(datasetPath, "utf8")))
      : await updateDeputies();
    report = { result: "success", fetchedAt: data.fetchedAt, records: data.deputies.length, pages: data.pages, duplicates: data.duplicates, sha256: data.integrity.sha256 };
  } catch (error) {
    report = { result: "failure", message: error.message, url: error.url, status: error.status, kind: error.kind, previousFile: "unchanged; deployment must stop" };
    process.exitCode = 1;
  }
  console.log(JSON.stringify(report, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Atualização de deputados\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
