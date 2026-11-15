import { expect, test } from "../playwright-fixture";
import { apiPattern, datasetPattern, mockDeputies, testDataset } from "./fixtures/camara";

test("exibe os dois indicadores publicados e reutiliza uma única consulta ao site", async ({ page }) => {
  const mocked = await mockDeputies(page);
  await page.goto("./graficos");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  await expect(page.getByText("5 deputados no conjunto publicado", { exact: true })).toBeVisible();
  await page.getByText("Ver dados em tabela", { exact: true }).first().click();
  const states = page.getByRole("table", { name: "Deputados federais por estado" });
  await expect(states.getByRole("row", { name: "SP 2", exact: true })).toBeVisible();
  await expect(states.getByRole("row", { name: "CE 2", exact: true })).toBeVisible();
  await page.getByText("Ver dados em tabela", { exact: true }).last().click();
  const parties = page.getByRole("table", { name: "Deputados federais por partido" });
  await expect(parties.getByRole("row", { name: "ALFA 2 40%", exact: true })).toBeVisible();
  await expect(parties.getByRole("row", { name: "BETA 3 60%", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dados Abertos da Câmara dos Deputados · documentação", exact: true }).first()).toHaveAttribute("href", "https://dadosabertos.camara.leg.br/swagger/api.html");
  await expect(page.locator("time").first()).toHaveAttribute("datetime", /\d{4}-\d{2}-\d{2}T/);
  await expect(page.getByText(/Metodologia:/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Atualizar dados" })).toHaveCount(0);
  expect(mocked.calls()).toBe(1);
  await page.getByRole("navigation", { name: "Navegação dos indicadores" }).getByRole("link", { name: "Início", exact: true }).click();
  await page.getByRole("link", { name: "Explorar gráficos" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  expect(mocked.calls()).toBe(1);
});

test("mostra carregamento até validar o arquivo completo", async ({ page }) => {
  const data = await testDataset();
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  await page.route(datasetPattern, async (route) => { await ready; await route.fulfill({ json: data }); });
  await page.goto("./graficos");
  try {
    await expect(page.getByRole("status")).toContainText("Carregando os dados publicados");
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
  } finally { release(); }
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
});

test("falha do arquivo não consulta a Câmara nem mostra gráficos parciais e permite repetir", async ({ page }) => {
  let apiCalls = 0;
  await page.route(apiPattern, (route) => { apiCalls++; return route.abort(); });
  let failing = true;
  const data = await testDataset();
  await page.route(datasetPattern, (route) => route.fulfill(failing ? { status: 503, json: {} } : { json: data }));
  await page.goto("./graficos");
  await expect(page.getByRole("alert")).toContainText("HTTP 503");
  await expect(page.locator("circle[data-party]")).toHaveCount(0);
  await expect(page.getByRole("img", { name: /Gráfico lollipop/ })).toHaveCount(0);
  failing = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  expect(apiCalls).toBe(0);
});

test("recusa conjunto vazio ou corrompido sem criar contagens", async ({ page }) => {
  const data = await testDataset();
  await page.route(datasetPattern, (route) => route.fulfill({ json: { ...data, deputies: [] } }));
  await page.goto("./graficos");
  await expect(page.getByRole("alert")).toContainText("integridade");
  await expect(page.locator("circle[data-party]")).toHaveCount(0);
  await page.route(datasetPattern, (route) => route.fulfill({ json: { ...data, integrity: { ...data.integrity, sha256: "0".repeat(64) } } }));
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("alert")).toContainText("integridade");
  await expect(page.locator("circle[data-party]")).toHaveCount(0);
});
