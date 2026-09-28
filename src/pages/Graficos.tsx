import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartInfo = {
  id: string;
  title: string;
  description: string;
  metric: string;
  type: string;
};

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

const monthlyData = [
  { month: "Jan", projetos: 12, aprovados: 8 },
  { month: "Fev", projetos: 15, aprovados: 10 },
  { month: "Mar", projetos: 20, aprovados: 14 },
  { month: "Abr", projetos: 18, aprovados: 11 },
  { month: "Mai", projetos: 25, aprovados: 18 },
  { month: "Jun", projetos: 22, aprovados: 15 },
  { month: "Jul", projetos: 30, aprovados: 20 },
  { month: "Ago", projetos: 28, aprovados: 19 },
  { month: "Set", projetos: 24, aprovados: 16 },
  { month: "Out", projetos: 32, aprovados: 22 },
  { month: "Nov", projetos: 27, aprovados: 18 },
  { month: "Dez", projetos: 20, aprovados: 14 },
];

const partidoData = [
  { name: "PT", value: 85 },
  { name: "PL", value: 72 },
  { name: "MDB", value: 58 },
  { name: "PSDB", value: 45 },
  { name: "PP", value: 40 },
  { name: "PSD", value: 38 },
];

const genderData = [
  { name: "Masculino", value: 420 },
  { name: "Feminino", value: 130 },
];

const ageData = [
  { faixa: "18-25", value: 1200 },
  { faixa: "26-35", value: 4500 },
  { faixa: "36-45", value: 6200 },
  { faixa: "46-55", value: 5800 },
  { faixa: "56-65", value: 3900 },
  { faixa: "65+", value: 2100 },
];

const colors = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  secondary: "hsl(var(--secondary-foreground))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
};

const pieColors = [
  colors.primary,
  colors.destructive,
  colors.muted,
  colors.accent,
  colors.secondary,
  "hsl(var(--primary) / 0.6)",
];

const tooltipProps = {
  cursor: { fill: "hsl(var(--muted))" },
  contentStyle: {
    borderRadius: 8,
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 12px 30px hsl(220 15% 15% / 0.12)",
  },
  formatter: (value: number | string, name: string) => [
    numberFormatter.format(Number(value)),
    name,
  ],
};

const allCharts: ChartInfo[] = [
  {
    id: "projetos",
    title: "Projetos aprovados",
    description: "Série anual consolidada entre Câmara e Senado",
    metric: "148",
    type: "Barra",
  },
  {
    id: "raca",
    title: "Distribuição por raça",
    description: "Registros por autodeclaração",
    metric: "35.512",
    type: "Barra horizontal",
  },
  {
    id: "votacao",
    title: "Votação",
    description: "Distribuição dos votos registrados",
    metric: "550",
    type: "Rosca",
  },
  {
    id: "regiao",
    title: "Casos por região",
    description: "Volume agregado por região brasileira",
    metric: "34.500",
    type: "Barra",
  },
  {
    id: "mensal",
    title: "Projetos mensais",
    description: "Propostos vs. aprovados ao longo do ano",
    metric: "273",
    type: "Linha",
  },
  {
    id: "partido",
    title: "Projetos por partido",
    description: "Quantidade agregada por sigla partidária",
    metric: "338",
    type: "Barra",
  },
  {
    id: "genero",
    title: "Distribuição por gênero",
    description: "Composição declarada no conjunto analisado",
    metric: "550",
    type: "Rosca",
  },
  {
    id: "idade",
    title: "Casos por faixa etária",
    description: "Distribuição por grupos de idade",
    metric: "23.700",
    type: "Área",
  },
];

const ChartCard = ({ chart, children }: { chart: ChartInfo; children: ReactElement }) => (
  <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {chart.type}
        </p>
        <h2 className="text-base font-semibold text-foreground">{chart.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{chart.description}</p>
      </div>
      <p className="rounded-md bg-muted px-2.5 py-1.5 text-sm font-semibold text-foreground">
        {chart.metric}
      </p>
    </div>
    <ResponsiveContainer width="100%" height={280}>
      {children}
    </ResponsiveContainer>
  </section>
);

const Graficos = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = allCharts.filter((chart) => {
    const haystack = `${chart.title} ${chart.description} ${chart.type}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const renderChart = (chart: ChartInfo) => {
    switch (chart.id) {
      case "projetos":
        return (
          <BarChart data={yearData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" name="Aprovados" fill={colors.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      case "raca":
        return (
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
              width={96}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" name="Registros" fill={colors.accent} radius={[0, 6, 6, 0]} />
          </BarChart>
        );
      case "votacao":
        return (
          <PieChart>
            <Pie
              data={voteData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={92}
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
        );
      case "regiao":
        return (
          <BarChart data={regionData} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" name="Casos" fill={colors.secondary} radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      case "mensal":
        return (
          <LineChart data={monthlyData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="projetos" name="Propostos" stroke={colors.primary} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="aprovados" name="Aprovados" stroke={colors.destructive} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        );
      case "partido":
        return (
          <BarChart data={partidoData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" name="Projetos" fill={colors.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      case "genero":
        return (
          <PieChart>
            <Pie
              data={genderData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              fontSize={11}
            >
              {genderData.map((_, index) => (
                <Cell key={`gender-${index}`} fill={pieColors[index]} />
              ))}
            </Pie>
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        );
      case "idade":
        return (
          <AreaChart data={ageData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="faixa" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipProps} />
            <Area
              type="monotone"
              dataKey="value"
              name="Casos"
              fill="hsl(var(--primary) / 0.22)"
              stroke={colors.primary}
              strokeWidth={2.5}
            />
          </AreaChart>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Todos os Gráficos</h1>
            <p className="text-sm text-muted-foreground">
              Painéis resumidos para leitura rápida dos dados do projeto.
            </p>
          </div>
        </div>
        <div className="relative w-full sm:ml-auto sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar gráficos..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      <main className="grid grid-cols-1 gap-5 p-4 sm:p-8 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((chart) => (
          <ChartCard key={chart.id} chart={chart}>
            {renderChart(chart)}
          </ChartCard>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum gráfico encontrado.
          </p>
        )}
      </main>
    </div>
  );
};

export default Graficos;
