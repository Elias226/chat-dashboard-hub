import BrandLogo from "@/components/BrandLogo";
import "./SiteFooter.css";

interface SiteFooterProps {
  compact?: boolean;
  showAiNotice?: boolean;
}

const SiteFooter = ({ compact = false, showAiNotice = false }: SiteFooterProps) => (
  <footer className={`site-footer${compact ? " site-footer-compact" : ""}`}>
    <div className="site-footer-inner">
      <div className="site-footer-identity">
        <BrandLogo small />
        <span>Projeto acadêmico</span>
      </div>
      <p>
        Educação política com fontes verificáveis.
        {showAiNotice && <span className="site-footer-ai">Respostas de IA podem conter erros. Confira as fontes.</span>}
      </p>
    </div>
  </footer>
);

export default SiteFooter;
