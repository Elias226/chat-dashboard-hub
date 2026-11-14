import { CAMARA_DOCUMENTATION, DEPUTIES_ENDPOINT, DEPUTIES_QUERY_URL, normalizeRecord, type DeputiesSnapshot } from "./camaraDeputies.ts";

export interface PublishedDeputies extends DeputiesSnapshot {
  schemaVersion: 1;
  source: { name: string; endpoint: string; documentation: string; reference: string };
  collection: NonNullable<DeputiesSnapshot["collection"]>;
  integrity: { recordCount: number; sha256: string };
}

function canonicalRecords(snapshot: DeputiesSnapshot): string {
  return JSON.stringify([...snapshot.deputies].sort((a, b) => a.id - b.id).map((d) => ({
    id: d.id, nome: d.nome, siglaPartido: d.siglaPartido, siglaUf: d.siglaUf, urlFoto: d.urlFoto,
  })));
}

async function digest(snapshot: DeputiesSnapshot): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalRecords(snapshot));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Shared by the collector, integrity check and browser; no presumed seat count. */
export async function validateDeputiesDataset(value: unknown): Promise<PublishedDeputies> {
  const fail = () => { throw new Error("O arquivo de deputados está incompleto ou falhou na verificação de integridade."); };
  if (!value || typeof value !== "object") return fail();
  const data = value as PublishedDeputies;
  if (data.schemaVersion !== 1 || data.complete !== true || data.invalidRecords !== 0 ||
    !Array.isArray(data.deputies) || !data.deputies.length || !Number.isSafeInteger(data.duplicates) || data.duplicates < 0 ||
    typeof data.fetchedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(data.fetchedAt) || !Number.isFinite(Date.parse(data.fetchedAt)) ||
    Date.parse(data.fetchedAt) > Date.now() + 5 * 60 * 1000 ||
    data.source?.endpoint !== DEPUTIES_QUERY_URL || data.source?.documentation !== CAMARA_DOCUMENTATION ||
    data.source?.name !== "Câmara dos Deputados — Dados Abertos" || data.source?.reference !== "Deputados em exercício no momento da consulta, sem filtros temporais.") return fail();
  const ids = new Set<number>();
  for (const deputy of data.deputies) {
    const normalized = normalizeRecord(deputy);
    if (!normalized || !normalized.nome || !normalized.siglaUf || !normalized.siglaPartido || ids.has(normalized.id) ||
      ["nome", "siglaUf", "siglaPartido", "urlFoto"].some((field) => normalized[field] !== deputy[field])) return fail();
    ids.add(normalized.id);
  }
  const collection = data.collection;
  if (!collection || !Array.isArray(collection.pages) || !collection.pages.length || collection.pages.length > 100 ||
    data.pages !== collection.pages.length || collection.expectedCount !== ids.size || data.integrity?.recordCount !== ids.size ||
    collection.receivedCount !== ids.size + data.duplicates) return fail();
  let received = 0;
  for (const [index, page] of collection.pages.entries()) {
    if (!Number.isSafeInteger(page.count) || page.count <= 0 || page.count > 100 || page.total !== collection.expectedCount) return fail();
    try {
      const url = new URL(page.url);
      const expected = new URL(DEPUTIES_QUERY_URL);
      expected.searchParams.set("pagina", String(index + 1));
      url.searchParams.sort(); expected.searchParams.sort();
      if (url.href !== expected.href || url.origin + url.pathname !== DEPUTIES_ENDPOINT) return fail();
    } catch { return fail(); }
    received += page.count;
  }
  if (received !== collection.receivedCount || !/^[a-f0-9]{64}$/.test(data.integrity.sha256) || await digest(data) !== data.integrity.sha256) return fail();
  return data;
}

export async function createDeputiesDataset(snapshot: DeputiesSnapshot): Promise<PublishedDeputies> {
  const data = {
    ...snapshot,
    deputies: [...snapshot.deputies].sort((a, b) => a.id - b.id),
    schemaVersion: 1 as const,
    source: {
      name: "Câmara dos Deputados — Dados Abertos",
      endpoint: DEPUTIES_QUERY_URL,
      documentation: CAMARA_DOCUMENTATION,
      reference: "Deputados em exercício no momento da consulta, sem filtros temporais.",
    },
    collection: snapshot.collection!,
    integrity: { recordCount: snapshot.deputies.length, sha256: await digest(snapshot) },
  };
  return validateDeputiesDataset(data);
}
