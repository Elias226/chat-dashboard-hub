import { Link, NavLink } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const ParliamentHeader = () => (
  <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-5 py-4 sm:px-8">
    <Link to="/" aria-label="Chat Político — página inicial"><BrandLogo small /></Link>
    <nav aria-label="Navegação de parlamentares" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#17324D]">
      {[["/", "Início"], ["/chat", "Assistente IA"], ["/parlamentares", "Parlamentares"], ["/projetos-de-lei", "Projetos de lei"], ["/graficos", "Indicadores"]].map(([to, label]) => (
        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167D8D] focus-visible:ring-offset-4 ${isActive ? "font-semibold text-[#167D8D]" : ""}`}>{label}</NavLink>
      ))}
    </nav>
  </header>
);

export default ParliamentHeader;
