import { expect, test } from "../playwright-fixture";
import { writeFile } from "node:fs/promises";
import { validateDeputiesDataset } from "../src/services/deputiesDataset";
import { groupDeputies } from "../src/services/camaraDeputies";

test("dados reais publicados: indicadores sem acesso do navegador à API", async ({ page }, testInfo) => {
  test.skip(process.env.RUN_PUBLISHED_LIVE !== "1", "Validação real opcional do JSON coletado; sem respostas simuladas.");
  const apiRequests: string[] = [];
  page.on("request", (request) => { if (request.url().startsWith("https://dadosabertos.camara.leg.br/api/")) apiRequests.push(request.url()); });
  const published = page.waitForResponse((response) => response.url().endsWith("/data/deputados.json"));
  await page.goto("./graficos");
  const response = await published;
  expect(response.status()).toBe(200);
  expect(new URL(response.url()).origin).toBe(new URL(page.url()).origin);
  const data = await validateDeputiesDataset(await response.json());
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  await expect(page.getByText(`${data.deputies.length} deputados no conjunto publicado`, { exact: true })).toBeVisible();
  for (const [field, title] of [["siglaUf", "Deputados federais por estado"], ["siglaPartido", "Deputados federais por partido"]] as const) {
    const region = page.getByRole("region", { name: title, exact: true });
    await region.getByText("Ver dados em tabela", { exact: true }).click();
    for (const { category, count } of groupDeputies(data.deputies, field)) {
      const row = region.getByRole("row").filter({ has: page.getByRole("rowheader", { name: category, exact: true }) });
      await expect(row.getByRole("cell").first()).toHaveText(String(count));
      if (field === "siglaPartido") await expect(row.getByRole("cell").nth(1)).toHaveText(`${(count / data.deputies.length * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
    }
    if (field === "siglaPartido") await expect(region.locator("circle[data-party]")).toHaveCount(data.deputies.length);
    await region.getByText("Ver dados em tabela", { exact: true }).click();
  }
  expect(apiRequests).toEqual([]);
  const evidence = { file: response.url(), status: response.status(), fetchedAt: data.fetchedAt, records: data.deputies.length, pages: data.collection.pages, integrity: data.integrity, browserApiRequests: apiRequests };
  await writeFile(testInfo.outputPath("indicadores-publicados-reais.json"), JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: testInfo.outputPath("indicadores-publicados-reais.png"), fullPage: true });
});
