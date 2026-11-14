import { CAMARA_DETAIL_BUDGET_MS, CAMARA_LIST_BUDGET_MS, fetchCamaraJson, withCamaraBudget } from "./camaraHttp.ts";

export const DEPUTIES_ENDPOINT = "https://dadosabertos.camara.leg.br/api/v2/deputados";
export const DEPUTIES_QUERY_URL = `${DEPUTIES_ENDPOINT}?ordem=ASC&ordenarPor=nome&pagina=1&itens=100`;
export const CAMARA_DOCUMENTATION = "https://dadosabertos.camara.leg.br/swagger/api.html";

export interface Deputy {
  id: number;
  siglaUf: string | null;
  siglaPartido: string | null;
  nome?: string | null;
  urlFoto?: string | null;
}

export interface DeputiesSnapshot {
  complete: true;
  deputies: Deputy[];
  fetchedAt: string;
  pages: number;
  duplicates: number;
  invalidRecords: number;
  collection?: { expectedCount: number; receivedCount: number; pages: { url: string; count: number; total: number }[] };
}

export interface DeputyGroup {
  category: string;
  count: number;
}

export interface DeputyDetails extends Deputy {
  complete: true;
  situacao: string | null;
  condicaoEleitoral: string | null;
  descricaoStatus: string | null;
  dataStatus: string | null;
  idLegislatura: number | null;
  email: string | null;
  gabinete: { nome: string | null; predio: string | null; sala: string | null; andar: string | null; telefone: string | null; email: string | null };
  fetchedAt: string;
}

export function deputyProfileUrl(id: number): string {
  return `https://www.camara.leg.br/deputados/${id}`;
}

const validUfs = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
const NOT_INFORMED = "Não informado";

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function officialUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && (url.hostname === "camara.leg.br" || url.hostname.endsWith(".camara.leg.br")) ? url.href : null;
  } catch { return null; }
}

export function normalizeRecord(record: unknown): Deputy | null {
  if (!record || typeof record !== "object") return null;
  const raw = record as Record<string, unknown>;
  if (typeof raw.id !== "number" || !Number.isSafeInteger(raw.id) || raw.id <= 0) return null;
  const uf = typeof raw.siglaUf === "string" ? raw.siglaUf.trim().toUpperCase() : "";
  const party = typeof raw.siglaPartido === "string" ? raw.siglaPartido.trim().toUpperCase() : "";
  return {
    id: raw.id,
    siglaUf: validUfs.has(uf) ? uf : null,
    siglaPartido: party && party.length <= 40 ? party : null,
    nome: textOrNull(raw.nome),
    urlFoto: officialUrl(raw.urlFoto),
  };
}

function normalizePageUrl(href: string, current: string): string {
  const url = new URL(href, current);
  if (url.origin !== new URL(DEPUTIES_ENDPOINT).origin || url.pathname !== "/api/v2/deputados" || url.username || url.password || url.hash) {
    throw new Error("A Câmara retornou um link de paginação inesperado. A consulta foi interrompida.");
  }
  return url.href;
}

