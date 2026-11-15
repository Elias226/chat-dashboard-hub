import { PROPOSALS_DOCS } from "@/services/camaraProposals";

export default function ProposalReference({ fetchedAt, start, end }: { fetchedAt?: string; start?: string; end?: string }) {
  return <aside className="rounded-xl border border-[#17324D]/15 bg-[#F5F8FB] p-5 text-sm leading-7">
    <p className="font-semibold text-[#17324D]">Uma proposta não é automaticamente uma lei</p>
    <p>Apresentação, aprovação em comissão ou em uma das Casas e publicação de uma norma são etapas diferentes. A situação e as movimentações abaixo reproduzem registros da Câmara; não certificam, por si só, a conversão em lei. Uma PEC segue rito próprio, sem sanção presidencial.</p>
    {start && end && <p className="mt-2">Publicação pesquisável por assunto: PL, PEC e PLP com data de apresentação de <strong>{start.split("-").reverse().join("/")}</strong> a <strong>{end.split("-").reverse().join("/")}</strong>, inclusive. Não é todo o acervo legislativo.</p>}
    {fetchedAt && <p className="mt-2 text-xs text-muted-foreground">Consulta oficial: {new Date(fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília). Os registros podem mudar na fonte.</p>}
    <a href={PROPOSALS_DOCS} target="_blank" rel="noopener noreferrer" className="text-[#167D8D] underline">Documentação oficial da Câmara</a>
  </aside>;
}
