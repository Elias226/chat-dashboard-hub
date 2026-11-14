import { describe, expect, it } from "vitest";
import { getSourceHost, normalizeOfficialSource } from "./sourceLinks";
import type { MessageSource } from "@/types/chat";

describe("fontes oficiais: protocolo, autoridade e normalização", () => {
  it.each([
    "https://www.camara.leg.br/", "https://www2.camara.leg.br/atividade-legislativa",
    "https://www12.senado.leg.br/dados-abertos", "https://www25.senado.leg.br/web/senadores/em-exercicio",
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados", "https://cidades.ibge.gov.br/",
    "https://dadosabertos.tse.jus.br/", "https://cdn.tse.jus.br/estatistica/arquivo.zip",
    "https://divulgacandcontas.tse.jus.br/", "https://api.portaldatransparencia.gov.br/api-de-dados",
    "https://portaldatransparencia.gov.br/", "https://www.gov.br/planalto/pt-br/",
  ])("preserva host autorizado: %s", (url) => {
    expect(normalizeOfficialSource({ title: "Fonte de teste", url })).toEqual({ title: "Fonte de teste", url });
  });
  it("preserva links antigos por HTTPS, parsing case-insensitive e porta padrão", () => {
    expect(normalizeOfficialSource({ title: "Câmara", url: " HTTP://WWW.CAMARA.LEG.BR:80/ " })?.url).toBe("https://www.camara.leg.br/");
    expect(normalizeOfficialSource({ title: "Câmara", url: "https://www.camara.leg.br:443/" })?.url).toBe("https://www.camara.leg.br/");
  });
  it("transforma URLs de API em páginas oficiais legíveis", () => {
    expect(normalizeOfficialSource({ title: "Fonte", url: "https://dadosabertos.camara.leg.br/api/v2/deputados/62881" })?.url).toBe("https://www.camara.leg.br/deputados/62881");
    expect(normalizeOfficialSource({ title: "Fonte", url: "https://dadosabertos.camara.leg.br/api/v2/proposicoes/123/tramitacoes" })?.url).toBe("https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=123");
    expect(normalizeOfficialSource({ title: "Fonte", url: "https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json" })?.url).toBe("https://www25.senado.leg.br/web/senadores/em-exercicio");
  });
  it.each([
    "javascript:alert(1)", "JaVaScRiPt:void(0)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)",
    "file:///etc/passwd", "blob:https://www.camara.leg.br/example", "//www.camara.leg.br/", "/api/v2/deputados",
    "https://www.camara.leg.br.evil.example/", "https://evilcamara.leg.br/", "https://www.camara.leg.br@evil.example/",
    "https://attacker@www.camara.leg.br/", "https://user:password@www.camara.leg.br/", "https://www.camara.leg.br:444/",
    "https://www.camara.leg.br./", "https://www.cаmara.leg.br/", "https://new-unreviewed.gov.br/",
    "https://www.camara.leg.br\\@evil.example/", "https://www.camara.leg.br\n.evil.example/", "https://www.camara.leg.br/pa\tth",
    "not a URL", "",
  ])("rejeita URL não autorizada: %s", (url) => {
    expect(normalizeOfficialSource({ title: "Fonte", url })).toBeNull();
    expect(getSourceHost(url)).toBe("fonte indisponível");
  });
  it("recusa fontes malformadas sem lançar exceção", () => {
    for (const value of [null, undefined, {}, { title: 1, url: "https://www.camara.leg.br/" }, { title: "", url: "https://www.camara.leg.br/" }]) {
      expect(normalizeOfficialSource(value as MessageSource)).toBeNull();
    }
  });
});
