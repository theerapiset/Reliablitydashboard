import { useState, type ReactNode } from 'react';
import EditGate from '../EditGate';
import type { MonitorAsset, MonitorGroup, MonitorIcon } from '../../types/models';
import { uid } from '../../utils/calc';
import { weekOf } from '../../utils/week';
import { AddLinkRow, Icon, LinkBadge, PageHead, PiEmbed, btn, inputStyle, labelStyle, mono, useToast, useWeekly, wk } from '../weekly/ui';

type Status = 'Normal' | 'Alert' | 'Danger' | 'No data';
const COL: Record<Status, string> = { Normal: wk.green, Alert: '#B45309', Danger: wk.redBright, 'No data': wk.muted };
const CHIP: Record<Status, [string, string]> = { Normal: [wk.greenBg, wk.greenInk], Alert: [wk.amberBg, wk.amber], Danger: [wk.redBright, '#fff'], 'No data': ['#EEF0F3', wk.muted] };
const TINT: Record<Status, [string, string]> = { Danger: [wk.redBg, wk.red], Alert: [wk.amberBg, wk.amber], Normal: [wk.greenBg, wk.green], 'No data': [wk.line3, wk.text2] };
const ORDER: Record<Status, number> = { Danger: 0, Alert: 1, Normal: 2, 'No data': 3 };
const UNIT: Record<string, string> = { Vibration: 'mm/s', Temperature: '°C', 'Motor current': 'A', 'Differential pressure': 'kPa', 'Oil / grease analysis': 'ppm' };

const statusOf = (a: MonitorAsset, v: number): Status => (v >= a.danger ? 'Danger' : v >= a.alert ? 'Alert' : 'Normal');
const r1 = (v: number) => Math.round(v * 10) / 10;
const fmtN = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(r1(v)));

function geo(a: MonitorAsset, W: number, H: number, pad: number) {
  const vals = a.readings.map((r) => r.v);
  const lo = Math.min(...vals, a.alert) * 0.85;
  const hi = Math.max(...vals, a.danger) * 1.08;
  const y = (v: number) => r1(H - pad - ((v - lo) / (hi - lo || 1)) * (H - 2 * pad));
  const n = vals.length;
  const x = (i: number) => r1(n > 1 ? pad + (i * (W - 2 * pad)) / (n - 1) : W / 2);
  return { lo, hi, x, y, n, pts: vals.map((v, i) => `${x(i)},${y(v)}`).join(' ') };
}

function derive(a: MonitorAsset) {
  const vals = a.readings.map((r) => r.v);
  const last = vals.length ? vals[vals.length - 1] : 0;
  const prev = vals.length > 1 ? vals[vals.length - 2] : last;
  const status: Status = vals.length ? statusOf(a, last) : 'No data';
  return { last, diff: last - prev, status, has: vals.length > 0 };
}

const worst = (items: MonitorAsset[]): Status => items.reduce<Status>((w, a) => { const s = derive(a).status; return ORDER[s] < ORDER[w] ? s : w; }, 'No data');

