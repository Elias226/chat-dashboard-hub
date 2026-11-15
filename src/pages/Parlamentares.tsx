import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ChamberSwitch from "@/components/ChamberSwitch";
import SenatorsList from "@/components/SenatorsList";
import { ArrowRight, Loader2, Search, UsersRound } from "lucide-react";
import { useDeputies } from "@/hooks/useDeputies";
import { deputyFilterOptions, filterDeputies } from "@/lib/deputyFilters";
import ParliamentHeader from "@/components/ParliamentHeader";
import DeputyPhoto from "@/components/DeputyPhoto";
import CamaraSource from "@/components/CamaraSource";
import { CamaraStaleNotice, CamaraUnavailable } from "@/components/CamaraReliability";
import SiteFooter from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Parlamentares = () => {
  const [params] = useSearchParams();
  const senate = params.get("casa") === "senado";
  const [name, setName] = useState("");
  const [uf, setUf] = useState("");
  const [party, setParty] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const { data, isPending, isFetching, isError, error, refetch, canUseLastComplete, usingLastComplete, useLastComplete } = useDeputies();
  const results = useMemo(() => filterDeputies(data?.deputies ?? [], name, uf, party), [data, name, uf, party]);
  const states = useMemo(() => deputyFilterOptions(data?.deputies ?? [], "siglaUf"), [data]);
  const parties = useMemo(() => deputyFilterOptions(data?.deputies ?? [], "siglaPartido"), [data]);
  const loading = isPending || isFetching;
  const clearFilters = () => { setName(""); setUf(""); setParty(""); setVisibleCount(20); };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8FB] text-[#243746]">
      <ParliamentHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <ChamberSwitch value={senate ? "senado" : "camara"} />
        {senate ? <SenatorsList /> : <>
        <div className="mb-7 max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#167D8D]"><UsersRound aria-hidden="true" className="h-4 w-4" /> Parlamentares · Câmara dos Deputados</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#17324D] sm:text-4xl">Conheça os deputados federais</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">Consulte deputados em exercício e conheça suas informações institucionais na fonte oficial. Pesquise por nome e combine os filtros de estado e partido.</p>
        </div>

        <section aria-label="Filtros de parlamentares" className="mb-7 grid gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <div><label htmlFor="deputy-name" className="block text-sm font-medium">Nome do deputado</label>
            <span className="relative mt-2 block"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="deputy-name" placeholder="Pesquisar por nome..." value={name} onChange={(event) => { setName(event.target.value); setVisibleCount(20); }} className="pl-9" /></span>
          </div>
          <div><label htmlFor="deputy-state" className="block text-sm font-medium">Estado (UF)</label>
            <select id="deputy-state" value={uf} onChange={(event) => { setUf(event.target.value); setVisibleCount(20); }} className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D]">
              <option value="">Todas as UFs</option>{states.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div><label htmlFor="deputy-party" className="block text-sm font-medium">Partido</label>
            <select id="deputy-party" value={party} onChange={(event) => { setParty(event.target.value); setVisibleCount(20); }} className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D]">
              <option value="">Todos os partidos</option>{parties.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <Button type="button" variant="outline" onClick={clearFilters}>Limpar filtros</Button>
        </section>

        {usingLastComplete && data && <CamaraStaleNotice fetchedAt={data.fetchedAt} />}
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-3 py-20 text-[#17324D]"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> Carregando os dados publicados…</div>
        ) : isError ? (
          <CamaraUnavailable title="Não foi possível carregar os parlamentares." message={error!.message} onRetry={() => void refetch()} onUseLastComplete={canUseLastComplete ? useLastComplete : undefined} />
        ) : data && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="text-sm text-muted-foreground"><strong className="text-[#17324D]">{results.length}</strong> de {data.deputies.length} deputados encontrados</p>
            </div>
            {results.length ? (
              <ul aria-label="Deputados encontrados" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.slice(0, visibleCount).map((deputy) => (
                  <li key={deputy.id}>
                    <Link to={`/parlamentares/${deputy.id}`} aria-label={`Ver detalhes de ${deputy.nome ?? `deputado ${deputy.id}`}`} className="group flex h-full gap-4 rounded-xl border border-border bg-white p-5 transition-colors hover:border-[#167D8D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D]">
                      <DeputyPhoto src={deputy.urlFoto} name={deputy.nome} className="h-24 w-20" />
                      <div className="flex min-w-0 flex-1 flex-col items-start">
                        <h2 className="text-base font-semibold text-[#17324D]">{deputy.nome ?? "Nome não informado"}</h2>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">Partido: {deputy.siglaPartido ?? "Não informado"}<br />UF: {deputy.siglaUf ?? "Não informada"}</p>
                        <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#167D8D]">Ver detalhes <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-border bg-white px-5 py-12 text-center text-muted-foreground">{data.deputies.length ? "Nenhum deputado encontrado com os filtros selecionados." : "A Câmara não retornou deputados para esta consulta."}</p>
            )}
            {results.length > visibleCount && <div className="mt-6 text-center"><p className="mb-3 text-xs text-muted-foreground">Exibindo {visibleCount} de {results.length} resultados</p><Button variant="outline" onClick={() => setVisibleCount((count) => count + 20)}>Carregar mais</Button></div>}
            <CamaraSource fetchedAt={data.fetchedAt} />
          </>
        )}
        </>}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Parlamentares;
