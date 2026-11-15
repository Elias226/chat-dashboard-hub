import { expect, test } from "../playwright-fixture";
test("Senado real em navegador novo: lista, perfil e distribuição sem requisições à API", async ({ page }) => {
  test.skip(process.env.RUN_PUBLISHED_LIVE !== "1", "Usa o arquivo oficial servido; sem mocks.");
  let calls = 0;
  page.on("request", request => { if (request.url().startsWith("https://legis.senado.leg.br/dadosabertos/")) calls++; });
  await page.goto("./parlamentares?casa=senado");
  await expect(page.getByRole("status")).toHaveText("81 de 81 senadores encontrados");
  await page.getByRole("list", { name: "Senadores encontrados" }).getByRole("link").first().click();
  await expect(page.getByRole("link", { name: "Abrir perfil oficial no Senado" })).toHaveAttribute("href", /^https:\/\/www25.senado.leg.br\/web\/senadores\/senador\/-\/perfil\/\d+$/);
  await expect(page.getByText("Período do mandato da cadeira", { exact: true })).toBeVisible();
  await page.goto("./graficos?casa=senado");
  await expect(page.getByRole("heading", { name: "Senadores por partido", exact: true })).toBeVisible();
  await page.getByText("Ver dados em tabela", { exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "% de 81 cadeiras", exact: true })).toBeVisible();
  expect(calls).toBe(0);
});
