import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, ArrowRight } from "lucide-react";
import { useProposals } from "@/hooks/useProposals";
import { filterProposals, searchOfficialProposal, PROPOSAL_TYPES, type ProposalType } from "@/services/camaraProposals";
import ParliamentHeader from "@/components/ParliamentHeader";
import SiteFooter from "@/components/SiteFooter";
import ProposalReference from "@/components/ProposalReference";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProjetosDeLei() {
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState(params.get("tipo") ?? "");
  const [number, setNumber] = useState(params.get("numero") ?? "");
  const [year, setYear] = useState(params.get("ano") ?? "");
  const [subject, setSubject] = useState(params.get("assunto") ?? "");
  const [visible, setVisible] = useState(20);
  const [validation, setValidation] = useState("");
  const published = useProposals();
  const exact = params.get("consulta") === "exata";
  const direct = useQuery({ queryKey: ["official-proposal-search", params.get("tipo"), params.get("numero"), params.get("ano")], enabled: exact,
    queryFn: ({ signal }) => searchOfficialProposal(params.get("tipo") as ProposalType, params.get("numero") ?? "", params.get("ano") ?? "", signal), retry: false, staleTime: 300000, refetchOnWindowFocus: false });
  const filtered = useMemo(() => filterProposals(published.data?.records ?? [], type, number, year, subject), [published.data, type, number, year, subject]);
  const records = exact ? direct.data?.records ?? [] : filtered;
  const loading = exact ? direct.isFetching : published.isPending;
  const error = exact ? direct.error : published.error;
  function submit(event: React.FormEvent) {
    event.preventDefault(); setValidation(""); setVisible(20);
    if (number && !/^[1-9]\d{0,6}$/.test(number.trim())) { setValidation("Informe um número positivo de até sete dígitos."); return; }
    if (year && !/^(19|20)\d{2}$/.test(year.trim())) { setValidation("Informe um ano entre 1900 e 2099, com quatro dígitos."); return; }
    if (type && number && year && subject.trim()) { setValidation("Para a busca exata na Câmara, limpe o assunto. A busca por assunto se limita ao recorte publicado."); return; }
    setParams({ tipo: type, numero: number.trim(), ano: year.trim(), assunto: subject, consulta: type && number && year ? "exata" : "publicacao" });
  }
  function clear() { setType(""); setNumber(""); setYear(""); setSubject(""); setVisible(20); setValidation(""); setParams({}); }
  return <div className="flex min-h-screen flex-col bg-[#F5F8FB] text-[#243746]">
    <ParliamentHeader />
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-9 sm:px-8">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#167D8D]"><FileText aria-hidden="true" className="h-4 w-4" /> Proposições · Câmara dos Deputados</p>
      <h1 className="mt-3 text-3xl font-semibold text-[#17324D] sm:text-4xl">Explore os projetos de lei</h1>
      <p className="mt-4 max-w-3xl leading-7">Pesquise propostas e acompanhe os registros de sua tramitação. Consulte PL, PEC e PLP, sem avaliações sobre autores ou conteúdo.</p>
      <form aria-label="Pesquisa de proposições" onSubmit={submit} className="my-7 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><label htmlFor="proposal-type" className="text-sm font-medium">Tipo</label><select id="proposal-type" value={type} onChange={event => { setType(event.target.value); setVisible(20); }} className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="">Todos os tipos</option>{PROPOSAL_TYPES.map(item => <option key={item}>{item}</option>)}</select></div>
        <div><label htmlFor="proposal-number" className="text-sm font-medium">Número</label><Input id="proposal-number" inputMode="numeric" maxLength={7} value={number} onChange={event => { setNumber(event.target.value); setVisible(20); }} placeholder="Ex.: 2630" className="mt-2" /></div>
        <div><label htmlFor="proposal-year" className="text-sm font-medium">Ano</label><Input id="proposal-year" inputMode="numeric" maxLength={4} value={year} onChange={event => { setYear(event.target.value); setVisible(20); }} placeholder="Ex.: 2020" className="mt-2" /></div>
        <div><label htmlFor="proposal-subject" className="text-sm font-medium">Assunto ou palavra-chave</label><Input id="proposal-subject" value={subject} maxLength={200} onChange={event => { setSubject(event.target.value); setVisible(20); }} placeholder="Ex.: educação" className="mt-2" /></div>
        <p className="text-sm leading-6 text-muted-foreground sm:col-span-2 lg:col-span-4">Os filtros e o assunto pesquisam a publicação recente abaixo. Com tipo, número e ano preenchidos, o botão Pesquisar consulta diretamente a Câmara, inclusive para outros períodos; essa consulta depende da disponibilidade da fonte.</p>
        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4"><Button type="submit" disabled={direct.isFetching}>Pesquisar</Button><Button type="button" variant="outline" onClick={clear}>Limpar filtros</Button>{exact && <Button type="button" variant="outline" onClick={clear}>Voltar à publicação recente</Button>}</div>
        {validation && <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-4">{validation}</p>}
      </form>
      <ProposalReference fetchedAt={exact ? direct.data?.fetchedAt : published.data?.fetchedAt} start={published.data?.coverage.start} end={published.data?.coverage.end} />
      {loading ? <p role="status" className="flex items-center justify-center gap-3 py-16"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />{exact ? "Consultando a Câmara…" : "Carregando proposições publicadas…"}</p> : error ? <div role="alert" className="my-6 rounded-xl border bg-white p-6"><h2 className="font-semibold">{exact ? "A consulta à Câmara não pôde ser concluída." : "A publicação de proposições não pôde ser carregada."}</h2><p className="my-3 text-sm">{error.message} Isso não significa que a proposta não exista.</p><Button variant="outline" onClick={() => void (exact ? direct.refetch() : published.refetch())}>Tentar novamente</Button></div> : <>
        <p role="status" className="my-5 text-sm text-muted-foreground">{records.length} proposição(ões) encontrada(s) {exact ? "na consulta exata à Câmara" : "no recorte publicado"}.</p>
        {!records.length ? <div className="rounded-xl border bg-white p-7"><h2 className="font-semibold">Nenhum resultado encontrado</h2><p className="mt-2 text-sm leading-6">{exact ? "A Câmara não retornou proposições para esse tipo, número e ano. Confira os filtros." : "Nenhuma proposição deste recorte corresponde aos filtros. Isso não demonstra ausência no acervo da Câmara. Para outros períodos, preencha tipo, número e ano e selecione Pesquisar."}</p></div> : <ul aria-label="Proposições encontradas" className="grid gap-4 lg:grid-cols-2">{records.slice(0, visible).map(row => <li key={row.id} className="flex flex-col rounded-xl border bg-white p-6"><p className="text-xs font-medium text-[#167D8D]">Proposição legislativa</p><h2 className="mt-2 text-xl font-semibold text-[#17324D]">{row.siglaTipo} {row.numero}/{row.ano}</h2><p className="my-4 flex-1 text-sm leading-7">{row.ementa}</p><Link state={{ from: `/projetos-de-lei?${params.toString()}` }} to={`/projetos-de-lei/${row.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#167D8D] underline">Ver detalhes de {row.siglaTipo} {row.numero}/{row.ano}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></li>)}</ul>}
        {records.length > visible && <Button variant="outline" className="mt-6" onClick={() => setVisible(count => count + 20)}>Carregar mais</Button>}
      </>}
    </main><SiteFooter />
  </div>;
}
