import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ChatResponseInfo from "./ChatResponseInfo";
import type { Message } from "@/types/chat";

afterEach(cleanup);
const message: Message = { id: "1", conversation_id: "1", role: "assistant", content: "Resposta", timestamp: "2026-11-14T12:00:00Z" };
it.each([
  ["ai", "ExplicarPEC", "Resposta com IA"],
  ["template", "ExplicarPEC", "Resposta educativa pronta"],
  ["template", "BuscarPolitico", "Resposta de base"],
  ["template", "Fallback", "Pergunta não compreendida"],
  [undefined, undefined, "Modo de resposta não informado"],
  ["unexpected", undefined, "Modo de resposta não informado"],
  ["error", undefined, "Não foi possível obter a resposta"],
])("diferencia modo %s e intenção %s sem atribuir IA a templates", (mode, intent, label) => {
  render(<ChatResponseInfo message={{ ...message, mode, intent }} />);
  expect(screen.getByText(label)).toBeInTheDocument();
  if (mode !== "ai") expect(screen.queryByText("Resposta com IA")).not.toBeInTheDocument();
});
