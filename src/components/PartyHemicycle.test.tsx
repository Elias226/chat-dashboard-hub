import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import PartyHemicycle from "./PartyHemicycle";
afterEach(cleanup);
const props = { id: "test", title: "Composição de teste", data: [{ category: "ALFA", count: 2 }, { category: "BETA", count: 3 }], fetchedAt: "2026-11-14T12:00:00Z", label: "Deputados", sourceUrl: "https://www.camara.leg.br/", sourceLabel: "Câmara" };
it("mantém uma cadeira por círculo e interação por botões acessíveis com contagem e percentual", () => {
  const { container } = render(<PartyHemicycle {...props} />);
  expect(container.querySelectorAll("circle")).toHaveLength(5);
  const button = screen.getByRole("button", { name: "ALFA: 2 deputados · 40% de 5 cadeiras" });
  fireEvent.focus(button); fireEvent.click(button);
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(container.querySelector('circle[data-party="BETA"]')).toHaveAttribute("opacity", "0.18");
  fireEvent.click(screen.getByRole("button", { name: "Limpar destaque" }));
  expect(button).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("table", { name: props.title, hidden: true })).toHaveTextContent("ALFA240%");
  expect(screen.getByRole("link", { name: "Câmara" })).toHaveAttribute("href", props.sourceUrl);
});
it("conjunto vazio não inventa círculos nem percentuais indefinidos", () => {
  const { container } = render(<PartyHemicycle {...props} data={[]} />);
  expect(container.querySelectorAll("circle")).toHaveLength(0);
  expect(container).not.toHaveTextContent(/NaN|Infinity/);
  expect(screen.getByText("Nenhuma cadeira disponível neste conjunto.")).toBeInTheDocument();
});
