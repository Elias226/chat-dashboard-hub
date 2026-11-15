import { Link, useParams } from "react-router-dom";
import { useSenators } from "@/hooks/useSenators";
import { senateProfileUrl } from "@/services/senate";
import ParliamentHeader from "@/components/ParliamentHeader";
import SiteFooter from "@/components/SiteFooter";
import DeputyPhoto from "@/components/DeputyPhoto";
import SenateSource from "@/components/SenateSource";
import { Button } from "@/components/ui/button";
const date = (value: string) => value.split("-").reverse().join("/");
export default function SenadorDetails() {
  const { id } = useParams(), query = useSenators();
  const row = /^\d+$/.test(id ?? "") ? query.data?.senators.find(item => item.id === Number(id)) : undefined;
  return <div className="flex min-h-screen flex-col bg-[#F5F8FB] text-[#243746]"><ParliamentHeader /><main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
    <Link to="/parlamentares?casa=senado" className="text-sm text-[#167D8D] underline">← Voltar aos senadores</Link>
    {query.isPending ? <p role="status" className="py-16">Carregando perfil publicado…</p> : query.error ? <div role="alert" className="my-6"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div> : !row ? <div className="my-8"><h1 className="text-2xl font-semibold">Senador não encontrado nesta publicação</h1><p className="mt-4">O identificador pode não constar da lista em exercício na data consultada. Isso não significa que a pessoa nunca tenha sido senadora.</p></div> : <>
      <section className="my-6 rounded-xl border bg-white p-6 sm:p-8"><div className="flex flex-wrap gap-6"><DeputyPhoto src={row.urlFoto} name={row.nome} className="h-48 w-40" /><div><p className="text-xs uppercase tracking-widest text-[#167D8D]">Senado Federal · perfil institucional</p><h1 className="mt-3 text-3xl font-semibold text-[#17324D]">{row.nome}</h1><p className="mt-3">{row.siglaPartido} · {row.siglaUf}</p><a href={senateProfileUrl(row.id)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm text-[#167D8D] underline">Abrir perfil oficial no Senado</a></div></div>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">{[["Participação no mandato", row.participacao], ["Período do mandato da cadeira", `${date(row.mandatoInicio)} a ${date(row.mandatoFim)}`], ["Início do exercício informado", date(row.exercicioInicio)], ["Fim do exercício informado", row.exercicioFim ? date(row.exercicioFim) : "Não informado pela fonte"]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2">{value}</dd></div>)}</dl>
        <p className="mt-6 text-sm leading-7">O mandato da cadeira abrange duas legislaturas. O exercício individual pode ser menor, por substituição, licença ou sucessão; um suplente não inicia automaticamente um novo mandato de oito anos.</p>
        <ul className="mt-4 list-disc pl-5 text-sm">{row.legislaturas.map(leg => <li key={leg.numero}>{leg.numero}ª legislatura: {date(leg.inicio)} a {date(leg.fim)}</li>)}</ul>
      </section><SenateSource data={query.data!} />
    </>}
  </main><SiteFooter /></div>;
}
