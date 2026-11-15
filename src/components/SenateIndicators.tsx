import { useSenators } from "@/hooks/useSenators";
import { SENATE_COMPOSITION, SENATE_DOCUMENTATION, senatePartyDistribution } from "@/services/senate";
import PartyHemicycle from "./PartyHemicycle";
import SenateSource from "./SenateSource";
import { Button } from "./ui/button";
export default function SenateIndicators({ search }: { search: string }) {
  const query = useSenators(), data = query.data;
  if (query.isPending) return <p role="status" className="py-16">Carregando indicadores do Senado…</p>;
  if (query.error) return <div role="alert" className="rounded-xl border p-6"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>;
  if (!data) return null;
  const partyVisible = "senadores por partido distribuição partidária".normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  const periods = [...new Set(data.senators.map(row => `${row.mandatoInicio}/${row.mandatoFim}`))].sort();
  return <>
    <SenateSource data={data} />
    <p className="my-5 text-sm">{data.senators.length} senadores em exercício no conjunto publicado. Cada identificador e cada cadeira são contados uma única vez.</p>
    {partyVisible ? <PartyHemicycle id="senate-party" title="Senadores por partido" data={senatePartyDistribution(data.senators)} fetchedAt={data.fetchedAt} label="Senadores" sourceUrl={SENATE_DOCUMENTATION} sourceLabel="Dados Abertos do Senado · documentação" /> : <p className="py-8 text-muted-foreground">Nenhum gráfico encontrado.</p>}
    <section className="my-6 rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold text-[#17324D]">Como funcionam os mandatos no Senado</h2><p className="my-4 text-sm leading-7">Cada estado e o Distrito Federal elegem três senadores para mandatos de oito anos. A renovação ocorre a cada quatro anos, alternadamente por um e dois terços. O período da cadeira não equivale ao tempo de exercício de uma pessoa: suplentes podem assumir durante afastamentos ou sucessões.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="pb-3 text-left font-medium">Períodos das cadeiras representadas nesta consulta</caption><thead><tr><th className="p-3" scope="col">Mandato da cadeira</th><th className="p-3" scope="col">Senadores em exercício</th></tr></thead><tbody>{periods.map(period => { const [start, end] = period.split("/"); return <tr key={period} className="border-t"><th className="p-3 font-normal" scope="row">{start.split("-").reverse().join("/")} a {end.split("-").reverse().join("/")}</th><td className="p-3">{data.senators.filter(row => row.mandatoInicio === start && row.mandatoFim === end).length}</td></tr>; })}</tbody></table></div>
      <p className="mt-4 text-xs text-muted-foreground">Estes registros não projetam a composição eleita para 2027. O endpoint de exercício será consultado novamente na transição.</p><a href={SENATE_COMPOSITION} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-[#167D8D] underline">Fonte institucional: composição do Senado</a>
    </section>
  </>;
}
