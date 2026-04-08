import { useNavigate } from "react-router-dom";
import { BarChart3, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import DashboardCharts from "@/components/DashboardCharts";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import { useConversations } from "@/hooks/useConversations";

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "Obrigado pela sua pergunta! Estou processando a informação. Em breve terei uma resposta mais completa para você.",
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("chat político"))
    return "O Chat Político é uma plataforma de inteligência artificial focada em política brasileira. Ele permite consultar dados sobre projetos de lei, eleições, parlamentares e muito mais.";
  if (lower.includes("pec") || lower.includes("segurança"))
    return "A PEC da Segurança Pública propõe mudanças na Constituição para ampliar as atribuições da União na segurança pública, incluindo a criação de uma política nacional de segurança e a constitucionalização do SUSP.";
  if (lower.includes("governador") && lower.includes("ceará"))
    return "O atual governador do Ceará é Elmano de Freitas (PT), que tomou posse em janeiro de 2023.";
  return MOCK_RESPONSES.default;
}

const Index = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const chatExpanded = activeConversation !== null;

  const handleSend = (message: string) => {
    let convId = activeConversationId;

    // If no active conversation, create one
    if (!convId) {
      convId = createConversation();
    }

    // Add user message
    addMessage(convId, "user", message);

    // Simulate assistant response
    setTimeout(() => {
      addMessage(convId!, "assistant", getMockResponse(message));
    }, 600);
  };

  const handleNewChat = () => {
    startNewChat();
  };

  return (
    <div className="flex h-screen bg-background">
      <div
        className="h-screen shrink-0 overflow-hidden transition-all duration-500 ease-in-out"
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

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((v) => !v)}
              className="shrink-0"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              {activeConversation ? activeConversation.title : "Chat Político"}
            </h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden bg-card">
          {/* Charts section — visible only when no conversation is active */}
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out px-8"
            style={{
              maxHeight: chatExpanded ? "0px" : "500px",
              opacity: chatExpanded ? 0 : 1,
              marginBottom: chatExpanded ? "0px" : "12px",
              paddingTop: chatExpanded ? "0px" : "24px",
            }}
          >
            <div className="mb-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/graficos")}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Mais Gráficos
              </Button>
            </div>
            <DashboardCharts />
          </div>

          {/* Chat area */}
          <div
            className="flex flex-1 flex-col overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              flex: chatExpanded ? 1 : 0,
              minHeight: chatExpanded ? 0 : "auto",
            }}
          >
            {activeConversation && activeConversation.messages.length > 0 && (
              <ChatMessages messages={activeConversation.messages} />
            )}
          </div>

          {/* Input area — always at the bottom */}
          <div className="border-t border-border px-8 py-4">
            <ChatInput
              onSend={handleSend}
              showSuggestions={!chatExpanded}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
