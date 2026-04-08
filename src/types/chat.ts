export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}
