import { MessageSource } from "@/types/chat";
import { normalizeOfficialSource } from "@/lib/sourceLinks";

const DEFAULT_CHAT_API_URL = "https://chatbot-politico.onrender.com/chat";

const chatApiUrl = import.meta.env.VITE_CHAT_API_URL || DEFAULT_CHAT_API_URL;
export const CHAT_TIMEOUT_MS = 90_000;

export class ChatRequestError extends Error {
  constructor(message: string, public readonly kind: "timeout" | "network" | "unavailable" | "invalid") {
    super(message);
    this.name = "ChatRequestError";
  }
}

type ChatApiResponse = {
  reply?: string;
  fulfillmentText?: string;
  error?: string;
  sources?: Partial<MessageSource>[];
  intent?: string;
  mode?: string;
};

export type ChatApiResult = {
  reply: string;
  sources: MessageSource[];
  intent?: string;
  mode?: string;
};

function normalizeSources(sources?: Partial<MessageSource>[]): MessageSource[] {
  if (!Array.isArray(sources)) return [];

  return sources
    .filter((source): source is MessageSource => {
      return Boolean(source && typeof source.title === "string" && typeof source.url === "string");
    })
    .map((source) => ({
      title: String(source.title),
      url: String(source.url),
    }))
    .map(normalizeOfficialSource)
    .filter((source): source is MessageSource => source !== null);
}

export async function sendChatMessage(message: string): Promise<ChatApiResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  // One POST only: automatic retries could duplicate generation and its cost.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ChatRequestError("Tempo de espera esgotado. O serviço pode estar iniciando ou demorando para responder. Tente novamente em instantes.", "timeout"));
      controller.abort();
    }, CHAT_TIMEOUT_MS);
  });
  try {
    return await Promise.race([deadline, (async () => {
      const response = await fetch(chatApiUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }), signal: controller.signal,
      });
      if (!response.ok) {
        throw new ChatRequestError(response.status === 429
          ? "O serviço atingiu um limite temporário de consultas. Aguarde um pouco antes de tentar novamente."
          : "O serviço de respostas está indisponível no momento. Tente novamente em instantes.", "unavailable");
      }
      let data: ChatApiResponse;
      try { data = await response.json(); } catch {
        throw new ChatRequestError("Não foi possível interpretar a resposta do serviço. Tente novamente em instantes.", "invalid");
      }
      const reply = typeof data?.reply === "string" && data.reply.trim() ? data.reply
        : typeof data?.fulfillmentText === "string" && data.fulfillmentText.trim() ? data.fulfillmentText : null;
      if (!reply) throw new ChatRequestError("O serviço não retornou uma resposta válida. Tente novamente em instantes.", "invalid");
      return {
        reply, sources: normalizeSources(data.sources),
        intent: typeof data.intent === "string" ? data.intent : undefined,
        mode: data.mode === "ai" || data.mode === "template" ? data.mode : undefined,
      };
    })()]);
  } catch (error) {
    if (error instanceof ChatRequestError) throw error;
    throw new ChatRequestError("Não consegui consultar o backend agora. Tente novamente em instantes.", "network");
  } finally {
    clearTimeout(timer!);
  }
}
