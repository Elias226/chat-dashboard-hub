import { MessageSquarePlus } from "lucide-react";
import logo from "@/assets/logo.png";

const Sidebar = () => {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <img src={logo} alt="Chat Político" className="h-8 w-8 object-contain" />
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
          <MessageSquarePlus className="h-4 w-4" />
          Novo chat
        </button>
        <p className="px-3 py-2 text-xs text-muted-foreground">Todas as suas conversas</p>
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Chat Político</p>
        <p className="mt-1 text-sm font-medium text-foreground">Usuário</p>
      </div>
    </aside>
  );
};

export default Sidebar;
