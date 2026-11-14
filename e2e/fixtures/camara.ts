import type { Page } from "@playwright/test";
import { createDeputiesDataset } from "../../src/services/deputiesDataset";
import { DEPUTIES_QUERY_URL } from "../../src/services/camaraDeputies";

export const apiPattern = "https://dadosabertos.camara.leg.br/api/v2/deputados**";
export const datasetPattern = "**/data/deputados.json";

export async function testDataset(count = 5) {
  const names = ["Ágata de Teste", "Bruno de Teste", "Carla de Teste", "Davi de Teste", "Eva de Teste"];
  return createDeputiesDataset({
    complete: true, fetchedAt: "2026-11-04T12:00:00.000Z", pages: 1, duplicates: 0, invalidRecords: 0,
    deputies: Array.from({ length: count }, (_, index) => ({ id: index + 1, nome: names[index] ?? `Pessoa de teste ${index + 1}`, siglaUf: index === 0 || index === 2 ? "SP" : index === 3 ? "DF" : "CE", siglaPartido: index === 0 || index === 2 ? "ALFA" : "BETA", urlFoto: null })),
    collection: { expectedCount: count, receivedCount: count, pages: [{ url: DEPUTIES_QUERY_URL, count, total: count }] },
  });
}

/** Respostas sintéticas exclusivas dos testes automatizados. Não são dados oficiais. */
export async function mockDeputies(page: Page) {
  let calls = 0;
  const data = await testDataset();
  await page.route(datasetPattern, (route) => { calls += 1; return route.fulfill({ json: data }); });
  await page.route(apiPattern, async (route) => {
    calls += 1;
    const detail = new URL(route.request().url()).pathname.match(/\/deputados\/(\d+)$/);
    if (detail) {
      const id = Number(detail[1]);
      await route.fulfill({ json: { dados: { id, ultimoStatus: id === 5 ? {} : { nome: "Carla de Teste", siglaUf: "SP", siglaPartido: "ALFA", situacao: "Exercício", condicaoEleitoral: "Titular", idLegislatura: 57, data: "2026-01-01T10:00", email: "teste@camara.leg.br", gabinete: { nome: "101", predio: "IV", sala: "101", telefone: "00000000" } } }, links: [] } });
      return;
    }
    throw new Error("O navegador não deve consultar a listagem diretamente na Câmara.");
  });
  return { calls: () => calls };
}
