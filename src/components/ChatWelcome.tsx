import { ArrowUpRight, FileText, Landmark, MessageCircle, ScrollText, UsersRound } from "lucide-react";

const suggestions = [
  { question: "O que é uma PEC?", icon: FileText },
  { question: "Como funciona o Congresso Nacional?", icon: Landmark },
  { question: "Como um projeto de lei é aprovado?", icon: ScrollText },
  { question: "O que faz um deputado federal?", icon: UsersRound },
];

interface ChatWelcomeProps {
  onSend: (message: string) => void | Promise<void>;
  isSending: boolean;
}

const ChatWelcome = ({ onSend, isSending }: ChatWelcomeProps) => (
  <section aria-labelledby="chat-welcome-title" className="m-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#17324D] text-white">
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </div>
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#167D8D]">Assistente IA · Chat Político</p>
    <h2 id="chat-welcome-title" className="max-w-xl text-2xl font-semibold leading-tight tracking-tight text-[#17324D] sm:text-4xl">
      Como posso ajudar você a entender a política?
    </h2>
    <p className="mt-4 max-w-xl text-sm leading-7 text-[#516474] sm:text-base">
      Faça perguntas sobre instituições, parlamentares, projetos de lei e outros assuntos da política brasileira.
    </p>
    <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Sugestões de perguntas">
      {suggestions.map(({ question, icon: Icon }) => (
        <button
          key={question}
          type="button"
          disabled={isSending}
          onClick={() => { if (!isSending) void onSend(question); }}
          className="group flex items-center gap-3 rounded-xl border border-[#17324D]/15 bg-[#F5F8FB] px-4 py-4 text-left text-sm leading-6 text-[#243746] transition-colors hover:border-[#167D8D] hover:bg-[#167D8D]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon className="h-5 w-5 shrink-0 text-[#167D8D]" aria-hidden="true" />
          <span className="flex-1">{question}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#167D8D]" aria-hidden="true" />
        </button>
      ))}
    </div>
  </section>
);

export default ChatWelcome;
