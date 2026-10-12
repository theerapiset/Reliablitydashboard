import {
  MONTHS,
  RECORDABLE_CATEGORIES,
  SAFETY_CATEGORIES,
  type ConcernBlock,
  type MonthName,
  type ReliabilityEvent,
  type SafetyCategory,
  type ShutdownPerfKpiRow,
  type Year,
} from '../types/models';

export function num(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export function fmt(n: unknown, d = 1): string {
  if (n === '' || n == null || isNaN(Number(n))) return '–';
  return Number(n).toFixed(d);
}

export function monthIdx(m: string | null | undefined): number {
  return MONTHS.indexOf((m || '') as MonthName);
}

export function monthOf(iso: string | null | undefined): MonthName | '' {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return MONTHS[d.getMonth()];
}

export function hoursBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const d = (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
  return d > 0 ? Math.round(d * 100) / 100 : 0;
}

export function uid(): string {
  return 'x' + Math.random().toString(36).slice(2, 9);
}

/** Sum of all event hours in a reliability array (used for PTA ESD hours accum). */
export function esdHoursAccum(events: ReliabilityEvent[]): number {
  return events.reduce((s, e) => s + num(e.hours), 0);
}

/**
 * Σ hours of CTA-shutdown-tab events with plantEffect==='ESD' only — a CTA
 * event with a different effect (e.g. "CTA load down") is real downtime of
 * some kind, but not an ESD, so it shouldn't count toward "CTA ESD hours".
 * This is also the numerator behind % unplanned downtime, so the two stay
 * in lockstep by construction.
 */
export function ctaEsdHoursAccum(cta: ReliabilityEvent[]): number {
  return cta.filter((e) => e.plantEffect === 'ESD').reduce((s, e) => s + num(e.hours), 0);
}

/** % unplanned downtime = ctaEsdHoursAccum(cta) / 26280 * 100 */
export function unplannedPct(cta: ReliabilityEvent[]): number {
  return (ctaEsdHoursAccum(cta) / 26280) * 100;
}

export interface CostTotals {
  il3: number;
  il4: number;
  overdue: number;
  count: number;
}

export function costTotals(year: Year, activeMonth: MonthName, activeYear: number): CostTotals {
  let il3 = 0;
  let il4 = 0;
  let overdue = 0;
  const curM = monthIdx(activeMonth);
  year.cost.forEach((p) => {
    if (p.status === 'Release saving (IL4)') il4 += num(p.actualMB || p.planMB);
    else il3 += num(p.planMB);
    if (
      p.status !== 'Release saving (IL4)' &&
      p.sil4Year &&
      (num(p.sil4Year) < activeYear || (num(p.sil4Year) === activeYear && monthIdx(p.sil4Month) <= curM))
    ) {
      overdue++;
    }
  });
  return { il3, il4, overdue, count: year.cost.length };
}

export interface CostSavingProject {
  name: string;
  mb: number;
}

/** Project-level breakdown behind the IL4/IL3 cost-saving totals, for hover detail. */
export function costSavingBreakdown(year: Year): { il4: CostSavingProject[]; il3: CostSavingProject[] } {
  const il4: CostSavingProject[] = [];
  const il3: CostSavingProject[] = [];
  year.cost.forEach((p) => {
    if (p.status === 'Release saving (IL4)') il4.push({ name: p.projectName, mb: num(p.actualMB || p.planMB) });
    else il3.push({ name: p.projectName, mb: num(p.planMB) });
  });
  return { il4, il3 };
}

/** category -> 12-month derived counts, from safety.log entries */
export function safetyMonthlyCounts(year: Year): Record<SafetyCategory, number[]> {
  const out = {} as Record<SafetyCategory, number[]>;
  SAFETY_CATEGORIES.forEach((c) => (out[c] = Array(12).fill(0)));
  (year.safety.log || []).forEach((l) => {
    const mi = monthIdx(l.month || monthOf(l.date));
    if (mi < 0 || !l.type || !out[l.type as SafetyCategory]) return;
    out[l.type as SafetyCategory][mi]++;
  });
  return out;
}

export function safetyRecordable(year: Year): number {
  return (year.safety.log || []).filter((l) => RECORDABLE_CATEGORIES.includes(l.type as SafetyCategory)).length;
}

export interface PlantEventBucket {
  p1: number;
  p2: number;
  p3: number;
}

export interface PlantCase {
  topic: string;
  hours: number;
  effect: string;
}

export function monthlyByPlant(entries: ReliabilityEvent[]) {
  const M: PlantEventBucket[] = Array.from({ length: 12 }, () => ({ p1: 0, p2: 0, p3: 0 }));
  const C: Record<'p1' | 'p2' | 'p3', PlantCase[]>[] = Array.from({ length: 12 }, () => ({
    p1: [],
    p2: [],
    p3: [],
  }));
  entries.forEach((e) => {
    const i = monthIdx(e.month || monthOf(e.sdStart));
    if (i < 0) return;
    const pk: 'p1' | 'p2' | 'p3' = e.plant === 'Plant 2' ? 'p2' : e.plant === 'Plant 3' ? 'p3' : 'p1';
    M[i][pk] += num(e.hours);
    C[i][pk].push({ topic: e.topic, hours: num(e.hours), effect: e.plantEffect });
  });
  return { M, C };
}

export function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  let m: number;
  if (n <= 1) m = 1;
  else if (n <= 2) m = 2;
  else if (n <= 5) m = 5;
  else m = 10;
  return m * pow;
}

