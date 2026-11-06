// ISO-8601 week helpers for the weekly monitoring views.

export interface WeekInfo {
  key: string; // 2026-W43
  num: number; // 43
  label: string; // W43 · 19–25 Oct 2026
}

function isoWeekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - day);
  return x;
}

export function weekOf(d: Date = new Date()): WeekInfo {
  const start = isoWeekStart(d);
  const thursday = new Date(start);
  thursday.setDate(start.getDate() + 3);
  const isoYear = thursday.getFullYear();
  const jan4 = new Date(isoYear, 0, 4);
  const week1 = isoWeekStart(jan4);
  const num = 1 + Math.round((start.getTime() - week1.getTime()) / (7 * 86400000));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const mon = (x: Date) => x.toLocaleDateString('en-GB', { month: 'short' });
  const range =
    start.getMonth() === end.getMonth()
      ? `${start.getDate()}–${end.getDate()} ${mon(end)} ${end.getFullYear()}`
      : `${start.getDate()} ${mon(start)} – ${end.getDate()} ${mon(end)} ${end.getFullYear()}`;
  return { key: `${isoYear}-W${String(num).padStart(2, '0')}`, num, label: `W${num} · ${range}` };
}

/** "2026-W42" -> "W42" */
export const shortWeek = (key: string) => (key ? key.slice(key.indexOf('W')) : '');

export function fmtDate(iso: string, month: 'short' | 'long' = 'short'): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: month === 'short' ? '2-digit' : 'numeric', month, year: 'numeric' });
}

export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export const nowStamp = (withYear = false) =>
  new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
