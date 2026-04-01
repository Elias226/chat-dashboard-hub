import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import DashboardCharts from "@/components/DashboardCharts";
import ChatInput from "@/components/ChatInput";

const Index = () => {
  const navigate = useNavigate();
  const [chatExpanded, setChatExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<string[]>([]);

  const handleSend = (message: string) => {
    if (!chatExpanded) {
      const newConv = `Conversa ${conversations.length + 1}`;
      setConversations((prev) => [...prev, newConv]);
    }
    setChatExpanded(true);
  };

  const handleNewChat = useCallback(() => {
    setChatExpanded(false);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar with smooth transition */}
      <div
        className="h-screen shrink-0 overflow-hidden transition-all duration-500 ease-in-out"
        style={{ width: sidebarOpen ? "15rem" : "0px" }}
      >
        <Sidebar
          conversations={conversations}
          onNewChat={handleNewChat}
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
            <h1 className="text-lg font-semibold text-foreground">Chat Político</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-auto px-8 py-6 bg-card">
          {/* Charts section */}
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: chatExpanded ? "0px" : "500px",
              opacity: chatExpanded ? 0 : 1,
              marginBottom: chatExpanded ? "0px" : "12px",
              transform: chatExpanded ? "translateY(-20px)" : "translateY(0)",
            }}
          >
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => navigate("/graficos")} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Mais Gráficos
              </Button>
            </div>
            <DashboardCharts />
          </div>

          {/* Chat section */}
          <div
            className="flex items-center justify-center rounded-xl bg-card shadow-xl border-solid border-2 transition-all duration-500 ease-in-out"
            style={{
              flex: chatExpanded ? 1 : 0,
              minHeight: chatExpanded ? "100%" : "auto",
              padding: chatExpanded ? "2rem" : "1.5rem 0",
              marginTop: chatExpanded ? "0px" : "30px",
              opacity: chatExpanded ? 1 : 1,
              transform: chatExpanded ? "translateY(0)" : "translateY(0)",
            }}
          >
            <ChatInput onSend={handleSend} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
