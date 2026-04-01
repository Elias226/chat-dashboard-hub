import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import DashboardCharts from "@/components/DashboardCharts";
import ChatInput from "@/components/ChatInput";

const Index = () => {
  const navigate = useNavigate();
  const [chatExpanded, setChatExpanded] = useState(false);

  const handleSend = (message: string) => {
    setChatExpanded(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Chat Político</h1>
        </header>

        <div className="flex flex-1 flex-col px-8 py-6 bg-card">
          {/* Charts section - shrinks and disappears */}
          <div
            className="transition-all duration-700 ease-in-out overflow-hidden"
            style={{
              maxHeight: chatExpanded ? "0px" : "400px",
              opacity: chatExpanded ? 0 : 1,
              marginBottom: chatExpanded ? "0px" : "12px",
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

          {/* Chat section - grows to fill */}
          <div
            className="flex items-center justify-center rounded-xl bg-card shadow-xl border-solid border-2 transition-all duration-700 ease-in-out"
            style={{
              flex: chatExpanded ? 1 : 0,
              minHeight: chatExpanded ? "100%" : "auto",
              padding: chatExpanded ? "2rem" : "1.5rem 0",
              marginTop: chatExpanded ? "0px" : "30px",
              marginBottom: chatExpanded ? "0px" : "0px",
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
