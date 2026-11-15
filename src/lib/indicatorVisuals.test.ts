import { expect, it } from "vitest";
import { hemicycleSeats, partyColor, partySummary, proposalGroups } from "./indicatorVisuals";
import { proposalFixture } from "@/test/proposalsFixture";

it.each([0, 1, 2, 81, 513])("produz exatamente %i cadeiras com coordenadas válidas", count => {
  const seats = hemicycleSeats([{ category: "PL", count }]);
  expect(seats).toHaveLength(count);
  expect(new Set(seats.map(point => `${point.x.toFixed(6)}/${point.y.toFixed(6)}`)).size).toBe(count);
  for (const seat of seats) {
    expect(Number.isFinite(seat.x + seat.y + seat.radius)).toBe(true);
    expect(seat.x - seat.radius).toBeGreaterThanOrEqual(0);
    expect(seat.x + seat.radius).toBeLessThanOrEqual(600);
    expect(seat.y - seat.radius).toBeGreaterThanOrEqual(0);
    expect(seat.y + seat.radius).toBeLessThanOrEqual(310);
  }
});
it("não sobrepõe os círculos no tamanho real da Câmara", () => {
  const seats = hemicycleSeats([{ category: "PL", count: 513 }]);
  for (let i = 0; i < seats.length; i++) for (let j = i + 1; j < seats.length; j++) expect(Math.hypot(seats[i].x - seats[j].x, seats[i].y - seats[j].y)).toBeGreaterThan(seats[i].radius + seats[j].radius);
});
it("conserva a quantidade por partido e ordena siglas, sem usar alinhamento ideológico", () => {
  const groups = [{ category: "PT", count: 13 }, { category: "MDB", count: 39 }, { category: "PL", count: 29 }];
  const seats = hemicycleSeats(groups);
  expect([...new Set(seats.map(seat => seat.party))]).toEqual(["MDB", "PL", "PT"]);
  for (const row of groups) expect(seats.filter(seat => seat.party === row.category)).toHaveLength(row.count);
  expect(hemicycleSeats([...groups].reverse())).toEqual(seats);
});
it("cores são estáveis entre Casas, acentos e nomes equivalentes", () => {
  expect(partyColor("UNIÃO")).toBe(partyColor("UNIAO"));
  expect(partyColor("PODEMOS")).toBe(partyColor("PODE"));
  expect(partyColor("pt")).toBe(partyColor("PT"));
  expect(partyColor("ALFA")).toBe(partyColor("ALFA"));
});
it("resumos tratam empates e não contam ausência de partido como bancada", () => {
  expect(partySummary([{ category: "ALFA", count: 2 }, { category: "BETA", count: 2 }, { category: "S/Partido", count: 5 }, { category: "Não informado", count: 1 }])).toEqual({ total: 10, parties: 2, largestCount: 2, largestParties: ["ALFA", "BETA"] });
  expect(partySummary([])).toMatchObject({ total: 0, parties: 0, largestParties: [] });
});
it.each([-1, 1.5, NaN, 2001])("recusa contagem inválida ou excessiva: %s", count => expect(() => hemicycleSeats([{ category: "X", count }])).toThrow());
it("agrupa o recorte por tipo e dia, incluindo dias sem apresentação sem alterar datas", () => {
  const groups = proposalGroups([proposalFixture(), proposalFixture(102), proposalFixture(103)], "2026-11-08", "2026-11-14");
  expect(groups.types).toEqual([{ category: "PL", count: 1 }, { category: "PEC", count: 1 }, { category: "PLP", count: 1 }]);
  expect(groups.days).toHaveLength(7);
  expect(groups.days[2]).toEqual({ category: "10/11/2026", count: 3 });
  expect(groups.days[0].count).toBe(0);
  expect(groups.days.reduce((sum, row) => sum + row.count, 0)).toBe(3);
});
