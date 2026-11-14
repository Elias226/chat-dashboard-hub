import { afterEach, describe, expect, it, vi } from "vitest";
import { DEPUTIES_ENDPOINT, fetchDeputies, fetchDeputyDetails, groupDeputies, deputyProfileUrl } from "./camaraDeputies";

// Dados sintéticos exclusivos destes testes.
const deputy = (id: number, siglaUf: string | null, siglaPartido: string | null) => ({ id, siglaUf, siglaPartido, nome: null, urlFoto: null });
const response = (dados: unknown[], links: unknown[] = []) => ({ ok: true, json: async () => ({ dados, links }) });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("agrupamento dos registros da Câmara", () => {
  const records = [deputy(1, "SP", "ALFA"), deputy(2, "CE", "BETA"), deputy(3, "SP", "BETA"), deputy(4, null, null)];
  it("agrupa por UF em ordem alfabética e mantém campos ausentes identificados", () => {
    expect(groupDeputies(records, "siglaUf")).toEqual([{ category: "CE", count: 1 }, { category: "SP", count: 2 }, { category: "Não informado", count: 1 }]);
  });
  it("ordena partidos por quantidade e desempata alfabeticamente", () => {
    expect(groupDeputies(records, "siglaPartido")).toEqual([{ category: "BETA", count: 2 }, { category: "ALFA", count: 1 }, { category: "Não informado", count: 1 }]);
    expect(groupDeputies(records.slice(0, 2), "siglaPartido").map((group) => group.category)).toEqual(["ALFA", "BETA"]);
  });
  it("não inventa categorias ou valores quando não há registros", () => {
    expect(groupDeputies([], "siglaUf")).toEqual([]);
  });
});

describe("consulta paginada da Câmara", () => {
  it("preserva nome e fotografia oficial sem alterar os agrupamentos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([{ id: 1, nome: " Pessoa de teste ", siglaUf: "SP", siglaPartido: "ALFA", urlFoto: "https://www.camara.leg.br/internet/deputado/bandep/1.jpg" }])));
    const result = await fetchDeputies();
    expect(result.deputies[0]).toEqual({ id: 1, nome: "Pessoa de teste", siglaUf: "SP", siglaPartido: "ALFA", urlFoto: "https://www.camara.leg.br/internet/deputado/bandep/1.jpg" });
    expect(groupDeputies(result.deputies, "siglaUf")).toEqual([{ category: "SP", count: 1 }]);
  });
  it("segue next até o fim, mesmo em páginas curtas e sem usar last como próxima página", async () => {
    const next = `${DEPUTIES_ENDPOINT}?pagina=2&itens=100`;
    const last = `${DEPUTIES_ENDPOINT}?pagina=3&itens=100`;
    const mock = vi.fn().mockResolvedValueOnce(response([deputy(1, "SP", "ALFA")], [{ rel: "last", href: last }, { rel: "next", href: next }]))
      .mockResolvedValueOnce(response([deputy(2, "CE", "BETA")], [{ rel: "next", href: last }]))
      .mockResolvedValueOnce(response([deputy(3, "DF", "ALFA")]));
    vi.stubGlobal("fetch", mock);
    const result = await fetchDeputies();
    expect(result.deputies).toHaveLength(3);
    expect(result.pages).toBe(3);
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[1][0]).toBe(next);
    expect(new URL(mock.mock.calls[1][0]).searchParams.get("pagina")).toBe("2");
    expect(mock.mock.calls[0][0]).not.toMatch(/idLegislatura|dataInicio|dataFim/);
    expect(Number.isNaN(Date.parse(result.fetchedAt))).toBe(false);
  });
  it("remove IDs duplicados, exclui IDs inválidos e normaliza campos ausentes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([
      deputy(1, " sp ", " alfa "), deputy(1, "CE", "BETA"), null, { id: -1 }, { id: "2" },
      { id: 2, siglaUf: "XX", siglaPartido: " " }, { id: 3, siglaUf: null, siglaPartido: 42 },
    ])));
    const result = await fetchDeputies();
    expect(result.duplicates).toBe(1);
    expect(result.invalidRecords).toBe(3);
    expect(result.deputies).toEqual([deputy(1, "SP", "ALFA"), deputy(2, null, null), deputy(3, null, null)]);
    expect(groupDeputies(result.deputies, "siglaUf").reduce((sum, group) => sum + group.count, 0)).toBe(3);
  });
  it("rejeita falha em uma página posterior sem entregar totais parciais", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response([deputy(1, "SP", "ALFA")], [{ rel: "next", href: `${DEPUTIES_ENDPOINT}?pagina=2` }]))
      .mockResolvedValue({ ok: false, status: 503 }));
    const check = expect(fetchDeputies()).rejects.toThrow("HTTP 503");
    await vi.advanceTimersByTimeAsync(3000);
    await check;
  });
  it("rejeita formatos inesperados em vez de interpretar falha como lista vazia", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ dados: [] }) }));
    await expect(fetchDeputies()).rejects.toThrow("Formato de resposta");
  });
  it("aceita ausência de dados apenas quando a resposta é válida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([])));
    expect((await fetchDeputies()).deputies).toEqual([]);
  });
  it("rejeita uma resposta em que todos os IDs são inválidos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([{ id: null }])));
    await expect(fetchDeputies()).rejects.toThrow("identificadores válidos");
  });
  it("interrompe ciclos de paginação mesmo com parâmetros reordenados", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([], [{ rel: "next", href: `${DEPUTIES_ENDPOINT}?pagina=1&ordenarPor=nome&ordem=ASC&itens=100` }])));
    await expect(fetchDeputies()).rejects.toThrow("concluir a paginação");
  });
  it("rejeita links externos, HTTP ou links next inválidos", async () => {
    for (const href of ["https://example.com/api/v2/deputados", "http://dadosabertos.camara.leg.br/api/v2/deputados", ""]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([], [{ rel: "next", href }])));
      await expect(fetchDeputies()).rejects.toThrow();
    }
  });
  it("encerra uma requisição que excede o tempo de espera", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))));
    const check = expect(fetchDeputies()).rejects.toThrow("tempo de espera");
    await vi.advanceTimersByTimeAsync(63000);
    await check;
  });
});

