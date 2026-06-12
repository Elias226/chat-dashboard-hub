import { useState } from "react";
import { Plus, Mic, AudioLines, Loader2, Send } from "lucide-react";

const suggestions = [
  "Para que serve o chatbot?",
  "O que é uma PEC?",
  "O que faz um deputado?",
];

interface ChatInputProps {
  onSend?: (message: string) => void | Promise<void>;
  showSuggestions?: boolean;
  isSending?: boolean;
}

const ChatInput = ({
  onSend,
  showSuggestions = true,
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

  const handleSuggestion = (s: string) => {
    if (isSending) return;

    void onSend?.(s);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {showSuggestions && (
        <>
          <h2 className="mb-4 text-center text-xl font-semibold text-foreground">
            Como posso ajudar?
          </h2>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                disabled={isSending}
                className="rounded-full border border-border bg-muted px-4 py-2 text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

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
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
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
