import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CAMARA_DOCUMENTATION, type DeputyGroup } from "@/services/camaraDeputies";

interface DeputiesChartProps {
  id: string;
  title: string;
  description: string;
  data: DeputyGroup[];
  fetchedAt: string;
  color: string;
  label?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  denominator?: number;
}

function formatConsultationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

const DeputiesChart = ({ id, title, description, data, fetchedAt, color, label = "Deputados", sourceUrl = CAMARA_DOCUMENTATION, sourceLabel = "Dados Abertos da Câmara dos Deputados · documentação", denominator }: DeputiesChartProps) => (
  <section aria-labelledby={`${id}-title`} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
    <h2 id={`${id}-title`} className="text-lg font-semibold text-[#17324D]">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    <div role="img" aria-label={`${title}. Quantidade por categoria; valores disponíveis também na tabela.`} className="mt-5">
      <ResponsiveContainer width="100%" height={Math.max(250, data.length * 29 + 40)}>
        <BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 8, right: 32, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis dataKey="category" type="category" width={100} interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#243746" }} />
          <Tooltip formatter={(value: number) => [value.toLocaleString("pt-BR"), label]} cursor={{ fill: "#17324D08" }} />
          <Bar dataKey="count" name={label} fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
            <LabelList dataKey="count" position="right" fill="#243746" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <details className="mt-5 rounded-lg border border-border text-sm">
      <summary className="cursor-pointer px-4 py-3 font-medium text-[#17324D]">Ver dados em tabela</summary>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{title}</caption>
        <thead><tr className="border-t border-border"><th scope="col" className="px-4 py-2">Categoria</th><th scope="col" className="px-4 py-2 text-right">{label}</th>{denominator && <th scope="col" className="px-4 py-2 text-right">% de {denominator} cadeiras</th>}</tr></thead>
        <tbody>{data.map(({ category, count }) => <tr key={category} className="border-t border-border"><th scope="row" className="px-4 py-2 font-normal">{category}</th><td className="px-4 py-2 text-right tabular-nums">{count.toLocaleString("pt-BR")}</td>{denominator && <td className="px-4 py-2 text-right">{(count / denominator * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</td>}</tr>)}</tbody>
      </table>
    </details>
    <p className="mt-4 text-xs leading-6 text-muted-foreground">
      Fonte: <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-[#167D8D] underline">{sourceLabel}</a>.<br />
      Dados atualizados em <time dateTime={fetchedAt}>{formatConsultationDate(fetchedAt)}</time> (Brasília).
    </p>
  </section>
);

export default DeputiesChart;
