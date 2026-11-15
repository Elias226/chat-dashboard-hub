import type { MessageSource } from "@/types/chat";

// Hosts reviewed against the sources already supported by the project.
// Exact matching prevents suffix traps, lookalikes and arbitrary gov.br tenants.
const officialHosts = new Set([
  "camara.leg.br", "www.camara.leg.br", "www2.camara.leg.br", "dadosabertos.camara.leg.br",
  "senado.leg.br", "www.senado.leg.br", "legis.senado.leg.br", "www12.senado.leg.br", "www25.senado.leg.br", "adm.senado.leg.br",
  "ibge.gov.br", "www.ibge.gov.br", "servicodados.ibge.gov.br", "cidades.ibge.gov.br",
  "tse.jus.br", "www.tse.jus.br", "dadosabertos.tse.jus.br", "cdn.tse.jus.br", "divulgacandcontas.tse.jus.br",
  "portaldatransparencia.gov.br", "www.portaldatransparencia.gov.br", "api.portaldatransparencia.gov.br",
  "gov.br", "www.gov.br", "planalto.gov.br", "www.planalto.gov.br",
]);

function parseOfficialUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if ([...input].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === "\\")) return null;
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port || !officialHosts.has(url.hostname)) return null;
    // Preserve old official links while avoiding mixed/insecure navigation.
    url.protocol = "https:";
    return url;
  } catch { return null; }
}

function getReadableCamaraSource(pathname: string): MessageSource | null {
  const deputadoMatch = pathname.match(/^\/api\/v2\/deputados\/([1-9]\d*)(?:\/|$)/);

  if (deputadoMatch) {
    return {
      title: "Câmara dos Deputados - perfil parlamentar",
      url: `https://www.camara.leg.br/deputados/${deputadoMatch[1]}`,
    };
  }

  const proposicaoMatch = pathname.match(/^\/api\/v2\/proposicoes\/([1-9]\d*)(?:\/|$)/);

  if (proposicaoMatch) {
    return {
      title: "Câmara dos Deputados - ficha de tramitação",
      url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${proposicaoMatch[1]}`,
    };
  }

  return null;
}

function getReadableSenadoSource(pathname: string): MessageSource | null {
  if (pathname.includes("/dadosabertos/senador/lista/atual")) {
    return {
      title: "Senado Federal - senadores em exercício",
      url: "https://www25.senado.leg.br/web/senadores/em-exercicio",
    };
  }

  if (pathname.includes("/dadosabertos")) {
    return {
      title: "Senado Federal - dados abertos",
      url: "https://www12.senado.leg.br/dados-abertos",
    };
  }

  return null;
}

export function normalizeOfficialSource(source: MessageSource): MessageSource | null {
  if (!source || typeof source.title !== "string" || !source.title.trim()) return null;
  const parsedUrl = parseOfficialUrl(source.url);
  if (!parsedUrl) return null;
  const normalized = { title: source.title, url: parsedUrl.href };
  const host = parsedUrl.hostname;

  if (host === "dadosabertos.camara.leg.br") {
    return getReadableCamaraSource(parsedUrl.pathname) || normalized;
  }

  if (host === "legis.senado.leg.br") {
    return getReadableSenadoSource(parsedUrl.pathname) || normalized;
  }

  return normalized;
}

export function getSourceHost(url: string): string {
  return parseOfficialUrl(url)?.hostname.replace(/^www\./, "") ?? "fonte indisponível";
}
