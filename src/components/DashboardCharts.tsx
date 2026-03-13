import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const yearData = [
{ year: "2020", value: 35 },
{ year: "2021", value: 28 },
{ year: "2022", value: 22 },
{ year: "2023", value: 18 },
{ year: "2024", value: 15 },
{ year: "2025", value: 12 },
{ year: "2026", value: 10 },
{ year: "2027", value: 8 }];


const raceData = [
{ name: "amarela", value: 148 },
{ name: "branca", value: 11861 },
{ name: "indígena", value: 314 },
{ name: "parda", value: 13484 },
{ name: "preta", value: 4952 },
{ name: "NA", value: 4753 }];


const voteData = [
{ name: "Sim", value: 320 },
{ name: "Não", value: 180 },
{ name: "Abstenção", value: 50 }];


const PIE_COLORS = [
"hsl(var(--primary))",
"hsl(var(--destructive))",
"hsl(var(--muted-foreground))"];


const regionData = [
{ name: "Norte", value: 4200 },
{ name: "Nordeste", value: 8500 },
{ name: "Centro-Oeste", value: 3100 },
{ name: "Sudeste", value: 12400 },
{ name: "Sul", value: 6300 }];


const DashboardCharts = () => {
  return (
    <ScrollArea className="w-full" type="always">
      <div className="gap-6 pb-4 flex flex-row" style={{ minWidth: "1600px" }}>
        <div className="min-w-[380px] flex-1 rounded-xl border border-border bg-card p-4 shadow">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Casos por Ano</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-[380px] flex-1 rounded-xl border border-border bg-card p-4 shadow">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Número de casos por Raça</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={raceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-[380px] flex-1 rounded-xl border border-border bg-card p-4 shadow">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Votação</p>
          <ResponsiveContainer width="100%" height={220} className="py-0 my-0">
            <PieChart>
              <Pie
                data={voteData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                fontSize={11}>
                
                {voteData.map((_, index) =>
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                )}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-[380px] flex-1 rounded-xl border border-border bg-card p-4 shadow">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Casos por Região</p>
          <ResponsiveContainer width="100%" height={220} className="bg-transparent text-primary">
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>);

};

export default DashboardCharts;