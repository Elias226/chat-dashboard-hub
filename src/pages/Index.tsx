import Sidebar from "@/components/Sidebar";
import DashboardCharts from "@/components/DashboardCharts";
import ChatInput from "@/components/ChatInput";

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Chat Político</h1>
        </header>

        <div className="flex flex-1 flex-col px-8 py-6 bg-card">
          <DashboardCharts />

          <div className="flex flex-1 items-center justify-center px-0 py-0 rounded-xl bg-card gap-0 my-[30px] shadow-xl border-solid border-2">
            <ChatInput />
          </div>
        </div>
      </main>
    </div>);

};

export default Index;