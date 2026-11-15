import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareProposals, referenceDay, writeProposals, collectProposals } from "./update-proposals.mjs";
import { proposalsFixture, proposalFixture } from "../src/test/proposalsFixture.ts";
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "chat-politico-proposals-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const target = join(directory, "proposicoes.json"), data = await proposalsFixture();
  await writeFile(target, JSON.stringify(data));
  return { target, data };
}
test("recorte diário usa a data de Brasília, inclusive próximo à meia-noite UTC", () => {
  assert.equal(referenceDay(new Date("2026-11-15T01:00:00Z")), "2026-11-14");
});
test("falha na coleta mantém último conjunto publicado completo", async t => {
  const { target, data } = await fixture(t);
  const report = await prepareProposals({ target, fetchPublished: async () => Response.json(data), collect: async () => { throw new Error("Falha simulada da fonte"); } });
  assert.equal(report.refreshed, false);
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), data);
});
test("candidato parcial e anterior nunca substituem publicação válida", async t => {
  const { target, data } = await fixture(t);
  for (const candidate of [{ ...data, records: [] }, await proposalsFixture(undefined, "2026-11-13T12:00:00Z")]) {
    const result = await prepareProposals({ target, fetchPublished: async () => Response.json(data), collect: async () => candidate });
    assert.equal(result.refreshed, false);
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), data);
  }
});
test("nova coleta completa substitui a publicação", async t => {
  const { target, data } = await fixture(t), updated = await proposalsFixture([proposalFixture()], "2026-11-14T15:00:00Z");
  const result = await prepareProposals({ target, fetchPublished: async () => Response.json(data), collect: async () => updated });
  assert.equal(result.refreshed, true);
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), updated);
});
test("inicializa novo módulo somente em 404, sem ocultar falhas de rede ou publicação corrompida", async t => {
  const { target, data } = await fixture(t), collect = async () => { throw new Error("Offline simulado"); };
  const report = await prepareProposals({ target, eventName: "workflow_dispatch", bootstrap: true, fetchPublished: async () => new Response("", { status: 404 }), collect });
  assert.equal(report.refreshed, false);
  for (const fetchPublished of [async () => { throw new Error("Network"); }, async () => Response.json({}), async () => new Response("", { status: 503 })]) await assert.rejects(prepareProposals({ target, fetchPublished, collect }));
  for (const [eventName, bootstrap] of [["schedule", true], ["push", true], ["push", false], ["workflow_dispatch", false]]) await assert.rejects(prepareProposals({ target, eventName, bootstrap, fetchPublished: async () => new Response("", { status: 404 }), collect }));
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), data);
});
test("escrita inválida preserva bytes anteriores e não cria arquivo parcial", async t => {
  const { target } = await fixture(t), before = await readFile(target, "utf8");
  await assert.rejects(writeProposals(target, { complete: false }));
  assert.equal(await readFile(target, "utf8"), before);
});
test("coletor recusa duplicatas que não correspondem ao total único oficial", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/autores")) return Response.json({ dados: [], links: [] });
    if (parsed.pathname.endsWith("/tramitacoes")) return Response.json({ dados: [], links: [] });
    if (/\/101$/.test(parsed.pathname)) return Response.json({ dados: proposalFixture() });
    return Response.json({ dados: [proposalFixture(), proposalFixture()], links: [] }, { headers: { "X-Total-Count": "2" } });
  };
  await assert.rejects(collectProposals("2026-11-14"), /Total único/);
});
test("coletor completo inclui os detalhes e rejeita recorte excessivo antes de coletá-los", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let total = 1, calls = 0;
  globalThis.fetch = async url => {
    calls++;
    const path = new URL(url).pathname;
    if (path.endsWith("/autores")) return Response.json({ dados: [{ nome: "Autor de teste" }], links: [] });
    if (path.endsWith("/tramitacoes")) return Response.json({ dados: [], links: [] });
    if (path.endsWith("/101")) return Response.json({ dados: proposalFixture() });
    return Response.json({ dados: [proposalFixture()], links: [] }, { headers: { "X-Total-Count": String(total) } });
  };
  const data = await collectProposals("2026-11-14");
  assert.equal(data.records[0].autores[0], "Autor de teste");
  assert.equal(calls, 4);
  total = 251; calls = 0;
  await assert.rejects(collectProposals("2026-11-14"), /limite seguro/);
  assert.equal(calls, 1);
});
