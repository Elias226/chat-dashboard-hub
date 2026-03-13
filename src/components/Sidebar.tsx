import { MessageSquarePlus, Search, Image, AppWindow, Compass, Code, FolderOpen } from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: MessageSquarePlus, label: "Novo chat" },
  { icon: Search, label: "Buscar em chats" },
  { icon: Image, label: "Imagens" },
  { icon: AppWindow, label: "Aplicativos" },
  { icon: Compass, label: "Investigação" },
  { icon: Code, label: "Codex" },
  { icon: FolderOpen, label: "Projetos" },
];

const Sidebar = () => {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <img src={logo} alt="Chat Político" className="h-8 w-8 object-contain" />
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Chat Político</p>
        <p className="mt-1 text-sm font-medium text-foreground">Usuário</p>
      </div>
    </aside>
  );
};

export default Sidebar;
