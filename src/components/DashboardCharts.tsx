import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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


const DashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4 my-0 shadow-xl">
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

      <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Número de casos por Raça</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={raceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>);

};

export default DashboardCharts;