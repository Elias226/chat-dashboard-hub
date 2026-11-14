import { expect, test } from "../playwright-fixture";
import { mockDeputies } from "./fixtures/camara";

test.beforeEach(async ({ page }) => { await mockDeputies(page); });

test("apresenta as quatro áreas e distingue funcionalidades futuras", async ({ page }, testInfo) => {
  await page.goto("./");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política não precisa ser complicada.");
  for (const name of ["Assistente IA", "Parlamentares", "Projetos de lei", "Indicadores"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Em desenvolvimento", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Consultar deputados" })).toHaveAttribute("href", /\/parlamentares$/);
  await expect(page.getByRole("link", { name: /Projetos de lei/ })).toHaveCount(0);
  await expect(page.getByText("Fonte oficial", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("inicio-desktop.png"), fullPage: true });
});

test("navega entre início, assistente e gráficos com pesquisa preservada", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Conversar com o assistente" }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como posso ajudar você a entender a política?" })).toBeVisible();
  await page.getByRole("link", { name: "Indicadores", exact: true }).click();
  await expect(page).toHaveURL(/\/graficos$/);
  await expect(page.getByText("Indicadores com dados oficiais da Câmara dos Deputados.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  await page.getByPlaceholder("Pesquisar gráficos...").fill("partido");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Deputados federais por partido" })).toBeVisible();
  await page.getByRole("navigation", { name: "Navegação dos indicadores" }).getByRole("link", { name: "Início", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política não precisa ser complicada.");
  await page.getByRole("link", { name: "Explorar gráficos" }).click();
  await page.getByRole("navigation", { name: "Navegação dos indicadores" }).getByRole("link", { name: "Assistente IA", exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeInViewport();
});

test("preserva envio, fontes e histórico ao voltar ao início e recarregar", async ({ page }) => {
  // Resposta controlada exclusiva do teste; nenhuma consulta ao backend real.
  await page.route("**/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    expect(route.request().postDataJSON()).toEqual({ message: "Pergunta de teste" });
    await route.fulfill({
      json: {
        reply: "Resposta controlada para teste de navegação.",
        sources: [{ title: "Câmara dos Deputados", url: "https://www.camara.leg.br/" }],
        mode: "template",
      },
    });
  });
  await page.goto("./chat");
  await page.getByPlaceholder("Pergunte alguma coisa").fill("Pergunta de teste");
  await page.getByPlaceholder("Pergunte alguma coisa").press("Enter");
  await expect(page.getByRole("heading", { name: "Como posso ajudar você a entender a política?" })).toHaveCount(0);
  await expect(page.getByText("Resposta controlada para teste de navegação.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Câmara dos Deputados/ })).toHaveAttribute("href", "https://www.camara.leg.br/");
  await page.getByRole("link", { name: "Início", exact: true }).click();
  await page.getByRole("link", { name: "Abrir assistente" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Pergunta de teste", exact: true }).click();
  await expect(page.getByText("Resposta controlada para teste de navegação.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Novo chat", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Como posso ajudar você a entender a política?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pergunta de teste", exact: true })).toBeVisible();
});

test("apresenta quatro perguntas sem gráficos e envia uma sugestão pelo fluxo do chat", async ({ page }, testInfo) => {
  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => { releaseResponse = resolve; });
  let requests = 0;
  await page.route("**/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests += 1;
    expect(route.request().postDataJSON()).toEqual({ message: "O que é uma PEC?" });
    // Resposta controlada somente no teste, liberada após verificar o estado de envio.
    await responseReady;
    await route.fulfill({ json: { reply: "Resposta controlada da sugestão.", sources: [], mode: "template" } });
  });
  await page.goto("./chat");
  const welcome = page.getByRole("region", { name: "Como posso ajudar você a entender a política?" });
  await expect(welcome).toBeVisible();
  await expect(welcome).toContainText("Faça perguntas sobre instituições, parlamentares, projetos de lei e outros assuntos da política brasileira.");
  const questions = [
    "O que é uma PEC?",
    "Como funciona o Congresso Nacional?",
    "Como um projeto de lei é aprovado?",
    "O que faz um deputado federal?",
  ];
  await expect(welcome.getByRole("button")).toHaveCount(4);
  for (const question of questions) await expect(welcome.getByRole("button", { name: question, exact: true })).toBeVisible();
  await expect(page.locator(".recharts-wrapper, [aria-roledescription='carousel']")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mais Gráficos" })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("assistente-inicial.png"), fullPage: true });
  try {
    await welcome.getByRole("button", { name: "O que é uma PEC?", exact: true }).click();
    await expect(welcome).toHaveCount(0);
    await expect(page.getByRole("main").getByText("O que é uma PEC?", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeDisabled();
  } finally {
    releaseResponse();
  }
  await expect(page.getByText("Resposta controlada da sugestão.", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeEnabled();
  expect(requests).toBe(1);
  await page.reload();
  await page.getByRole("complementary").getByRole("button", { name: "O que é uma PEC?", exact: true }).click();
  await expect(page.getByText("Resposta controlada da sugestão.", { exact: true })).toBeVisible();
  await expect(welcome).toHaveCount(0);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
  test(`mantém navegação, pesquisa e cabeçalho dos indicadores acessíveis em ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("./graficos");
    const header = page.getByRole("banner");
    const nav = page.getByRole("navigation", { name: "Navegação dos indicadores" });
    const search = page.getByRole("textbox", { name: "Pesquisar gráficos" });
    await expect(nav.getByRole("link", { name: "Início", exact: true })).toBeInViewport();
    await expect(nav.getByRole("link", { name: "Assistente IA", exact: true })).toBeInViewport();
    await expect(header.getByRole("link", { name: "Assistente IA", exact: true })).toHaveCount(1);
    await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(2);
    if (viewport.width >= 1280) {
      const navBox = await nav.boundingBox();
      const searchBox = await search.boundingBox();
      const titleBox = await header.getByRole("heading", { level: 1 }).boundingBox();
      expect(navBox!.x).toBeGreaterThan(titleBox!.x + titleBox!.width);
      expect(Math.abs(navBox!.y + navBox!.height / 2 - searchBox!.y - searchBox!.height / 2)).toBeLessThan(4);
    }
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await expect(nav).toBeInViewport();
    await expect(search).toBeInViewport();
    expect((await header.boundingBox())!.y).toBe(0);
    const footerBox = await page.getByRole("contentinfo").boundingBox();
    const headerBox = await header.boundingBox();
    expect(footerBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
    await search.fill("estado");
    await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Deputados federais por estado", exact: true })).toBeVisible();
    await search.fill("Sem resultados de teste");
    await expect(page.getByText("Nenhum gráfico encontrado.", { exact: true })).toBeVisible();
    await search.clear();
    await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("indicadores-cabecalho.png"), fullPage: true });
  });
}

test("mantém o tratamento de falha do assistente", async ({ page }) => {
  await page.route("**/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({ status: 500, json: { error: "Falha controlada do teste" } });
  });
  await page.goto("./chat");
  await page.getByPlaceholder("Pergunte alguma coisa").fill("Teste de falha");
  await page.getByPlaceholder("Pergunte alguma coisa").press("Enter");
  await expect(page.getByText("Não consegui consultar o backend agora. Tente novamente em instantes.")).toBeVisible();
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeEnabled();
});

test("mantém a página inicial utilizável em tela pequena", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("inicio-mobile.png"), fullPage: true });
  await page.getByRole("link", { name: "Explorar gráficos" }).click();
  await expect(page).toHaveURL(/\/graficos$/);
});
