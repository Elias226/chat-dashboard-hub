import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchDeputies, DEPUTIES_QUERY_URL } from "../src/services/camaraDeputies.ts";
import { createDeputiesDataset, validateDeputiesDataset } from "../src/services/deputiesDataset.ts";
import { updateDeputies } from "./update-deputies.mjs";

// All records here are synthetic, exclusively for automated tests.
const deputy = (id) => ({ id, nome: `Pessoa de teste ${id}`, siglaUf: "CE", siglaPartido: "TESTE", urlFoto: null });
const next = DEPUTIES_QUERY_URL.replace("pagina=1", "pagina=2");
const response = (records, links = [], total = "2", status = 200) => new Response(JSON.stringify({ dados: records, links }), { status, headers: { "X-Total-Count": total, "Retry-After": "0" } });
function mockFetch(t, fn) { t.mock.method(globalThis, "fetch", fn); }

test("collector follows next, deduplicates identical IDs, validates dynamic total and hash", async (t) => {
  const urls = [];
  mockFetch(t, async (url) => { urls.push(url); return url === DEPUTIES_QUERY_URL ? response([deputy(1)], [{ rel: "next", href: next }]) : response([deputy(1), deputy(2)]); });
  const data = await createDeputiesDataset(await fetchDeputies(undefined, { verifyTotal: true }));
  assert.deepEqual(urls, [DEPUTIES_QUERY_URL, next]);
  assert.equal(data.deputies.length, 2); assert.equal(data.duplicates, 1);
  assert.equal(data.collection.receivedCount, 3); assert.equal(data.integrity.sha256.length, 64);
  assert.deepEqual(await validateDeputiesDataset(JSON.parse(JSON.stringify(data))), data);
  const altered = structuredClone(data); altered.deputies[0].nome = "Alterado";
  await assert.rejects(validateDeputiesDataset(altered), /integridade/);
  const truncated = structuredClone(data); truncated.deputies.pop();
  await assert.rejects(validateDeputiesDataset(truncated), /integridade/);
});

test("transient second-page failure recovers without repeating first page", async (t) => {
  let first = 0; let second = 0;
  mockFetch(t, async (url) => {
    if (url === DEPUTIES_QUERY_URL) { first++; return response([deputy(1)], [{ rel: "next", href: next }]); }
    second++; return second === 1 ? response([], [], "2", 503) : response([deputy(2)]);
  });
  assert.equal((await fetchDeputies(undefined, { verifyTotal: true })).deputies.length, 2);
  assert.equal(first, 1); assert.equal(second, 2);
});

test("failed refresh preserves last valid file byte for byte; no cache creates no output", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "chat-politico-data-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const target = join(directory, "deputados.json");
  mockFetch(t, async () => response([deputy(1), deputy(2)]));
  await updateDeputies(target);
  const before = await readFile(target, "utf8");
  let calls = 0;
  globalThis.fetch = async () => { calls++; return response([], [], "2", 504); };
  await assert.rejects(updateDeputies(target), /3 tentativas/);
  assert.equal(calls, 3); assert.equal(await readFile(target, "utf8"), before);
  const missing = join(directory, "missing.json");
  await assert.rejects(updateDeputies(missing), /3 tentativas/);
  await assert.rejects(readFile(missing), { code: "ENOENT" });
  const replacement = { ...JSON.parse(before), fetchedAt: new Date(Date.now() - 60000).toISOString() };
  await updateDeputies(target, async () => replacement);
  assert.notEqual(await readFile(target, "utf8"), before);
  await validateDeputiesDataset(JSON.parse(await readFile(target, "utf8")));
});

for (const [name, records, total, links] of [
  ["partial", [deputy(1)], "2", []],
  ["missing total", [deputy(1)], "", []],
  ["invalid ID", [{ ...deputy(1), id: null }], "1", []],
  ["missing name", [{ ...deputy(1), nome: null }], "1", []],
  ["missing UF", [{ ...deputy(1), siglaUf: null }], "1", []],
  ["missing party", [{ ...deputy(1), siglaPartido: null }], "1", []],
  ["conflicting IDs", [deputy(1), { ...deputy(1), siglaUf: "SP" }], "1", []],
  ["empty", [], "0", []],
  ["cycle", [deputy(1)], "1", [{ rel: "next", href: DEPUTIES_QUERY_URL }]],
]) {
  test(`rejects ${name} without replacing valid bytes`, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "chat-politico-invalid-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const target = join(directory, "deputados.json");
    await writeFile(target, "previous bytes");
    mockFetch(t, async () => response(records, links, total));
    await assert.rejects(updateDeputies(target));
    assert.equal(await readFile(target, "utf8"), "previous bytes");
  });
}

test("refuses changed totals between pages", async (t) => {
  mockFetch(t, async (url) => url === DEPUTIES_QUERY_URL ? response([deputy(1)], [{ rel: "next", href: next }]) : response([deputy(2)], [], "3"));
  await assert.rejects(fetchDeputies(undefined, { verifyTotal: true }), /mudou/);
});

test("follows official next with omitted defaults while preserving explicit query scope", async (t) => {
  const urls = [];
  mockFetch(t, async (url) => {
    urls.push(url);
    return urls.length === 1 ? response([deputy(1)], [{ rel: "next", href: "https://dadosabertos.camara.leg.br/api/v2/deputados?pagina=2&itens=100" }]) : response([deputy(2)]);
  });
  await createDeputiesDataset(await fetchDeputies(undefined, { verifyTotal: true }));
  const followed = new URL(urls[1]);
  assert.equal(followed.searchParams.get("pagina"), "2");
  assert.equal(followed.searchParams.get("ordenarPor"), "nome");
  assert.equal(followed.searchParams.get("ordem"), "ASC");
});

test("rejects corrupted source, totals, receipts, duplicate IDs and unsafe photos", async (t) => {
  mockFetch(t, async () => response([deputy(1), deputy(2)]));
  const valid = await createDeputiesDataset(await fetchDeputies(undefined, { verifyTotal: true }));
  const mutations = [
    (d) => { d.source.endpoint = "https://example.com"; },
    (d) => { d.collection.expectedCount++; },
    (d) => { d.collection.pages[0].count--; },
    (d) => { d.collection.pages[0].url += "&dataInicio=2020-01-01"; },
    (d) => { d.deputies[1].id = 1; },
    (d) => { d.deputies[0].urlFoto = "https://example.com/photo.jpg"; },
    (d) => { d.fetchedAt = "not a date"; },
    (d) => { d.complete = false; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(valid); mutate(changed);
    await assert.rejects(validateDeputiesDataset(changed));
  }
});
