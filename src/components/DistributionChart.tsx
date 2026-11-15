import { CAMARA_DOCUMENTATION, type DeputyGroup } from "@/services/camaraDeputies";
import { IndicatorSource, IndicatorTable } from "./IndicatorData";
interface Props { id: string; title: string; description: string; data: DeputyGroup[]; fetchedAt: string; color: string; label?: string; sourceUrl?: string; sourceLabel?: string; variant?: "lollipop" | "bar" }
/** CSS tracks keep labels readable without shrinking SVG text on small screens. */
export default function DistributionChart({ id, title, description, data, fetchedAt, color, label = "Deputados", sourceUrl = CAMARA_DOCUMENTATION, sourceLabel = "Dados Abertos da Câmara dos Deputados · documentação", variant = "lollipop" }: Props) {
  const max = Math.max(1, ...data.map(row => row.count));
  return <section aria-labelledby={`${id}-title`} className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#167D8D]">{variant === "lollipop" ? "Distribuição territorial" : "Recorte de proposições"}</p><h2 id={`${id}-title`} className="mt-2 text-xl font-semibold text-[#17324D]">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    <div role="img" aria-label={`${title}. ${variant === "lollipop" ? "Gráfico lollipop" : "Gráfico de barras"}; valores na tabela.`} className="mt-6 space-y-1.5">
      <div aria-hidden="true" className={`grid gap-3 text-[10px] text-muted-foreground ${variant === "lollipop" ? "grid-cols-[3rem_1fr_2rem]" : "grid-cols-[6rem_1fr_2rem]"}`}><span /><span className="flex justify-between"><span>0</span><span>{(max / 2).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span><span>{max}</span></span></div>
      {data.map(row => <div key={row.category} data-category={row.category} className={`grid min-h-7 items-center gap-3 text-xs ${variant === "lollipop" ? "grid-cols-[3rem_1fr_2rem]" : "grid-cols-[6rem_1fr_2rem]"}`}>
        <span className="font-medium text-[#243746]">{row.category}</span><div className="relative h-7 border-l border-[#17324D]/10 bg-[linear-gradient(to_right,transparent_49.5%,#17324D0c_50%,transparent_50.5%)]">
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full ${variant === "lollipop" ? "h-0.5" : "h-3.5"}`} style={{ width: `${row.count / max * 100}%`, backgroundColor: color }} />
          {variant === "lollipop" && <span aria-hidden="true" className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm" style={{ left: `${row.count / max * 100}%`, backgroundColor: color }} />}
        </div><span className="text-right font-semibold tabular-nums">{row.count}</span>
      </div>)}
    </div><IndicatorTable title={title} data={data} label={label} /><IndicatorSource fetchedAt={fetchedAt} url={sourceUrl} label={sourceLabel} />
  </section>;
}
