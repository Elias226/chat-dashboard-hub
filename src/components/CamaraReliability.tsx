import { Button } from "@/components/ui/button";

export const CamaraUnavailable = ({ title, message, onRetry, onUseLastComplete }: {
  title: string;
  message: string;
  onRetry: () => void;
  onUseLastComplete?: () => void;
}) => (
  <div role="alert" className="rounded-xl border border-destructive/30 bg-white p-6">
    <p className="font-semibold text-[#17324D]">{title}</p>
    <p className="mt-2 text-sm leading-7 text-muted-foreground">{message}</p>
    <p className="mt-2 text-sm text-muted-foreground">Nenhum dado fictício ou resultado parcial será exibido.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Button onClick={onRetry} variant="outline">Tentar novamente</Button>
      {onUseLastComplete && <Button onClick={onUseLastComplete} variant="outline">Usar última consulta completa</Button>}
    </div>
  </div>
);

export const CamaraStaleNotice = ({ fetchedAt }: { fetchedAt: string }) => (
  <div role="status" className="mb-5 rounded-xl border border-[#F3B95F] bg-[#F3B95F]/15 p-4 text-sm leading-7 text-[#243746]">
    <p className="font-semibold">Exibindo a última consulta completa salva nesta sessão. Os dados podem estar desatualizados.</p>
    <p>Consulta original: <time dateTime={fetchedAt}>{new Date(fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> (Brasília). A tentativa de atualização não foi concluída.</p>
  </div>
);
