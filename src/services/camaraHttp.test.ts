import { afterEach, describe, expect, it, vi } from "vitest";
import { CamaraRequestError, fetchCamaraJson, retryAfterDelay, withCamaraBudget } from "./camaraHttp";

const url = "https://dadosabertos.camara.leg.br/api/v2/deputados/1";
const response = (status: number, retryAfter: string | null = null) => ({ ok: status === 200, status, headers: { get: () => retryAfter }, json: async () => ({ dados: { id: 1 } }) });
const request = (limit = 70000, signal?: AbortSignal) => withCamaraBudget(url, limit, signal, (budget) => fetchCamaraJson(url, budget));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("recuperação limitada de requisições da Câmara", () => {
  it.each([408, 429, 502, 503, 504])("recupera HTTP %i repetindo apenas a URL que falhou", async (status) => {
    vi.useFakeTimers();
    const mock = vi.fn().mockResolvedValueOnce(response(status)).mockResolvedValue(response(200));
    vi.stubGlobal("fetch", mock);
    const result = request();
    await vi.advanceTimersByTimeAsync(999);
    expect(mock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toEqual({ dados: { id: 1 } });
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock.mock.calls.every(([requested]) => requested === url)).toBe(true);
  });
  it("recupera falha de rede usando intervalos progressivos de 1 e 2 segundos", async () => {
    vi.useFakeTimers();
    const mock = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(response(502)).mockResolvedValue(response(200));
    vi.stubGlobal("fetch", mock);
    const result = request();
    await vi.advanceTimersByTimeAsync(1000);
    expect(mock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1999);
    expect(mock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toHaveProperty("dados.id", 1);
    expect(mock).toHaveBeenCalledTimes(3);
  });
  it("respeita Retry-After em segundos e não espera esse cabeçalho em uma resposta bem-sucedida", async () => {
    vi.useFakeTimers();
    const mock = vi.fn().mockResolvedValueOnce(response(429, "4")).mockResolvedValue(response(200, "30"));
    vi.stubGlobal("fetch", mock);
    const result = request();
    await vi.advanceTimersByTimeAsync(3999);
    expect(mock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(mock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("interpreta Retry-After como data HTTP e rejeita espera que ultrapassaria o orçamento", async () => {
    const now = Date.UTC(2026, 10, 4, 12);
    expect(retryAfterDelay(new Date(now + 5000).toUTCString(), now)).toBe(5000);
    expect(retryAfterDelay("inválido", now)).toBe(0);
    const mock = vi.fn().mockResolvedValue(response(503, "120"));
    vi.stubGlobal("fetch", mock);
    await expect(request()).rejects.toThrow("solicitou aguardar");
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it("esgota três tentativas, preservando URL e status para diagnóstico", async () => {
    vi.useFakeTimers();
    const mock = vi.fn().mockResolvedValue(response(504));
    vi.stubGlobal("fetch", mock);
    const result = request();
    const check = expect(result).rejects.toMatchObject({ name: "CamaraRequestError", url, status: 504, kind: "http", message: expect.stringContaining("3 tentativas") });
    await vi.advanceTimersByTimeAsync(3000);
    await check;
    expect(mock).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("não repete HTTP 404 nem JSON inválido", async () => {
    const mock = vi.fn().mockResolvedValueOnce(response(404)).mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError("JSON inválido"); } });
    vi.stubGlobal("fetch", mock);
    await expect(request()).rejects.toMatchObject({ status: 404 });
    await expect(request()).rejects.toThrow("não pôde ser lida");
    expect(mock).toHaveBeenCalledTimes(2);
  });
  it("encerra em 63 segundos mesmo se o transporte ignorar o cancelamento", async () => {
    vi.useFakeTimers();
    const mock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", mock);
    const check = expect(request()).rejects.toMatchObject({ kind: "timeout" });
    await vi.advanceTimersByTimeAsync(63000);
    await check;
    expect(mock).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("aplica limite total mesmo a uma operação que nunca termina", async () => {
    vi.useFakeTimers();
    const result = withCamaraBudget(url, 2500, undefined, () => new Promise(() => {}));
    const check = expect(result).rejects.toBeInstanceOf(CamaraRequestError);
    await vi.advanceTimersByTimeAsync(2500);
    await check;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancelamento de navegação interrompe o intervalo e não inicia outra tentativa", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const mock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", mock);
    const result = request(70000, controller.signal);
    const check = expect(result).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(1);
    controller.abort();
    await check;
    await vi.advanceTimersByTimeAsync(3000);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
