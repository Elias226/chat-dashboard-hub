import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ChamberSwitch from "@/components/ChamberSwitch";
import SenateIndicators from "@/components/SenateIndicators";
import CongressComparison from "@/components/CongressComparison";
import { useDeputies } from "@/hooks/useDeputies";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SiteFooter from "@/components/SiteFooter";
import DeputiesChart from "@/components/DeputiesChart";
import { CamaraStaleNotice, CamaraUnavailable } from "@/components/CamaraReliability";
import { CAMARA_DOCUMENTATION, groupDeputies } from "@/services/camaraDeputies";

const charts = [
  { id: "uf", title: "Deputados federais por estado", description: "Quantidade por unidade da Federação, incluindo o Distrito Federal. UFs em ordem alfabética.", field: "siglaUf" as const, color: "#167D8D" },
  { id: "partido", title: "Deputados federais por partido", description: "Quantidade por sigla partidária, em ordem decrescente. Empates em ordem alfabética.", field: "siglaPartido" as const, color: "#17324D" },
];

const Graficos = () => {
  const [params] = useSearchParams();
  const house = ["senado", "comparativo"].includes(params.get("casa") ?? "") ? params.get("casa")! : "camara";
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isPending, isFetching, isError, error, refetch, canUseLastComplete, usingLastComplete, useLastComplete } = useDeputies();
  const grouped = useMemo(() => data ? {
    siglaUf: groupDeputies(data.deputies, "siglaUf"),
    siglaPartido: groupDeputies(data.deputies, "siglaPartido"),
  } : null, [data]);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = charts.filter((chart) => `${chart.title} ${chart.description}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  const loading = isPending || isFetching;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-border bg-background px-4 py-4 sm:px-8 xl:flex-row xl:items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Voltar ao início" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Todos os Gráficos</h1>
            <p className="text-sm text-muted-foreground">Indicadores oficiais e informações sobre o Congresso Nacional.</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-5 xl:ml-auto xl:w-auto">
          <nav aria-label="Navegação dos indicadores" className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#17324D]">
            <Link to="/" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] focus-visible:ring-offset-4">Início</Link>
            <Link to="/chat" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] focus-visible:ring-offset-4">Assistente IA</Link>
            <Link to="/parlamentares" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] focus-visible:ring-offset-4">Parlamentares</Link>
            <Link to="/projetos-de-lei" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] focus-visible:ring-offset-4">Projetos de lei</Link>
          </nav>
          {house !== "comparativo" && <div className="relative min-w-0 flex-1 xl:w-64">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Pesquisar gráficos" placeholder="Pesquisar gráficos..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>}
        </div>
      </header>

      <main className="w-full flex-1 p-4 sm:p-8">
        <ChamberSwitch indicators value={house} />
        {house === "senado" ? <SenateIndicators search={search} /> : house === "comparativo" ? <CongressComparison /> : <>
        <section aria-label="Sobre os indicadores" className="mb-6 rounded-xl border border-[#17324D]/10 bg-[#F5F8FB] p-5 text-sm leading-7 text-[#243746]">
          <p className="font-semibold text-[#17324D]">Deputados em exercício no momento da consulta</p>
          <p>Período de referência: retrato da composição na consulta, sem filtros históricos. UF e partido seguem os registros retornados pela Câmara.</p>
          <p>Metodologia: cada deputado é contado uma vez por identificador, agrupado pela UF ou sigla partidária. Os dois gráficos utilizam o mesmo conjunto completo, validado e publicado com o site, sem avaliações sobre partidos ou parlamentares.</p>
          <p className="mt-2 text-xs text-muted-foreground">Atualização diária prevista. Se a fonte falhar, a última publicação válida permanece disponível. A coleta reúne páginas sucessivas e não é uma fotografia simultânea da base; os dados podem mudar na fonte.</p>
          <a href={CAMARA_DOCUMENTATION} target="_blank" rel="noreferrer" className="text-xs text-[#167D8D] underline">Documentação da fonte e critérios da consulta</a>
        </section>

        {usingLastComplete && data && <CamaraStaleNotice fetchedAt={data.fetchedAt} />}
        {loading ? (
          <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-[#17324D]">
            <div className="flex items-center gap-3"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> Carregando os dados publicados…</div>
          </div>
        ) : isError ? (
          <CamaraUnavailable title="Não foi possível carregar os indicadores." message={error!.message} onRetry={() => void refetch()} onUseLastComplete={canUseLastComplete ? useLastComplete : undefined} />
        ) : data && grouped && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground"><strong className="text-[#17324D]">{data.deputies.length.toLocaleString("pt-BR")}</strong> deputados no conjunto publicado</p>
                <p className="mt-1 text-xs text-muted-foreground">Dados atualizados em <time dateTime={data.fetchedAt}>{new Date(data.fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> (Brasília).</p>
              </div>
            </div>
            {data.duplicates > 0 && (
              <p role="status" className="mb-5 rounded-lg border border-[#F3B95F] bg-[#F3B95F]/10 p-4 text-sm leading-7 text-[#243746]">
                {data.duplicates} registros repetidos foram contados uma única vez por identificador na coleta.
              </p>
            )}
            {data.deputies.length === 0 ? (
              <p role="status" className="py-16 text-center text-muted-foreground">A Câmara não retornou deputados para esta consulta. Nenhum indicador foi calculado.</p>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-2">
                {filtered.map((chart) => <DeputiesChart key={chart.id} id={chart.id} title={chart.title} description={chart.description} data={grouped[chart.field]} fetchedAt={data.fetchedAt} color={chart.color} />)}
                {filtered.length === 0 && <p className="col-span-full py-12 text-center text-muted-foreground">Nenhum gráfico encontrado.</p>}
              </div>
            )}
          </>
        )}
        </>}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Graficos;