export function esc(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>');
}

export const IMPACT_COLOR: Record<string, string> = {
  ESD: '#cf2e2e',
  'CTA load down': '#d9822b',
  'Re slurry': '#2f6fd0',
  Resolvent: '#7a5cc0',
};

export function impactColor(effect: string): string {
  return IMPACT_COLOR[effect] || '#5a6878';
}

/**
 * Starting point for a new "free layout" Concerning Equipment canvas — the
 * standard headings everyone is expected to fill in, positioned as a stacked
 * left column. Fully editable afterward (reposition, rename, resize, delete)
 * so this only sets the shared starting template, not a hard requirement.
 */
export function defaultConcernBlocks(): ConcernBlock[] {
  const sections: [string, string][] = [
    ['Background', 'Double-click to edit — what happened, when it was found…'],
    ['Observation', 'Double-click to edit — what was observed / inspected…'],
    ['Possible cause', 'Double-click to edit — likely root cause…'],
    ['Corrective Action', 'Double-click to edit — what was done…'],
    ['Preventive Action', 'Double-click to edit — how to prevent recurrence…'],
  ];
  const heights = [22, 14, 20, 14, 14];
  let y = 2;
  return sections.map(([label, body], i) => {
    const h = heights[i];
    const block: ConcernBlock = {
      id: uid(),
      type: 'text',
      x: 2,
      y,
      w: 46,
      h,
      z: i + 1,
      html: `<div><strong style="color:#1257a8">${esc(label)}</strong></div><div>${esc(body)}</div>`,
    };
    y += h + 2;
    return block;
  });
}

/** Starting point for a new Shutdown Performance KPI table — the 3 standard rows. */
export function defaultShutdownKpiRows(): ShutdownPerfKpiRow[] {
  return [
    { id: uid(), kpi: 'Incident Case', plan: '0', actual: '', remark: '' },
    { id: uid(), kpi: 'Shutdown Cost (MB)', plan: '', actual: '', remark: '' },
    { id: uid(), kpi: 'Shutdown Day', plan: '', actual: '', remark: '' },
  ];
}

const SHUTDOWN_KPI_ICONS: Record<string, string> = {
  'Incident Case': '✅',
  'Shutdown Cost (MB)': '💰',
  'Shutdown Day': '⏱️',
};

export function shutdownKpiIcon(label: string): string {
  return SHUTDOWN_KPI_ICONS[label] || '📌';
}

export function applySlideOrder<T extends { key: string }>(items: T[], order: string[] | undefined): T[] {
  if (!order || !order.length) return items;
  const byKey = new Map(items.map((it) => [it.key, it]));
  const ordered: T[] = [];
  order.forEach((k) => {
    const it = byKey.get(k);
    if (it) {
      ordered.push(it);
      byKey.delete(k);
    }
  });
  byKey.forEach((it) => ordered.push(it));
  return ordered;
}
