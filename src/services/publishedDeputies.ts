import { validateDeputiesDataset } from "./deputiesDataset";

/** Only this same-origin file is loaded for lists and indicators. No live API fallback. */
export async function fetchPublishedDeputies(signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/deputados.json`, { signal: controller.signal, cache: "no-cache" });
    if (!response.ok) throw new Error(`O arquivo publicado não está disponível (HTTP ${response.status}).`);
    return await validateDeputiesDataset(await response.json());
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Não foi possível carregar a última publicação de dados. ${controller.signal.aborted ? "O tempo de espera foi excedido." : error instanceof Error ? error.message : "Verifique sua conexão."}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
