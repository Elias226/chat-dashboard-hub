import { useMemo, useState } from "react";
import type { DeputyGroup } from "@/services/camaraDeputies";
import { hemicycleSeats, partyColor } from "@/lib/indicatorVisuals";
import { IndicatorSource, IndicatorTable } from "./IndicatorData";
interface Props { id: string; title: string; data: DeputyGroup[]; fetchedAt: string; label: string; sourceUrl: string; sourceLabel: string }
export default function PartyHemicycle({ id, title, data, fetchedAt, label, sourceUrl, sourceLabel }: Props) {
  const [selected, setSelected] = useState<string | null>(null), [hovered, setHovered] = useState<string | null>(null);
  const seats = useMemo(() => hemicycleSeats(data), [data]);
  const groups = useMemo(() => [...data].filter(row => row.count > 0).sort((a, b) => a.category.localeCompare(b.category, "pt-BR")), [data]);
  const total = seats.length, candidate = hovered || selected;
  const active = groups.some(row => row.category === candidate) ? candidate : null;
  const current = groups.find(row => row.category === active);
  const description = (party: string) => { const row = groups.find(item => item.category === party)!; return `${party}: ${row.count} ${label.toLowerCase()} · ${(row.count / total * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% de ${total} cadeiras`; };
  return <section aria-labelledby={`${id}-title`} className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#167D8D]">Composição partidária</p><h2 id={`${id}-title`} className="mt-2 text-xl font-semibold text-[#17324D]">{title}</h2>
    <p id={`${id}-note`} className="mt-3 text-xs leading-6 text-muted-foreground">Cada círculo representa uma cadeira. Siglas em ordem alfabética, sem posição ideológica ou reprodução dos assentos reais. As cores são identificadores visuais, sem caráter oficial.</p>
    {total ? <>
      <svg id={`${id}-seats`} viewBox="0 0 600 310" role="img" aria-label={`Hemiciclo simbólico: ${total} cadeiras. Valores por partido na legenda e na tabela.`} aria-describedby={`${id}-note`} className="mx-auto mt-4 w-full max-w-[720px]" onMouseLeave={() => setHovered(null)}>
        {seats.map((seat, index) => <circle key={index} data-party={seat.party} cx={seat.x} cy={seat.y} r={seat.radius} fill={partyColor(seat.party)} opacity={!active || active === seat.party ? 1 : 0.18} stroke="white" strokeWidth="0.5" aria-hidden="true" className="cursor-pointer" onMouseEnter={() => setHovered(seat.party)} onClick={() => setSelected(value => value === seat.party ? null : seat.party)}><title>{description(seat.party)}</title></circle>)}
        <text x="300" y="234" textAnchor="middle" fill="#17324D" fontSize="40" fontWeight="600">{total}</text><text x="300" y="260" textAnchor="middle" fill="#607482" fontSize="13">cadeiras na consulta</text>
      </svg>
      <p className="min-h-11 rounded-lg bg-[#F5F8FB] px-4 py-3 text-center text-sm font-medium text-[#17324D]">{current ? description(current.category) : "Passe sobre as cadeiras ou selecione um partido na legenda."}</p>
      <div aria-label={`Legenda de ${title}`} className="mt-4 grid gap-2 sm:grid-cols-2">{groups.map(row => <button key={row.category} type="button" aria-label={description(row.category)} aria-pressed={selected === row.category} aria-controls={`${id}-seats`} onFocus={() => setHovered(row.category)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(row.category)} onMouseLeave={() => setHovered(null)} onClick={() => setSelected(value => value === row.category ? null : row.category)} className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] ${selected === row.category ? "border-[#167D8D] bg-[#167D8D]/5" : "border-transparent hover:bg-[#F5F8FB]"}`}>
        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: partyColor(row.category) }} /><span className="font-medium">{row.category}</span><span className="ml-auto whitespace-nowrap text-xs tabular-nums text-muted-foreground">{row.count} · {(row.count / total * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
      </button>)}</div>
      <p className="sr-only" aria-live="polite">{selected && groups.some(row => row.category === selected) ? `Selecionado: ${description(selected)}` : "Nenhum partido selecionado."}</p>
      {selected && <button type="button" className="mt-3 text-sm text-[#167D8D] underline" onClick={() => { setSelected(null); setHovered(null); }}>Limpar destaque</button>}
      <p className="mt-4 text-xs leading-6 text-muted-foreground">Percentuais calculados sobre as {total} cadeiras desta publicação. Valores arredondados podem não somar exatamente 100%.</p>
    </> : <p className="py-12 text-sm">Nenhuma cadeira disponível neste conjunto.</p>}
    <IndicatorTable title={title} data={data} label={label} denominator={total} /><IndicatorSource fetchedAt={fetchedAt} url={sourceUrl} label={sourceLabel} />
  </section>;
}
