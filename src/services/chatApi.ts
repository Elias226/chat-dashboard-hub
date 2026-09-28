import { MessageSource } from "@/types/chat";
import { normalizeOfficialSource } from "@/lib/sourceLinks";

const DEFAULT_CHAT_API_URL = "https://chatbot-politico.onrender.com/chat";

const chatApiUrl = import.meta.env.VITE_CHAT_API_URL || DEFAULT_CHAT_API_URL;

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
      return Boolean(source.title && source.url);
    })
    .map((source) => ({
      title: String(source.title),
      url: String(source.url),
    }))
    .map(normalizeOfficialSource);
}

export async function sendChatMessage(message: string): Promise<ChatApiResult> {
  const response = await fetch(chatApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  let data: ChatApiResponse | null = null;

  try {
    data = (await response.json()) as ChatApiResponse;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || "Erro ao consultar o backend.");
  }

  const reply = data?.reply || data?.fulfillmentText;

  if (!reply) {
    throw new Error("O backend não retornou uma resposta.");
  }

  return {
    reply,
    sources: normalizeSources(data?.sources),
    intent: data?.intent,
    mode: data?.mode,
  };
}
