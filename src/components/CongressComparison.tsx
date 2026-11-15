import { useDeputies } from "@/hooks/useDeputies";
import { useSenators } from "@/hooks/useSenators";
import { SENATE_COMPOSITION } from "@/services/senate";
import SenateSource from "./SenateSource";
import { Button } from "./ui/button";
export default function CongressComparison() {
  const deputies = useDeputies(), senators = useSenators();
  const rows = [
    ["Representação", "O povo, com distribuição de deputados por UF proporcional à população, conforme critérios constitucionais e legais.", "Os estados e o Distrito Federal, com três cadeiras por UF."],
    ["Eleição", "Sistema proporcional.", "Sistema majoritário."],
    ["Duração do mandato", "Quatro anos.", "Oito anos, abrangendo duas legislaturas."],
    ["Renovação", "Integral a cada quatro anos.", "Alternada: um terço e dois terços a cada quatro anos."],
    ["Parlamentares no conjunto publicado", deputies.data ? String(deputies.data.deputies.length) : "Consulta não disponível", senators.data ? String(senators.data.senators.length) : "Consulta não disponível"],
  ];
  return <section className="rounded-xl border bg-white p-5 sm:p-7"><h2 className="text-2xl font-semibold text-[#17324D]">Duas Casas, representações diferentes</h2><p className="my-4 text-sm leading-7">Câmara e Senado formam o Congresso Nacional. A diferença de quantidade de parlamentares decorre de suas funções e formas de representação; não mede qualidade, poder individual ou desempenho. Cada publicação tem sua própria data e não é uma fotografia simultânea das duas Casas.</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Comparativo institucional Câmara x Senado</caption><thead><tr><th scope="col" className="p-4">Característica</th><th scope="col" className="p-4">Câmara dos Deputados</th><th scope="col" className="p-4">Senado Federal</th></tr></thead><tbody>{rows.map(([label, chamber, senate]) => <tr key={label} className="border-t"><th scope="row" className="p-4 align-top font-medium">{label}</th><td className="p-4 align-top leading-7">{chamber}</td><td className="p-4 align-top leading-7">{senate}</td></tr>)}</tbody></table></div>
    {deputies.isPending || senators.isPending ? <p role="status" className="mt-5">Carregando as publicações…</p> : null}
    {deputies.error && <div role="alert" className="mt-5 text-sm"><p>Publicação da Câmara indisponível. As informações institucionais acima não dependem dessa consulta.</p><Button variant="outline" onClick={() => void deputies.refetch()}>Repetir consulta da Câmara</Button></div>}
    {senators.error && <div role="alert" className="mt-5 text-sm"><p>Publicação do Senado indisponível. Nenhuma quantidade foi presumida.</p><Button variant="outline" onClick={() => void senators.refetch()}>Repetir consulta do Senado</Button></div>}
    {deputies.data && <p className="mt-5 text-xs text-muted-foreground">Câmara: consulta de {new Date(deputies.data.fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília).</p>}
    {senators.data && <SenateSource data={senators.data} />}
    <p className="mt-5 text-sm">Referências institucionais: <a href="https://www2.camara.leg.br/transparencia/acesso-a-informacao/copy_of_perguntas-frequentes/deputados" target="_blank" rel="noopener noreferrer" className="text-[#167D8D] underline">Câmara — deputados</a> · <a href={SENATE_COMPOSITION} target="_blank" rel="noopener noreferrer" className="text-[#167D8D] underline">Senado — composição</a>.</p>
  </section>;
}
