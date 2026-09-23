export interface MessageSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: MessageSource[];
  intent?: string;
  mode?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}