/** Sem filtros temporais: deputados em exercício na consulta, conforme a documentação da Câmara. */
export async function fetchDeputies(signal?: AbortSignal, options: { verifyTotal?: boolean } = {}): Promise<DeputiesSnapshot> {
  return withCamaraBudget(DEPUTIES_QUERY_URL, CAMARA_LIST_BUDGET_MS, signal, async (budget) => {
    const deputies = new Map<number, Deputy>();
    const visited = new Set<string>();
    let url: string | null = normalizePageUrl(DEPUTIES_QUERY_URL, DEPUTIES_QUERY_URL);
    let duplicates = 0;
    let invalidRecords = 0;
    let expectedCount: number | null = null;
    let receivedCount = 0;
    const receipts: { url: string; count: number; total: number }[] = [];
    while (url) {
      const canonical = new URL(url);
      canonical.searchParams.sort();
      if (visited.has(canonical.href) || visited.size >= 100) throw new Error("Não foi possível concluir a paginação da Câmara. Nenhum resultado parcial será exibido.");
      visited.add(canonical.href);
      let total = 0;
      const response = await fetchCamaraJson(url, budget, (http) => {
        if (!options.verifyTotal) return;
        const header = http.headers.get("X-Total-Count");
        if (!header || !/^[1-9]\d*$/.test(header) || !Number.isSafeInteger(Number(header))) throw new Error("A fonte não informou um total válido para verificar a integridade.");
        total = Number(header);
        if (expectedCount !== null && expectedCount !== total) throw new Error("O total da fonte mudou durante a paginação. A publicação foi interrompida.");
        expectedCount = total;
      });
      if (!response || typeof response !== "object") throw new Error("Formato de resposta inesperado da Câmara.");
      const page = response as Record<string, unknown>;
      if (!Array.isArray(page.dados) || !Array.isArray(page.links)) throw new Error("Formato de resposta inesperado da Câmara.");
      receivedCount += page.dados.length;
      receipts.push({ url, count: page.dados.length, total });
      for (const raw of page.dados) {
        const record = normalizeRecord(raw);
        if (options.verifyTotal && (!record || !record.nome || !record.siglaUf || !record.siglaPartido)) throw new Error("Registro sem identificador, nome, UF ou partido válido. Nenhum conjunto parcial será publicado.");
        if (!record) { invalidRecords += 1; continue; }
        // Uma pessoa conta uma vez. Em duplicatas, mantém-se a primeira ocorrência.
        if (deputies.has(record.id)) {
          if (options.verifyTotal && JSON.stringify(deputies.get(record.id)) !== JSON.stringify(record)) throw new Error("Registros conflitantes para o mesmo deputado. Publicação interrompida.");
          duplicates += 1;
        }
        else deputies.set(record.id, record);
      }
      const next: string[] = [];
      for (const raw of page.links) {
        if (!raw || typeof raw !== "object" || typeof raw.rel !== "string" || typeof raw.href !== "string") throw new Error("A Câmara retornou links de paginação inválidos.");
        if (raw.rel === "next") next.push(raw.href);
      }
      if (next.length > 1) throw new Error("A Câmara retornou uma paginação ambígua.");
      url = next.length ? normalizePageUrl(next[0], url) : null;
      if (url && options.verifyTotal) {
        // Alguns links da fonte omitem a ordenação padrão. Mantém explicitamente
        // a mesma consulta ao seguir o link, sem inventar o número da próxima página.
        const nextUrl = new URL(url);
        const initial = new URL(DEPUTIES_QUERY_URL);
        for (const field of ["ordem", "ordenarPor", "itens"]) {
          if (!nextUrl.searchParams.has(field)) nextUrl.searchParams.set(field, initial.searchParams.get(field)!);
        }
        url = nextUrl.href;
      }
    }
    if (!deputies.size && invalidRecords) throw new Error("A consulta não retornou registros com identificadores válidos. Os indicadores não podem ser calculados.");
    if (options.verifyTotal && (!expectedCount || deputies.size !== expectedCount)) throw new Error("A quantidade de identificadores únicos não corresponde ao total oficial. Nenhum resultado parcial será publicado.");
    return { complete: true, deputies: [...deputies.values()], fetchedAt: new Date().toISOString(), pages: visited.size, duplicates, invalidRecords,
      ...(options.verifyTotal ? { collection: { expectedCount: expectedCount!, receivedCount, pages: receipts } } : {}) };
  });
}

export function groupDeputies(deputies: Deputy[], field: "siglaUf" | "siglaPartido"): DeputyGroup[] {
  const counts = new Map<string, number>();
  for (const deputy of deputies) {
    const category = deputy[field] ?? NOT_INFORMED;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts].map(([category, count]) => ({ category, count })).sort((a, b) => {
    if (a.category === NOT_INFORMED) return 1;
    if (b.category === NOT_INFORMED) return -1;
    return (field === "siglaPartido" ? b.count - a.count : 0) || a.category.localeCompare(b.category, "pt-BR");
  });
}

/** O endpoint individual contém o último registro disponível; pode incluir ex-deputados. */
export async function fetchDeputyDetails(id: number, signal?: AbortSignal): Promise<DeputyDetails> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Identificador de deputado inválido.");
  return withCamaraBudget(`${DEPUTIES_ENDPOINT}/${id}`, CAMARA_DETAIL_BUDGET_MS, signal, async (budget) => {
    const response = await fetchCamaraJson(`${DEPUTIES_ENDPOINT}/${id}`, budget);
    if (!response || typeof response !== "object" || !("dados" in response)) throw new Error("Formato de resposta inesperado da Câmara.");
    const value = response.dados;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("A Câmara não retornou os dados do deputado solicitado.");
    const raw = value as Record<string, unknown>;
    if (raw.id !== id) throw new Error("A Câmara não retornou os dados do deputado solicitado.");
    const status: Record<string, unknown> = raw.ultimoStatus && typeof raw.ultimoStatus === "object" && !Array.isArray(raw.ultimoStatus) ? raw.ultimoStatus as Record<string, unknown> : {};
    const normalized = normalizeRecord({ ...status, id })!;
    const gabinete: Record<string, unknown> = status.gabinete && typeof status.gabinete === "object" && !Array.isArray(status.gabinete) ? status.gabinete as Record<string, unknown> : {};
    return {
      complete: true,
      ...normalized,
      situacao: textOrNull(status.situacao),
      condicaoEleitoral: textOrNull(status.condicaoEleitoral),
      descricaoStatus: textOrNull(status.descricaoStatus),
      dataStatus: textOrNull(status.data),
      idLegislatura: typeof status.idLegislatura === "number" && Number.isSafeInteger(status.idLegislatura) && status.idLegislatura > 0 ? status.idLegislatura : null,
      email: textOrNull(status.email),
      gabinete: { nome: textOrNull(gabinete.nome), predio: textOrNull(gabinete.predio), sala: textOrNull(gabinete.sala), andar: textOrNull(gabinete.andar), telefone: textOrNull(gabinete.telefone), email: textOrNull(gabinete.email) },
      fetchedAt: new Date().toISOString(),
    };
  });
}
