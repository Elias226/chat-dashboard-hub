import { Message } from "@/types/chat";
import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

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
      {messages.map((msg) => (
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

            {msg.role === "assistant" && Boolean(msg.sources?.length) && (
              <div className="mt-3 border-t border-border/70 pt-2">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Fontes
                </p>
                <div className="flex flex-col gap-1">
                  {msg.sources?.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
