import { expect, test } from "../playwright-fixture";

test("recorte oficial em navegador novo abre detalhes sem acessar a API", async ({ page, request }) => {
  test.skip(process.env.RUN_PUBLISHED_LIVE !== "1", "Usa o JSON oficial efetivamente servido; sem mocks.");
  const root = test.info().project.use.baseURL!;
  const response = await request.get(new URL("data/proposicoes.json", root.endsWith("/") ? root : root + "/").href);
  expect(response.ok()).toBe(true);
  const data = await response.json();
  let calls = 0;
  page.on("request", req => { if (req.url().startsWith("https://dadosabertos.camara.leg.br/api/")) calls++; });
  await page.goto("./projetos-de-lei");
  await expect(page.getByRole("status")).toContainText(`${data.records.length} proposição`);
  if (data.records.length) {
    const row = data.records[0];
    await page.getByLabel("Tipo", { exact: true }).selectOption(row.siglaTipo);
    await page.getByLabel("Número", { exact: true }).fill(String(row.numero));
    await page.getByLabel("Ano", { exact: true }).fill(String(row.ano));
    await page.getByRole("link", { name: `Ver detalhes de ${row.siglaTipo} ${row.numero}/${row.ano}` }).click();
    await expect(page.getByRole("heading", { name: "Ementa oficial", exact: true })).toBeVisible();
    await expect(page.getByText(row.ementa, { exact: true })).toBeVisible();
  }
  expect(calls).toBe(0);
});
test("busca e detalhes reais na API da Câmara pelo navegador", async ({ page }) => {
  test.skip(process.env.RUN_PROPOSALS_LIVE !== "1", "Integração opcional real; sujeita a CORS e disponibilidade externa.");
  test.setTimeout(150000);
  await page.goto("./projetos-de-lei");
  await page.getByLabel("Tipo", { exact: true }).selectOption("PL");
  await page.getByLabel("Número", { exact: true }).fill("2630");
  await page.getByLabel("Ano", { exact: true }).fill("2020");
  await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await page.getByRole("link", { name: "Ver detalhes de PL 2630/2020" }).click({ timeout: 75000 });
  await expect(page.getByRole("heading", { name: "PL 2630/2020", exact: true })).toBeVisible({ timeout: 75000 });
  await expect(page.getByRole("heading", { name: "Autoria", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Tramitações registradas" }).getByRole("listitem").first()).toBeVisible();
});
