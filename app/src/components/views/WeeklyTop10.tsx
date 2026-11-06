import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import EditGate from '../EditGate';
import { useAuth } from '../../store/AuthContext';
import { I_SCALE, ISO_LISTS, L_SCALE, POOL, SEV, blankTop10, sevAt, top10FromPool, type SevKey } from '../../data/weeklySeed';
import type { Top10Item, Top10Source, WeeklyPlant } from '../../types/models';
import { daysUntil, fmtDate, nowStamp, weekOf } from '../../utils/week';
import { uid } from '../../utils/calc';
import Top10Detail, { SRC_STYLE } from '../weekly/Top10Detail';
import { MOVE, STATUS, STEP_DOT, buildTop10, resOf, stepsText, type Row } from '../weekly/top10Model';
import { CloseBtn, Icon, KpiRow, KpiTile, Modal, PageHead, Panel, PanelHead, PlantTabs, btn, inputStyle, mono, pill, useToast, useWeekly, wk } from '../weekly/ui';

type PlantFilter = 'All' | WeeklyPlant;
const PLANT_TABS: [PlantFilter, string][] = [
  ['All', 'All Plants'],
  ['Plant 1', 'Plant 1'],
  ['Plant 2', 'Plant 2'],
  ['Plant 3', 'Plant 3'],
  ['UT', 'UT'],
];

const th: CSSProperties = { padding: 10, fontWeight: 600 };
const td: CSSProperties = { padding: '12px 10px', verticalAlign: 'top' };
const srOnly: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' };

function MoveBadge({ r }: { r: Row }) {
  const m = MOVE[r.mv];
  return (
    <div title={r.mvText}>
      <span style={{ ...mono, display: 'inline-block', marginTop: 4, minWidth: 18, textAlign: 'center', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: m.bg, color: m.fg }}>{m.badge}</span>
    </div>
  );
}

