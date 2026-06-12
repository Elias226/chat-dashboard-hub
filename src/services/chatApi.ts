const DEFAULT_CHAT_API_URL = "https://chatbot-politico.onrender.com/chat";

const chatApiUrl = import.meta.env.VITE_CHAT_API_URL || DEFAULT_CHAT_API_URL;

type ChatApiResponse = {
  reply?: string;
  fulfillmentText?: string;
  error?: string;
};

export async function sendChatMessage(message: string): Promise<string> {
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

  return reply;
}
