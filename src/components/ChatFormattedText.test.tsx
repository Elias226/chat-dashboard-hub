import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ChatFormattedText from "./ChatFormattedText";

afterEach(cleanup);
it("renderiza ênfase, código, títulos e listas sem exibir os marcadores", () => {
  render(<ChatFormattedText text={"## Resumo\nUma **PEC** altera a *Constituição*.\n- Uma etapa\n- Outra etapa\n\n1. Leia `PL`.\n2. Consulte a fonte."} />);
  expect(screen.getByText("PEC").tagName).toBe("STRONG");
  expect(screen.getByText("Constituição").tagName).toBe("EM");
  expect(screen.getByText("PL").tagName).toBe("CODE");
  expect(screen.getAllByRole("list")).toHaveLength(2);
  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  expect(screen.queryByText(/\*\*PEC/)).not.toBeInTheDocument();
});
it("mantém HTML, URLs, imagens e links Markdown como texto inerte", () => {
  const text = '<img src=x onerror=alert(1)> <script>alert(1)</script>\n[clique](javascript:alert(1))\n![foto](https://evil.example/x)\nhttps://evil.example';
  const { container } = render(<ChatFormattedText text={text} />);
  expect(container.querySelector("script,img,a,iframe")).toBeNull();
  expect(container).toHaveTextContent("<script>alert(1)</script>");
  expect(container).toHaveTextContent("javascript:alert(1)");
});
it("preserva texto simples, marcadores incompletos e acentos", () => {
  render(<ChatFormattedText text={"Mensagem **incompleta e ação política."} />);
  expect(screen.getByText("Mensagem **incompleta e ação política.")).toBeInTheDocument();
});
