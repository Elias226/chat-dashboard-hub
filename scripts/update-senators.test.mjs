import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { senateFixture, senateRawFixture } from "../src/test/senateFixture.ts";
import { createSenateDataset } from "../src/services/senate.ts";
import { prepareSenators, writeSenators } from "./update-senators.mjs";
async function fixture(t) { const directory = await mkdtemp(join(tmpdir(), "senators-test-")); t.after(() => rm(directory, { recursive: true, force: true })); const target = join(directory, "senadores.json"), data = await senateFixture(); await writeFile(target, JSON.stringify(data)); return { target, data }; }
test("indisponibilidade do Senado preserva último JSON completo publicado", async t => {
  const { target, data } = await fixture(t);
  const result = await prepareSenators({ target, fetchPublished: async () => Response.json(data), collect: async () => { throw new Error("Falha simulada"); } });
  assert.equal(result.refreshed, false); assert.deepEqual(JSON.parse(await readFile(target, "utf8")), data);
});
test("conjunto parcial, anterior e conflitante nunca substituem conjunto válido", async t => {
  const { target, data } = await fixture(t);
  const conflicting = senateRawFixture(); conflicting.ListaParlamentarEmExercicio.Parlamentares.Parlamentar[0].IdentificacaoParlamentar.NomeParlamentar = "Outro nome de teste";
  for (const candidate of [{ ...data, senators: data.senators.slice(1) }, await senateFixture("2026-11-13T12:00:00.000Z"), await createSenateDataset(conflicting, data.fetchedAt)]) {
    const result = await prepareSenators({ target, fetchPublished: async () => Response.json(data), collect: async () => candidate });
    assert.equal(result.refreshed, false); assert.deepEqual(JSON.parse(await readFile(target, "utf8")), data);
  }
});
test("coleta completa validada substitui versão anterior", async t => {
  const { target, data } = await fixture(t), updated = await senateFixture("2026-11-14T15:00:00.000Z");
  assert.equal((await prepareSenators({ target, fetchPublished: async () => Response.json(data), collect: async () => updated })).refreshed, true);
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), updated);
});
test("bootstrap exige 404, dispatch e autorização explícita; rede e corrupção interrompem", async t => {
  const { target, data } = await fixture(t), collect = async () => data, missing = async () => new Response("", { status: 404 });
  await assert.rejects(prepareSenators({ target, fetchPublished: missing, collect }));
  await assert.rejects(prepareSenators({ target, eventName: "schedule", bootstrap: true, fetchPublished: missing, collect }));
  assert.equal((await prepareSenators({ target, eventName: "workflow_dispatch", bootstrap: true, fetchPublished: missing, collect })).refreshed, true);
  for (const fetchPublished of [async () => { throw new Error("Offline"); }, async () => Response.json({}), async () => new Response("", { status: 503 })]) await assert.rejects(prepareSenators({ target, eventName: "workflow_dispatch", bootstrap: true, fetchPublished, collect }));
});
test("validação inválida não altera bytes do arquivo anterior", async t => {
  const { target } = await fixture(t), before = await readFile(target, "utf8");
  await assert.rejects(writeSenators(target, { complete: false })); assert.equal(await readFile(target, "utf8"), before);
});
