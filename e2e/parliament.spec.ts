import { expect, test } from "../playwright-fixture";
import { datasetPattern, mockDeputies, testDataset } from "./fixtures/camara";

test("pesquisa e combina filtros sobre o conjunto completo e trata fotografia ausente", async ({ page }, testInfo) => {
  const mocked = await mockDeputies(page);
  await page.goto("./parlamentares");
  const results = page.getByRole("list", { name: "Deputados encontrados" });
  await expect(results.getByRole("listitem")).toHaveCount(5);
  await page.getByLabel("Nome do deputado").fill("agata");
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await expect(results.getByRole("heading", { name: "Ágata de Teste" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByLabel("Estado (UF)").selectOption("SP");
  await expect(results.getByRole("listitem")).toHaveCount(2);
  await page.getByLabel("Partido", { exact: true }).selectOption("ALFA");
  await page.getByLabel("Nome do deputado").fill("carla");
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await expect(results.getByRole("heading", { name: "Carla de Teste" })).toBeVisible();
  expect(mocked.calls()).toBe(1);
  await page.getByLabel("Estado (UF)").selectOption("CE");
  await expect(page.getByText("Nenhum deputado encontrado com os filtros selecionados.")).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByLabel("Partido", { exact: true }).selectOption("BETA");
  await expect(results.getByRole("listitem")).toHaveCount(3);
  await expect(results.getByRole("img", { name: "Fotografia não disponível" })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Atualizar dados" })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("parlamentares.png"), fullPage: true });
});

test("renderiza 20 inicialmente, carrega mais e filtra inclusive registros ainda não renderizados", async ({ page }) => {
  const data = await testDataset(45);
  await page.route(datasetPattern, (route) => route.fulfill({ json: data }));
  await page.goto("./parlamentares");
  const cards = page.getByRole("list", { name: "Deputados encontrados" }).getByRole("listitem");
  await expect(cards).toHaveCount(20);
  await page.getByRole("button", { name: "Carregar mais" }).click();
  await expect(cards).toHaveCount(40);
  await page.getByRole("button", { name: "Carregar mais" }).click();
  await expect(cards).toHaveCount(45);
  await expect(page.getByRole("button", { name: "Carregar mais" })).toHaveCount(0);
  await page.getByLabel("Nome do deputado").fill("Pessoa de teste 45");
  await page.getByLabel("Estado (UF)").selectOption("CE");
  await page.getByLabel("Partido", { exact: true }).selectOption("BETA");
  await expect(cards).toHaveCount(1);
  await expect(cards.getByRole("heading", { name: "Pessoa de teste 45" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(cards).toHaveCount(20);
});

test("navega entre início, listagem, perfil básico, indicadores e chat com cache compartilhado", async ({ page }, testInfo) => {
  const mocked = await mockDeputies(page);
  await page.goto("./");
  await page.getByRole("link", { name: "Consultar deputados" }).click();
  await page.getByRole("link", { name: "Ver detalhes de Carla de Teste", exact: true }).click();
  await expect(page).toHaveURL(/\/parlamentares\/3$/);
  await expect(page.getByRole("heading", { level: 1, name: "Carla de Teste", exact: true })).toBeVisible();
  expect(mocked.calls()).toBe(1);
  await expect(page.getByRole("link", { name: "Perfil oficial na Câmara" })).toHaveAttribute("href", "https://www.camara.leg.br/deputados/3");
  await page.screenshot({ path: testInfo.outputPath("parlamentar-detalhes.png"), fullPage: true });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Carla de Teste", exact: true })).toBeVisible();
  expect(mocked.calls()).toBe(2);
  await page.getByRole("button", { name: "Consultar informações adicionais" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Exercício" })).toBeVisible();
  await page.getByRole("link", { name: "Voltar aos parlamentares" }).click();
  const before = mocked.calls();
  await page.getByRole("navigation", { name: "Navegação de parlamentares" }).getByRole("link", { name: "Indicadores", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Deputados federais por estado", exact: true })).toBeVisible();
  expect(mocked.calls()).toBe(before);
  await page.getByRole("navigation", { name: "Navegação dos indicadores" }).getByRole("link", { name: "Parlamentares", exact: true }).click();
  await page.getByRole("navigation", { name: "Navegação de parlamentares" }).getByRole("link", { name: "Assistente IA", exact: true }).click();
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeVisible();
});

test("detalhes adicionais incompletos, ID inválido e perfil fora da publicação não inventam dados", async ({ page }) => {
  await mockDeputies(page);
  await page.goto("./parlamentares/5");
  await expect(page.getByRole("heading", { level: 1, name: "Eva de Teste" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Fotografia não disponível" })).toBeVisible();
  await page.getByRole("button", { name: "Consultar informações adicionais" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Não informado" })).toHaveCount(12);
  await page.goto("./parlamentares/invalido");
  await expect(page.getByRole("alert")).toContainText("Identificador de parlamentar inválido");
  await page.goto("./parlamentares/99");
  await expect(page.getByRole("alert")).toContainText("não foi encontrado no conjunto publicado");
});

test("permite filtros e detalhes em tela pequena", async ({ page }, testInfo) => {
  await mockDeputies(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("./parlamentares");
  await page.getByLabel("Nome do deputado").fill("Carla");
  await expect(page.getByRole("list", { name: "Deputados encontrados" }).getByRole("listitem")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("parlamentares-mobile.png"), fullPage: true });
  await page.getByRole("link", { name: "Ver detalhes de Carla de Teste", exact: true }).click();
  await expect(page.getByRole("link", { name: "Perfil oficial na Câmara" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
