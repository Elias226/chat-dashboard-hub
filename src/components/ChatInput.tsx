import { useState } from "react";
import { Plus, Mic, AudioLines, Loader2, Send } from "lucide-react";

interface ChatInputProps {
  onSend?: (message: string) => void | Promise<void>;
  isSending?: boolean;
}

const ChatInput = ({
  onSend,
  isSending = false,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmedMessage = message.trim();

    if (trimmedMessage && !isSending) {
      void onSend?.(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm transition-shadow focus-within:shadow-md">
        <button
          disabled={isSending}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder="Pergunte alguma coisa"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          disabled={isSending}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mic className="h-4 w-4" />
        </button>
        <button
          onClick={handleSend}
          disabled={isSending}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : message ? (
            <Send className="h-4 w-4" />
          ) : (
            <AudioLines className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
