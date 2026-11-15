import { afterEach, expect, it, vi } from "vitest";
import { createSenateDataset, senatePartyDistribution, senatePeriodWarning, senatePhoto, validateSenateDataset } from "./senate";
import { senateFixture, senateRawFixture } from "../test/senateFixture";
import { filterDeputies } from "../lib/deputyFilters";
afterEach(() => vi.useRealTimers());
const consultation = "2026-11-14T12:00:00.000Z";
it("normaliza 81 exercícios e retém apenas informações institucionais necessárias", async () => {
  const data = await senateFixture();
  expect(data.senators).toHaveLength(81);
  expect(data.senators[0]).toMatchObject({ nome: "Ágata de Teste", participacao: "1º Suplente", mandatoInicio: "2019-02-01", exercicioInicio: "2026-01-01" });
  expect(JSON.stringify(data)).not.toContain("fixture-private");
  expect(data.senators[0].urlFoto).toMatch(/^https:/);
  await expect(validateSenateDataset(data)).resolves.toEqual(data);
});
it("deduplica registros idênticos sem inventar cadeiras", async () => {
  const raw = senateRawFixture(); raw.ListaParlamentarEmExercicio.Parlamentares.Parlamentar.push(structuredClone(raw.ListaParlamentarEmExercicio.Parlamentares.Parlamentar[0]));
  const data = await createSenateDataset(raw, consultation);
  expect(data.integrity).toMatchObject({ recordCount: 81, rawCount: 82, duplicates: 1 });
});
it("recusa resposta parcial e duplicação conflitante de pessoa ou cadeira", async () => {
  const raw = senateRawFixture(); raw.ListaParlamentarEmExercicio.Parlamentares.Parlamentar.pop();
  await expect(createSenateDataset(raw, consultation)).rejects.toThrow();
  const conflicting = senateRawFixture(), rows = conflicting.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
  rows[1].Mandato.CodigoMandato = rows[0].Mandato.CodigoMandato;
  await expect(createSenateDataset(conflicting, consultation)).rejects.toThrow();
  rows[1].IdentificacaoParlamentar.CodigoParlamentar = rows[0].IdentificacaoParlamentar.CodigoParlamentar;
  await expect(createSenateDataset(conflicting, consultation)).rejects.toThrow(/conflitantes/);
});
it("não publica eleitos de 2026 cujo exercício só começa em fevereiro de 2027", async () => {
  const raw = senateRawFixture(); raw.ListaParlamentarEmExercicio.Parlamentares.Parlamentar[0].Mandato.Exercicios.Exercicio.DataInicio = "2027-02-01";
  await expect(createSenateDataset(raw, consultation)).rejects.toThrow(/eleitos futuros/);
});
it("avisa sobre snapshot anterior à transição sem reescrever nomes ou mandatos", async () => {
  const data = await senateFixture();
  expect(senatePeriodWarning(data, "2027-01-31")).toBe(false);
  expect(senatePeriodWarning(data, "2027-02-01")).toBe(true);
  await expect(validateSenateDataset(data)).resolves.toEqual(data);
});
it("nova coleta após fevereiro de 2027 aceita mandatos vigentes da nova legislatura", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2027-02-02T12:00:00Z"));
  const raw = senateRawFixture();
  for (const row of raw.ListaParlamentarEmExercicio.Parlamentares.Parlamentar) {
    row.Mandato.PrimeiraLegislaturaDoMandato = { NumeroLegislatura: "58", DataInicio: "2027-02-01", DataFim: "2031-01-31" };
    row.Mandato.SegundaLegislaturaDoMandato = { NumeroLegislatura: "59", DataInicio: "2031-02-01", DataFim: "2035-01-31" };
    row.Mandato.Exercicios.Exercicio.DataInicio = "2027-02-01";
  }
  const data = await createSenateDataset(raw, "2027-02-02T12:00:00.000Z");
  expect(senatePeriodWarning(data)).toBe(false);
});
it("conta partidos uma vez por registro e usa filtros combinados sem acentos", async () => {
  const data = await senateFixture(), distribution = senatePartyDistribution(data.senators);
  expect(distribution).toEqual([{ category: "BETA", count: 54 }, { category: "ALFA", count: 27 }]);
  expect(distribution.reduce((sum, row) => sum + row.count, 0)).toBe(data.senators.length);
  expect(filterDeputies(data.senators, "AGATA", "AC", "ALFA")).toHaveLength(1);
  expect(filterDeputies(data.senators, "AGATA", "SP", "ALFA")).toHaveLength(0);
});
it("rejeita adulteração, campos ausentes e UF fora do conjunto constitucional", async () => {
  const data = await senateFixture();
  for (const mutate of [(copy: typeof data) => { copy.senators[0].nome = "Alterado"; }, (copy: typeof data) => { copy.senators[0].siglaUf = "ZZ"; }, (copy: typeof data) => { copy.referenceDate = "2027-02-01"; }]) {
    const copy = structuredClone(data); mutate(copy); await expect(validateSenateDataset(copy)).rejects.toThrow();
  }
});
it.each(["javascript:alert(1)", "https://www.senado.leg.br.evil.example/senadores/img/fotos-oficiais/senador1.jpg", "https://user@www.senado.leg.br/senadores/img/fotos-oficiais/senador1.jpg", "https://www.senado.leg.br:444/senadores/img/fotos-oficiais/senador1.jpg"])("recusa foto insegura: %s", value => expect(senatePhoto(value)).toBeNull());
