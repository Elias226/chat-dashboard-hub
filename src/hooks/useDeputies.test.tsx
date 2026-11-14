import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeputies, useDeputyDetails } from "./useDeputies";

const api = vi.hoisted(() => ({ fetchDeputies: vi.fn(), fetchDeputyDetails: vi.fn() }));
vi.mock("@/services/camaraDeputies", () => api);
vi.mock("@/services/publishedDeputies", () => ({ fetchPublishedDeputies: api.fetchDeputies }));
const key = ["camara", "deputados", "publicados"];
const snapshot = { complete: true, deputies: [{ id: 1, nome: "Pessoa de teste", siglaUf: "SP", siglaPartido: "ALFA" }], fetchedAt: "2026-11-04T12:00:00.000Z", pages: 1, duplicates: 0, invalidRecords: 0 };
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
beforeEach(() => { client = new QueryClient(); api.fetchDeputies.mockReset(); api.fetchDeputyDetails.mockReset(); });
afterEach(() => { cleanup(); client.clear(); });

describe("cache compartilhado e recuperação explícita", () => {
  it("deduplica observadores concorrentes e refetches manuais", async () => {
    let release!: (value: typeof snapshot) => void;
    api.fetchDeputies.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    const { result } = renderHook(() => [useDeputies(), useDeputies()], { wrapper });
    await waitFor(() => expect(api.fetchDeputies).toHaveBeenCalledTimes(1));
    act(() => { release(snapshot); });
    await waitFor(() => expect(result.current[0].data).toEqual(snapshot));
    act(() => { void result.current[0].refetch(); void result.current[1].refetch(); });
    await waitFor(() => expect(api.fetchDeputies).toHaveBeenCalledTimes(2));
    act(() => { release(snapshot); });
    await waitFor(() => expect(result.current[0].isFetching).toBe(false));
  });
  it("oferece apenas o último resultado completo e conserva a data original", async () => {
    client.setQueryData(key, snapshot);
    api.fetchDeputies.mockRejectedValue(new Error("API indisponível"));
    const { result } = renderHook(() => useDeputies(), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.canUseLastComplete).toBe(true);
    expect(result.current.usingLastComplete).toBe(false);
    act(() => result.current.useLastComplete());
    expect(result.current.usingLastComplete).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.fetchedAt).toBe(snapshot.fetchedAt);
  });
  it("sem cache não oferece dados substitutos nem reinicia ao remontar uma consulta com erro", async () => {
    api.fetchDeputies.mockRejectedValue(new Error("Sem conexão"));
    const first = renderHook(() => useDeputies(), { wrapper });
    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect(first.result.current.canUseLastComplete).toBe(false);
    expect(first.result.current.data).toBeUndefined();
    first.unmount();
    const second = renderHook(() => useDeputies(), { wrapper });
    await waitFor(() => expect(second.result.current.isError).toBe(true));
    expect(api.fetchDeputies).toHaveBeenCalledTimes(1);
  });
  it("não oferece um cache marcado como incompleto", async () => {
    client.setQueryData(key, { ...snapshot, complete: false });
    api.fetchDeputies.mockRejectedValue(new Error("API indisponível"));
    const { result } = renderHook(() => useDeputies(), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.canUseLastComplete).toBe(false);
  });
  it("detalhes com erro sem cache permanecem separados do cache da listagem", async () => {
    client.setQueryData(key, snapshot);
    api.fetchDeputyDetails.mockRejectedValue(new Error("HTTP 404"));
    const { result } = renderHook(() => useDeputyDetails(99), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.canUseLastComplete).toBe(false);
    expect(client.getQueryData(key)).toEqual(snapshot);
  });
});
