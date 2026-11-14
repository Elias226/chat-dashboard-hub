import { Link } from "react-router-dom";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import ChatWelcome from "@/components/ChatWelcome";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import SiteFooter from "@/components/SiteFooter";
import { useConversations } from "@/hooks/useConversations";
import { sendChatMessage } from "@/services/chatApi";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isSending, setIsSending] = useState(false);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    addMessage,
    selectConversation,
    startNewChat,
    deleteConversation,
  } = useConversations();

  const hasMessages = Boolean(activeConversation?.messages.length);

  const handleSend = async (message: string) => {
    if (isSending) return;

    let convId = activeConversationId;

    if (!convId) {
      convId = createConversation();
    }

    addMessage(convId, "user", message);

    setIsSending(true);

    try {
      const response = await sendChatMessage(message);
      addMessage(convId, "assistant", response.reply, {
        sources: response.sources,
        intent: response.intent,
        mode: response.mode,
      });
    } catch {
      addMessage(
        convId,
        "assistant",
        "Não consegui consultar o backend agora. Tente novamente em instantes."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    startNewChat();
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div
        className="h-full shrink-0 overflow-hidden transition-all duration-500 ease-in-out"
        style={{ width: sidebarOpen ? "15rem" : "0px" }}
      >
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarOpen ? "Recolher histórico" : "Mostrar histórico"}
              onClick={() => setSidebarOpen((v) => !v)}
              className="shrink-0"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
            <h1 className="truncate text-lg font-semibold text-foreground">
              {activeConversation ? activeConversation.title : "Chat Político"}
            </h1>
          </div>
          <nav aria-label="Navegação do assistente" className="flex shrink-0 gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:underline">Início</Link>
            <Link to="/parlamentares" className="text-muted-foreground hover:underline">Parlamentares</Link>
            <Link to="/graficos" className="text-muted-foreground hover:underline">Indicadores</Link>
          </nav>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {hasMessages ? (
              <ChatMessages messages={activeConversation!.messages} />
            ) : (
              <ChatWelcome onSend={handleSend} isSending={isSending} />
            )}
          </div>
          {/* Input area — always below the scrollable content */}
          <div className="shrink-0 border-t border-border px-4 py-4 sm:px-8">
            <ChatInput
              onSend={handleSend}
              isSending={isSending}
            />
          </div>
        </main>
        <SiteFooter compact showAiNotice />
      </div>
    </div>
  );
};

export default Index;
