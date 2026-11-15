import { normalizeProposal, positive, recentProposalUrl, type PageReceipt, type ProposalDetail } from "./camaraProposals.ts";
export interface ProposalsDataset {
  schemaVersion: 1; complete: true; fetchedAt: string;
  coverage: { start: string; end: string; types: ["PL", "PEC", "PLP"] };
  source: string; collection: { expectedCount: number; pages: PageReceipt[] };
  records: ProposalDetail[]; integrity: { recordCount: number; sha256: string };
}
async function digest(data: Omit<ProposalsDataset, "integrity">) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("");
}
export async function validateProposalsDataset(value: unknown): Promise<ProposalsDataset> {
  const fail = () => { throw new Error("A publicação de proposições está incompleta ou inválida."); };
  if (!value || typeof value !== "object") return fail();
  const data = value as ProposalsDataset;
  const { integrity, ...payload } = data;
  if (data.schemaVersion !== 1 || data.complete !== true || typeof data.fetchedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(data.fetchedAt) || !Number.isFinite(Date.parse(data.fetchedAt)) || Date.parse(data.fetchedAt) > Date.now() + 300000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.coverage?.start) || !/^\d{4}-\d{2}-\d{2}$/.test(data.coverage?.end) ||
    Date.parse(data.coverage.end) - Date.parse(data.coverage.start) !== 6 * 86400000 || JSON.stringify(data.coverage.types) !== '["PL","PEC","PLP"]' ||
    data.source !== recentProposalUrl(data.coverage.start, data.coverage.end) || !Array.isArray(data.records) || data.records.length > 250 ||
    data.collection?.expectedCount !== data.records.length || integrity?.recordCount !== data.records.length || !/^[a-f0-9]{64}$/.test(integrity?.sha256)) return fail();
  const ids = new Set<number>();
  const nullable = (value: unknown) => value === null || typeof value === "string";
  for (const row of data.records) {
    const record = normalizeProposal(row);
    if (ids.has(row.id) || !record.dataApresentacao || record.dataApresentacao.slice(0, 10) < data.coverage.start || record.dataApresentacao.slice(0, 10) > data.coverage.end ||
      !nullable(row.keywords) || !nullable(row.ementaDetalhada) || !nullable(row.situacao) || !Array.isArray(row.autores) || !row.autores.every(name => typeof name === "string" && name.trim()) ||
      (row.ultimaMovimentacao !== null && (typeof row.ultimaMovimentacao !== "object" || !row.ultimaMovimentacao)) || !Array.isArray(row.tramitacoes) || row.tramitacoes.length > 10000) return fail();
    for (const item of [...row.tramitacoes, ...(row.ultimaMovimentacao ? [row.ultimaMovimentacao] : [])]) {
      if (!item || ![item.dataHora, item.orgao, item.descricao, item.situacao, item.despacho].every(nullable) || (item.dataHora && !Number.isFinite(Date.parse(item.dataHora))) || (item.sequencia !== null && !positive(item.sequencia))) return fail();
    }
    ids.add(row.id);
  }
  if (!Array.isArray(data.collection.pages) || !data.collection.pages.length || data.collection.pages.length > 100) return fail();
  let received = 0;
  for (const [index, page] of data.collection.pages.entries()) {
    const actual = new URL(page.url), expected = new URL(data.source);
    expected.searchParams.set("pagina", String(index + 1)); actual.searchParams.set("pagina", actual.searchParams.get("pagina") || "1");
    actual.searchParams.sort(); expected.searchParams.sort();
    if (actual.href !== expected.href || page.total !== data.collection.expectedCount || !Number.isSafeInteger(page.count) || page.count < 0 || page.count > 100) return fail();
    received += page.count;
  }
  if (received !== ids.size || await digest(payload) !== integrity.sha256) return fail();
  return data;
}
export async function createProposalsDataset(data: Omit<ProposalsDataset, "integrity">): Promise<ProposalsDataset> {
  const payload = { ...data, records: [...data.records].sort((a, b) => a.id - b.id) };
  return validateProposalsDataset({ ...payload, integrity: { recordCount: data.records.length, sha256: await digest(payload) } });
}