function GroupIcon({ icon, size }: { icon: MonitorIcon; size: number }) {
  const p = { width: size, height: size, viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<MonitorIcon, ReactNode> = {
    motor: (<><rect x="6" y="15" width="26" height="17" rx="3" /><path d="M10 19.5h18M10 23.5h18M10 27.5h18" /><rect x="14" y="9" width="10" height="6" rx="1" /><rect x="32" y="20" width="3" height="7" /><path d="M35 23.5h8" /><path d="M10 32v4M28 32v4M6 36h26" /></>),
    compressor: (<><circle cx="21" cy="27" r="12" /><circle cx="21" cy="27" r="4" /><path d="M21 23c4-3 8-1 9 3M25 27c3 4 1 8-3 9M21 31c-4 3-8 1-9-3M17 27c-3-4-1-8 3-9" /><path d="M27 16.5V8h14" /><path d="M9 27H3" /><path d="M10 39h22" /></>),
    agitator: (<><rect x="19" y="3" width="10" height="8" rx="1.5" /><path d="M10 15h28" /><path d="M12 15v20a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5V15" /><path d="M24 11v24" /><path d="M17 33l7 2 7-2M17 37l7-2 7 2" /><path d="M12 22c3-2 5 2 8 0s5 2 8 0 5 2 8 0" /></>),
    centrifuge: (<><path d="M8 16h18a8 8 0 0 1 8 8v0a8 8 0 0 1-8 8H8z" /><path d="M8 13v22" /><rect x="37" y="19" width="8" height="10" rx="1.5" /><path d="M34 24h3" /><path d="M14 24a5 5 0 1 0 5-5" /><path d="M19 16.5 21 19l-2.5 2" /><path d="M5 40h40M12 32v8M30 32v8" /></>),
    hx: (<><rect x="5" y="16" width="38" height="16" rx="8" /><path d="M12 21h24M12 24h24M12 27h24" /><path d="M14 16V9M11 9h6" /><path d="M34 32v7M31 39h6" /><path d="M2 24h3M43 24h3" /></>),
  };
  return <svg {...p}>{paths[icon]}</svg>;
}

const chip = (s: Status, size = 12) => ({ padding: '2px 10px', borderRadius: 999, fontSize: size, fontWeight: 700, background: CHIP[s][0], color: CHIP[s][1], whiteSpace: 'nowrap' as const });

function TrendCard({ a, selected, onPick }: { a: MonitorAsset; selected: boolean; onPick: () => void }) {
  const d = derive(a);
  const g = geo(a, 280, 72, 6);
  const dangerY = Math.max(0, g.y(a.danger));
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 12, background: '#fff', color: wk.ink, ...(selected ? { border: `2px solid ${wk.blue}`, boxShadow: `0 0 0 3px ${wk.focus}` } : { border: d.status === 'Danger' ? `2px solid ${wk.redBright}` : `1px solid ${wk.line}` }) }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...mono, fontWeight: 700, fontSize: 16 }}>{a.tag}</span>
          <span style={{ fontSize: 12, color: wk.muted }}>
            {a.plant} · {a.param} ({a.unit})
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={chip(d.status)}>{d.status}</span>
          {a.sample && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#6B4E00', background: '#FFF1C2', padding: '1px 6px', borderRadius: 3 }}>SAMPLE</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, width: '100%' }}>
        <span style={{ ...mono, fontSize: 30, fontWeight: 700, color: COL[d.status] }}>{d.has ? fmtN(d.last) : '—'}</span>
        <span style={{ fontSize: 13, color: wk.muted }}>{a.unit}</span>
        {a.readings.length > 1 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: d.diff > 0 ? wk.red : wk.greenInk }}>
            {d.diff > 0 ? '▲ +' : d.diff < 0 ? '▼ ' : '■ '}
            {fmtN(d.diff)} vs last
          </span>
        )}
      </div>
      {d.has ? (
        <svg viewBox="0 0 280 72" width="100%" height={72} role="img" aria-label={`${a.tag} ${a.param} trend, latest ${fmtN(d.last)} ${a.unit}, ${d.status}`} style={{ display: 'block' }}>
          <rect x={0} y={0} width={280} height={dangerY} fill={wk.redBg} opacity={0.6} />
          <line x1={0} x2={280} y1={g.y(a.alert)} y2={g.y(a.alert)} stroke={wk.amberBright} strokeWidth={1} strokeDasharray="4 3" />
          <line x1={0} x2={280} y1={dangerY} y2={dangerY} stroke={wk.redBright} strokeWidth={1} strokeDasharray="4 3" />
          <polyline points={g.pts} fill="none" stroke={wk.ink} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={g.x(g.n - 1)} cy={g.y(d.last)} r={4} fill={COL[d.status]} stroke="#fff" strokeWidth={2} />
        </svg>
      ) : (
        <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: wk.muted, background: wk.soft, borderRadius: 6 }}>ยังไม่มีค่า reading</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 11, color: wk.muted }}>
        <span>{a.readings[0]?.d || ''}</span>
        <span>
          Alert {a.alert} · Danger {a.danger}
        </span>
        <span>{a.readings[a.readings.length - 1]?.d || ''}</span>
      </div>
    </button>
  );
}

