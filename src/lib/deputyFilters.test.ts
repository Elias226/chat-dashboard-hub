import { describe, expect, it } from "vitest";
import { deputyFilterOptions, filterDeputies, MISSING_FILTER } from "./deputyFilters";

const records = [
  { id: 1, nome: "Ágata de Teste", siglaUf: "SP", siglaPartido: "ALFA" },
  { id: 2, nome: "Bruno de Teste", siglaUf: "CE", siglaPartido: "BETA" },
  { id: 3, nome: "Ana de Teste", siglaUf: "SP", siglaPartido: "BETA" },
  { id: 4, nome: null, siglaUf: null, siglaPartido: null },
];

describe("filtros locais sobre o conjunto completo", () => {
  it("pesquisa nomes sem distinguir caixa ou acentos", () => {
    expect(filterDeputies(records, " aGAtA ", "", "").map((record) => record.id)).toEqual([1]);
  });
  it("filtra por UF e partido de forma independente", () => {
    expect(filterDeputies(records, "", "SP", "").map((record) => record.id)).toEqual([1, 3]);
    expect(filterDeputies(records, "", "", "BETA").map((record) => record.id)).toEqual([3, 2]);
  });
  it("combina os três filtros por interseção", () => {
    expect(filterDeputies(records, "ana", "SP", "BETA").map((record) => record.id)).toEqual([3]);
    expect(filterDeputies(records, "ana", "CE", "BETA")).toEqual([]);
  });
  it("mantém registros incompletos identificáveis e filtra ausências", () => {
    expect(filterDeputies(records, "", MISSING_FILTER, MISSING_FILTER).map((record) => record.id)).toEqual([4]);
    expect(filterDeputies(records, "", "", "")).toHaveLength(4);
    expect(deputyFilterOptions(records, "siglaUf")).toEqual([{ value: "CE", label: "CE" }, { value: "SP", label: "SP" }, { value: MISSING_FILTER, label: "Não informado" }]);
  });
});
