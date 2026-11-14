import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { preparePublication } from "./prepare-publication.mjs";
import { createDeputiesDataset } from "../src/services/deputiesDataset.ts";
import { DEPUTIES_QUERY_URL } from "../src/services/camaraDeputies.ts";

// Synthetic snapshots are restricted to automated tests and temporary directories.
async function snapshot(date = "2026-11-04T12:00:00.000Z", nome = "Pessoa de teste") {
  return createDeputiesDataset({ complete: true, deputies: [{ id: 1, nome, siglaUf: "CE", siglaPartido: "TESTE", urlFoto: null }], fetchedAt: date, pages: 1, duplicates: 0, invalidRecords: 0, collection: { expectedCount: 1, receivedCount: 1, pages: [{ url: DEPUTIES_QUERY_URL, count: 1, total: 1 }] } });
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "chat-politico-publication-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const target = join(directory, "deputados.json");
  await writeFile(target, JSON.stringify(await snapshot("2026-11-01T12:00:00.000Z")));
  return target;
}
const offline = async () => { throw new Error("API simulada indisponível"); };

test("API failure publishes code with newer deployed snapshot, not older checkout", async (t) => {
  const target = await fixture(t); const deployed = await snapshot();
  const report = await preparePublication({ target, fetchPublished: async () => Response.json(deployed), collect: offline });
  assert.equal(report.refreshed, false); assert.equal(report.origin, "published-site");
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), deployed);
});
test("successful complete refresh supersedes deployed snapshot", async (t) => {
  const target = await fixture(t); const updated = await snapshot("2026-11-05T12:00:00.000Z");
  const report = await preparePublication({ target, fetchPublished: async () => Response.json(await snapshot()), collect: async () => updated });
  assert.equal(report.refreshed, true); assert.equal(report.fetchedAt, updated.fetchedAt);
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), updated);
});
for (const [name, fetchPublished] of [
  ["network failure", offline], ["HTTP 504", async () => new Response("", { status: 504 })],
  ["invalid JSON", async () => new Response("not json")], ["corrupt dataset", async () => Response.json({ complete: true, deputies: [] })],
  ["404 without bootstrap", async () => new Response("", { status: 404 })],
]) test(`cannot publish on ${name}; previous local bytes unchanged`, async (t) => {
  const target = await fixture(t); const before = await readFile(target, "utf8"); let calls = 0;
  await assert.rejects(preparePublication({ target, fetchPublished, collect: async () => { calls++; return snapshot(); } }));
  assert.equal(await readFile(target, "utf8"), before); assert.equal(calls, 0);
});
test("explicit bootstrap on 404 can use valid official seed during API failure", async (t) => {
  const target = await fixture(t); const before = JSON.parse(await readFile(target, "utf8"));
  const report = await preparePublication({ target, eventName: "workflow_dispatch", bootstrap: true, fetchPublished: async () => new Response("", { status: 404 }), collect: offline });
  assert.equal(report.origin, "explicit-initial-snapshot"); assert.deepEqual(JSON.parse(await readFile(target, "utf8")), before);
});
test("bootstrap does not hide a broken existing publication", async (t) => {
  const target = await fixture(t);
  await assert.rejects(preparePublication({ target, eventName: "workflow_dispatch", bootstrap: true, fetchPublished: async () => Response.json({ complete: false }), collect: offline }));
});

test("only manual dispatch can bootstrap; schedules never publish a failed refresh", async (t) => {
  const target = await fixture(t);
  for (const eventName of ["push", "schedule"]) {
    await assert.rejects(preparePublication({ target, eventName, bootstrap: true, fetchPublished: async () => new Response("", { status: 404 }), collect: offline }));
  }
  for (const eventName of ["push", "workflow_dispatch", "schedule"]) {
    const report = await preparePublication({ target, eventName, fetchPublished: async () => Response.json(await snapshot()), collect: offline });
    assert.equal(report.deployAllowed, eventName !== "schedule");
    assert.equal(report.refreshed, false);
  }
});

test("invalid initial seed is never accepted even through explicit manual bootstrap", async (t) => {
  const target = await fixture(t);
  await writeFile(target, JSON.stringify({ complete: true, deputies: [] }));
  const before = await readFile(target, "utf8");
  await assert.rejects(preparePublication({ target, eventName: "workflow_dispatch", bootstrap: true, fetchPublished: async () => new Response("", { status: 404 }), collect: offline }));
  assert.equal(await readFile(target, "utf8"), before);
});
test("invalid/partial/older refresh preserves the deployed dataset", async (t) => {
  const target = await fixture(t); const deployed = await snapshot();
  for (const candidate of [{ complete: false, deputies: [] }, await snapshot("2026-11-02T12:00:00.000Z"), await snapshot(deployed.fetchedAt, "Conflito de teste")]) {
    const report = await preparePublication({ target, fetchPublished: async () => Response.json(deployed), collect: async () => candidate });
    assert.equal(report.refreshed, false); assert.deepEqual(JSON.parse(await readFile(target, "utf8")), deployed);
  }
});
