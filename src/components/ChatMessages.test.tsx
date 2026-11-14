import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ChatMessages from "./ChatMessages";
import type { Message } from "@/types/chat";

beforeEach(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);

it("filtra links inseguros de mensagens antigas na renderização, preservando texto e fontes válidas", () => {
  const message: Message = {
    id: "test", conversation_id: "test", role: "assistant", timestamp: "2026-11-04T12:00:00Z",
    content: "Texto preservado <script>não executado</script>",
    sources: [
      { title: "Fonte válida", url: "https://dadosabertos.camara.leg.br/api/v2/deputados/62881" },
      { title: "Esquema perigoso", url: "javascript:void(0)" },
      { title: "Domínio enganoso", url: "https://camara.leg.br.evil.example/" },
    ],
  };
  render(<ChatMessages messages={[message]} />);
  expect(screen.getByText(message.content)).toBeInTheDocument();
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute("href", "https://www.camara.leg.br/deputados/62881");
  expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  expect(document.querySelector("script")).toBeNull();
  expect(message.sources).toHaveLength(3);
});
