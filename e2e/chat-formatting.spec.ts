import { expect, test } from "../playwright-fixture";

test("formatação segura reaparece no histórico sem alterar o conteúdo persistido", async ({ page }) => {
  const question = "Me diz quem é o Lula";
  const reply = "**Biografia institucional**\n- Marco histórico simulado no teste.\n- Consulte a fonte.\n<script>window.unsafeMarkdown=true</script>\n[atalho](javascript:alert(1))";
  await page.route("**/chat", async route => {
    if (route.request().method() !== "POST") return route.continue();
    expect(route.request().postDataJSON()).toEqual({ message: question });
    await route.fulfill({ json: { reply, mode: "ai", intent: "BuscarPerfilOficial", sources: [{ title: "Senado (teste)", url: "https://adm.senado.leg.br/vcb/vocab/index.php?/direita-ciencia-politica=&tema=8592" }] } });
  });
  await page.goto("./chat");
  await page.getByPlaceholder("Pergunte alguma coisa").fill(question);
  await page.getByPlaceholder("Pergunte alguma coisa").press("Enter");
  await expect(page.locator("strong", { hasText: "Biografia institucional" })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Senado \(teste\)/ })).toHaveAttribute("href", "https://adm.senado.leg.br/vcb/vocab/index.php?/direita-ciencia-politica=&tema=8592");
  expect(await page.evaluate(() => localStorage.getItem("chat-politico-conversations"))).toContain("**Biografia institucional**");
  expect(await page.evaluate(() => Reflect.get(window, "unsafeMarkdown"))).toBeUndefined();
  await page.reload();
  await page.getByRole("complementary").getByRole("button", { name: question, exact: true }).click();
  await expect(page.locator("strong", { hasText: "Biografia institucional" })).toBeVisible();
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeEditable();
  expect(await page.evaluate(() => Reflect.get(window, "unsafeMarkdown"))).toBeUndefined();
});
