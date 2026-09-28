import type { MessageSource } from "@/types/chat";

function getReadableCamaraSource(pathname: string): MessageSource | null {
  const deputadoMatch = pathname.match(/^\/api\/v2\/deputados\/(\d+)/);

  if (deputadoMatch) {
    return {
      title: "Câmara dos Deputados - perfil parlamentar",
      url: `https://www.camara.leg.br/deputados/${deputadoMatch[1]}`,
    };
  }

  const proposicaoMatch = pathname.match(/^\/api\/v2\/proposicoes\/(\d+)/);

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

export function normalizeOfficialSource(source: MessageSource): MessageSource {
  try {
    const parsedUrl = new URL(source.url);
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host === "dadosabertos.camara.leg.br") {
      return getReadableCamaraSource(parsedUrl.pathname) || source;
    }

    if (host === "legis.senado.leg.br") {
      return getReadableSenadoSource(parsedUrl.pathname) || source;
    }

    return source;
  } catch {
    return source;
  }
}

export function getSourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "fonte oficial";
  }
}
