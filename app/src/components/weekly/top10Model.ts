import { SEV, sevAt, type SevKey } from '../../data/weeklySeed';
import type { Top10Item, Top10SnapshotItem, WeeklyData } from '../../types/models';
import { shortWeek } from '../../utils/week';
import { wk } from './ui';

export type MoveKind = 'new' | 'up' | 'down' | 'shift' | 'same' | 'pending';

export const MOVE: Record<MoveKind, { badge: string; bg: string; fg: string }> = {
  new: { badge: 'NEW', bg: wk.blue, fg: '#fff' },
  up: { badge: '▲', bg: wk.redBright, fg: '#fff' },
  down: { badge: '▼', bg: wk.green, fg: '#fff' },
  shift: { badge: '↔', bg: wk.amberBg, fg: wk.amber },
  same: { badge: '●', bg: '#EEF0F3', fg: wk.muted },
  pending: { badge: '?', bg: '#EEF0F3', fg: wk.muted },
};

export const STATUS = {
  open: { label: 'Open', bg: wk.blueBg, fg: wk.blueInk },
  verifying: { label: 'Verifying', bg: wk.amberBg, fg: wk.amber },
  closed: { label: 'Closed ✓', bg: wk.greenBg, fg: wk.greenInk },
} as const;

export const resOf = (v: Top10Item['ver']): SevKey => sevAt(Number(v.rl) || 0, Number(v.ri) || 0);

export interface Row extends Top10Item {
  rank: number; // 0 for closed
  sevKey: SevKey;
  mv: MoveKind;
  mvText: string;
  statusMoved: string; // '' if not moved, else "Open → Verifying"
}

export interface LeftItem {
  id: string;
  tag: string;
  l: number;
  i: number;
  closed: boolean;
  reason: string;
  note: string;
}

export function prevWeekKey(weekly: WeeklyData, curKey: string): string {
  return Object.keys(weekly.snapshots || {})
    .filter((k) => k < curKey)
    .sort()
    .pop() || '';
}

export function buildTop10(weekly: WeeklyData, curKey: string) {
  const prevKey = prevWeekKey(weekly, curKey);
  const prev: Top10SnapshotItem[] = prevKey ? weekly.snapshots[prevKey] : [];
  const prevMap = Object.fromEntries(prev.map((p) => [p.id, p]));
  const pW = shortWeek(prevKey) || 'last week';
  const cW = shortWeek(curKey);
  const statusRank = { open: 0, verifying: 1, closed: 2 };

  const ranked = weekly.top10
    .map((r, idx) => ({ r, idx }))
    .sort(
      (a, b) =>
        Number(a.r.status === 'closed') - Number(b.r.status === 'closed') ||
        SEV[sevAt(b.r.l, b.r.i)].rank - SEV[sevAt(a.r.l, a.r.i)].rank ||
        b.r.l * b.r.i - a.r.l * a.r.i ||
        statusRank[a.r.status] - statusRank[b.r.status] ||
        a.idx - b.idx
    )
    .map((x) => x.r);

  let n = 0;
  const all: Row[] = ranked.map((r) => {
    const sevKey = sevAt(r.l, r.i);
    const closed = r.status === 'closed';
    if (!closed) n++;
    const p = prevMap[r.id];
    let mv: MoveKind = 'new';
    let mvText = 'New this week';
    if (p) {
      const pk = sevAt(p.l, p.i);
      const pTxt = `${SEV[pk].label} ${p.l}×${p.i}`;
      const cTxt = sevKey === 'N' ? 'not re-assessed' : `${SEV[sevKey].label} ${r.l}×${r.i}`;
      if (sevKey === 'N') mv = 'pending';
      else if (SEV[sevKey].rank > SEV[pk].rank) mv = 'up';
      else if (SEV[sevKey].rank < SEV[pk].rank) mv = 'down';
      else if (p.l !== r.l || p.i !== r.i) mv = 'shift';
      else mv = 'same';
      mvText = `${pW} ${pTxt} → ${cW} ${cTxt}`;
    }
    return {
      ...r,
      rank: closed ? 0 : n,
      sevKey,
      mv,
      mvText,
      statusMoved: p && p.status !== r.status ? `${STATUS[p.status].label} → ${STATUS[r.status].label}` : '',
    };
  });
  const active = all.filter((x) => x.status !== 'closed');
  const activeIds = new Set(active.map((x) => x.id));

  const left: LeftItem[] = prev
    .filter((p) => !activeIds.has(p.id))
    .map((p) => {
      const row = all.find((x) => x.id === p.id);
      const closed = !!row && row.status === 'closed';
      const rem = [...(weekly.removed || [])].reverse().find((x) => x.id === p.id);
      return {
        id: p.id,
        tag: p.tag,
        l: p.l,
        i: p.i,
        closed,
        reason: closed ? 'Closed — verified' : 'Removed without close-out',
        note: closed
          ? `Residual ${SEV[resOf(row!.ver)].label} · verified by ${row!.ver.by || '—'}`
          : rem
            ? 'Reason: ' + rem.reason
            : 'ไม่ได้ระบุเหตุผล — ควรปิดผ่าน effectiveness check',
      };
    });

  const sevCount = (keys: SevKey[]) => (['C', 'S', 'L', 'V'] as SevKey[]).map((k) => keys.filter((x) => x === k).length);
  const prevCounts = sevCount(prev.map((p) => sevAt(p.l, p.i)));
  const nowCounts = sevCount(active.map((a) => a.sevKey));

  const byMove = (k: MoveKind) => active.filter((x) => x.mv === k);

  return {
    prevKey,
    pW,
    cW,
    prev,
    all,
    active,
    activeIds,
    left,
    prevCounts,
    nowCounts,
    moves: {
      new: byMove('new'),
      up: byMove('up'),
      down: byMove('down'),
      shift: byMove('shift'),
      pending: byMove('pending'),
      same: byMove('same'),
      status: active.filter((x) => x.statusMoved),
    },
  };
}

export type Top10Model = ReturnType<typeof buildTop10>;

export const stepsText = (r: Top10Item) =>
  r.steps.length ? r.steps.map((a) => ({ Done: '✓ ', Watch: '◐ ', Open: '○ ' })[a.status] + a.text + (a.result ? ' — ' + a.result : '')).join('\n') : '—';

export const STEP_DOT = { Done: wk.greenDot, Watch: wk.blue, Open: wk.amberBright } as const;
