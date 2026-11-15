import { afterEach, describe, expect, it, vi } from "vitest";
import { filterProposals, searchOfficialProposal, fetchProposalDetail, proposalPages, recentProposalUrl, normalizeProposal } from "./camaraProposals";
import { withCamaraBudget } from "./camaraHttp";
import { createProposalsDataset, validateProposalsDataset } from "./proposalsDataset";
import { proposalFixture, proposalsFixture } from "../test/proposalsFixture";

afterEach(() => vi.unstubAllGlobals());
const page = (dados: unknown[], next?: string, total?: number) => Response.json({ dados, links: next ? [{ rel: "next", href: next }] : [] }, { headers: total === undefined ? {} : { "X-Total-Count": String(total) } });
describe("proposições oficiais", () => {
  it("combina tipo, número, ano e assunto sem diferenciar acentos/caixa", () => {
    const records = [proposalFixture(), proposalFixture(102), proposalFixture(103)];
    expect(filterProposals(records, "PL", "1", "2026", "EDUCACAO inclusão").map(row => row.id)).toEqual([101]);
    expect(filterProposals(records, "PEC", "", "", "").map(row => row.id)).toEqual([102]);
    expect(filterProposals(records, "", "", "2020", "")).toEqual([]);
  });
  it("busca exata inclui ano e não usa o recorte padrão de 30 dias", async () => {
    const fetcher = vi.fn(async (_url: string) => page([{ ...proposalFixture(), ano: 2020 }], undefined, 1));
    vi.stubGlobal("fetch", fetcher);
    const result = await searchOfficialProposal("PL", "1", "2020");
    expect(result.records[0].ano).toBe(2020);
    expect(fetcher.mock.calls[0][0]).toContain("siglaTipo=PL&numero=1&ano=2020");
  });
  it("recusa filtros inválidos antes de acessar a rede", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    for (const args of [["PL", "0", "2020"], ["PL", "1", "20"], ["REQ", "1", "2020"]]) await expect(searchOfficialProposal(args[0] as "PL", args[1], args[2])).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("segue next preservando filtros e detecta truncamento", async () => {
    const initial = recentProposalUrl("2026-11-08", "2026-11-14");
    const fetcher = vi.fn().mockResolvedValueOnce(page([proposalFixture()], "https://dadosabertos.camara.leg.br/api/v2/proposicoes?pagina=2", 2)).mockResolvedValueOnce(page([proposalFixture(102)], undefined, 2));
    vi.stubGlobal("fetch", fetcher);
    const result = await withCamaraBudget(initial, 2000, undefined, budget => proposalPages(initial, budget, true));
    expect(result.rows).toHaveLength(2);
    expect(fetcher.mock.calls[1][0]).toContain("dataApresentacaoInicio=2026-11-08");
    vi.stubGlobal("fetch", vi.fn(async () => page([proposalFixture()], undefined, 2)));
    await expect(withCamaraBudget(initial, 2000, undefined, budget => proposalPages(initial, budget, true))).rejects.toThrow(/incompleta/);
  });
  it.each(["https://evil.example/?pagina=2", "https://dadosabertos.camara.leg.br/api/v2/proposicoes?pagina=1", "https://dadosabertos.camara.leg.br/api/v2/proposicoes?pagina=2&siglaTipo=REQ"])("rejeita next inseguro ou que altera escopo: %s", async next => {
    const initial = recentProposalUrl("2026-11-08", "2026-11-14");
    vi.stubGlobal("fetch", vi.fn(async () => page([proposalFixture()], next, 2)));
    await expect(withCamaraBudget(initial, 1000, undefined, budget => proposalPages(initial, budget, true))).rejects.toThrow();
  });
  it("carrega detalhe, autores e histórico completos; mantém campos ausentes nulos", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith("/autores")) return page([{ nome: "Autor de teste" }]);
      if (url.endsWith("/tramitacoes")) return page([{ dataHora: "2026-11-10T11:00", descricaoTramitacao: "Registro de teste" }]);
      return Response.json({ dados: proposalFixture() });
    });
    vi.stubGlobal("fetch", fetcher);
    const detail = await fetchProposalDetail(101);
    expect(detail.autores).toEqual(["Autor de teste"]);
    expect(detail.situacao).toBeNull();
    expect(detail.tramitacoes[0].descricao).toBe("Registro de teste");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("uma falha de fonte não é resultado vazio e identificadores incorretos são recusados", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    await expect(searchOfficialProposal("PL", "1", "2020")).rejects.toThrow(/404/);
    await expect(fetchProposalDetail(101)).rejects.toThrow(/404/);
    expect(() => normalizeProposal({ id: 1 })).toThrow();
  });
  it("ausência real de resultados é uma lista vazia validada", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => page([], undefined, 0)));
    expect((await searchOfficialProposal("PLP", "1", "2020")).records).toEqual([]);
  });
  it("valida hash, completude, duplicatas e período; permite recorte oficial vazio", async () => {
    const data = await proposalsFixture();
    await expect(validateProposalsDataset(data)).resolves.toEqual(data);
    await expect(proposalsFixture([])).resolves.toMatchObject({ records: [] });
    for (const mutate of [
      (copy: typeof data) => { copy.records[0].ementa = "Adulterado"; },
      (copy: typeof data) => { copy.records.pop(); },
      (copy: typeof data) => { copy.records[1].id = copy.records[0].id; },
      (copy: typeof data) => { copy.records[0].dataApresentacao = "2020-01-01T10:00"; },
      (copy: typeof data) => { copy.collection.pages[0].url = "https://evil.example/"; },
    ]) { const copy = structuredClone(data); mutate(copy); await expect(validateProposalsDataset(copy)).rejects.toThrow(); }
    const { integrity: ignored, ...payload } = data;
    await expect(createProposalsDataset({ ...payload, records: [proposalFixture(), proposalFixture()] })).rejects.toThrow();
  });
});