function ScaleGuide({ onClose }: { onClose: () => void }) {
  const cellHead: CSSProperties = { padding: '6px 12px', fontWeight: 600 };
  return (
    <div style={{ padding: '16px 20px', background: wk.soft, borderBottom: `1px solid ${wk.line2}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Likelihood / Impact scale guide</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: wk.muted }}>Likelihood ref. MC 1 Nov 2021</span>
          <CloseBtn onClick={onClose} size={32} />
        </div>
      </div>
      <div style={{ overflowX: 'auto', border: `1px solid ${wk.line}`, borderRadius: 8, background: '#fff' }}>
        <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th scope="col" rowSpan={2} style={{ padding: '8px 12px', width: 56, background: wk.line3, fontWeight: 700, verticalAlign: 'bottom' }}>
                Level
              </th>
              <th scope="colgroup" colSpan={3} style={{ padding: '8px 12px', background: '#1E3A70', color: '#fff', fontWeight: 700 }}>
                Likelihood — โอกาสที่จะเกิด
              </th>
              <th scope="colgroup" colSpan={3} style={{ padding: '8px 12px', background: wk.amber, color: '#fff', fontWeight: 700, borderLeft: '2px solid #fff' }}>
                Impact — ผลกระทบ
              </th>
            </tr>
            <tr style={{ textAlign: 'left', fontSize: 12, color: wk.text2 }}>
              <th style={{ ...cellHead, background: wk.blueBg }}>ระดับ</th>
              <th style={{ ...cellHead, background: wk.blueBg }}>Probability of future events</th>
              <th style={{ ...cellHead, background: wk.blueBg }}>สภาพเครื่องจักร (guide)</th>
              <th style={{ ...cellHead, background: wk.amberBg, borderLeft: '2px solid #fff' }}>ระดับ</th>
              <th style={{ ...cellHead, background: wk.amberBg }}>ผลกระทบต่อ Plant</th>
              <th style={{ ...cellHead, background: wk.amberBg }}>ตัวอย่างเหตุการณ์เครื่องจักร</th>
            </tr>
          </thead>
          <tbody>
            {[...L_SCALE].reverse().map((l) => {
              const im = I_SCALE[l.n - 1];
              const c: CSSProperties = { padding: '10px 12px' };
              return (
                <tr key={l.n} style={{ borderTop: `1px solid ${wk.line2}`, verticalAlign: 'top' }}>
                  <td style={{ ...c, ...mono, fontSize: 16, fontWeight: 700, textAlign: 'center' }}>{l.n}</td>
                  <td style={{ ...c, fontWeight: 600, whiteSpace: 'nowrap' }}>{l.name}</td>
                  <td style={{ ...c, ...mono, fontWeight: 600, whiteSpace: 'nowrap', background: '#FFFDE8' }}>{l.prob}</td>
                  <td style={{ ...c, color: wk.muted }}>{l.desc}</td>
                  <td style={{ ...c, fontWeight: 600, whiteSpace: 'nowrap', borderLeft: `2px solid ${wk.line2}` }}>{im.name}</td>
                  <td style={c}>{im.desc}</td>
                  <td style={{ ...c, color: wk.muted }}>{im.ex}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: wk.muted }}>Severity = ตำแหน่งบน Risk Matrix 5×5 (Likelihood × Impact) · Critical / Significant / Low / Very Low</div>
    </div>
  );
}

function WowGroup({ label, color, children }: { label: string; color: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
      {children}
    </div>
  );
}

export default function WeeklyTop10() {
  const { weekly, update } = useWeekly();
  const { isAdmin } = useAuth();
  const { flash, node: toast } = useToast();
  const week = weekOf();
  const m = useMemo(() => buildTop10(weekly, week.key), [weekly, week.key]);

  const [plant, setPlant] = useState<PlantFilter>('All');
  const [showScale, setShowScale] = useState(false);
  const [addMenu, setAddMenu] = useState(false);
  const [pool, setPool] = useState<Top10Source | ''>('');
  const [cmp, setCmp] = useState(true);
  const [detailId, setDetailId] = useState('');
  const [recipDraft, setRecipDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const patchItem = (id: string) => (fn: (x: Top10Item) => void) =>
    update((w) => {
      const x = w.top10.find((r) => r.id === id);
      if (x) fn(x);
    });

  const rows = plant === 'All' ? m.all : m.all.filter((x) => x.plant === plant);
  const detail = m.all.find((x) => x.id === detailId);
  const recipsOn = weekly.recips.filter((r) => r.on);
  const sentThisWeek = !!weekly.sentAt && weekly.sentWeek === week.key;
  const acked = sentThisWeek ? recipsOn.filter((r) => r.ack).length : 0;
  const closedRows = m.all.filter((x) => x.status === 'closed');

  const kpi = {
    active: m.active.length,
    critical: m.active.filter((x) => x.sevKey === 'C').length,
    significant: m.active.filter((x) => x.sevKey === 'S').length,
    unassessed: m.active.filter((x) => x.sevKey === 'N').length,
    open: m.all.filter((x) => x.status === 'open').length,
    verifying: m.all.filter((x) => x.status === 'verifying').length,
    closed: closedRows.length,
  };

  const addManual = () => {
    const id = 'm' + uid();
    update((w) => void w.top10.push(blankTop10(id, 'MANUAL', plant === 'All' ? 'Plant 1' : plant)));
    setAddMenu(false);
    setDetailId(id);
  };
  const prevById = Object.fromEntries(m.prev.map((p) => [p.id, p]));
  const addFromPool = (id: string) => {
    const p = POOL.find((x) => x.id === id);
    if (!p) return;
    update((w) => {
      if (w.top10.some((r) => r.id === id)) return;
      w.top10.push(top10FromPool(p, prevById[id]));
    });
  };

  const subject = `Top 10 Plant Concerning — ${week.label.replace(' · ', ' (')}) · Please acknowledge`;
  const wowLines: [string, string][] = [
    ...m.moves.new.map((x): [string, string] => ['New', x.tag]),
    ...m.moves.up.map((x): [string, string] => ['Escalated', `${x.tag} (${x.mvText.replace(m.pW + ' ', '').replace(' ' + m.cW + ' ', ' ')})`]),
    ...m.moves.down.map((x): [string, string] => ['De-escalated', `${x.tag} (${x.mvText.replace(m.pW + ' ', '').replace(' ' + m.cW + ' ', ' ')})`]),
    ...m.moves.status.map((x): [string, string] => ['Status', `${x.tag} ${x.statusMoved}`]),
    ...m.left.map((x): [string, string] => ['Left the board', `${x.tag} — ${x.reason}${x.note.startsWith('Reason: ') ? ' (' + x.note.slice(8) + ')' : ''}`]),
  ];

  const emailText = () => {
    const lines = [subject, '', 'Dear all,', '', "Please find below this week's Top 10 Plant Concerning, consolidated from the Plant Concerning Dashboard and the Inspection Daily Board.", ''];
    m.active.forEach((x) =>
      lines.push(`${x.rank}. ${x.tag} — ${x.detail} | ${SEV[x.sevKey].label} (${x.l && x.i ? `${x.l}×${x.i} = ${x.l * x.i}` : '—'}) | ${stepsText(x).replace(/\n/g, '; ')} | ${x.owner || '[Assign]'} | ${fmtDate(x.due)}`)
    );
    if (wowLines.length) {
      lines.push('', `Changes vs last week (${m.pW} → ${m.cW}):`);
      wowLines.forEach(([l, t]) => lines.push(`- ${l}: ${t}`));
    }
    if (closedRows.length) {
      lines.push('', 'Closed this week (verified):');
      closedRows.forEach((c) => lines.push(`- ${c.tag} — ${c.detail} · Residual ${SEV[resOf(c.ver)].label} · Verified by ${c.ver.by || '—'}`));
    }
    lines.push('', 'Best regards,', 'Reliability & Asset Integrity');
    return lines.join('\n');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailText());
    } catch {
      /* clipboard blocked — non-fatal */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = () => {
    const at = nowStamp();
    update((w) => {
      w.sentAt = at;
      w.sentWeek = week.key;
      w.recips.forEach((r) => (r.ack = ''));
      // Freeze this week's board so next week can compare against it.
      w.snapshots[week.key] = buildTop10(w, week.key).active.map((x) => ({ id: x.id, tag: x.tag, l: x.l, i: x.i, status: x.status }));
    });
    const to = recipsOn.map((r) => r.name).filter((n) => n.includes('@')).join(',');
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailText())}`, '_self');
    flash(`Snapshot ${m.cW} saved · email opened for ${recipsOn.length} recipient(s)`);
  };

  const ackNext = () => {
    if (!sentThisWeek) return;
    update((w) => {
      const r = w.recips.find((x) => x.on && !x.ack);
      if (r) r.ack = nowStamp();
    });
  };

  const poolItems = POOL.filter((p) => p.src === pool);
  const inTop = new Set(weekly.top10.map((r) => r.id));
  const emailGrid = '32px minmax(0,1.2fr) minmax(0,1.6fr) 56px 96px minmax(0,1.5fr) 100px 96px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1680, margin: '0 auto', color: wk.ink, fontSize: 14, lineHeight: 1.45 }}>
      <PageHead
        title="Top 10 Plant Concerning"
        week={week.label}
        sub="คัดจาก Plant Concerning Dashboard และ Inspection Daily Board · คลิกแถวหรือปุ่ม Edit เพื่อเปิดและแก้ไขรายละเอียด"
        right={
          <a href="#weekly-email" style={{ ...btn('primary', 44), background: wk.gold, color: wk.ink, borderRadius: 10, textDecoration: 'none', gap: 8 }}>
            <Icon.Mail />
            Weekly email
          </a>
        }
      />

      <KpiRow>
        <KpiTile label="Active items" value={kpi.active} />
        <KpiTile label="Critical" value={kpi.critical} color={wk.red} />
        <KpiTile label="Significant" value={kpi.significant} color={wk.amber} />
        <KpiTile label="Waiting for L × I" value={kpi.unassessed} color={wk.muted} />
        <KpiTile label="Awaiting verification" value={kpi.verifying} color={wk.amber} />
        <KpiTile label="Closed (verified)" value={kpi.closed} color={wk.green} />
        <KpiTile label="Manager acknowledged" value={acked} suffix={`/${recipsOn.length}`} color={wk.green} />
      </KpiRow>

      <Panel pad={false}>
        <PanelHead
          border
          size={18}
          title={`Top 10 Plant Concerning — ${m.cW}`}
          sub="View only · แก้ไขทั้งหมดในหน้า Edit (concern, L×I, classification, mitigation, attachments, close-out)"
          right={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <PlantTabs value={plant} onChange={setPlant} options={PLANT_TABS} />
              <EditGate>
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setAddMenu(!addMenu)} aria-expanded={addMenu} aria-haspopup="menu" style={btn('primary')}>
                    <Icon.Plus />
                    Add item
                    <Icon.Chevron />
                  </button>
                  {addMenu && (
                    <div role="menu" style={{ position: 'absolute', right: 0, top: 42, zIndex: 30, width: 280, background: '#fff', border: `1px solid ${wk.line}`, borderRadius: 10, boxShadow: '0 12px 32px rgba(14,26,43,.18)', padding: 6, display: 'flex', flexDirection: 'column' }}>
                      {(
                        [
                          ['กรอกเอง (Manual)', 'สร้างรายการใหม่แล้วเปิดหน้า Edit', wk.ink, addManual],
                          ['From Plant Concerning Dashboard', 'เลือกจากรายการที่ยังเปิดอยู่ใน PCD', wk.blue, () => { setPool('PCD'); setAddMenu(false); }],
                          ['From Inspection Daily Board', 'เลือกจาก concern ล่าสุดของ inspection', wk.teal, () => { setPool('IDB'); setAddMenu(false); }],
                        ] as const
                      ).map(([t, sub, color, fn]) => (
                        <button key={t} type="button" role="menuitem" onClick={fn} style={{ border: 'none', background: 'transparent', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color }}>{t}</span>
                          <span style={{ fontSize: 12, color: wk.muted }}>{sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </EditGate>
              <button type="button" onClick={() => setShowScale(!showScale)} aria-expanded={showScale} style={{ ...btn('outline'), fontWeight: 400 }}>
                <Icon.Info />
                L / I scale guide
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 8, background: wk.line3, color: wk.text2, fontSize: 12, fontWeight: 500 }}>
                <Icon.Sort />
                Auto-ranked by severity
              </span>
            </div>
          }
        />
        {showScale && <ScaleGuide onClose={() => setShowScale(false)} />}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1540, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: wk.tableHead, color: '#fff', textAlign: 'left' }}>
                <th scope="col" style={{ ...th, width: 32 }}>#</th>
                <th scope="col" style={{ ...th, width: 170 }}>Equipment</th>
                <th scope="col" style={{ ...th, width: 220 }}>Topic</th>
                <th scope="col" style={{ ...th, minWidth: 320 }}>Situation / Background</th>
                {['Likelihood', 'Impact'].map((h) => (
                  <th key={h} scope="col" style={{ ...th, padding: '10px 6px', width: h === 'Likelihood' ? 150 : 140 }}>
                    <button type="button" onClick={() => setShowScale(!showScale)} title={`ดูคำอธิบาย ${h} 1–5`} style={{ border: 'none', background: 'transparent', color: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                      {h} <Icon.Info />
                    </button>
                  </th>
                ))}
                <th scope="col" style={{ ...th, width: 104 }}>Severity</th>
                <th scope="col" style={{ ...th, minWidth: 240 }}>Action / Mitigation</th>
                <th scope="col" style={{ ...th, width: 120 }}>Response</th>
                <th scope="col" style={{ ...th, width: 136 }}>Due date</th>
                <th scope="col" style={{ ...th, width: 84 }}>
                  <span style={srOnly}>Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const closed = r.status === 'closed';
                const sev = SEV[r.sevKey];
                const done = r.steps.filter((s) => s.status === 'Done').length;
                const att = r.photos.length + r.links.length;
                const mode = ISO_LISTS.mode.find((x) => x.v === r.cls.mode);
                const dn = daysUntil(r.due);
                const preview = [...r.steps].sort((a, b) => Number(a.status === 'Done') - Number(b.status === 'Done')).slice(0, 4);
                return (
                  <tr key={r.id} onClick={() => setDetailId(r.id)} style={{ borderTop: `1px solid ${wk.line3}`, cursor: 'pointer', background: closed ? wk.soft : r.sevKey === 'C' ? '#FFF7F7' : '#fff', opacity: closed ? 0.7 : 1 }}>
                    <td style={{ ...td, ...mono, fontWeight: 700, color: wk.muted }}>
                      {closed ? '—' : r.rank}
                      <MoveBadge r={r} />
                    </td>
                    <td style={td}>
                      <div style={{ ...mono, fontWeight: 700, color: wk.red, fontSize: 14 }}>{r.tag || '[TAG]'}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 4, flexWrap: 'wrap' }}>
                        <span style={SRC_STYLE(r.src)}>{r.src}</span>
                        <span style={{ fontSize: 12, color: wk.muted }}>{r.plant}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingTop: 6 }}>
                        <span style={pill(STATUS[r.status].bg, STATUS[r.status].fg, 11)}>{STATUS[r.status].label}</span>
                        {mode && (
                          <span title={mode.t} style={{ ...mono, fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: wk.brownBg, color: wk.brown }}>
                            {r.cls.mode}
                          </span>
                        )}
                        {att > 0 && <span style={{ fontSize: 11, color: wk.blue, padding: '2px 0' }}>{att} attachment{att > 1 ? 's' : ''}</span>}
                      </div>
                    </td>
                    <td style={{ ...td, fontWeight: 600, fontSize: 14 }}>{r.detail || '—'}</td>
                    <td style={td}>
                      <div style={{ color: wk.text2, whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.background || '—'}</div>
                    </td>
                    <td style={{ ...td, padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{r.l ? `${r.l} · ${L_SCALE[r.l - 1].name}` : '– Not assessed'}</div>
                      <div style={{ fontSize: 11, color: wk.muted, paddingTop: 2 }}>{r.l ? 'Probability ' + L_SCALE[r.l - 1].prob : 'ยังไม่ได้ประเมิน'}</div>
                    </td>
                    <td style={{ ...td, padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{r.i ? `${r.i} · ${I_SCALE[r.i - 1].name}` : '– Not assessed'}</div>
                      <div style={{ fontSize: 11, color: wk.muted, paddingTop: 2 }}>{r.i ? I_SCALE[r.i - 1].desc : 'ยังไม่ได้ประเมิน'}</div>
                    </td>
                    <td style={td}>
                      <span style={pill(sev.bg, sev.fg)}>{sev.label}</span>
                      <div style={{ ...mono, fontSize: 11, color: wk.muted, paddingTop: 4 }}>{r.l && r.i ? `${r.l}×${r.i} = ${r.l * r.i}` : '—'}</div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: wk.line3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: wk.green, width: `${r.steps.length ? Math.round((100 * done) / r.steps.length) : 0}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: wk.muted, whiteSpace: 'nowrap' }}>{r.steps.length ? `${done}/${r.steps.length} done` : 'No steps yet'}</span>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {preview.map((a, k) => (
                            <li key={k} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12.5 }}>
                              <span style={{ flex: 'none', width: 8, height: 8, borderRadius: '50%', marginTop: 6, background: STEP_DOT[a.status] }} />
                              <span style={a.status === 'Done' ? { color: wk.muted } : { fontWeight: 500 }}>
                                {a.text}
                                {a.result && <span style={{ color: wk.muted, fontWeight: 400 }}> — {a.result}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {r.steps.length > 4 && <span style={{ fontSize: 11, color: wk.muted }}>+{r.steps.length - 4} more</span>}
                      </div>
                    </td>
                    <td style={td}>{r.owner || '[Assign]'}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      {fmtDate(r.due)}
                      {!closed && dn !== null && (
                        <div style={{ fontSize: 11, padding: '2px 8px', ...(dn <= 7 ? { color: wk.red, fontWeight: 700 } : { color: wk.muted }) }}>
                          {dn < 0 ? `Overdue ${-dn}d` : dn === 0 ? 'Due today' : `${dn} days left`}
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, padding: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailId(r.id);
                        }}
                        aria-label={`${isAdmin ? 'Edit' : 'Open'} ${r.tag || 'item'}`}
                        style={btn('outlineBlue')}
                      >
                        <Icon.Edit />
                        {isAdmin ? 'Edit' : 'Open'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 32, textAlign: 'center', color: wk.muted }}>
                    ยังไม่มีรายการ{plant !== 'All' ? ` ของ ${plant}` : ''} — กด Add item
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Risk matrix */}
        <Panel style={{ flex: '1 1 420px', minWidth: 0 }}>
          <PanelHead
            title="Risk Matrix 5×5"
            sub={`Active Top 10 · ${m.cW}`}
            right={
              m.prevKey ? (
                <button type="button" onClick={() => setCmp(!cmp)} aria-pressed={cmp} style={{ ...(cmp ? btn('dark', 34) : { ...btn('outline', 34), fontWeight: 600 }), fontSize: 12 }}>
                  <Icon.Swap />
                  {cmp ? `Comparing with ${m.pW}` : `Compare with ${m.pW}`}
                </button>
              ) : undefined
            }
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: wk.text2, textAlign: 'center' }}>IMPACT</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[5, 4, 3, 2, 1].map((imp) => (
                <div key={imp} style={{ display: 'flex', gap: 3, alignItems: 'stretch' }}>
                  <span style={{ ...mono, width: 16, display: 'flex', alignItems: 'center', fontSize: 12, color: wk.muted }}>{imp}</span>
                  {[1, 2, 3, 4, 5].map((lik) => {
                    const here = m.active.filter((x) => x.l === lik && x.i === imp);
                    const ghosts = cmp
                      ? m.prev.filter((p) => p.l === lik && p.i === imp).filter((p) => {
                          const cur = m.active.find((a) => a.id === p.id);
                          return !cur || cur.l !== p.l || cur.i !== p.i;
                        })
                      : [];
                    return (
                      <div key={lik} style={{ flex: 1, minHeight: 52, borderRadius: 4, padding: 4, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: 3, background: SEV[sevAt(lik, imp)].cell }}>
                        {here.map((x) => {
                          const showMv = cmp && x.mv !== 'same' && x.mv !== 'pending';
                          const bg = cmp && x.mv === 'up' ? wk.red : cmp && x.mv === 'new' ? wk.blue : cmp && x.mv === 'down' ? wk.green : wk.ink;
                          return (
                            <button key={x.id} type="button" onClick={() => setDetailId(x.id)} style={{ ...mono, border: 'none', fontSize: 10, fontWeight: 600, padding: '2px 4px', borderRadius: 3, color: '#fff', background: bg }}>
                              {x.tag || '—'}
                              {showMv ? ' ' + MOVE[x.mv].badge : ''}
                            </button>
                          );
                        })}
                        {ghosts.map((p) => {
                          const cur = m.all.find((a) => a.id === p.id);
                          return (
                            <button key={'g' + p.id} type="button" onClick={() => cur && setDetailId(cur.id)} style={{ ...mono, fontSize: 10, fontWeight: 600, padding: '1px 4px', borderRadius: 3, border: `1.5px dashed ${wk.muted}`, color: wk.text2, background: 'rgba(255,255,255,.55)' }}>
                              {p.tag}
                              {m.activeIds.has(p.id) ? '' : ' ✕'}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 3, paddingLeft: 19 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ ...mono, flex: 1, textAlign: 'center', fontSize: 12, color: wk.muted }}>
                    {n}
                  </span>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: wk.text2, paddingLeft: 19 }}>LIKELIHOOD</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
            {(['C', 'S', 'L', 'V'] as SevKey[]).map((k) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: SEV[k].cell }} />
                {SEV[k].label}
              </span>
            ))}
          </div>
          {cmp && m.prevKey && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: wk.text2, borderTop: `1px solid ${wk.line2}`, paddingTop: 10 }}>
              {(
                [
                  ['TAG ▲', 'Escalated', { background: wk.red, color: '#fff' }],
                  ['TAG ▼', 'De-escalated', { background: wk.green, color: '#fff' }],
                  ['TAG NEW', 'New', { background: wk.blue, color: '#fff' }],
                  ['TAG', `${m.pW} position`, { border: `1.5px dashed ${wk.muted}` }],
                  ['TAG ✕', 'Left the board', { border: `1.5px dashed ${wk.muted}` }],
                ] as [string, string, CSSProperties][]
              ).map(([t, l, st]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 3, ...st }}>{t}</span>
                  {l}
                </span>
              ))}
            </div>
          )}
        </Panel>

        {/* Week over week */}
        <Panel style={{ flex: '1 1 420px', minWidth: 0, gap: 14 }}>
          <PanelHead title={`Week-over-week · ${m.pW} → ${m.cW}`} sub={m.prevKey ? 'เทียบกับ snapshot ที่ส่ง email สัปดาห์ก่อน' : 'ยังไม่มี snapshot สัปดาห์ก่อน — snapshot จะถูกบันทึกเมื่อส่ง weekly email'} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: wk.muted, fontSize: 12 }}>
                <th scope="col" style={{ padding: '4px 0', fontWeight: 600 }}>Severity</th>
                <th scope="col" style={{ padding: '4px 8px', fontWeight: 600, textAlign: 'right' }}>{m.pW}</th>
                <th scope="col" style={{ padding: '4px 8px', fontWeight: 600, textAlign: 'right' }}>{m.cW}</th>
                <th scope="col" style={{ padding: '4px 0', fontWeight: 600, textAlign: 'right' }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {(['C', 'S', 'L', 'V'] as SevKey[]).map((k, n) => {
                const d = m.nowCounts[n] - m.prevCounts[n];
                const high = k === 'C' || k === 'S';
                return (
                  <tr key={k} style={{ borderTop: `1px solid ${wk.line3}` }}>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: SEV[k].cell }} />
                        {SEV[k].label}
                      </span>
                    </td>
                    <td style={{ ...mono, padding: '6px 8px', textAlign: 'right', color: wk.muted }}>{m.prevCounts[n]}</td>
                    <td style={{ ...mono, padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{m.nowCounts[n]}</td>
                    <td style={{ ...mono, padding: '6px 0', textAlign: 'right', fontWeight: 700, color: high && d > 0 ? wk.red : high && d < 0 ? wk.green : wk.muted }}>{d > 0 ? '+' + d : String(d)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(
              [
                ['new', 'NEW — เข้ามาใหม่', wk.blue],
                ['up', '▲ ESCALATED — รุนแรงขึ้น', wk.red],
                ['down', '▼ DE-ESCALATED — ลดลง', wk.green],
                ['shift', '↔ L×I CHANGED — severity เท่าเดิม', wk.amber],
              ] as const
            ).map(
              ([k, label, color]) =>
                m.moves[k].length > 0 && (
                  <WowGroup key={k} label={label} color={color}>
                    {m.moves[k].map((x) => (
                      <button key={x.id} type="button" onClick={() => setDetailId(x.id)} style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left', fontSize: 13 }}>
                        <span style={{ ...mono, fontWeight: 700 }}>{x.tag}</span> <span style={{ color: wk.muted }}>{x.mvText}</span>
                      </button>
                    ))}
                  </WowGroup>
                )
            )}
            {m.moves.status.length > 0 && (
              <WowGroup label="STATUS MOVED" color={wk.text2}>
                {m.moves.status.map((x) => (
                  <button key={x.id} type="button" onClick={() => setDetailId(x.id)} style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left', fontSize: 13 }}>
                    <span style={{ ...mono, fontWeight: 700 }}>{x.tag}</span> <span style={{ color: wk.muted }}>{x.statusMoved}</span>
                  </button>
                ))}
              </WowGroup>
            )}
            {m.left.length > 0 && (
              <WowGroup label="✕ LEFT THE BOARD — ออกจากกระดาน" color={wk.text2}>
                {m.left.map((x) => (
                  <div key={x.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                    <span style={{ ...mono, fontWeight: 700 }}>{x.tag}</span>
                    <span style={x.closed ? pill(wk.greenBg, wk.greenInk, 11) : pill(wk.amberBg, wk.amber, 11)}>{x.reason}</span>
                    <span style={{ fontSize: 12, color: wk.muted, flexBasis: '100%' }}>{x.note}</span>
                  </div>
                ))}
              </WowGroup>
            )}
            {m.moves.pending.length > 0 && (
              <WowGroup label="? CARRIED — ยังไม่ได้ประเมินใหม่" color={wk.muted}>
                {m.moves.pending.map((x) => (
                  <span key={x.id} style={{ ...mono, fontSize: 13, fontWeight: 700 }}>
                    {x.tag}
                  </span>
                ))}
              </WowGroup>
            )}
            <span style={{ fontSize: 12, color: wk.muted }}>● Unchanged: {m.moves.same.length} item(s)</span>
          </div>
        </Panel>

        {/* Close-out pipeline */}
        <Panel style={{ flex: '1 1 420px', minWidth: 0 }}>
          <PanelHead title="Close-out pipeline" sub="Open → Verifying → Closed · ปิดได้เมื่อผ่าน effectiveness check เท่านั้น" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {(
              [
                ['Open', kpi.open, wk.blueBg, wk.blueInk],
                ['Verifying', kpi.verifying, wk.amberBg, wk.amber],
                ['Closed', kpi.closed, wk.greenBg, wk.greenInk],
              ] as const
            ).map(([l, v, bg, fg]) => (
              <div key={l} style={{ borderRadius: 10, padding: 12, background: bg, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, color: fg }}>{l}</span>
                <span style={{ ...mono, fontSize: 24, fontWeight: 700, color: fg }}>{v}</span>
              </div>
            ))}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {m.all
              .filter((x) => x.status !== 'open')
              .map((x) => (
                <li key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: `1px solid ${wk.line2}`, borderRadius: 8 }}>
                  <span style={pill(STATUS[x.status].bg, STATUS[x.status].fg, 11)}>{STATUS[x.status].label}</span>
                  <span style={{ ...mono, fontWeight: 700 }}>{x.tag}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: wk.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {x.status === 'closed' ? `Residual ${SEV[resOf(x.ver)].label} · verified by ${x.ver.by || '—'} · recheck ${fmtDate(x.ver.recheck)}` : 'Waiting for evidence & verifier'}
                  </span>
                  <button type="button" onClick={() => setDetailId(x.id)} style={{ ...btn('outline', 32), fontSize: 12, fontWeight: 400 }}>
                    Open
                  </button>
                </li>
              ))}
          </ul>
          {kpi.verifying + kpi.closed === 0 && <span style={{ fontSize: 13, color: wk.muted }}>ยังไม่มีรายการที่รอ verify หรือปิดแล้ว</span>}
        </Panel>
      </div>

      <div id="weekly-email" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', scrollMarginTop: 20 }}>
        <Panel pad={false} style={{ flex: '999 1 720px', minWidth: 0 }}>
          <PanelHead
            border
            title="Weekly email — preview"
            sub="สร้างจากตาราง Top 10 · รูปและลิงก์ที่แนบจะอยู่ใต้แต่ละรายการ"
            right={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={copyEmail} style={{ ...btn('outline', 44), fontWeight: 400 }}>
                  {copied ? 'Copied' : 'Copy text'}
                </button>
                <EditGate>
                  <button type="button" onClick={sendEmail} style={{ ...btn('dark', 44), gap: 8 }}>
                    <Icon.Send />
                    {sentThisWeek ? 'Resend' : 'Send & request acknowledge'}
                  </button>
                </EditGate>
              </div>
            }
          />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '6px 12px', fontSize: 13 }}>
              <span style={{ color: wk.muted }}>Subject</span>
              <span style={{ fontWeight: 600 }}>{subject}</span>
              <span style={{ color: wk.muted }}>To</span>
              <span>{recipsOn.map((r) => r.name).join('; ') || '—'}</span>
            </div>
            <p style={{ margin: 0 }}>Dear all,</p>
            <p style={{ margin: 0 }}>
              Please find below this week's Top 10 Plant Concerning, consolidated from the Plant Concerning Dashboard and the Inspection Daily Board. Kindly focus on the Critical items and on mitigation actions due within the next 7 days.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${wk.line}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: emailGrid, gap: 8, padding: '8px 10px', background: wk.tableHead, color: '#fff', fontSize: 12, fontWeight: 600 }}>
                {['#', 'Topic', 'Situation / Background', 'L×I', 'Severity', 'Action / Mitigation', 'Response', 'Due'].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
              {m.active.map((x) => {
                const mode = ISO_LISTS.mode.find((o) => o.v === x.cls.mode);
                const clsLine = [x.cls.eqClass, mode?.t, x.cls.mech && 'Mech. ' + x.cls.mech, x.cls.cause === 'TBD' ? 'Cause under investigation' : x.cls.cause && 'Cause ' + x.cls.cause].filter(Boolean).join(' · ');
                return (
                  <div key={x.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, borderTop: `1px solid ${wk.line2}`, fontSize: 13 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: emailGrid, gap: 8, alignItems: 'start' }}>
                      <span style={mono}>{x.rank}</span>
                      <span>
                        <span style={{ fontWeight: 700, color: wk.red, display: 'block' }}>{x.tag}</span>
                        {x.detail}
                        {clsLine && <span style={{ display: 'block', fontSize: 11, color: wk.brown }}>{clsLine}</span>}
                      </span>
                      <span style={{ color: wk.text2, whiteSpace: 'pre-line' }}>{x.background}</span>
                      <span style={mono}>{x.l && x.i ? `${x.l}×${x.i} = ${x.l * x.i}` : '—'}</span>
                      <span>
                        <span style={pill(SEV[x.sevKey].bg, SEV[x.sevKey].fg)}>{SEV[x.sevKey].label}</span>
                      </span>
                      <span style={{ whiteSpace: 'pre-line' }}>{stepsText(x)}</span>
                      <span>{x.owner || '[Assign]'}</span>
                      <span>{fmtDate(x.due)}</span>
                    </div>
                    {x.photos.length + x.links.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', paddingLeft: 40 }}>
                        {x.photos.map((p, k) => (
                          <img key={k} src={p.src} alt={p.label} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6, border: `1px solid ${wk.line}` }} />
                        ))}
                        {x.links.map((lk, k) => (
                          <a key={k} href={lk.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, textDecoration: 'none', color: lk.kind === 'pi' ? wk.ink : wk.blue, border: `1px solid ${lk.kind === 'pi' ? wk.ink : '#C7D5F5'}` }}>
                            {lk.kind === 'pi' ? 'PI trend: ' : ''}
                            {lk.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {wowLines.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px', border: `1px solid ${wk.line}`, background: wk.soft, borderRadius: 8 }}>
                <span style={{ fontWeight: 700 }}>
                  Changes vs last week ({m.pW} → {m.cW})
                </span>
                {wowLines.map(([l, t], k) => (
                  <span key={k} style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600, display: 'inline-block', minWidth: 112 }}>{l}</span>
                    {t}
                  </span>
                ))}
              </div>
            )}
            {closedRows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', border: '1px solid #BFDDB3', background: '#F3F9F0', borderRadius: 8 }}>
                <span style={{ fontWeight: 700, color: wk.greenInk }}>Closed this week (verified)</span>
                {closedRows.map((c) => (
                  <span key={c.id} style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{c.tag}</span> — {c.detail} · Residual {SEV[resOf(c.ver)].label} · Verified by {c.ver.by || '—'} ({fmtDate(c.ver.date)})
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 16, background: '#F0F6FF', borderRadius: 8 }}>
              <span style={{ fontSize: 13 }}>After reviewing this week's items, please click Acknowledge to confirm.</span>
              <EditGate>
                <button type="button" onClick={ackNext} disabled={!sentThisWeek} style={{ ...btn('primary', 44), padding: '0 20px', opacity: sentThisWeek ? 1 : 0.45 }}>
                  Review &amp; Acknowledge
                </button>
              </EditGate>
              <span style={{ fontSize: 11, color: wk.muted }}>This button opens the acknowledgement page for this week.</span>
            </div>
            <p style={{ margin: 0 }}>For full details, please refer to the Plant Concerning Dashboard.</p>
            <p style={{ margin: 0 }}>
              Best regards,
              <br />
              Reliability &amp; Asset Integrity
            </p>
          </div>
        </Panel>

        <Panel style={{ flex: '1 1 340px', minWidth: 0 }}>
          <PanelHead
            title="Acknowledgement tracker"
            sub={sentThisWeek ? `Sent ${weekly.sentAt} · ${acked} of ${recipsOn.length} acknowledged` : 'ยังไม่ได้ส่ง email สัปดาห์นี้'}
          />
          <EditGate>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weekly.recips.map((r) => {
                const status = !sentThisWeek ? 'Not sent' : !r.on ? 'Not included' : r.ack ? 'Acknowledged' : 'Pending';
                const [bg, fg] = status === 'Acknowledged' ? [wk.greenBg, wk.greenInk] : status === 'Pending' ? [wk.amberBg, wk.amber] : ['#EEF0F3', wk.muted];
                const canToggle = sentThisWeek && r.on;
                return (
                  <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${wk.line2}`, borderRadius: 8 }}>
                    <input type="checkbox" checked={r.on} onChange={() => update((w) => { const x = w.recips.find((y) => y.id === r.id); if (x) x.on = !x.on; })} aria-label="Send to this recipient" style={{ width: 18, height: 18, accentColor: wk.ink }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: 12, color: wk.muted }}>{r.role}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <button
                        type="button"
                        disabled={!canToggle}
                        title={canToggle ? 'Click to mark acknowledged / pending' : undefined}
                        onClick={() => update((w) => { const x = w.recips.find((y) => y.id === r.id); if (x) x.ack = x.ack ? '' : nowStamp(); })}
                        style={{ ...pill(bg, fg, 11), border: 'none', opacity: 1, cursor: canToggle ? 'pointer' : 'default' }}
                      >
                        {status}
                      </button>
                      {r.ack && <span style={{ fontSize: 11, color: wk.muted }}>{r.ack}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                aria-label="Add recipient"
                value={recipDraft}
                onChange={(e) => setRecipDraft(e.target.value)}
                placeholder="ชื่อ / email ผู้รับเพิ่ม"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => {
                  const t = recipDraft.trim();
                  if (!t) return;
                  update((w) => void w.recips.push({ id: 'r' + uid(), name: t, role: 'Recipient', on: true, ack: '' }));
                  setRecipDraft('');
                }}
                style={{ ...btn('outline'), border: `1px solid ${wk.ink}`, fontWeight: 400 }}
              >
                Add
              </button>
            </div>
          </EditGate>
          <div style={{ fontSize: 12, color: wk.muted, borderTop: `1px solid ${wk.line2}`, paddingTop: 10 }}>Pending เกิน 2 วันทำการ → ส่ง reminder · ใส่ email ในชื่อผู้รับเพื่อให้ส่งผ่านโปรแกรม email ได้</div>
        </Panel>
      </div>

      {detail && (
        <Top10Detail
          key={detail.id}
          row={detail}
          onClose={() => setDetailId('')}
          patch={patchItem(detail.id)}
          onRemove={(reason) => {
            update((w) => {
              w.top10 = w.top10.filter((x) => x.id !== detail.id);
              w.removed.push({ id: detail.id, tag: detail.tag, reason, week: week.key });
            });
            setDetailId('');
          }}
        />
      )}

      {pool && (
        <Modal onClose={() => setPool('')}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${wk.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{pool === 'PCD' ? 'Plant Concerning Dashboard' : 'Inspection Daily Board'}</h2>
              <span style={{ fontSize: 12, color: wk.muted }}>{pool === 'PCD' ? 'Latest sync · open items (In progress · Wait SD · Keep monitor · Need study)' : 'Latest sync · Rotating equipment Plant#1'}</span>
            </div>
            <CloseBtn onClick={() => setPool('')} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: wk.head, color: wk.text2, textAlign: 'left' }}>
                  {['Equipment', 'Plant', 'Concern', 'Status / severity', 'Source action'].map((h) => (
                    <th key={h} scope="col" style={{ padding: '10px 14px', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                  <th scope="col" style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>
                    Top 10
                  </th>
                </tr>
              </thead>
              <tbody>
                {poolItems.map((f) => {
                  const added = inTop.has(f.id);
                  return (
                    <tr key={f.id} style={{ borderTop: `1px solid ${wk.line3}` }}>
                      <td style={{ ...mono, padding: '10px 14px', fontWeight: 700 }}>{f.tag}</td>
                      <td style={{ padding: '10px 14px' }}>{f.plant}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {f.detail}
                        <span style={{ display: 'block', fontSize: 12, color: wk.muted }}>{f.condition}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{f.srcSev}</td>
                      <td style={{ padding: '10px 14px', color: wk.text2 }}>{f.srcAction}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button type="button" onClick={() => addFromPool(f.id)} disabled={added} style={{ ...btn(added ? 'outline' : 'primary'), minWidth: 72, ...(added ? { background: '#EEF0F3', color: wk.muted, border: `1px solid ${wk.line}`, fontWeight: 600 } : {}) }}>
                          {added ? 'Added' : 'Add'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${wk.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: wk.muted }}>{pool === 'PCD' ? 'Weekly highlight (★) จาก PCD ขึ้นก่อน' : 'เรียงตาม severity ★ จาก inspection'}</span>
            <button type="button" onClick={() => setPool('')} style={btn('dark', 44)}>
              Done
            </button>
          </div>
        </Modal>
      )}
      {toast}
    </div>
  );
}