describe("detalhes institucionais", () => {
  it("normaliza o último status retornado e mantém apenas os campos necessários", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ dados: { id: 1, cpf: "campo não utilizado", ultimoStatus: { nome: "Deputada de teste", siglaUf: "CE", siglaPartido: "ALFA", situacao: "Exercício", condicaoEleitoral: "Titular", idLegislatura: 57, data: "2026-01-01T10:00", email: "institucional@camara.leg.br", gabinete: { nome: "101", predio: "IV", sala: "101", telefone: "00000000" } } } }) }));
    const result = await fetchDeputyDetails(1);
    expect(result).toMatchObject({ id: 1, nome: "Deputada de teste", siglaUf: "CE", siglaPartido: "ALFA", situacao: "Exercício", idLegislatura: 57, gabinete: { nome: "101", andar: null } });
    expect(result).not.toHaveProperty("cpf");
    expect(deputyProfileUrl(result.id)).toBe("https://www.camara.leg.br/deputados/1");
  });
  it("não inventa dados quando o último status não está preenchido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ dados: { id: 1, ultimoStatus: null } }) }));
    expect(await fetchDeputyDetails(1)).toMatchObject({ nome: null, urlFoto: null, siglaUf: null, situacao: null, gabinete: { telefone: null } });
  });
  it("rejeita identificadores inválidos, respostas de outro parlamentar e HTTP 404", async () => {
    const mock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ dados: { id: 2 } }) }).mockResolvedValueOnce({ ok: false, status: 404 });
    vi.stubGlobal("fetch", mock);
    await expect(fetchDeputyDetails(-1)).rejects.toThrow("inválido");
    expect(mock).not.toHaveBeenCalled();
    await expect(fetchDeputyDetails(1)).rejects.toThrow("solicitado");
    await expect(fetchDeputyDetails(1)).rejects.toThrow("HTTP 404");
  });
  it("não usa URLs de fotografia externas ou protocolos inseguros", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([{ id: 1, urlFoto: "https://example.com/foto.jpg" }, { id: 2, urlFoto: "javascript:alert(1)" }])));
    expect((await fetchDeputies()).deputies.every((record) => record.urlFoto === null)).toBe(true);
  });
});
