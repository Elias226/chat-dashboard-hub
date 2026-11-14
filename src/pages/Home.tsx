import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  FileText,
  Landmark,
  MessageCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import "./Home.css";
import BrandLogo from "@/components/BrandLogo";
import SiteFooter from "@/components/SiteFooter";

const features = [
  {
    title: "Assistente IA",
    icon: MessageCircle,
    description: "Tire dúvidas sobre política brasileira em uma conversa simples e direta.",
    to: "/chat",
    action: "Iniciar conversa",
    status: "Disponível",
    featured: true,
  },
  {
    title: "Parlamentares",
    icon: UsersRound,
    description: "Conheça os deputados federais em exercício e consulte suas informações na Câmara.",
    to: "/parlamentares",
    action: "Consultar deputados",
    status: "Disponível",
  },
  {
    title: "Projetos de lei",
    icon: FileText,
    description: "Uma futura área para pesquisar propostas e acompanhar seu caminho até virar lei.",
    status: "Em desenvolvimento",
  },
  {
    title: "Indicadores",
    icon: BarChart3,
    description: "Consulte a distribuição dos deputados federais em exercício por estado e por partido.",
    to: "/graficos",
    action: "Explorar gráficos",
    status: "Fonte oficial",
  },
];

const Home = () => (
  <div className="home-page">
    <a className="home-skip-link" href="#conteudo">Pular para o conteúdo</a>

    <header className="home-header">
      <div className="home-container home-header-inner">
        <Link to="/" aria-label="Chat Político — página inicial">
          <BrandLogo />
        </Link>
        <nav className="home-nav" aria-label="Navegação principal">
          <Link to="/" aria-current="page" className="home-nav-active">Início</Link>
          <Link to="/chat">Assistente IA</Link>
          <Link to="/parlamentares">Parlamentares</Link>
          <Link to="/graficos">Indicadores</Link>
        </nav>
        <Link to="/chat" className="home-button home-header-cta">
          Abrir assistente <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>

    <main id="conteudo">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-container home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-eyebrow"><span /> MAIS CLAREZA. MAIS CIDADANIA.</p>
            <h1 id="home-title">Política não precisa ser <span>complicada.</span></h1>
            <p className="home-description">
              Entenda a política brasileira, explore informações públicas e tire suas dúvidas com o auxílio de inteligência artificial.
            </p>
            <div className="home-hero-actions">
              <Link to="/chat" className="home-button">
                Conversar com o assistente <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#explorar" className="home-text-link">Conhecer o projeto <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <p className="home-hero-note"><Scale size={16} aria-hidden="true" /> Um projeto acadêmico a serviço da educação política.</p>
          </div>

          <div className="home-hero-art">
            <div className="home-art-caption"><span className="home-art-dot" /> POLÍTICA MAIS PERTO DE VOCÊ</div>
            <svg className="home-congress" viewBox="0 0 520 310" role="img" aria-labelledby="congress-title">
              <title id="congress-title">Ilustração estilizada do Congresso Nacional</title>
              <defs>
                <pattern id="home-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#17324D" strokeOpacity=".06" />
                </pattern>
              </defs>
              <rect width="520" height="310" fill="url(#home-grid)" />
              <circle cx="370" cy="92" r="60" fill="#F3B95F" opacity=".7" />
              <circle cx="255" cy="169" r="127" fill="none" stroke="#167D8D" strokeOpacity=".15" />
              <path d="M40 248 H480 M65 260 H455 M95 272 H425" stroke="#167D8D" strokeOpacity=".25" />
              <path d="M80 235 H441 V247 H80 Z" fill="#17324D" />
              <path d="M100 225 H423 V235 H100 Z" fill="#167D8D" />
              <path d="M222 55 H252 V225 H222 Z M262 55 H292 V225 H262 Z" fill="#F5F8FB" stroke="#17324D" strokeWidth="2" />
              <path d="M229 62 H245 V218 H229 Z M269 62 H285 V218 H269 Z" fill="#17324D" />
              <path d="M237 62 V218 M277 62 V218" stroke="#F5F8FB" strokeOpacity=".3" />
              <path d="M98 215 Q149 147 200 215 Z" fill="#F5F8FB" stroke="#17324D" strokeWidth="2" />
              <path d="M309 178 Q360 246 411 178 Z" fill="#F5F8FB" stroke="#17324D" strokeWidth="2" />
              <path d="M309 178 H411 M98 215 H200" stroke="#17324D" strokeWidth="3" />
              <path d="M317 193 H403 M323 202 H397 M329 210 H391" stroke="#167D8D" strokeOpacity=".35" />
              <path d="M116 225 V215 M182 225 V215 M329 225 V208 M390 225 V208" stroke="#17324D" strokeWidth="2" />
              <path d="M67 106 H115 M91 82 V130 M427 139 H451 M439 127 V151" stroke="#167D8D" strokeOpacity=".4" />
              <circle cx="155" cy="103" r="4" fill="#167D8D" />
              <circle cx="421" cy="75" r="3" fill="#17324D" />
            </svg>
            <div className="home-art-bottom">
              <span className="home-art-icon"><Landmark size={22} aria-hidden="true" /></span>
              <div><strong>Entender é o primeiro passo.</strong><span>Informação para uma participação consciente.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="explorar" className="home-features home-container" aria-labelledby="features-title">
        <div className="home-section-heading">
          <div><p className="home-eyebrow">EXPLORE O CHAT POLÍTICO</p><h2 id="features-title">Um ponto de partida para entender mais.</h2></div>
          <p>Escolha por onde começar.</p>
        </div>
        <div className="home-feature-grid">
          {features.map(({ title, icon: Icon, description, to, action, status, featured }) => (
            <article key={title} className={`home-feature-card${featured ? " home-feature-card-featured" : ""}`}>
              <div className="home-card-top"><span className="home-feature-icon"><Icon size={24} aria-hidden="true" /></span></div>
              <span className={`home-status${to ? " home-status-available" : ""}`}>{status}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              {to ? (
                <Link to={to} className="home-card-action">{action}<ArrowRight size={18} aria-hidden="true" /></Link>
              ) : (
                <span className="home-card-pending">Disponível em uma próxima etapa</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="home-principles home-container" aria-label="Sobre a proposta do projeto">
        <div><ShieldCheck size={22} aria-hidden="true" /><div><h2>Fontes como referência</h2><p>Consulte os links das fontes nas respostas do assistente.</p></div></div>
        <div><Scale size={22} aria-hidden="true" /><div><h2>Espaço para compreender</h2><p>Uma proposta educativa, sem recomendação de voto.</p></div></div>
        <div><Sparkles size={22} aria-hidden="true" /><div><h2>IA com olhar crítico</h2><p>O assistente pode cometer erros. Confira as informações.</p></div></div>
      </section>
    </main>

    <SiteFooter showAiNotice />
  </div>
);

export default Home;
