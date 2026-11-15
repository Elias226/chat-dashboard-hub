import { fetchCamaraJson, withCamaraBudget, type CamaraBudget } from "./camaraHttp.ts";

export const PROPOSALS_API = "https://dadosabertos.camara.leg.br/api/v2/proposicoes";
export const PROPOSALS_DOCS = "https://dadosabertos.camara.leg.br/swagger/api.html";
export const PROPOSAL_TYPES = ["PL", "PEC", "PLP"] as const;
export type ProposalType = typeof PROPOSAL_TYPES[number];
export interface Proposal {
  id: number; siglaTipo: ProposalType; numero: number; ano: number; ementa: string;
  dataApresentacao: string | null;
}
export interface Movement {
  dataHora: string | null; sequencia: number | null; orgao: string | null;
  descricao: string | null; situacao: string | null; despacho: string | null;
}
export interface ProposalDetail extends Proposal {
  keywords: string | null; ementaDetalhada: string | null;
  situacao: string | null; ultimaMovimentacao: Movement | null;
  autores: string[]; tramitacoes: Movement[];
}
export interface PageReceipt { url: string; count: number; total: number | null }
export function officialProposalUrl(id: number) { return `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`; }
export function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
export function positive(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) > 0; }
export function normalizeProposal(value: unknown): Proposal {
  if (!value || typeof value !== "object") throw new Error("Registro de proposição inválido.");
  const row = value as Record<string, unknown>;
  if (!positive(row.id) || !positive(row.numero) || !positive(row.ano) || Number(row.ano) < 1900 || Number(row.ano) > 2100 || !PROPOSAL_TYPES.includes(row.siglaTipo as ProposalType) || !text(row.ementa)) throw new Error("Proposição sem identificação ou ementa válida.");
  const date = text(row.dataApresentacao);
  if (date && (!/^\d{4}-\d{2}-\d{2}T/.test(date) || !Number.isFinite(Date.parse(date)))) throw new Error("Data de apresentação inválida.");
  return { id: row.id, siglaTipo: row.siglaTipo as ProposalType, numero: row.numero, ano: row.ano, ementa: text(row.ementa)!, dataApresentacao: date };
}
function movement(value: unknown): Movement {
  if (!value || typeof value !== "object") throw new Error("Tramitação inválida.");
  const row = value as Record<string, unknown>;
  const date = text(row.dataHora);
  if (date && !Number.isFinite(Date.parse(date))) throw new Error("Data de tramitação inválida.");
  return { dataHora: date, sequencia: positive(Number(row.sequencia)) ? Number(row.sequencia) : null, orgao: text(row.siglaOrgao), descricao: text(row.descricaoTramitacao), situacao: text(row.descricaoSituacao), despacho: text(row.despacho) };
}
/** Follow only official next links, retaining omitted scope parameters. No guessed pages. */
export async function proposalPages(initial: string, budget: CamaraBudget, requireTotal = false) {
  const base = new URL(initial), seen = new Set<string>(), rows: unknown[] = [], pages: PageReceipt[] = [];
  let url: string | null = initial, expected: number | null = null;
  while (url) {
    if (seen.has(url) || pages.length >= 100) throw new Error("Paginação de proposições cíclica ou excessiva.");
    seen.add(url);
    let total: number | null = null;
    const body = await fetchCamaraJson(url, budget, response => {
      const header = response.headers.get("X-Total-Count");
      if (header !== null) {
        if (!/^\d+$/.test(header)) throw new Error("Total oficial inválido.");
        total = Number(header);
        if (!Number.isSafeInteger(total)) throw new Error("Total oficial inválido.");
      }
    }) as { dados?: unknown[]; links?: { rel: string; href: string }[] };
    if (!Array.isArray(body?.dados) || !Array.isArray(body.links)) throw new Error("Resposta de listagem inválida.");
    if (requireTotal && total === null) throw new Error("A Câmara não informou o total do recorte.");
    if (pages.length && total !== expected) throw new Error("O total oficial mudou durante a consulta.");
    expected = total;
    rows.push(...body.dados); pages.push({ url, count: body.dados.length, total });
    if (rows.length > 10000 || (requireTotal && (total! > 250 || rows.length > 300))) throw new Error("Recorte excede o limite seguro desta publicação; nenhum resultado parcial será publicado.");
    const next = body.links.filter(link => link.rel === "next");
    if (next.length > 1) throw new Error("Paginação ambígua.");
    url = null;
    if (next.length) {
      if (!body.dados.length) throw new Error("Página vazia com continuação.");
      const parsed = new URL(next[0].href);
      if (parsed.origin !== base.origin || parsed.pathname !== base.pathname || parsed.username || parsed.password || parsed.hash) throw new Error("Link de paginação não autorizado.");
      for (const [key, value] of base.searchParams) {
        if (key === "pagina") continue;
        if (parsed.searchParams.has(key) && parsed.searchParams.get(key) !== value) throw new Error("A paginação alterou o filtro.");
        parsed.searchParams.set(key, value);
      }
      for (const key of parsed.searchParams.keys()) if (key !== "pagina" && !base.searchParams.has(key)) throw new Error("A paginação adicionou um filtro inesperado.");
      if (parsed.searchParams.getAll("pagina").length !== 1 || Number(parsed.searchParams.get("pagina")) !== pages.length + 1) throw new Error("Sequência de páginas inválida.");
      url = parsed.href;
    }
  }
  if (expected !== null && expected !== rows.length) throw new Error("A listagem oficial está incompleta.");
  return { rows, pages, expected };
}
export async function proposalDetail(id: number, budget: CamaraBudget): Promise<ProposalDetail> {
  if (!positive(id)) throw new Error("Identificador inválido.");
  const url = `${PROPOSALS_API}/${id}`;
  const body = await fetchCamaraJson(url, budget) as { dados?: Record<string, unknown> };
  const record = normalizeProposal(body?.dados);
  if (record.id !== id) throw new Error("A Câmara retornou outra proposição.");
  const authors = await proposalPages(`${url}/autores`, budget);
  const history = await proposalPages(`${url}/tramitacoes`, budget);
  const names = authors.rows.map(row => text((row as { nome?: unknown })?.nome));
  if (names.some(name => !name)) throw new Error("Registro de autoria inválido.");
  const status = body.dados!.statusProposicao as Record<string, unknown> | undefined;
  const tramitacoes = history.rows.map(movement).sort((a, b) => (b.dataHora ?? "").localeCompare(a.dataHora ?? "") || (b.sequencia ?? 0) - (a.sequencia ?? 0));
  return { ...record, keywords: text(body.dados!.keywords), ementaDetalhada: text(body.dados!.ementaDetalhada), situacao: text(status?.descricaoSituacao), ultimaMovimentacao: status ? movement(status) : tramitacoes[0] ?? null, autores: [...new Set(names as string[])], tramitacoes };
}
export function fetchProposalDetail(id: number, signal?: AbortSignal) {
  return withCamaraBudget(`${PROPOSALS_API}/${id}`, 70000, signal, budget => proposalDetail(id, budget));
}
export async function searchOfficialProposal(type: ProposalType, number: string, year: string, signal?: AbortSignal) {
  if (!PROPOSAL_TYPES.includes(type) || !/^[1-9]\d{0,6}$/.test(number) || !/^(19|20)\d{2}$/.test(year)) throw new Error("Informe tipo, número positivo e ano com quatro dígitos (1900–2099).");
  const url = `${PROPOSALS_API}?siglaTipo=${type}&numero=${number}&ano=${year}&itens=100&ordem=ASC&ordenarPor=id`;
  return withCamaraBudget(url, 70000, signal, async budget => {
    const { rows } = await proposalPages(url, budget);
    const records = rows.map(normalizeProposal);
    if (records.some(row => row.siglaTipo !== type || row.numero !== Number(number) || row.ano !== Number(year))) throw new Error("A resposta oficial não corresponde aos filtros solicitados.");
    return { records: [...new Map(records.map(row => [row.id, row])).values()], fetchedAt: new Date().toISOString() };
  });
}
export function recentProposalUrl(start: string, end: string) {
  return `${PROPOSALS_API}?siglaTipo=PL,PEC,PLP&dataApresentacaoInicio=${start}&dataApresentacaoFim=${end}&itens=100&ordem=ASC&ordenarPor=id`;
}
export function filterProposals(records: ProposalDetail[], type: string, number: string, year: string, subject: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const terms = normalize(subject).trim().split(/\s+/).filter(Boolean);
  return records.filter(row => (!type || row.siglaTipo === type) && (!number || String(row.numero) === number.trim()) && (!year || String(row.ano) === year.trim()) && terms.every(term => normalize(`${row.ementa} ${row.ementaDetalhada ?? ""} ${row.keywords ?? ""}`).includes(term)));
}
