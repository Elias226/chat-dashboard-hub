import { afterEach, expect, it, vi } from "vitest";
import { sendChatMessage } from "./chatApi";

afterEach(() => vi.unstubAllGlobals());
it("preserva o contrato do chat e retém somente URLs oficiais seguras nas respostas novas", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: "Resposta de teste", intent: "test", mode: "template", sources: [
    { title: "Câmara", url: "https://dadosabertos.camara.leg.br/api/v2/deputados/62881" },
    { title: "Inválida", url: "data:text/html,test" }, { title: "Não oficial", url: "https://example.com/" }, null,
  ] }) });
  vi.stubGlobal("fetch", fetchMock);
  expect(await sendChatMessage("Pergunta de teste")).toEqual({ reply: "Resposta de teste", intent: "test", mode: "template", sources: [{ title: "Câmara dos Deputados - perfil parlamentar", url: "https://www.camara.leg.br/deputados/62881" }] });
  expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ message: "Pergunta de teste" }));
});
