import { useQuery } from "@tanstack/react-query";
import { validateProposalsDataset } from "@/services/proposalsDataset";

export async function fetchPublishedProposals(signal?: AbortSignal) {
  const combined = signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/proposicoes.json`, { signal: combined, cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await validateProposalsDataset(await response.json());
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Não foi possível carregar a publicação de proposições. Verifique sua conexão e tente novamente. Nenhuma consulta direta foi feita à Câmara.");
  }
}
export function useProposals() {
  return useQuery({ queryKey: ["published-proposals"], queryFn: ({ signal }) => fetchPublishedProposals(signal), staleTime: 5 * 60000, gcTime: 10 * 60000, retry: false, refetchOnWindowFocus: false });
}
