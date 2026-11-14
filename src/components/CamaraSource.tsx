import { CAMARA_DOCUMENTATION } from "@/services/camaraDeputies";

const CamaraSource = ({ fetchedAt }: { fetchedAt: string }) => (
  <div className="mt-6 rounded-xl border border-[#17324D]/10 bg-white p-4 text-xs leading-6 text-muted-foreground">
    <p>Fonte: <a href={CAMARA_DOCUMENTATION} target="_blank" rel="noreferrer" className="text-[#167D8D] underline">Dados Abertos da Câmara dos Deputados · documentação oficial</a>.</p>
    <p>Dados atualizados em <time dateTime={fetchedAt}>{new Date(fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> (Brasília).</p>
    <p>Campos ausentes são identificados como não informados; as informações podem mudar na fonte.</p>
  </div>
);

export default CamaraSource;
