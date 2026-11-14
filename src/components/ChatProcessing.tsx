import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CHAT_TIMEOUT_MS } from "@/services/chatApi";

export const CHAT_SLOW_MS = 12_000;

const ChatProcessing = () => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), CHAT_SLOW_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div role="status" aria-live="polite" className="mx-auto mb-3 flex max-w-2xl items-start gap-2 text-xs leading-5 text-muted-foreground">
      <Loader2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
      <p>{slow
        ? `Ainda aguardando o serviço. A primeira resposta pode demorar enquanto ele inicia. A espera termina em até ${CHAT_TIMEOUT_MS / 1000} segundos.`
        : "Aguardando resposta do serviço…"}</p>
    </div>
  );
};

export default ChatProcessing;
