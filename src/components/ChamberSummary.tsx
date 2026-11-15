import type { DeputyGroup } from "@/services/camaraDeputies";
import { partySummary } from "@/lib/indicatorVisuals";
export default function ChamberSummary({ title, data, fetchedAt }: { title: string; data: DeputyGroup[]; fetchedAt: string }) {
  const summary = partySummary(data);
  return <section aria-label={`Resumo: ${title}`} className="rounded-2xl border bg-[#F5F8FB] p-5"><h3 className="text-lg font-semibold text-[#17324D]">{title}</h3>
    <dl className="mt-4 grid grid-cols-2 gap-3">{[
      ["Parlamentares", String(summary.total)], ["Partidos representados", String(summary.parties)],
      ["Maior bancada", summary.largestParties.length ? `${summary.largestParties.join(" · ")} — ${summary.largestCount}${summary.largestParties.length > 1 ? " cada" : ""}` : "Não informada"],
      ["Atualização (Brasília)", new Date(fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })],
    ].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-white bg-white p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-2 break-words font-semibold text-[#17324D] ${label === "Parlamentares" || label === "Partidos representados" ? "text-3xl" : "text-sm leading-6"}`}>{value}</dd></div>)}</dl>
    <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Sem partido e informação ausente continuam no total de parlamentares, mas não contam como partido ou bancada. Empates de maior bancada são exibidos juntos.</p>
  </section>;
}
