import { expect, test } from "../playwright-fixture";
import { mockDeputies } from "./fixtures/camara";

test.beforeEach(async ({ page }) => { await mockDeputies(page); });

test("compartilha logotipo e rodapé institucional nas três páginas", async ({ page }, testInfo) => {
  let symbol: string | null = null;
  for (const [name, path] of [["inicio", "./"], ["chat", "./chat"], ["indicadores", "./graficos"]]) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveCount(1);
    await expect(footer).toContainText("Chat Político");
    await expect(footer).toContainText("Projeto acadêmico");
    await expect(footer).toContainText("Educação política com fontes verificáveis.");
    await expect(footer).toHaveCSS("position", "static");

    const marks = page.locator(".brand-logo-mark");
    for (const mark of await marks.all()) {
      await expect(mark).toHaveCSS("background-color", "rgb(23, 50, 77)");
      await expect(mark).toHaveCSS("color", "rgb(255, 255, 255)");
      const pathData = await mark.locator("svg path").getAttribute("d");
      if (symbol === null) symbol = pathData;
      expect(pathData).toBe(symbol);
    }
    if (name === "chat") {
      await expect(page.getByRole("complementary").locator(".brand-logo")).toBeVisible();
      await expect(page.getByText("Usuário", { exact: true })).toHaveCount(0);
    }
    if (name !== "indicadores") await expect(footer).toContainText("Respostas de IA podem conter erros.");

    const content = await page.getByRole("main").boundingBox();
    const footerBox = await footer.boundingBox();
    expect(footerBox!.y).toBeGreaterThanOrEqual(content!.y + content!.height - 1);
    await page.screenshot({ path: testInfo.outputPath(`${name}-rodape.png`), fullPage: true });
  }
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
  test(`mantém campo, mensagens e histórico acessíveis em ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    // Histórico sintético restrito ao navegador isolado deste teste.
    await page.addInitScript(() => {
      const messages = Array.from({ length: 30 }, (_, index) => ({
        id: `mensagem-${index}`,
        conversation_id: "conversa-layout",
        role: index % 2 === 0 ? "user" : "assistant",
        content: index === 29 ? "Última mensagem de verificação." : `Mensagem de verificação ${index}.`,
        timestamp: "2026-11-04T12:00:00.000Z",
      }));
      localStorage.setItem("chat-politico-conversations", JSON.stringify([{
        id: "conversa-layout", title: "Histórico de verificação", created_at: "2026-11-04T12:00:00.000Z", messages,
      }]));
    });
    await page.goto("./chat");
    const input = page.getByPlaceholder("Pergunte alguma coisa");
    await expect(input).toBeInViewport();
    await input.fill("Rascunho acessível");
    await expect(input).toHaveValue("Rascunho acessível");
    await input.clear();

    const sidebarContainer = page.getByRole("complementary").locator("..");
    if (viewport.width < 768) {
      await page.getByRole("button", { name: "Mostrar histórico" }).click();
      // O botão dentro da sidebar não se move, mas seu contêiner ainda pode
      // estar recortado pela transição. Aguarda a abertura antes de clicar.
      await expect(sidebarContainer).toHaveCSS("width", "240px");
    }
    await page.getByRole("button", { name: "Histórico de verificação", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Histórico de verificação", exact: true })).toBeVisible();
    if (viewport.width < 768) {
      await page.getByRole("button", { name: "Recolher histórico" }).click();
      await expect(sidebarContainer).toHaveCSS("width", "0px");
    }
    const lastMessage = page.getByText("Última mensagem de verificação.", { exact: true });
    // A mudança de largura da sidebar pode alterar a posição das mensagens;
    // verifica o acesso por rolagem, sem exigir rolagem automática durante a animação.
    await lastMessage.scrollIntoViewIfNeeded();
    await expect(lastMessage).toBeInViewport();
    await expect(input).toBeInViewport();
    await input.fill("Campo continua disponível");
    await expect(input).toBeFocused();

    const inputBox = await input.boundingBox();
    const footerBox = await page.getByRole("contentinfo").boundingBox();
    const messageBox = await lastMessage.boundingBox();
    expect(messageBox!.y + messageBox!.height).toBeLessThanOrEqual(inputBox!.y);
    expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(footerBox!.y);
    expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("chat-historico-rodape.png"), fullPage: true });
  });
}
