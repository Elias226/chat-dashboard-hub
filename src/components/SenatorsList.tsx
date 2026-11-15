import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSenators } from "@/hooks/useSenators";
import { deputyFilterOptions, filterDeputies } from "@/lib/deputyFilters";
import DeputyPhoto from "./DeputyPhoto";
import SenateSource from "./SenateSource";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
export default function SenatorsList() {
  const { data, isPending, error, refetch } = useSenators();
  const [name, setName] = useState(""), [uf, setUf] = useState(""), [party, setParty] = useState(""), [visible, setVisible] = useState(20);
  const rows = useMemo(() => filterDeputies(data?.senators ?? [], name, uf, party), [data, name, uf, party]);
  const selectClass = "mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm";
  return <>
    <h1 className="text-3xl font-semibold text-[#17324D] sm:text-4xl">Conheça os senadores</h1>
    <p className="my-5 max-w-3xl leading-7">Consulte os senadores em exercício no momento da coleta oficial. Pesquise por nome e combine UF e partido. Titulares afastados e suplentes sem exercício não são acrescentados à lista.</p>
    <section aria-label="Filtros de senadores" className="my-6 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div><label htmlFor="senator-name" className="text-sm font-medium">Nome do senador</label><Input id="senator-name" value={name} onChange={e => { setName(e.target.value); setVisible(20); }} className="mt-2" placeholder="Pesquisar por nome..." /></div>
      <div><label htmlFor="senator-state" className="text-sm font-medium">Estado (UF)</label><select id="senator-state" value={uf} onChange={e => { setUf(e.target.value); setVisible(20); }} className={selectClass}><option value="">Todas as UFs</option>{deputyFilterOptions(data?.senators ?? [], "siglaUf").map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <div><label htmlFor="senator-party" className="text-sm font-medium">Partido</label><select id="senator-party" value={party} onChange={e => { setParty(e.target.value); setVisible(20); }} className={selectClass}><option value="">Todos os partidos</option>{deputyFilterOptions(data?.senators ?? [], "siglaPartido").map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <Button variant="outline" className="self-end" onClick={() => { setName(""); setUf(""); setParty(""); setVisible(20); }}>Limpar filtros</Button>
    </section>
    {isPending ? <p role="status" className="py-16">Carregando senadores publicados…</p> : error ? <div role="alert" className="rounded-xl border bg-white p-6"><p>{error.message}</p><Button variant="outline" className="mt-3" onClick={() => void refetch()}>Tentar novamente</Button></div> : data && <>
      <SenateSource data={data} />
      <p role="status" className="my-5 text-sm text-muted-foreground">{rows.length} de {data.senators.length} senadores encontrados</p>
      {rows.length ? <ul aria-label="Senadores encontrados" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.slice(0, visible).map(row => <li key={row.id}><Link to={`/parlamentares/senadores/${row.id}`} aria-label={`Ver detalhes de ${row.nome}`} className="flex h-full gap-4 rounded-xl border bg-white p-5 hover:border-[#167D8D]"><DeputyPhoto src={row.urlFoto} name={row.nome} className="h-24 w-20" /><div className="min-w-0"><h2 className="font-semibold text-[#17324D]">{row.nome}</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Partido: {row.siglaPartido}<br />UF: {row.siglaUf}</p><span className="mt-3 block text-xs font-semibold text-[#167D8D]">Ver detalhes →</span></div></Link></li>)}</ul> : <p className="rounded-xl border bg-white p-8">Nenhum senador encontrado com os filtros selecionados.</p>}
      {rows.length > visible && <Button variant="outline" className="mt-6" onClick={() => setVisible(count => count + 20)}>Carregar mais</Button>}
    </>}
  </>;
}
