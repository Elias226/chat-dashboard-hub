import { useState } from "react";
import { Link } from "react-router-dom";
import { useProposals } from "@/hooks/useProposals";
import { proposalGroups } from "@/lib/indicatorVisuals";
import { PROPOSALS_DOCS } from "@/services/camaraProposals";
import DistributionChart from "./DistributionChart";
import { Button } from "./ui/button";
function PublishedProposalCharts() {
  const query = useProposals(), data = query.data;
  if (query.isPending) return <p role="status" className="p-6">Carregando o recorte publicado…</p>;
  if (query.error) return <div role="alert" className="p-6"><p>{query.error.message}</p><Button className="mt-3" variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>;
  if (!data) return null;
  const groups = proposalGroups(data.records, data.coverage.start, data.coverage.end);
  const props = { fetchedAt: data.fetchedAt, label: "Proposições", sourceUrl: PROPOSALS_DOCS, sourceLabel: "Câmara · documentação de proposições", variant: "bar" as const };
  return <div className="p-4 sm:p-6"><p className="mb-5 rounded-xl border border-[#F3B95F]/60 bg-[#F3B95F]/10 p-4 text-sm leading-7"><strong>Somente o recorte recente publicado, não todo o acervo legislativo.</strong><br />{data.records.length} proposições (PL, PEC e PLP) apresentadas de {data.coverage.start.split("-").reverse().join("/")} a {data.coverage.end.split("-").reverse().join("/")}. Contagens derivadas do mesmo conjunto completo da pesquisa.</p>
    <div className="grid items-start gap-5 lg:grid-cols-2"><DistributionChart {...props} id="proposals-types" title="Proposições por tipo" description="Quantidade de PL, PEC e PLP dentro do período publicado." data={groups.types} color="#167D8D" /><DistributionChart {...props} id="proposals-days" title="Proposições por dia de apresentação" description="Datas registradas pela Câmara, em ordem cronológica. Zero indica ausência de registros nesse dia do recorte; não mede atividade parlamentar total." data={groups.days} color="#17324D" /></div>
    <Link to="/projetos-de-lei" className="mt-5 inline-block text-sm font-semibold text-[#167D8D] underline">Pesquisar as proposições deste recorte →</Link>
  </div>;
}
export default function ProposalIndicators() {
  const [open, setOpen] = useState(false);
  return <details className="mt-8 rounded-2xl border bg-white" onToggle={event => setOpen(event.currentTarget.open)}><summary className="cursor-pointer px-5 py-5 text-base font-semibold text-[#17324D]">Projetos de lei · indicadores do recorte recente</summary>{open && <PublishedProposalCharts />}</details>;
}
