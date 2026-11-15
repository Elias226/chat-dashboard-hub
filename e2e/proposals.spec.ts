import { expect, test } from "../playwright-fixture";
import { proposalsFixture } from "../src/test/proposalsFixture";
import { mockDeputies } from "./fixtures/camara";

test.beforeEach(async ({ page }) => {
  await mockDeputies(page);
  await page.route("**/data/proposicoes.json", async route => route.fulfill({ json: await proposalsFixture() }));
});
test("ativa cartão, combina filtros e assunto e abre detalhes publicados sem consultar a API", async ({ page }) => {
  const requests: string[] = [];
  await page.route("https://dadosabertos.camara.leg.br/api/v2/proposicoes**", route => { requests.push(route.request().url()); return route.abort(); });
  await page.goto("./");
  await page.getByRole("link", { name: "Pesquisar propostas", exact: true }).click();
  await expect(page).toHaveURL(/\/projetos-de-lei$/);
  await expect(page.getByRole("list", { name: "Proposições encontradas" }).getByRole("listitem")).toHaveCount(3);
  await page.getByLabel("Tipo", { exact: true }).selectOption("PLP");
  await page.getByLabel("Número", { exact: true }).fill("3");
  await page.getByLabel("Ano", { exact: true }).fill("2026");
  await page.getByLabel("Assunto ou palavra-chave").fill("EDUCACAO inclusão");
  await expect(page.getByRole("list", { name: "Proposições encontradas" }).getByRole("listitem")).toHaveCount(1);
  await page.getByRole("link", { name: "Ver detalhes de PLP 3/2026" }).click();
  await expect(page.getByRole("heading", { name: "PLP 3/2026", exact: true })).toBeVisible();
  await expect(page.getByText("Autoria simulada", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Tramitações registradas" })).toContainText("Movimentação simulada");
  await expect(page.getByRole("link", { name: "Abrir página oficial na Câmara" })).toHaveAttribute("href", /idProposicao=103$/);
  await expect(page.getByText("Uma proposta não é automaticamente uma lei", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "PLP 3/2026", exact: true })).toBeVisible();
  expect(requests).toEqual([]);
  await page.getByRole("navigation").getByRole("link", { name: "Indicadores" }).click();
  await expect(page.getByRole("heading", { name: "Deputados federais por estado" })).toBeVisible();
});
test("busca exata de outro período consulta fonte e carrega autoria e histórico", async ({ page }) => {
  const urls: string[] = [];
  await page.route("https://dadosabertos.camara.leg.br/api/v2/proposicoes**", route => {
    const url = new URL(route.request().url()); urls.push(url.href);
    let dados: unknown;
    if (url.pathname.endsWith("/autores")) dados = [{ nome: "Instituição de teste" }];
    else if (url.pathname.endsWith("/tramitacoes")) dados = Array.from({ length: 23 }, (_, index) => ({ dataHora: "2020-01-01T10:00", sequencia: index + 1, descricaoTramitacao: `Tramitação de teste ${index + 1}` }));
    else { const row = { id: 900, siglaTipo: "PL", numero: 2630, ano: 2020, ementa: "Ementa oficial simulada apenas no teste", dataApresentacao: "2020-01-01T10:00" }; dados = url.pathname.endsWith("/900") ? row : [row]; }
    return route.fulfill({ json: { dados, links: [] } });
  });
  await page.goto("./projetos-de-lei");
  await page.getByLabel("Tipo", { exact: true }).selectOption("PL");
  await page.getByLabel("Número", { exact: true }).fill("2630");
  await page.getByLabel("Ano", { exact: true }).fill("2020");
  await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await page.getByRole("link", { name: "Ver detalhes de PL 2630/2020" }).click();
  await expect(page.getByText("Instituição de teste", { exact: true })).toBeVisible();
  const history = page.getByRole("list", { name: "Tramitações registradas" });
  await expect(history.getByRole("listitem")).toHaveCount(20);
  await page.getByRole("button", { name: "Carregar mais tramitações" }).click();
  await expect(history.getByRole("listitem")).toHaveCount(23);
  await expect(page.getByText("Não informada pela fonte", { exact: true })).toBeVisible();
  expect(urls[0]).toContain("numero=2630&ano=2020");
  expect(urls).toHaveLength(4);
});
test("zero resultados e falha de consulta são mensagens diferentes", async ({ page }) => {
  let failed = false;
  await page.route("https://dadosabertos.camara.leg.br/api/v2/proposicoes**", route => failed ? route.fulfill({ status: 404 }) : route.fulfill({ json: { dados: [], links: [] } }));
  await page.goto("./projetos-de-lei");
  await page.getByLabel("Assunto ou palavra-chave").fill("palavra inexistente");
  await expect(page.getByRole("heading", { name: "Nenhum resultado encontrado" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByLabel("Tipo", { exact: true }).selectOption("PEC");
  await page.getByLabel("Número", { exact: true }).fill("999999");
  await page.getByLabel("Ano", { exact: true }).fill("2020");
  await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(page.getByText("A Câmara não retornou proposições para esse tipo, número e ano. Confira os filtros.")).toBeVisible();
  failed = true;
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Isso não significa que a proposta não exista");
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});
test("publicação indisponível não faz fallback silencioso para a API", async ({ page }) => {
  let live = 0;
  await page.route("**/data/proposicoes.json", route => route.fulfill({ status: 503 }));
  await page.route("https://dadosabertos.camara.leg.br/api/v2/proposicoes**", route => { live++; return route.abort(); });
  await page.goto("./projetos-de-lei");
  await expect(page.getByRole("alert")).toContainText("A publicação de proposições não pôde ser carregada");
  expect(live).toBe(0);
});
test("carregamento, ID inválido e responsividade básica", async ({ page }) => {
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/data/proposicoes.json", async route => { await waiting; return route.fulfill({ json: await proposalsFixture() }); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./projetos-de-lei");
  await expect(page.getByRole("status")).toHaveText("Carregando proposições publicadas…");
  release();
  await expect(page.getByRole("link", { name: "Ver detalhes de PL 1/2026" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("./projetos-de-lei/invalido");
  await expect(page.getByRole("heading", { name: "Identificador de proposição inválido" })).toBeVisible();
});
