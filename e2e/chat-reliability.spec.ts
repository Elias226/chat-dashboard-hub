import { expect, test } from "../playwright-fixture";

test("pergunta aberta preservada, carregamento, modo IA e fontes seguros no histórico", async ({ page }) => {
  const question = "Qual é a diferença entre as funções de um deputado federal e de um senador?";
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  await page.route("**/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests++;
    expect(route.request().postDataJSON()).toEqual({ message: question });
    await ready;
    await route.fulfill({ json: { reply: "Resposta gerada simulada exclusivamente neste teste.", mode: "ai", intent: "ExplicarComparacao", sources: [
      { title: "Câmara", url: "https://www.camara.leg.br/" },
      { title: "Maliciosa", url: "javascript:alert(1)" },
    ] } });
  });
  await page.goto("./chat");
  const input = page.getByPlaceholder("Pergunte alguma coisa");
  await expect(input).toBeEditable();
  await page.clock.install();
  await input.fill(question);
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Aguardando resposta do serviço…");
  await expect(input).toBeDisabled();
  await page.clock.fastForward(12_000);
  await expect(page.getByRole("status")).toContainText("Ainda aguardando o serviço.");
  await expect(input).toBeInViewport();
  release();
  await expect(page.getByText("Resposta com IA", { exact: true })).toBeVisible();
  await expect(input).toBeEditable();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Maliciosa/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Câmara/ })).toHaveAttribute("href", "https://www.camara.leg.br/");
  expect(requests).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: question.slice(0, 40) + "…", exact: true }).click();
  await expect(page.getByText("Resposta com IA", { exact: true })).toBeVisible();
});

test("serviço indisponível permite nova tentativa manual e distingue template de IA", async ({ page }) => {
  let requests = 0;
  await page.route("**/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    expect(route.request().postDataJSON()).toEqual({ message: "O que é uma PEC?" });
    requests++;
    if (requests === 1) return route.fulfill({ status: 503, json: { error: "erro interno não exibido" } });
    await route.fulfill({ json: { reply: "Resposta pronta simulada para teste.", mode: "template", intent: "ExplicarPEC" } });
  });
  await page.goto("./chat");
  await page.getByRole("button", { name: "O que é uma PEC?", exact: true }).click();
  await expect(page.getByText("O serviço de respostas está indisponível no momento. Tente novamente em instantes.", { exact: true })).toBeVisible();
  expect(requests).toBe(1);
  await expect(page.getByText("erro interno não exibido")).toHaveCount(0);
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByText("Resposta educativa pronta", { exact: true })).toBeVisible();
  await expect(page.getByText("Resposta com IA", { exact: true })).toHaveCount(0);
  expect(requests).toBe(2);
});

test("timeout libera a digitação e encerra o carregamento sem reenvio automático", async ({ page }) => {
  let requests = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests++;
    await ready;
    await route.fulfill({ json: { reply: "Resposta tardia não deve ser adicionada.", mode: "ai" } }).catch(() => {});
  });
  await page.goto("./chat");
  await page.clock.install();
  await page.getByRole("button", { name: "O que é uma PEC?", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Aguardando resposta");
  await page.clock.fastForward(90_000);
  await expect(page.getByText(/Tempo de espera esgotado\./)).toBeVisible();
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeEditable();
  await expect(page.getByRole("status")).toHaveCount(0);
  expect(requests).toBe(1);
  release();
  await expect(page.getByText("Resposta tardia não deve ser adicionada.", { exact: true })).toHaveCount(0);
});
