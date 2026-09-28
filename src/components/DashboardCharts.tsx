import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const numberFormatter = new Intl.NumberFormat("pt-BR");

const yearData = [
  { year: "2020", value: 35 },
  { year: "2021", value: 28 },
  { year: "2022", value: 22 },
  { year: "2023", value: 18 },
  { year: "2024", value: 15 },
  { year: "2025", value: 12 },
  { year: "2026", value: 10 },
  { year: "2027", value: 8 },
];

const raceData = [
  { name: "Parda", value: 13484 },
  { name: "Branca", value: 11861 },
  { name: "Preta", value: 4952 },
  { name: "Não informado", value: 4753 },
  { name: "Indígena", value: 314 },
  { name: "Amarela", value: 148 },
];

const voteData = [
  { name: "Sim", value: 320 },
  { name: "Não", value: 180 },
  { name: "Abstenção", value: 50 },
];

const regionData = [
  { name: "Sudeste", value: 12400 },
  { name: "Nordeste", value: 8500 },
  { name: "Sul", value: 6300 },
  { name: "Norte", value: 4200 },
  { name: "Centro-Oeste", value: 3100 },
];

const colors = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  secondary: "hsl(var(--secondary-foreground))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
};

const pieColors = [colors.primary, colors.destructive, colors.muted];

const tooltipProps = {
  cursor: { fill: "hsl(var(--muted))" },
  contentStyle: {
    borderRadius: 8,
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 12px 30px hsl(220 15% 15% / 0.12)",
  },
  formatter: (value: number | string) => [
    numberFormatter.format(Number(value)),
    "Quantidade",
  ],
};

const charts = [
  {
    title: "Projetos Aprovados",
    metric: "148",
    helper: "Série anual consolidada",
    render: () => (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={yearData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipProps} />
          <Bar dataKey="value" fill={colors.primary} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    title: "Distribuição por Raça",
    metric: "35.512",
    helper: "Registros por autodeclaração",
    render: () => (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={raceData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            width={92}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip {...tooltipProps} />
          <Bar dataKey="value" fill={colors.accent} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    title: "Votação",
    metric: "550",
    helper: "Total de votos registrados",
    render: () => (
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={voteData}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={86}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            fontSize={11}
          >
            {voteData.map((_, index) => (
              <Cell key={`vote-${index}`} fill={pieColors[index]} />
            ))}
          </Pie>
          <Tooltip {...tooltipProps} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    ),
  },
  {
    title: "Casos por Região",
    metric: "34.500",
    helper: "Volume agregado por região",
    render: () => (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={regionData} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipProps} />
          <Bar dataKey="value" fill={colors.secondary} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
];

const chartPairs: typeof charts[] = [];
for (let i = 0; i < charts.length; i += 2) {
  chartPairs.push(charts.slice(i, i + 2));
}

const DashboardCharts = () => {
  return (
    <div className="relative px-4 sm:px-12">
      <Carousel opts={{ align: "start" }}>
        <CarouselContent>
          {chartPairs.map((pair, pairIndex) => (
            <CarouselItem key={pairIndex} className="basis-full">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pair.map((chart) => (
                  <section
                    key={chart.title}
                    className="rounded-lg border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{chart.title}</h3>
                        <p className="text-xs text-muted-foreground">{chart.helper}</p>
                      </div>
                      <p className="rounded-md bg-muted px-2 py-1 text-sm font-semibold text-foreground">
                        {chart.metric}
                      </p>
                    </div>
                    {chart.render()}
                  </section>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-2 sm:-left-10" />
        <CarouselNext className="-right-2 sm:-right-10" />
      </Carousel>
    </div>
  );
};

export default DashboardCharts;
