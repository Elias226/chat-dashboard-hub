import { useNavigate } from "react-router-dom";
import { BarChart3, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import DashboardCharts from "@/components/DashboardCharts";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import { useConversations } from "@/hooks/useConversations";
import { sendChatMessage } from "@/services/chatApi";

const Index = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const chatExpanded = activeConversation !== null;

  const handleSend = async (message: string) => {
    if (isSending) return;

    let convId = activeConversationId;

    if (!convId) {
      convId = createConversation();
    }

    addMessage(convId, "user", message);

    setIsSending(true);

    try {
      const reply = await sendChatMessage(message);
      addMessage(convId, "assistant", reply);
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
              isSending={isSending}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
