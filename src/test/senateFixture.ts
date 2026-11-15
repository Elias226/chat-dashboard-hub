import { createSenateDataset, STATES } from "../services/senate.ts";
/** Synthetic records only in automated tests; never published as official data. */
export function senateRawFixture() {
  return { ListaParlamentarEmExercicio: { Metadados: { Versao: "Fixture simulada" }, Parlamentares: { Parlamentar: Array.from({ length: 81 }, (_, index) => ({
    IdentificacaoParlamentar: { CodigoParlamentar: String(index + 1), NomeParlamentar: index === 0 ? "Ágata de Teste" : `Senador de Teste ${index + 1}`, SiglaPartidoParlamentar: index % 3 ? "BETA" : "ALFA", UfParlamentar: STATES[Math.floor(index / 3)], UrlFotoParlamentar: index ? "" : "http://www.senado.leg.br/senadores/img/fotos-oficiais/senador1.jpg", EmailParlamentar: "fixture-private@example.test" },
    Mandato: { CodigoMandato: String(index + 100), DescricaoParticipacao: index === 0 ? "1º Suplente" : "Titular", PrimeiraLegislaturaDoMandato: { NumeroLegislatura: "56", DataInicio: "2019-02-01", DataFim: "2023-01-31" }, SegundaLegislaturaDoMandato: { NumeroLegislatura: "57", DataInicio: "2023-02-01", DataFim: "2027-01-31" }, Exercicios: { Exercicio: { DataInicio: index === 0 ? "2026-01-01" : "2019-02-01" } } },
  })) } } };
}
export function senateFixture(fetchedAt = "2026-11-14T12:00:00.000Z") { return createSenateDataset(senateRawFixture(), fetchedAt); }
