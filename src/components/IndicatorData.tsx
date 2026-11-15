import type { DeputyGroup } from "@/services/camaraDeputies";
export function IndicatorTable({ title, data, label, denominator }: { title: string; data: DeputyGroup[]; label: string; denominator?: number }) {
  return <details className="mt-5 overflow-x-auto rounded-lg border border-border text-sm"><summary className="cursor-pointer px-4 py-3 font-medium text-[#17324D]">Ver dados em tabela</summary>
    <table className="w-full text-left text-sm"><caption className="sr-only">{title}</caption><thead><tr className="border-t"><th scope="col" className="px-4 py-2">Categoria</th><th scope="col" className="px-4 py-2 text-right">{label}</th>{Boolean(denominator) && <th scope="col" className="px-4 py-2 text-right">% de {denominator} cadeiras</th>}</tr></thead>
      <tbody>{data.map(({ category, count }) => <tr key={category} className="border-t"><th scope="row" className="px-4 py-2 font-normal">{category}</th><td className="px-4 py-2 text-right tabular-nums">{count.toLocaleString("pt-BR")}</td>{Boolean(denominator) && <td className="px-4 py-2 text-right tabular-nums">{(count / denominator! * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</td>}</tr>)}</tbody>
    </table></details>;
}
export function IndicatorSource({ fetchedAt, url, label }: { fetchedAt: string; url: string; label: string }) {
  return <p className="mt-4 text-xs leading-6 text-muted-foreground">Fonte: <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#167D8D] underline">{label}</a>.<br />Dados atualizados em <time dateTime={fetchedAt}>{new Date(fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> (Brasília).</p>;
}
