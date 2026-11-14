import { afterEach, expect, it, vi } from "vitest";
import { CHAT_TIMEOUT_MS, sendChatMessage } from "./chatApi";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it("preserva o contrato do chat e retém somente URLs oficiais seguras nas respostas novas", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: "Resposta de teste", intent: "test", mode: "template", sources: [
    { title: "Câmara", url: "https://dadosabertos.camara.leg.br/api/v2/deputados/62881" },
    { title: "Inválida", url: "data:text/html,test" }, { title: "Não oficial", url: "https://example.com/" }, null,
  ] }) });
  vi.stubGlobal("fetch", fetchMock);
  expect(await sendChatMessage("Pergunta de teste")).toEqual({ reply: "Resposta de teste", intent: "test", mode: "template", sources: [{ title: "Câmara dos Deputados - perfil parlamentar", url: "https://www.camara.leg.br/deputados/62881" }] });
  expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ message: "Pergunta de teste" }));
});

it.each(["ai", "template"])("preserva texto e modo %s sem reescrever a pergunta", async (mode) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: "Resposta", mode, intent: "ExplicarComparacao" }) });
  vi.stubGlobal("fetch", fetchMock);
  expect(await sendChatMessage("Pergunta aberta, sem regras locais")).toMatchObject({ reply: "Resposta", mode, intent: "ExplicarComparacao" });
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ message: "Pergunta aberta, sem regras locais" }));
});

it("aceita fulfillmentText e não inventa um modo quando ausente ou desconhecido", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ fulfillmentText: "Resposta legada", mode: "unknown", intent: 1 }) }));
  expect(await sendChatMessage("Pergunta")).toEqual({ reply: "Resposta legada", sources: [], mode: undefined, intent: undefined });
});

it.each([null, {}, { reply: 123 }, { reply: "  " }])("recusa resposta sem texto válido: %j", async (body) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => body }));
  await expect(sendChatMessage("Pergunta")).rejects.toMatchObject({ kind: "invalid" });
});

it("trata JSON inválido sem mostrar conteúdo bruto do servidor", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error("HTML interno"); } }));
  await expect(sendChatMessage("Pergunta")).rejects.toMatchObject({ kind: "invalid" });
});

it.each([429, 500, 502, 503, 504])("trata HTTP %s sem repetir um POST ou expor erros do provedor", async (status) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({ error: "detalhes privados" }) });
  vi.stubGlobal("fetch", fetchMock);
  await expect(sendChatMessage("Pergunta")).rejects.toMatchObject({ kind: "unavailable" });
  expect(fetchMock).toHaveBeenCalledOnce();
});

it("trata falha de rede sem repetir a geração", async () => {
  const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  vi.stubGlobal("fetch", fetchMock);
  await expect(sendChatMessage("Pergunta")).rejects.toMatchObject({ kind: "network" });
  expect(fetchMock).toHaveBeenCalledOnce();
});

it.each(["fetch", "body"])("encerra em 90 segundos mesmo com %s pendente e cancela a conexão", async (stage) => {
  vi.useFakeTimers();
  const never = new Promise<never>(() => {});
  const fetchMock = vi.fn().mockImplementation(() => stage === "fetch" ? never : Promise.resolve({ ok: true, json: () => never }));
  vi.stubGlobal("fetch", fetchMock);
  const pending = sendChatMessage("Pergunta");
  const failure = expect(pending).rejects.toMatchObject({ kind: "timeout" });
  await vi.advanceTimersByTimeAsync(CHAT_TIMEOUT_MS);
  await failure;
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it("limpa o temporizador após sucesso", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: "Resposta" }) }));
  await sendChatMessage("Pergunta");
  expect(vi.getTimerCount()).toBe(0);
});
