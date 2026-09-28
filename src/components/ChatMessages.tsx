import { Message } from "@/types/chat";
import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { getSourceHost, normalizeOfficialSource } from "@/lib/sourceLinks";

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto px-4 py-6">
      {messages.map((msg) => {
        const sources =
          msg.role === "assistant"
            ? (msg.sources || []).map(normalizeOfficialSource)
            : [];

        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {Boolean(sources.length) && (
                <div className="mt-3 border-t border-border/70 pt-2">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Fontes oficiais
                  </p>
                  <div className="flex flex-col gap-2">
                    {sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-start gap-2 rounded-md border border-border/70 bg-background/60 px-2.5 py-2 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-background"
                      >
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block font-medium leading-snug group-hover:underline">
                            {source.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                            {getSourceHost(source.url)}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
