import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";

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
  { name: "amarela", value: 148 },
  { name: "branca", value: 11861 },
  { name: "indígena", value: 314 },
  { name: "parda", value: 13484 },
  { name: "preta", value: 4952 },
  { name: "NA", value: 4753 },
];

const voteData = [
  { name: "Sim", value: 320 },
  { name: "Não", value: 180 },
  { name: "Abstenção", value: 50 },
];

const regionData = [
  { name: "Norte", value: 4200 },
  { name: "Nordeste", value: 8500 },
  { name: "Centro-Oeste", value: 3100 },
  { name: "Sudeste", value: 12400 },
  { name: "Sul", value: 6300 },
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

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(var(--primary) / 0.6)",
];

const allCharts = [
  { id: "projetos", title: "Projetos de Lei Aprovados (Câmara + Senado)", type: "bar" },
  { id: "raca", title: "Número de Casos por Raça", type: "bar" },
  { id: "votacao", title: "Votação", type: "pie" },
  { id: "regiao", title: "Casos por Região", type: "bar" },
  { id: "mensal", title: "Projetos Mensais (Propostos vs Aprovados)", type: "line" },
  { id: "partido", title: "Projetos por Partido", type: "bar" },
  { id: "genero", title: "Distribuição por Gênero", type: "pie" },
  { id: "idade", title: "Casos por Faixa Etária", type: "area" },
];

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-5 shadow">
    <p className="mb-3 text-sm font-medium text-muted-foreground">{title}</p>
    <ResponsiveContainer width="100%" height={260}>
      {children}
    </ResponsiveContainer>
  </div>
);

const Graficos = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = allCharts.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const renderChart = (chart: (typeof allCharts)[0]) => {
    switch (chart.id) {
      case "projetos":
        return (
          <BarChart data={yearData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "raca":
        return (
          <BarChart data={raceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "votacao":
        return (
          <PieChart>
            <Pie data={voteData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
              {voteData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        );
      case "regiao":
        return (
          <BarChart data={regionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "mensal":
        return (
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="projetos" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="aprovados" stroke="hsl(var(--destructive))" strokeWidth={2} />
          </LineChart>
        );
      case "partido":
        return (
          <BarChart data={partidoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "genero":
        return (
          <PieChart>
            <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
              {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        );
      case "idade":
        return (
          <AreaChart data={ageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth={2} />
          </AreaChart>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background px-8 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Todos os Gráficos</h1>
        <div className="relative ml-auto w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar gráficos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((chart) => (
          <ChartCard key={chart.id} title={chart.title}>
            {renderChart(chart)}
          </ChartCard>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum gráfico encontrado.
          </p>
        )}
      </div>
    </div>
  );
};

export default Graficos;
