import { MessageSquarePlus, MessageCircle, Trash2 } from "lucide-react";
import { Conversation } from "@/types/chat";
import BrandLogo from "@/components/BrandLogo";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

const Sidebar = ({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) => {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <BrandLogo small />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-auto px-3 pt-2">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Novo chat
        </button>

        <p className="px-3 py-2 text-xs text-muted-foreground">Todas as suas conversas</p>

        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent ${
              conv.id === activeConversationId
                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                : "text-sidebar-foreground"
            }`}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">{conv.title}</span>
            {onDeleteConversation && (
              <Trash2
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              />
            )}
          </button>
        ))}
      </nav>

    </aside>
  );
};

export default Sidebar;
