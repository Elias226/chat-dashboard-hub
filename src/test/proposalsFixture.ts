import { createProposalsDataset } from "../services/proposalsDataset.ts";
import { recentProposalUrl, type ProposalDetail } from "../services/camaraProposals.ts";

/** Synthetic records only for automated tests, never production. */
export function proposalFixture(id = 101): ProposalDetail {
  return { id, siglaTipo: id === 102 ? "PEC" : id === 103 ? "PLP" : "PL", numero: id - 100, ano: 2026, ementa: id === 102 ? "Ementa sintética sobre saúde." : "Ementa sintética sobre educação e inclusão.", dataApresentacao: "2026-11-10T10:00", keywords: "Educação", ementaDetalhada: null, situacao: "Situação simulada de teste", ultimaMovimentacao: { dataHora: "2026-11-11T10:00", sequencia: 1, orgao: "MESA", descricao: "Movimentação simulada", situacao: null, despacho: "Despacho exclusivo de teste" }, autores: ["Autoria simulada"], tramitacoes: [{ dataHora: "2026-11-11T10:00", sequencia: 1, orgao: "MESA", descricao: "Movimentação simulada", situacao: null, despacho: "Despacho exclusivo de teste" }] };
}
export function proposalsFixture(records = [proposalFixture(), proposalFixture(102), proposalFixture(103)], fetchedAt = "2026-11-14T12:00:00.000Z") {
  const source = recentProposalUrl("2026-11-08", "2026-11-14");
  return createProposalsDataset({ schemaVersion: 1, complete: true, fetchedAt, coverage: { start: "2026-11-08", end: "2026-11-14", types: ["PL", "PEC", "PLP"] }, source, collection: { expectedCount: records.length, pages: [{ url: source, count: records.length, total: records.length }] }, records });
}
