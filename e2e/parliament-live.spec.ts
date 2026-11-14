import { expect, test } from "../playwright-fixture";
import { writeFile } from "node:fs/promises";
import { validateDeputiesDataset } from "../src/services/deputiesDataset";

test("dados reais publicados: navegador novo lista, filtra e abre perfil sem cache prévio ou API", async ({ page }, testInfo) => {
  test.skip(process.env.RUN_PUBLISHED_LIVE !== "1", "Validação real opcional do JSON coletado; sem respostas simuladas.");
  const apiRequests: string[] = [];
  page.on("request", (request) => { if (request.url().startsWith("https://dadosabertos.camara.leg.br/api/")) apiRequests.push(request.url()); });
  const published = page.waitForResponse((response) => response.url().endsWith("/data/deputados.json"));
  await page.goto("./parlamentares");
  const response = await published;
  const data = await validateDeputiesDataset(await response.json());
  const results = page.getByRole("list", { name: "Deputados encontrados" });
  await expect(results.getByRole("listitem")).toHaveCount(Math.min(20, data.deputies.length));
  const selected = data.deputies.at(-1)!;
  await page.getByLabel("Nome do deputado").fill(selected.nome!);
  await page.getByLabel("Estado (UF)").selectOption(selected.siglaUf!);
  await page.getByLabel("Partido", { exact: true }).selectOption(selected.siglaPartido!);
  await page.getByRole("link", { name: `Ver detalhes de ${selected.nome}`, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: selected.nome!, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Perfil oficial na Câmara" })).toHaveAttribute("href", `https://www.camara.leg.br/deputados/${selected.id}`);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: selected.nome!, exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
  const evidence = { page: page.url(), file: response.url(), status: response.status(), records: data.deputies.length, selectedId: selected.id, fetchedAt: data.fetchedAt, browserApiRequests: apiRequests };
  await writeFile(testInfo.outputPath("parlamentares-publicados-reais.json"), JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: testInfo.outputPath("perfil-publicado-real.png"), fullPage: true });
});