function DetailChart({ a }: { a: MonitorAsset }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 240;
  const g = geo(a, W, H, 14);
  const dY = Math.max(0, g.y(a.danger));
  const aY = g.y(a.alert);
  if (!a.readings.length) {
    return <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px dashed ${wk.inputLine}`, borderRadius: 8, color: wk.muted }}>เพิ่ม reading ด้านขวาเพื่อแสดง trend</div>;
  }
  const hv = hover !== null ? a.readings[hover] : null;
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ ...mono, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: H, fontSize: 11, color: wk.muted, textAlign: 'right', minWidth: 40 }}>
          <span>{fmtN(g.hi)}</span>
          <span>{fmtN((g.hi + g.lo) / 2)}</span>
          <span>{fmtN(g.lo)}</span>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${a.tag} ${a.param} trend`}
            style={{ display: 'block', borderLeft: `1px solid ${wk.inputLine}`, borderBottom: `1px solid ${wk.inputLine}` }}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const px = ((e.clientX - rect.left) / rect.width) * W;
              let best = 0;
              for (let i = 1; i < g.n; i++) if (Math.abs(g.x(i) - px) < Math.abs(g.x(best) - px)) best = i;
              setHover(best);
            }}
          >
            <rect x={0} y={0} width={W} height={dY} fill={wk.redBg} opacity={0.55} />
            <rect x={0} y={dY} width={W} height={Math.max(0, aY - dY)} fill="#FFF1DC" opacity={0.7} />
            <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke={wk.line2} strokeWidth={1} />
            <line x1={0} x2={W} y1={aY} y2={aY} stroke={wk.amberBright} strokeWidth={1.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
            <line x1={0} x2={W} y1={dY} y2={dY} stroke={wk.redBright} strokeWidth={1.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
            {hover !== null && <line x1={g.x(hover)} x2={g.x(hover)} y1={0} y2={H} stroke={wk.muted} strokeWidth={1} vectorEffect="non-scaling-stroke" />}
            <polyline points={g.pts} fill="none" stroke={wk.blue} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {hv && hover !== null && (
            <>
              <span style={{ position: 'absolute', left: `${(g.x(hover) / W) * 100}%`, top: g.y(hv.v), width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: '50%', background: wk.blue, border: '2px solid #fff', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: `${(g.x(hover) / W) * 100}%`, top: 6, transform: hover > g.n / 2 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)', background: wk.ink, color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ color: '#C9D6E3' }}>{hv.d}</div>
                <div style={{ ...mono, fontWeight: 700 }}>
                  {fmtN(hv.v)} {a.unit} · {statusOf(a, hv.v)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ ...mono, display: 'flex', justifyContent: 'space-between', paddingLeft: 48, fontSize: 11, color: wk.muted }}>
        {a.readings.map((r, i) => (
          <span key={i}>{r.d}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, paddingLeft: 48 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 3, background: wk.blue }} />
          Reading
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, borderTop: `2px dashed ${wk.amberBright}` }} />
          Alert {a.alert} {a.unit}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, borderTop: `2px dashed ${wk.redBright}` }} />
          Danger {a.danger} {a.unit}
        </span>
      </div>
    </>
  );
}

