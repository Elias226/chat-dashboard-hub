export const CAMARA_REQUEST_TIMEOUT_MS = 20000;
export const CAMARA_LIST_BUDGET_MS = 120000;
export const CAMARA_DETAIL_BUDGET_MS = 70000;
export const CAMARA_MAX_ATTEMPTS = 3;

type FailureKind = "http" | "network" | "timeout" | "deadline";
export class CamaraRequestError extends Error {
  readonly kind: FailureKind;
  readonly url: string;
  readonly status?: number;
  readonly retryAfterMs: number;
  constructor(message: string, kind: FailureKind, url: string, status?: number, retryAfterMs = 0) {
    super(message);
    this.name = "CamaraRequestError";
    this.kind = kind;
    this.url = url;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export interface CamaraBudget {
  signal: AbortSignal;
  deadlineAt: number;
}

function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : new DOMException("Consulta cancelada.", "AbortError");
}

function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortReason(signal));
  return new Promise((resolve, reject) => {
    const abort = () => reject(abortReason(signal));
    signal.addEventListener("abort", abort, { once: true });
    operation.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(abortReason(signal)); return; }
    const abort = () => { clearTimeout(timer); reject(abortReason(signal)); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export function retryAfterDelay(value: string | null, now = Date.now()): number {
  if (!value?.trim()) return 0;
  if (/^\d+(\.\d+)?$/.test(value.trim())) return Number(value) * 1000;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now) : 0;
}

export async function withCamaraBudget<T>(url: string, timeout: number, external: AbortSignal | undefined, operation: (budget: CamaraBudget) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(external?.reason);
  if (external?.aborted) abort();
  external?.addEventListener("abort", abort, { once: true });
  const deadlineAt = Date.now() + timeout;
  const timer = setTimeout(() => controller.abort(new CamaraRequestError("O tempo máximo desta consulta à Câmara foi atingido. Tente novamente mais tarde.", "deadline", url)), timeout);
  try {
    if (controller.signal.aborted) throw abortReason(controller.signal);
    return await abortable(operation({ signal: controller.signal, deadlineAt }), controller.signal);
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", abort);
  }
}

async function requestOnce(url: string, budget: CamaraBudget, onResponse?: (response: Response) => void): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort(budget.signal.reason);
  if (budget.signal.aborted) abort();
  budget.signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(new CamaraRequestError("A consulta à Câmara excedeu o tempo de espera.", "timeout", url)), CAMARA_REQUEST_TIMEOUT_MS);
  try {
    return await abortable((async () => {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new CamaraRequestError(`A API da Câmara respondeu com erro HTTP ${response.status}.`, "http", url, response.status, retryAfterDelay(response.headers?.get("Retry-After") ?? null));
      onResponse?.(response);
      return await response.json();
    })(), controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw abortReason(controller.signal);
    if (error instanceof TypeError) throw new CamaraRequestError("O navegador não conseguiu acessar a Câmara. Pode ser uma falha de rede ou um bloqueio de acesso pela fonte.", "network", url);
    if (error instanceof SyntaxError) throw new Error("A Câmara retornou uma resposta que não pôde ser lida.");
    throw error;
  } finally {
    clearTimeout(timer);
    budget.signal.removeEventListener("abort", abort);
  }
}

export async function fetchCamaraJson(url: string, budget: CamaraBudget, onResponse?: (response: Response) => void): Promise<unknown> {
  for (let attempt = 1; attempt <= CAMARA_MAX_ATTEMPTS; attempt += 1) {
    if (budget.signal.aborted) throw abortReason(budget.signal);
    try {
      return await requestOnce(url, budget, onResponse);
    } catch (error) {
      if (budget.signal.aborted) throw abortReason(budget.signal);
      const transient = error instanceof CamaraRequestError && (error.kind === "timeout" || error.kind === "network" || (error.kind === "http" && [408, 429, 502, 503, 504].includes(error.status!)));
      if (!transient) throw error;
      if (attempt === CAMARA_MAX_ATTEMPTS) throw new CamaraRequestError(`${error.message} As ${CAMARA_MAX_ATTEMPTS} tentativas foram esgotadas. Tente novamente mais tarde.`, error.kind, url, error.status, error.retryAfterMs);
      const delay = Math.max(1000 * 2 ** (attempt - 1), error.retryAfterMs);
      if (delay >= budget.deadlineAt - Date.now()) throw new CamaraRequestError(error.retryAfterMs ? "A Câmara solicitou aguardar antes de uma nova tentativa, além do limite desta consulta. Tente novamente mais tarde." : "O tempo restante desta consulta não permite outra tentativa. Tente novamente mais tarde.", "deadline", url, error.status, error.retryAfterMs);
      await wait(delay, budget.signal);
    }
  }
  throw new Error("Não foi possível concluir a consulta à Câmara.");
}
