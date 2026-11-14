import { expect, test } from "../playwright-fixture";
import { apiPattern, datasetPattern, mockDeputies } from "./fixtures/camara";

test("API indisponível não impede lista, filtros, indicadores ou perfil básico em navegador sem cache", async ({ page }) => {
  await mockDeputies(page);
  let calls = 0;
  await page.route(apiPattern, (route) => { calls++; return route.fulfill({ status: 504 }); });
  await page.goto("./parlamentares");
  await expect(page.getByRole("list", { name: "Deputados encontrados" }).getByRole("listitem")).toHaveCount(5);
  await page.getByLabel("Nome do deputado").fill("Carla");
  await page.getByLabel("Estado (UF)").selectOption("SP");
  await page.getByLabel("Partido", { exact: true }).selectOption("ALFA");
  await expect(page.getByRole("list", { name: "Deputados encontrados" }).getByRole("listitem")).toHaveCount(1);
  await page.getByRole("link", { name: "Ver detalhes de Carla de Teste", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Carla de Teste" })).toBeVisible();
  await page.getByRole("navigation", { name: "Navegação de parlamentares" }).getByRole("link", { name: "Indicadores", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  expect(calls).toBe(0);
});

test("recupera detalhes transitórios apenas após solicitação explícita", async ({ page }) => {
  await mockDeputies(page);
  let calls = 0;
  await page.route(apiPattern, async (route) => {
    calls++;
    await route.fulfill(calls === 1 ? { status: 502, json: {} } : { json: { dados: { id: 3, ultimoStatus: { situacao: "Exercício" } } } });
  });
  await page.goto("./parlamentares/3");
  await expect(page.getByRole("heading", { level: 1, name: "Carla de Teste" })).toBeVisible();
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Consultar informações adicionais" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Exercício" })).toBeVisible();
  expect(calls).toBe(2);
});

test("falha de detalhes mantém perfil básico e link oficial", async ({ page }) => {
  await mockDeputies(page);
  await page.route(apiPattern, (route) => route.fulfill({ status: 404, json: {} }));
  await page.goto("./parlamentares/3");
  await page.getByRole("button", { name: "Consultar informações adicionais" }).click();
  await expect(page.getByRole("alert")).toContainText("As informações adicionais não estão disponíveis");
  await expect(page.getByRole("alert")).toContainText("HTTP 404");
  await expect(page.getByRole("heading", { level: 1, name: "Carla de Teste" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Perfil oficial na Câmara" })).toBeVisible();
});

test("conexão sem resposta termina o carregamento do arquivo sem fallback direto à API", async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  await page.route(datasetPattern, () => { calls++; return new Promise(() => {}); });
  await page.goto("./graficos");
  await expect.poll(() => calls).toBe(1);
  await page.clock.fastForward(20001);
  await expect(page.getByRole("alert")).toContainText("tempo de espera");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator(".recharts-wrapper")).toHaveCount(0);
});
