import { useState } from "react";
import { Plus, Mic, AudioLines, Send } from "lucide-react";

const suggestions = [
  "O que é o Chat Político?",
  "Me fale mais sobre a PEC da Segurança",
  "Quem é o governador do Ceará?",
];

const ChatInput = () => {
  const [message, setMessage] = useState("");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h2 className="mb-4 text-center text-xl font-semibold text-foreground">
        Como posso ajudar?
      </h2>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setMessage(s)}
            className="rounded-full border border-border bg-muted px-4 py-2 text-xs text-foreground transition-colors hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm transition-shadow focus-within:shadow-md">
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <Plus className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Pergunte alguma coisa"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <Mic className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80">
          {message ? <Send className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
