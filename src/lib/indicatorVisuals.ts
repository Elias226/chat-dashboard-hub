import type { DeputyGroup } from "@/services/camaraDeputies";
import { PROPOSAL_TYPES, type ProposalDetail } from "@/services/camaraProposals";
const partyKey = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
const palette: Record<string, string> = {
  AVANTE: "#96713B", CIDADANIA: "#547D92", MDB: "#98623E", NOVO: "#B06B24", PCDOB: "#9E526A", PDT: "#517649", PL: "#245A81", PODE: "#6C5F92", PP: "#36818A", PRD: "#9F645D", PSB: "#9A7B2D", PSD: "#467C68", PSDB: "#697C32", PSOL: "#896C34", PT: "#9D5151", PV: "#347856", REDE: "#436D98", REPUBLICANOS: "#735C83", SOLIDARIEDADE: "#A65C35", UNIAO: "#4F6B88", UP: "#8B5C75",
};
const noParty = (name: string) => ["S/PARTIDO", "SEM PARTIDO", "NAO INFORMADO", "INDEPENDENTE"].includes(partyKey(name));
export function partyColor(name: string) {
  let key = partyKey(name); if (key === "PODEMOS") key = "PODE";
  if (noParty(name)) return "#75818C";
  if (palette[key]) return palette[key];
  let hash = 0; for (const letter of key) hash = (hash * 31 + letter.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 45% 38%)`;
}
export function partySummary(groups: DeputyGroup[]) {
  const parties = groups.filter(row => row.count > 0 && !noParty(row.category));
  const largest = Math.max(0, ...parties.map(row => row.count));
  return { total: groups.reduce((sum, row) => sum + row.count, 0), parties: parties.length, largestCount: largest, largestParties: parties.filter(row => row.count === largest).map(row => row.category).sort((a, b) => a.localeCompare(b, "pt-BR")) };
}
/** Symbolic semicircle, sorted by sigla. No ideology or real seat coordinates. */
export function hemicycleSeats(groups: DeputyGroup[]) {
  if (groups.some(row => !row.category.trim() || !Number.isSafeInteger(row.count) || row.count < 0) || new Set(groups.map(row => row.category)).size !== groups.length) throw new Error("Contagens inválidas para o hemiciclo.");
  const sorted = [...groups].filter(row => row.count > 0).sort((a, b) => partyKey(a.category).localeCompare(partyKey(b.category), "pt-BR"));
  const total = sorted.reduce((sum, row) => sum + row.count, 0);
  if (!total) return [];
  if (total > 2000) throw new Error("Quantidade excede o limite de leitura do hemiciclo.");
  const rowCount = Math.min(total, Math.max(1, Math.ceil(Math.sqrt(total) / 2.2)));
  const radii = Array.from({ length: rowCount }, (_, index) => rowCount === 1 ? 220 : 130 + index * 140 / (rowCount - 1));
  const sum = radii.reduce((a, b) => a + b, 0), allocation = radii.map(radius => Math.floor(total * radius / sum));
  const remainders = radii.map((radius, index) => ({ index, fraction: total * radius / sum - allocation[index] })).sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let left = total - allocation.reduce((a, b) => a + b, 0), index = 0; left > 0; left--, index++) allocation[remainders[index].index]++;
  const gap = Math.min(...radii.map((radius, index) => allocation[index] > 1 ? 2 * radius * Math.sin(Math.PI / (2 * allocation[index])) : Infinity));
  const size = Math.min(9, gap * 0.34, rowCount > 1 ? 140 / (rowCount - 1) * 0.34 : 9);
  const points = radii.flatMap((radius, row) => Array.from({ length: allocation[row] }, (_, column) => {
    const angle = Math.PI * (column + 0.5) / allocation[row];
    return { x: 300 + radius * Math.cos(angle), y: 285 - radius * Math.sin(angle), radius: size, angle, ring: row };
  })).sort((a, b) => b.angle - a.angle || a.ring - b.ring);
  const labels = sorted.flatMap(row => Array.from({ length: row.count }, () => row.category));
  return points.map((point, index) => ({ ...point, party: labels[index] }));
}
export function proposalGroups(records: ProposalDetail[], start: string, end: string) {
  const types = PROPOSAL_TYPES.map(category => ({ category, count: records.filter(row => row.siglaTipo === category).length })), days: DeputyGroup[] = [];
  for (let value = Date.parse(start); value <= Date.parse(end); value += 86400000) {
    const iso = new Date(value).toISOString().slice(0, 10);
    days.push({ category: iso.split("-").reverse().join("/"), count: records.filter(row => row.dataApresentacao?.slice(0, 10) === iso).length });
  }
  return { types, days };
}
