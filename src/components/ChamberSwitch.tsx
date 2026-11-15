import { Link } from "react-router-dom";
export default function ChamberSwitch({ value, indicators = false }: { value: string; indicators?: boolean }) {
  const options = indicators ? [["camara", "Câmara dos Deputados"], ["senado", "Senado Federal"], ["comparativo", "Comparativo Câmara x Senado"]] : [["camara", "Deputados Federais"], ["senado", "Senadores"]];
  return <nav aria-label={indicators ? "Opções dos indicadores" : "Casa legislativa"} className="mb-7 flex flex-wrap gap-2">{options.map(([key, label]) => <Link key={key} to={`${indicators ? "/graficos" : "/parlamentares"}${key === "camara" ? "" : `?casa=${key}`}`} aria-current={value === key ? "page" : undefined} className={`rounded-lg border px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] ${value === key ? "border-[#17324D] bg-[#17324D] text-white" : "border-border bg-white text-[#17324D] hover:border-[#167D8D]"}`}>{label}</Link>)}</nav>;
}
