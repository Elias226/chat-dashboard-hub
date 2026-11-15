import { fetchCamaraJson, withCamaraBudget } from "./camaraHttp.ts";

export const SENATE_ENDPOINT = "https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json";
export const SENATE_DOCUMENTATION = "https://www12.senado.leg.br/dados-abertos/legislativo/parlamentares/senadores-em-exercicio";
export const SENATE_COMPOSITION = "https://www12.senado.leg.br/institucional/documentos/sobre-o-senado/atividade/composicao";
export const STATES = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export interface Senator {
  id: number; nome: string; siglaUf: string; siglaPartido: string; urlFoto: string | null;
  mandatoId: number; participacao: string; mandatoInicio: string; mandatoFim: string;
  legislaturas: { numero: number; inicio: string; fim: string }[];
  exercicioInicio: string; exercicioFim: string | null;
}
export interface SenateDataset {
  schemaVersion: 1; complete: true; source: string; fetchedAt: string; referenceDate: string;
  sourceVersion: string | null; senators: Senator[];
  integrity: { recordCount: number; rawCount: number; duplicates: number; sha256: string };
}
export function brasiliaDay(now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
export function senateProfileUrl(id: number) { return `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${id}`; }
const array = <T,>(value: T | T[] | undefined): T[] => value ? Array.isArray(value) ? value : [value] : [];
const required = (value: unknown) => { if (typeof value !== "string" || !value.trim()) throw new Error("Registro do Senado sem campo obrigatório."); return value.trim(); };
const idValue = (value: unknown) => { const id = Number(value); if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Identificador do Senado inválido."); return id; };
function date(value: unknown): string {
  const input = required(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input) || !Number.isFinite(Date.parse(input)) || new Date(input).toISOString().slice(0, 10) !== input) throw new Error("Data do Senado inválida.");
  return input;
}
export function senatePhoto(value: unknown): string | null {
  try {
    if (typeof value !== "string" || /[\s\\]/.test(value)) return null;
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.hostname !== "www.senado.leg.br" || url.username || url.password || url.port || !/^\/senadores\/img\/fotos-oficiais\/senador\d+\.jpg$/.test(url.pathname) || url.search || url.hash) return null;
    url.protocol = "https:"; return url.href;
  } catch { return null; }
}
async function digest(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(n => n.toString(16).padStart(2, "0")).join("");
}
type Raw = Record<string, unknown>;
function normalizeSenator(raw: Raw, reference: string): Senator {
  const identification = raw?.IdentificacaoParlamentar as Raw, mandate = raw?.Mandato as Raw;
  if (!identification || !mandate) throw new Error("Estrutura de senador inválida.");
  const legislaturas = [mandate.PrimeiraLegislaturaDoMandato, mandate.SegundaLegislaturaDoMandato].map(value => {
    const row = value as Raw;
    return { numero: idValue(row?.NumeroLegislatura), inicio: date(row?.DataInicio), fim: date(row?.DataFim) };
  });
  const exercises = array((mandate.Exercicios as { Exercicio?: Raw | Raw[] })?.Exercicio)
    .map(row => ({ inicio: date(row.DataInicio), fim: row.DataFim ? date(row.DataFim) : null }))
    .filter(row => row.inicio <= reference && (!row.fim || row.fim >= reference)).sort((a, b) => b.inicio.localeCompare(a.inicio));
  if (!exercises.length) throw new Error("Registro sem exercício vigente na data consultada; eleitos futuros não são incluídos.");
  return { id: idValue(identification.CodigoParlamentar), nome: required(identification.NomeParlamentar), siglaUf: required(identification.UfParlamentar), siglaPartido: required(identification.SiglaPartidoParlamentar), urlFoto: senatePhoto(identification.UrlFotoParlamentar), mandatoId: idValue(mandate.CodigoMandato), participacao: required(mandate.DescricaoParticipacao), mandatoInicio: legislaturas[0].inicio, mandatoFim: legislaturas[1].fim, legislaturas, exercicioInicio: exercises[0].inicio, exercicioFim: exercises[0].fim };
}
export async function validateSenateDataset(value: unknown): Promise<SenateDataset> {
  const fail = () => { throw new Error("O conjunto de senadores está incompleto ou falhou na validação."); };
  if (!value || typeof value !== "object") return fail();
  const data = value as SenateDataset, { integrity, ...payload } = data;
  if (data.schemaVersion !== 1 || data.complete !== true || data.source !== SENATE_ENDPOINT || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(data.fetchedAt) || !Number.isFinite(Date.parse(data.fetchedAt)) || Date.parse(data.fetchedAt) > Date.now() + 300000 || data.referenceDate !== brasiliaDay(new Date(data.fetchedAt)) || (data.sourceVersion !== null && typeof data.sourceVersion !== "string") || !Array.isArray(data.senators) || data.senators.length !== 81 || integrity?.recordCount !== 81 || !Number.isSafeInteger(integrity.duplicates) || integrity.duplicates < 0 || integrity.rawCount !== 81 + integrity.duplicates || !/^[a-f0-9]{64}$/.test(integrity.sha256)) return fail();
  const ids = new Set<number>(), seats = new Set<number>();
  for (const row of data.senators) {
    if (!Number.isSafeInteger(row.id) || row.id <= 0 || !Number.isSafeInteger(row.mandatoId) || row.mandatoId <= 0 || ids.has(row.id) || seats.has(row.mandatoId) || !STATES.includes(row.siglaUf) || !required(row.nome) || !required(row.siglaPartido) || !required(row.participacao) || (row.urlFoto !== null && senatePhoto(row.urlFoto) !== row.urlFoto) || !Array.isArray(row.legislaturas) || row.legislaturas.length !== 2) return fail();
    if (date(row.mandatoInicio) > data.referenceDate || date(row.mandatoFim) < data.referenceDate || date(row.exercicioInicio) > data.referenceDate || (row.exercicioFim !== null && date(row.exercicioFim) < data.referenceDate)) return fail();
    for (const leg of row.legislaturas) if (!Number.isSafeInteger(leg.numero) || leg.numero <= 0 || date(leg.inicio) > date(leg.fim)) return fail();
    if (row.mandatoInicio !== row.legislaturas[0].inicio || row.mandatoFim !== row.legislaturas[1].fim || Date.parse(row.legislaturas[1].inicio) - Date.parse(row.legislaturas[0].fim) !== 86400000 || row.legislaturas[1].numero !== row.legislaturas[0].numero + 1) return fail();
    ids.add(row.id); seats.add(row.mandatoId);
  }
  // Constitutional capacity is a validation guard, never a source of fake rows.
  if (STATES.some(uf => data.senators.filter(row => row.siglaUf === uf).length !== 3) || await digest({ ...payload, counts: { rawCount: integrity.rawCount, duplicates: integrity.duplicates } }) !== integrity.sha256) return fail();
  return data;
}
export async function createSenateDataset(body: unknown, fetchedAt = new Date().toISOString()): Promise<SenateDataset> {
  const root = (body as { ListaParlamentarEmExercicio?: { Metadados?: { Versao?: string }; Parlamentares?: { Parlamentar?: Raw | Raw[] } } })?.ListaParlamentarEmExercicio;
  if (!root?.Parlamentares?.Parlamentar) throw new Error("Resposta incompleta do Senado.");
  const referenceDate = brasiliaDay(new Date(fetchedAt)), records = array(root.Parlamentares.Parlamentar), unique = new Map<number, Senator>();
  for (const raw of records) {
    const row = normalizeSenator(raw, referenceDate);
    if (unique.has(row.id) && JSON.stringify(unique.get(row.id)) !== JSON.stringify(row)) throw new Error("Registros conflitantes de senador.");
    unique.set(row.id, row);
  }
  const payload = { schemaVersion: 1 as const, complete: true as const, source: SENATE_ENDPOINT, fetchedAt, referenceDate, sourceVersion: root.Metadados?.Versao ?? null, senators: [...unique.values()].sort((a, b) => a.id - b.id) };
  const counts = { rawCount: records.length, duplicates: records.length - unique.size };
  return validateSenateDataset({ ...payload, integrity: { recordCount: unique.size, ...counts, sha256: await digest({ ...payload, counts }) } });
}
export function fetchSenators() {
  return withCamaraBudget(SENATE_ENDPOINT, 70000, undefined, async budget => createSenateDataset(await fetchCamaraJson(SENATE_ENDPOINT, budget)));
}
export function senatePeriodWarning(data: SenateDataset, today = brasiliaDay()): boolean {
  return data.senators.some(row => row.mandatoFim < today || (row.exercicioFim !== null && row.exercicioFim < today) || row.legislaturas.some(leg => data.referenceDate <= leg.fim && leg.fim < today));
}
export function senatePartyDistribution(rows: Senator[]) {
  return [...new Set(rows.map(row => row.siglaPartido))].map(category => ({ category, count: rows.filter(row => row.siglaPartido === category).length })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}
