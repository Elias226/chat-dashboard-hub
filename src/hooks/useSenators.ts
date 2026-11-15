import { useQuery } from "@tanstack/react-query";
import { validateSenateDataset } from "@/services/senate";
export function useSenators() {
  return useQuery({ queryKey: ["published-senators"], queryFn: async ({ signal }) => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/senadores.json`, { signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]), cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await validateSenateDataset(await response.json());
    } catch (error) {
      if (signal.aborted) throw error;
      throw new Error("Não foi possível carregar a publicação do Senado. Verifique sua conexão ou tente novamente; nenhum dado parcial foi exibido.");
    }
  }, staleTime: 300000, gcTime: 600000, retry: false, refetchOnWindowFocus: false });
}
