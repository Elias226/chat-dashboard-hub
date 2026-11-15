import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProposals } from "@/hooks/useProposals";
import { fetchProposalDetail, officialProposalUrl, positive, type Movement } from "@/services/camaraProposals";
import ParliamentHeader from "@/components/ParliamentHeader";
import SiteFooter from "@/components/SiteFooter";
import ProposalReference from "@/components/ProposalReference";
import { Button } from "@/components/ui/button";

function date(value: string | null) { return value ? value.slice(0, 10).split("-").reverse().join("/") + (value.includes("T") ? ` · ${value.slice(11, 16)}` : "") : "Data não informada"; }
function MovementText({ item }: { item: Movement }) {
  return <><p className="text-xs text-muted-foreground">{date(item.dataHora)}{item.orgao ? ` · ${item.orgao}` : ""}</p><p className="mt-2 font-medium">{item.descricao || "Descrição não informada"}</p>{item.situacao && <p className="mt-2 text-sm">Situação registrada: {item.situacao}</p>}{item.despacho && <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{item.despacho}</p>}</>;
}
export default function ProjetoDeLeiDetails() {
  const { id: rawId } = useParams();
  const id = /^\d+$/.test(rawId ?? "") ? Number(rawId) : 0;
  const valid = positive(id), location = useLocation();
  const from = location.state?.from;
  const back = typeof from === "string" && from.startsWith("/projetos-de-lei?") ? from : "/projetos-de-lei";
  const published = useProposals(), snapshot = published.data?.records.find(row => row.id === id);
  const [visible, setVisible] = useState(20);
  const direct = useQuery({ queryKey: ["official-proposal-detail", id], enabled: valid && !published.isPending && !snapshot,
    queryFn: async ({ signal }) => ({ record: await fetchProposalDetail(id, signal), fetchedAt: new Date().toISOString() }), retry: false, staleTime: 300000, refetchOnWindowFocus: false });
  const row = snapshot || direct.data?.record;
  const fetchedAt = snapshot ? published.data?.fetchedAt : direct.data?.fetchedAt;
  const loading = valid && (published.isPending || (!snapshot && direct.isFetching));
  return <div className="flex min-h-screen flex-col bg-[#F5F8FB] text-[#243746]"><ParliamentHeader /><main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
    <Link to={back} className="text-sm text-[#167D8D] underline">← Voltar à pesquisa de proposições</Link>
    {loading ? <p role="status" className="py-16">Carregando detalhes da proposição…</p> : !valid ? <h1 className="my-8 text-2xl font-semibold">Identificador de proposição inválido</h1> : !row ? <div role="alert" className="my-8 rounded-xl border bg-white p-6"><h1 className="text-2xl font-semibold">Detalhes não disponíveis</h1><p className="my-4">Esta proposição não está na publicação recente e a consulta à Câmara não foi concluída. Pode haver indisponibilidade ou restrição de acesso; isso não comprova inexistência.</p><p className="mb-4 text-sm">{direct.error?.message}</p><Button variant="outline" onClick={() => void direct.refetch()}>Tentar novamente</Button><a href={officialProposalUrl(id)} target="_blank" rel="noopener noreferrer" className="ml-4 text-sm underline">Consultar página oficial</a></div> : <>
      <div className="my-7"><p className="text-xs font-semibold uppercase tracking-widest text-[#167D8D]">Câmara dos Deputados · {snapshot ? "Publicação recente" : "Consulta direta à fonte"}</p><h1 className="mt-3 text-3xl font-semibold text-[#17324D]">{row.siglaTipo} {row.numero}/{row.ano}</h1></div>
      <ProposalReference fetchedAt={fetchedAt} />
      <section className="my-6 rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">Ementa oficial</h2><p className="mt-4 whitespace-pre-wrap leading-8">{row.ementa}</p>{row.ementaDetalhada && <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{row.ementaDetalhada}</p>}<dl className="mt-6 grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Data de apresentação</dt><dd className="mt-1">{date(row.dataApresentacao)}</dd></div><div><dt className="text-sm text-muted-foreground">Situação registrada</dt><dd className="mt-1">{row.situacao || "Não informada pela fonte"}</dd></div></dl><a href={officialProposalUrl(row.id)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-sm font-semibold text-[#167D8D] underline">Abrir página oficial na Câmara</a></section>
      <section className="my-6 rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">Autoria</h2>{row.autores.length ? <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">{row.autores.map(name => <li key={name}>{name}</li>)}</ul> : <p className="mt-4 text-sm">A consulta não retornou autores.</p>}<p className="mt-4 text-xs text-muted-foreground">O endpoint oficial pode incluir proponentes e apoiadores, além de pessoas e órgãos institucionais.</p></section>
      <section className="my-6 rounded-xl border bg-white p-6"><h2 className="mb-4 text-xl font-semibold">Última movimentação registrada</h2>{row.ultimaMovimentacao ? <MovementText item={row.ultimaMovimentacao} /> : <p className="text-sm">Não informada pela fonte.</p>}</section>
      <section className="my-6 rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">Histórico de tramitação</h2><p className="my-3 text-sm text-muted-foreground">Registros retornados pela Câmara, do mais recente ao mais antigo. Não são um placar de votações nem certificação de publicação de norma.</p>{row.tramitacoes.length ? <ol aria-label="Tramitações registradas" className="divide-y">{row.tramitacoes.slice(0, visible).map((item, index) => <li key={`${item.sequencia}-${index}`} className="py-5"><MovementText item={item} /></li>)}</ol> : <p className="text-sm">A consulta não retornou registros de tramitação.</p>}{row.tramitacoes.length > visible && <Button variant="outline" onClick={() => setVisible(count => count + 20)}>Carregar mais tramitações</Button>}</section>
    </>}
  </main><SiteFooter /></div>;
}
