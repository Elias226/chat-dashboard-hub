import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useDeputies, useDeputyDetails } from "@/hooks/useDeputies";
import { deputyProfileUrl } from "@/services/camaraDeputies";
import ParliamentHeader from "@/components/ParliamentHeader";
import DeputyPhoto from "@/components/DeputyPhoto";
import CamaraSource from "@/components/CamaraSource";
import SiteFooter from "@/components/SiteFooter";
import { CamaraUnavailable } from "@/components/CamaraReliability";
import { Button } from "@/components/ui/button";

function AdditionalDetails({ id }: { id: number }) {
  const [requested, setRequested] = useState(false);
  const { data, isFetching, isError, error, refetch } = useDeputyDetails(id, requested);
  const statusDate = data?.dataStatus?.match(/^(\d{4})-(\d{2})-(\d{2})/)?.slice(1).reverse().join("/");
  const fields = data ? [
    ["Partido", data.siglaPartido], ["Estado (UF)", data.siglaUf], ["Situação registrada", data.situacao],
    ["Condição eleitoral", data.condicaoEleitoral], ["Legislatura do registro", data.idLegislatura], ["Data do registro", statusDate],
    ["E-mail institucional", data.email ?? data.gabinete.email], ["Telefone do gabinete", data.gabinete.telefone],
    ["Gabinete", data.gabinete.nome], ["Prédio / anexo", data.gabinete.predio], ["Sala", data.gabinete.sala], ["Andar", data.gabinete.andar],
  ] : [];
  return (
    <section aria-labelledby="institutional-title" className="mt-6 rounded-xl border border-border bg-white p-6 sm:p-8">
      <h2 id="institutional-title" className="text-xl font-semibold text-[#17324D]">Informações institucionais adicionais</h2>
      <p className="my-4 text-sm leading-7 text-muted-foreground">Gabinete, contatos e situação do último registro não estão incluídos no arquivo publicado. Você pode consultá-los diretamente na Câmara; essa consulta depende da disponibilidade da API e da permissão de acesso pela fonte.</p>
      {!requested && !data && <Button variant="outline" onClick={() => setRequested(true)}>Consultar informações adicionais</Button>}
      {isFetching ? <p role="status" className="flex items-center gap-3 text-sm"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Consultando informações adicionais… Limite de 70 segundos.</p>
        : isError ? <div role="alert"><p className="mb-3 text-sm">As informações adicionais não estão disponíveis. Os dados básicos publicados permanecem acima. {error.message}</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div>
        : data && <>
          <p className="text-xs leading-6 text-muted-foreground">Último registro disponível na API; pode incluir alterações posteriores à publicação dos dados básicos. Campos ausentes não são preenchidos.</p>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value ?? "Não informado"}</dd></div>)}</dl>
          {data.descricaoStatus && <p className="mt-6 border-t border-border pt-4 text-sm leading-7 text-muted-foreground">Descrição do registro: {data.descricaoStatus}</p>}
          <CamaraSource fetchedAt={data.fetchedAt} />
        </>}
    </section>
  );
}

const ParlamentarDetails = () => {
  const { id: rawId } = useParams();
  const id = rawId && /^[1-9]\d*$/.test(rawId) && Number.isSafeInteger(Number(rawId)) ? Number(rawId) : null;
  const { data, isPending, isError, error, refetch } = useDeputies();
  const deputy = data?.deputies.find((record) => record.id === id);
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8FB] text-[#243746]">
      <ParliamentHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Link to="/parlamentares" className="mb-7 inline-flex items-center gap-2 rounded-sm text-sm text-[#167D8D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D]"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Voltar aos parlamentares</Link>
        {id === null ? <div role="alert">Identificador de parlamentar inválido. Selecione um deputado na listagem.</div>
          : isPending ? <p role="status" className="flex items-center justify-center gap-3 py-20"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> Carregando os dados publicados…</p>
          : isError ? <CamaraUnavailable title="Não foi possível carregar o perfil publicado." message={error.message} onRetry={() => void refetch()} />
          : !deputy ? <p role="alert" className="rounded-xl border border-border bg-white p-6">Este deputado não foi encontrado no conjunto publicado. Consulte a listagem atual.</p>
          : <>
            <section className="flex flex-col gap-6 rounded-xl border border-border bg-white p-6 sm:flex-row sm:p-8">
              <DeputyPhoto src={deputy.urlFoto} name={deputy.nome} className="h-52 w-40" />
              <div className="min-w-0 flex-1">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#167D8D]">Informações do parlamentar</p>
                <h1 className="text-3xl font-semibold tracking-tight text-[#17324D]">{deputy.nome}</h1>
                <p className="mt-3 text-sm text-muted-foreground">Partido: {deputy.siglaPartido} · UF: {deputy.siglaUf}</p>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">Dados básicos da última publicação completa. A composição e as informações podem mudar na fonte.</p>
                <a href={deputyProfileUrl(deputy.id)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#17324D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#167D8D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] focus-visible:ring-offset-4">Perfil oficial na Câmara <ExternalLink aria-hidden="true" className="h-4 w-4" /></a>
              </div>
            </section>
            <CamaraSource fetchedAt={data.fetchedAt} />
            <AdditionalDetails key={id} id={id} />
          </>}
      </main>
      <SiteFooter />
    </div>
  );
};

export default ParlamentarDetails;
