import type { Message } from "@/types/chat";

const ChatResponseInfo = ({ message }: { message: Message }) => {
  let label: string;
  let description: string;
  if (message.mode === "error") {
    label = "Não foi possível obter a resposta";
    description = "Você pode tentar novamente. Nenhuma nova consulta é enviada automaticamente.";
  } else if (message.mode === "ai") {
    label = "Resposta com IA";
    description = "Modo informado pelo serviço. Confira as fontes e considere que a IA pode cometer erros.";
  } else if (message.mode === "template") {
    label = message.intent === "Fallback" ? "Pergunta não compreendida"
      : typeof message.intent === "string" && message.intent.startsWith("Explicar") ? "Resposta educativa pronta" : "Resposta de base";
    description = message.intent === "Fallback"
      ? "O serviço não gerou uma resposta com IA para esta pergunta. Tente reformular."
      : "Sem geração por IA nesta resposta. O serviço não informa se ela não se aplica ou está indisponível.";
  } else {
    label = "Modo de resposta não informado";
    description = "Não é possível confirmar geração por IA para esta mensagem.";
  }
  return <div className="mb-2 border-b border-border/70 pb-2 text-xs leading-5 text-muted-foreground">
    <p className="font-medium text-[#17324D]">{label}</p>
    <p>{description}</p>
  </div>;
};

export default ChatResponseInfo;
