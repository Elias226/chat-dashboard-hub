import { expect, test } from "../playwright-fixture";

test("links seguros nas respostas novas e no histórico, sem apagar a conversa", async ({ page }) => {
  await page.route("**/chat", async (route) => {
    if (route.request().method() !== "POST") { await route.continue(); return; }
    await route.fulfill({ json: { reply: "Resposta simulada de segurança.", sources: [
      { title: "Câmara dos Deputados", url: "https://dadosabertos.camara.leg.br/api/v2/deputados/62881" },
      { title: "Esquema bloqueado", url: "javascript:window.__unsafeSource=true" },
      { title: "HTML bloqueado", url: "data:text/html,unsafe" },
      { title: "Domínio enganoso", url: "https://www.camara.leg.br.evil.example/" },
    ] } });
  });
  await page.goto("./chat");
  await page.getByPlaceholder("Pergunte alguma coisa").fill("Teste de segurança das fontes");
  await page.getByPlaceholder("Pergunte alguma coisa").press("Enter");
  await expect(page.getByText("Resposta simulada de segurança.", { exact: true })).toBeVisible();
  const source = page.getByRole("link", { name: /Câmara dos Deputados - perfil parlamentar/ });
  await expect(source).toHaveAttribute("href", "https://www.camara.leg.br/deputados/62881");
  await expect(source).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator('a[href^="javascript:"], a[href^="data:"], a[href*="evil.example"]')).toHaveCount(0);
  await page.evaluate(() => {
    const key = "chat-politico-conversations";
    const conversations = JSON.parse(localStorage.getItem(key)!);
    const message = conversations[0].messages.find((record: { role: string }) => record.role === "assistant");
    message.sources.push({ title: "Fonte antiga insegura", url: "vbscript:msgbox(1)" });
    localStorage.setItem(key, JSON.stringify(conversations));
  });
  await page.reload();
  await page.getByRole("complementary").getByRole("button", { name: "Teste de segurança das fontes", exact: true }).click();
  await expect(page.getByText("Resposta simulada de segurança.", { exact: true })).toBeVisible();
  await expect(source).toBeVisible();
  await expect(page.locator('a[href^="vbscript:"]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("chat-politico-conversations")!)[0].messages.length)).toBe(2);
});
