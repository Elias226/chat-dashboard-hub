import { expect, test } from "../playwright-fixture";
import { mockDeputies } from "./fixtures/camara";
import { senateFixture } from "../src/test/senateFixture";
import { proposalsFixture } from "../src/test/proposalsFixture";
test.beforeEach(async ({ page }) => {
  await mockDeputies(page);
  await page.route("**/data/senadores.json", async route => route.fulfill({ json: await senateFixture() }));
});
test("hemiciclo conserva cadeiras, percentuais, teclado e cores entre Casas", async ({ page }) => {
  await page.goto("./graficos");
  const chamber = page.getByRole("region", { name: "Deputados federais por partido", exact: true });
  await expect(chamber.locator("circle[data-party]")).toHaveCount(5);
  await expect(chamber.locator('circle[data-party="ALFA"]')).toHaveCount(2);
  const color = await chamber.locator('circle[data-party="ALFA"]').first().getAttribute("fill");
  const button = chamber.getByRole("button", { name: "ALFA: 2 deputados · 40% de 5 cadeiras", exact: true });
  await button.focus(); await button.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(chamber.locator('circle[data-party="BETA"]').first()).toHaveAttribute("opacity", "0.18");
  await chamber.getByRole("button", { name: "Limpar destaque" }).click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("navigation", { name: "Opções dos indicadores" }).getByRole("link", { name: "Senado Federal", exact: true }).click();
  const senate = page.getByRole("region", { name: "Senadores por partido", exact: true });
  await expect(senate.locator("circle[data-party]")).toHaveCount(81);
  await expect(senate.locator('circle[data-party="ALFA"]').first()).toHaveAttribute("fill", color!);
  await expect(senate.getByRole("button", { name: "ALFA: 27 senadores · 33,3% de 81 cadeiras", exact: true })).toBeVisible();
});
test("lollipop mantém UFs e valores em ordem alfabética", async ({ page }) => {
  await page.goto("./graficos");
  const state = page.getByRole("region", { name: "Deputados federais por estado", exact: true });
  await expect(state.getByRole("img", { name: /Gráfico lollipop/ })).toBeVisible();
  await expect(state.locator("[data-category]")).toHaveText(["CE2", "DF1", "SP2"]);
});
test("comparativo resume cada fonte e explicita as duas escalas", async ({ page }) => {
  await page.goto("./graficos?casa=comparativo");
  const chamber = page.getByRole("region", { name: "Resumo: Câmara dos Deputados", exact: true });
  const senate = page.getByRole("region", { name: "Resumo: Senado Federal", exact: true });
  await expect(chamber).toContainText("BETA — 3");
  await expect(senate).toContainText("BETA — 54");
  await expect(chamber).toContainText("Partidos representados2");
  await expect(senate).toContainText("Atualização (Brasília)");
  await expect(page.getByRole("region", { name: "Composição da Câmara", exact: true }).locator("circle")).toHaveCount(5);
  await expect(page.getByRole("region", { name: "Composição do Senado", exact: true }).locator("circle")).toHaveCount(81);
  await expect(page.getByText(/os hemiciclos têm enquadramento próprio/)).toBeVisible();
});
test("indicadores de proposições são sob demanda e limitados ao recorte completo", async ({ page }) => {
  let calls = 0;
  await page.route("**/data/proposicoes.json", async route => { calls++; return route.fulfill({ json: await proposalsFixture() }); });
  await page.goto("./graficos");
  await expect(page.getByRole("heading", { name: "Deputados federais por partido", exact: true })).toBeVisible();
  expect(calls).toBe(0);
  const summary = page.getByText("Projetos de lei · indicadores do recorte recente", { exact: true });
  await summary.click();
  await expect(page.getByText("Somente o recorte recente publicado, não todo o acervo legislativo.", { exact: true })).toBeVisible();
  const types = page.getByRole("region", { name: "Proposições por tipo", exact: true });
  await types.getByText("Ver dados em tabela", { exact: true }).click();
  await expect(types.getByRole("table").getByRole("row", { name: "PL 1", exact: true })).toBeVisible();
  const days = page.getByRole("region", { name: "Proposições por dia de apresentação", exact: true });
  await expect(days.locator("[data-category]")).toHaveCount(7);
  await expect(days.locator('[data-category="10/11/2026"]')).toHaveText("10/11/20263");
  expect(calls).toBe(1);
  await summary.click(); await summary.click();
  await expect(types).toBeVisible();
  expect(calls).toBe(1);
});
test("falha de proposições preserva gráficos das Casas e não apresenta contagem fictícia", async ({ page }) => {
  await page.route("**/data/proposicoes.json", route => route.fulfill({ status: 503 }));
  await page.goto("./graficos");
  await page.getByText("Projetos de lei · indicadores do recorte recente", { exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível carregar");
  await expect(page.getByRole("heading", { name: "Proposições por tipo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Deputados federais por partido", exact: true }).locator("circle")).toHaveCount(5);
});
test("legendas e comparação continuam acessíveis em tela pequena", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./graficos?casa=comparativo");
  await expect(page.getByRole("region", { name: "Composição do Senado", exact: true }).getByRole("button", { name: /^ALFA:/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
