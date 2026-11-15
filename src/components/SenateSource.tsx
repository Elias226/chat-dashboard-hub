import { SENATE_DOCUMENTATION, senatePeriodWarning, type SenateDataset } from "@/services/senate";
export default function SenateSource({ data }: { data: SenateDataset }) {
  return <aside className="my-5 rounded-xl border border-border bg-white p-5 text-sm leading-7">
    <p>Fonte: <a href={SENATE_DOCUMENTATION} target="_blank" rel="noopener noreferrer" className="text-[#167D8D] underline">Dados Abertos do Senado — senadores em exercício</a>.</p>
    <p className="text-xs text-muted-foreground">Consulta oficial: <time dateTime={data.fetchedAt}>{new Date(data.fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> (Brasília). Exercício e partido são os informados nessa consulta, sujeitos a alterações.</p>
    <p className="mt-2 text-xs">A lista não representa o resultado da eleição de 2026. Eleição, mandato da cadeira e exercício individual são distintos. A mudança de legislatura em fevereiro de 2027 exige uma nova consulta à fonte, sem promover eleitos automaticamente.</p>
    {senatePeriodWarning(data) && <p role="alert" className="mt-3 rounded-lg border border-[#F3B95F] bg-[#F3B95F]/15 p-3">Esta publicação antecede uma mudança de legislatura ou o fim de um período informado. Pode não representar a composição atual. Confira a data e a fonte oficial.</p>}
  </aside>;
}
