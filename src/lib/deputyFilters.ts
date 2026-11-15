import type { Deputy } from "@/services/camaraDeputies";

export const MISSING_FILTER = "not-informed";

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function filterDeputies<T extends Pick<Deputy, "id" | "nome" | "siglaUf" | "siglaPartido">>(deputies: T[], name: string, uf: string, party: string): T[] {
  const search = normalizeName(name);
  return deputies.filter((deputy) => (
    (!search || normalizeName(deputy.nome ?? "").includes(search)) &&
    (!uf || (deputy.siglaUf ?? MISSING_FILTER) === uf) &&
    (!party || (deputy.siglaPartido ?? MISSING_FILTER) === party)
  )).sort((a, b) => {
    if (!a.nome && b.nome) return 1;
    if (a.nome && !b.nome) return -1;
    return (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR") || a.id - b.id;
  });
}

export function deputyFilterOptions(deputies: Pick<Deputy, "siglaUf" | "siglaPartido">[], field: "siglaUf" | "siglaPartido") {
  const values = [...new Set(deputies.map((deputy) => deputy[field]).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const options = values.map((value) => ({ value, label: value }));
  if (deputies.some((deputy) => !deputy[field])) options.push({ value: MISSING_FILTER, label: "Não informado" });
  return options;
}
