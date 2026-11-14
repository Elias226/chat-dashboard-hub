import { useState } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchDeputyDetails } from "@/services/camaraDeputies";
import { fetchPublishedDeputies } from "@/services/publishedDeputies";

type CompleteData = { complete: true; fetchedAt: string };

function useCompleteCamaraQuery<T extends CompleteData>(options: UseQueryOptions<T, Error>) {
  const query = useQuery({
    ...options,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // As tentativas são feitas por requisição HTTP, não reiniciando toda a paginação.
    retry: false,
    retryOnMount: false,
    refetchOnMount: (cached) => cached.state.status !== "error",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [acceptedData, setAcceptedData] = useState<T | null>(null);
  const canUseLastComplete = query.isError && query.data?.complete === true;
  const usingLastComplete = canUseLastComplete && acceptedData === query.data;

  return {
    ...query,
    isError: query.isError && !usingLastComplete,
    canUseLastComplete,
    usingLastComplete,
    useLastComplete: () => { if (canUseLastComplete) setAcceptedData(query.data!); },
    refetch: () => {
      setAcceptedData(null);
      // Cliques repetidos reutilizam a consulta em andamento, sem cancelá-la e refazê-la.
      return query.refetch({ cancelRefetch: false });
    },
  };
}

export function useDeputies() {
  return useCompleteCamaraQuery({
    queryKey: ["camara", "deputados", "publicados"],
    queryFn: ({ signal }) => fetchPublishedDeputies(signal),
    staleTime: Infinity,
  });
}

export function useDeputyDetails(id: number | null, enabled = true) {
  return useCompleteCamaraQuery({
    queryKey: ["camara", "deputado", id],
    queryFn: ({ signal }) => fetchDeputyDetails(id!, signal),
    enabled: id !== null && enabled,
  });
}