export default function CriticalMonitoring() {
  const { weekly, update } = useWeekly();
  const { flash, node: toast } = useToast();
  const week = weekOf();
  const groups = weekly.groups;
  const [grp, setGrp] = useState(groups[0]?.id || '');
  const [sel, setSel] = useState(() => weekly.assets.find((a) => a.group === groups[0]?.id)?.id || '');
  const [embedIdx, setEmbedIdx] = useState(() => groups[0]?.links.findIndex((l) => l.kind === 'pi') ?? -1);
  const [newD, setNewD] = useState('');
  const [newV, setNewV] = useState('');

  const G: MonitorGroup | undefined = groups.find((g) => g.id === grp) || groups[0];
  if (!G) return null;
  const gItems = weekly.assets.filter((a) => a.group === G.id).sort((a, b) => ORDER[derive(a).status] - ORDER[derive(b).status]);
  const s = gItems.find((a) => a.id === sel);
  const embedLink = embedIdx >= 0 ? G.links[embedIdx] : undefined;

  const patch = (id: string, fn: (a: MonitorAsset) => void) => update((w) => { const a = w.assets.find((x) => x.id === id); if (a) fn(a); });
  const patchGroup = (fn: (g: MonitorGroup) => void) => update((w) => { const g = w.groups.find((x) => x.id === G.id); if (g) fn(g); });

  const pickGroup = (g: MonitorGroup) => {
    setGrp(g.id);
    setSel(weekly.assets.find((a) => a.group === g.id)?.id || '');
    setEmbedIdx(g.links.findIndex((l) => l.kind === 'pi'));
  };

  const addReading = () => {
    const v = parseFloat(newV);
    if (!s || isNaN(v)) return;
    patch(s.id, (x) => void x.readings.push({ d: newD.trim() || weekOf().key.slice(5), v }));
    setNewD('');
    setNewV('');
  };

  const hostOf = (u: string) => {
    try {
      return new URL(u).host;
    } catch {
      return u;
    }
  };
  const gw = gItems.length ? worst(gItems) : 'No data';
  const flagged = weekly.assets.filter((a) => ['Alert', 'Danger'].includes(derive(a).status));

  const shareText = (items: MonitorAsset[]) =>
    items.map((a) => { const d = derive(a); return `${a.tag} (${a.service}) · ${a.param}: ${d.has ? fmtN(d.last) : '—'} ${a.unit} · ${d.status} (Alert ${a.alert} / Danger ${a.danger})${a.note ? '\n  ' + a.note : ''}`; }).join('\n');
  const share = (subject: string, items: MonitorAsset[], msg: string) => {
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText(items))}`, '_self');
    flash(msg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1600, margin: '0 auto', color: wk.ink, fontSize: 14, lineHeight: 1.45 }}>
      <PageHead
        title="Critical Equipment Monitoring"
        week={week.label}
        sub="เลือกกลุ่มเครื่องจักรเพื่อดู trend, PI link และค่าที่ monitor เป็นประจำ"
        right={
          <button type="button" onClick={() => share(`Critical equipment weekly trend — ${week.label}`, [...weekly.assets].sort((a, b) => ORDER[derive(a).status] - ORDER[derive(b).status]), `Weekly trend summary opened · ${flagged.length} points in Alert / Danger highlighted`)} style={{ ...btn('dark', 44), borderRadius: 10, gap: 8 }}>
            <Icon.Send />
            Share weekly trend to manager
          </button>
        }
      />

      <section aria-label="Equipment groups" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {groups.map((g) => {
          const items = weekly.assets.filter((a) => a.group === g.id);
          const w = items.length ? worst(items) : 'No data';
          const on = g.id === G.id;
          return (
            <button key={g.id} type="button" onClick={() => pickGroup(g)} aria-pressed={on} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, padding: 16, borderRadius: 14, background: '#fff', color: wk.ink, minHeight: 150, ...(on ? { border: `2px solid ${wk.blue}`, boxShadow: `0 0 0 3px ${wk.focus}` } : { border: `1px solid ${wk.line}` }) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: TINT[w][0], color: TINT[w][1] }}>
                  <GroupIcon icon={g.icon} size={44} />
                </div>
                <span style={chip(w, 11)}>{w}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{g.name}</span>
                <span style={{ fontSize: 12, color: wk.muted }}>
                  {items.length} point{items.length === 1 ? '' : 's'} · {g.links.length} link{g.links.length === 1 ? '' : 's'}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      <section style={{ background: '#fff', border: `1px solid ${wk.line}`, borderRadius: 14, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${wk.line2}`, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: wk.blueBg, color: wk.blueInk }}>
              <GroupIcon icon={G.icon} size={40} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{G.name}</h2>
              <span style={{ fontSize: 13, color: wk.muted }}>
                {gItems.length} monitoring point{gItems.length === 1 ? '' : 's'} · worst status {gw}
              </span>
            </div>
          </div>
          <EditGate>
            <button
              type="button"
              onClick={() => {
                const id = 'a' + uid();
                update((w) => void w.assets.push({ id, group: G.id, tag: '[TAG]', plant: '[Plant]', service: G.name, param: 'Vibration', unit: 'mm/s', alert: 4.5, danger: 7.1, sample: false, note: '', readings: [] }));
                setSel(id);
              }}
              style={{ ...btn('outline', 40), fontWeight: 400, gap: 8 }}
            >
              <Icon.Plus />
              Add monitoring point
            </button>
          </EditGate>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${wk.line2}`, display: 'flex', flexDirection: 'column', gap: 10, background: wk.soft }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Live data &amp; PI links</h3>
            <span style={{ fontSize: 12, color: wk.muted }}>เปิดในเครือข่ายบริษัท</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {G.links.map((lk, n) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #C7D5F5', borderRadius: 10, background: '#fff' }}>
                <a href={lk.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 6px 0 12px', textDecoration: 'none', color: wk.ink }}>
                  <LinkBadge kind={lk.kind} />
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{lk.label}</span>
                    <span style={{ fontSize: 11, color: wk.muted, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hostOf(lk.url)}</span>
                  </span>
                  <Icon.External />
                </a>
                {lk.kind === 'pi' && (
                  <button type="button" onClick={() => setEmbedIdx(embedIdx === n ? -1 : n)} style={{ ...(embedIdx === n ? btn('dark', 30) : { ...btn('outline', 30), border: `1px solid ${wk.ink}`, fontWeight: 600 }), fontSize: 12, borderRadius: 6, padding: '0 10px' }}>
                    {embedIdx === n ? 'Hide' : 'Show here'}
                  </button>
                )}
                <EditGate>
                  <button type="button" aria-label="Remove link" onClick={() => { patchGroup((g) => void g.links.splice(n, 1)); setEmbedIdx(-1); }} style={{ ...btn('ghost', 32), marginRight: 4 }}>
                    ×
                  </button>
                </EditGate>
              </div>
            ))}
            {G.links.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 14px', border: '1.5px dashed #9FB3C8', borderRadius: 10, color: wk.muted, fontSize: 13 }}>ยังไม่มีลิงก์ — เพิ่ม PI Vision display ของกลุ่มนี้ด้านล่าง</div>
            )}
          </div>
          <EditGate>
            <AddLinkRow
              kinds={[
                ['pi', 'PI Vision'],
                ['app', 'App / recorder'],
                ['link', 'Report / other'],
              ]}
              placeholder="ชื่อ เช่น Agitator gearbox vib. 30d"
              cta="Add link"
              onAdd={(l) => {
                const idx = G.links.length;
                patchGroup((g) => void g.links.push(l));
                if (l.kind === 'pi') setEmbedIdx(idx);
              }}
            />
          </EditGate>
          {embedLink && embedLink.kind === 'pi' && <PiEmbed key={embedLink.url} link={embedLink} />}
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gItems.some((a) => a.sample) && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#FFF8E1', border: '1px solid #F0D58A', fontSize: 12, color: '#6B4E00' }}>
              <Icon.Alert />
              Trend ที่มีป้าย SAMPLE เป็นค่าตัวอย่าง · tag ใน [ ] ให้แก้เป็น tag จริง · alert / danger limits แก้ได้ในแต่ละจุด
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {gItems.map((a) => (
              <TrendCard key={a.id} a={a} selected={a.id === sel} onPick={() => setSel(a.id)} />
            ))}
          </div>
          {gItems.length === 0 && <div style={{ padding: 24, border: `1.5px dashed ${wk.inputLine}`, borderRadius: 12, textAlign: 'center', color: wk.muted }}>ยังไม่มี monitoring point ในกลุ่มนี้ — กด Add monitoring point</div>}
        </div>
      </section>

      {s && (
        <section style={{ background: '#fff', border: `1px solid ${wk.line}`, borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${wk.line2}`, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, color: wk.muted }}>Trend detail · {G.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ ...mono, margin: 0, fontSize: 22, fontWeight: 700 }}>{s.tag}</h2>
                <span style={chip(derive(s).status)}>{derive(s).status}</span>
                <span style={{ color: wk.muted, fontSize: 13 }}>
                  {s.plant} · {s.param} ({s.unit}) · {s.service}
                </span>
              </div>
            </div>
            <button type="button" onClick={() => share(`Trend ${s.tag} — ${s.param}`, [s], `Trend ${s.tag} opened in email to share with manager`)} style={btn('outlineBlue', 44)}>
              Share this trend
            </button>
          </div>
          <EditGate>
            <div style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ flex: '2 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DetailChart a={s} />
                <label style={{ ...labelStyle, marginTop: 8 }}>
                  Comment ถึง manager
                  <textarea rows={3} value={s.note} onChange={(e) => patch(s.id, (x) => void (x.note = e.target.value))} placeholder="สรุปสั้นๆ: trend, สาเหตุที่สงสัย, action ต่อไป…" style={{ ...inputStyle, resize: 'vertical' }} />
                </label>
              </div>
              <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <label style={labelStyle}>
                    Tag
                    <input value={s.tag} onChange={(e) => patch(s.id, (x) => void (x.tag = e.target.value))} style={{ ...inputStyle, ...mono }} />
                  </label>
                  <label style={labelStyle}>
                    Parameter
                    <select value={s.param} onChange={(e) => patch(s.id, (x) => { x.param = e.target.value; x.unit = UNIT[e.target.value] || x.unit; })} style={inputStyle}>
                      {Object.keys(UNIT).map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label style={labelStyle}>
                    Plant
                    <input value={s.plant} onChange={(e) => patch(s.id, (x) => void (x.plant = e.target.value))} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Service
                    <input value={s.service} onChange={(e) => patch(s.id, (x) => void (x.service = e.target.value))} style={inputStyle} />
                  </label>
                  <label style={{ ...labelStyle, color: wk.amber }}>
                    Alert limit
                    <input type="number" step="any" value={s.alert} onChange={(e) => patch(s.id, (x) => void (x.alert = Number(e.target.value) || 0))} style={inputStyle} />
                  </label>
                  <label style={{ ...labelStyle, color: wk.red }}>
                    Danger limit
                    <input type="number" step="any" value={s.danger} onChange={(e) => patch(s.id, (x) => void (x.danger = Number(e.target.value) || 0))} style={inputStyle} />
                  </label>
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Readings</h3>
                <div style={{ border: `1px solid ${wk.line2}`, borderRadius: 8, maxHeight: 240, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: wk.head, textAlign: 'left' }}>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 600 }}>Date / week</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Value</th>
                        <th scope="col" style={{ padding: '8px 6px', width: 40 }} aria-label="Remove" />
                      </tr>
                    </thead>
                    <tbody>
                      {s.readings
                        .map((r, i) => ({ r, i }))
                        .reverse()
                        .map(({ r, i }) => (
                          <tr key={i} style={{ borderTop: `1px solid ${wk.line3}` }}>
                            <td style={{ padding: '6px 10px' }}>{r.d}</td>
                            <td style={{ ...mono, padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: COL[statusOf(s, r.v)] }}>{fmtN(r.v)}</td>
                            <td style={{ padding: '2px 6px' }}>
                              <button type="button" aria-label="Remove reading" onClick={() => patch(s.id, (x) => void x.readings.splice(i, 1))} style={btn('ghost', 32)}>
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <input aria-label="Reading date or week" value={newD} onChange={(e) => setNewD(e.target.value)} placeholder="W44 / 29 Oct" style={{ ...inputStyle, flex: '1 1 100px', width: 'auto' }} />
                  <input type="number" step="any" aria-label="Reading value" value={newV} onChange={(e) => setNewV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addReading()} placeholder="Value" style={{ ...inputStyle, flex: '1 1 80px', width: 'auto' }} />
                  <button type="button" onClick={addReading} style={{ ...btn('dark'), fontWeight: 400 }}>
                    Add reading
                  </button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: wk.muted }}>
                  <input type="checkbox" checked={s.sample} onChange={() => patch(s.id, (x) => void (x.sample = !x.sample))} />
                  Sample values (show SAMPLE badge)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Delete monitoring point ${s.tag}?`)) return;
                    update((w) => void (w.assets = w.assets.filter((x) => x.id !== s.id)));
                    setSel('');
                  }}
                  style={{ ...btn('outline', 36), alignSelf: 'flex-start', border: '1px solid #E8B4B2', color: wk.red, fontWeight: 400 }}
                >
                  Delete monitoring point
                </button>
              </div>
            </div>
          </EditGate>
        </section>
      )}
      {toast}
    </div>
  );
}
