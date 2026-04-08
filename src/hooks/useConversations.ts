import { useState, useCallback, useEffect } from "react";
import { Conversation, Message } from "@/types/chat";

const STORAGE_KEY = "chat-politico-conversations";

function generateId() {
  return crypto.randomUUID();
}

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 40) + "…";
}

function loadFromStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(loadFromStorage);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    saveToStorage(conversations);
  }, [conversations]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const createConversation = useCallback((): string => {
    const id = generateId();
    const conv: Conversation = {
      id,
      title: "Nova conversa",
      created_at: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(id);
    return id;
  }, []);

  const addMessage = useCallback(
    (conversationId: string, role: "user" | "assistant", content: string) => {
      const msg: Message = {
        id: generateId(),
        conversation_id: conversationId,
        role,
        content,
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const updated = { ...c, messages: [...c.messages, msg] };
          // Auto-title from first user message
          if (role === "user" && c.messages.length === 0) {
            updated.title = generateTitle(content);
          }
          return updated;
        })
      );
      return msg;
    },
    []
  );

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) setActiveConversationId(null);
    },
    [activeConversationId]
  );

  return {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    addMessage,
    selectConversation,
    startNewChat,
    deleteConversation,
  };
}
