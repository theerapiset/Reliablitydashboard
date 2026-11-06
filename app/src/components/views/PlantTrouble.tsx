import { Fragment, useState, type CSSProperties } from 'react';
import EditGate from '../EditGate';
import { useAuth } from '../../store/AuthContext';
import type { TroubleItem } from '../../types/models';
import { uid } from '../../utils/calc';
import { fmtDate, nowStamp, weekOf } from '../../utils/week';
import { CloseBtn, Icon, KpiRow, KpiTile, Modal, PageHead, Panel, PlantTabs, btn, inputStyle, labelStyle, mono, pill, useToast, useWeekly, wk } from '../weekly/ui';

type Plant = TroubleItem['plant'];
const PL: Record<Plant, [string, string]> = { '1': ['#D9F3FB', '#0B5A73'], '2': ['#DDF3E4', '#1F6B3A'], '3': ['#8E3B8E', '#FFFFFF'], UT: ['#EDE7FB', '#5B3DA8'] };
const plantBadge = (p: Plant): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, height: 26, padding: '0 6px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: PL[p][0], color: PL[p][1] });
const statusPill = (s: TroubleItem['status']) => (s === 'Completed' ? pill(wk.green, '#fff') : pill(wk.amberBg, wk.amber));

const DIST = (p: Plant) => [
  { id: 'mgr', name: '[RA Section Manager]', role: 'Reliability & Asset Integrity' },
  { id: 'pm', name: `[Plant ${p} Manager]`, role: 'Plant management' },
  { id: 'pe', name: `[Process Engineer P${p}]`, role: 'Process' },
  { id: 'mm', name: '[MM Section Head]', role: 'Maintenance' },
  { id: 'op', name: `[Operation Shift Head P${p}]`, role: 'Operation' },
];

const th: CSSProperties = { padding: '10px 8px', fontWeight: 600 };
const td: CSSProperties = { padding: '12px 8px', verticalAlign: 'top' };
const isUnsent = (r: TroubleItem) => r.ver > 1 && r.ver !== r.sentVer;

export default function PlantTrouble() {
  const { weekly, update } = useWeekly();
  const { isAdmin } = useAuth();
  const { flash, node: toast } = useToast();
  const week = weekOf();
  const [plant, setPlant] = useState<'All' | Plant>('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState('');
  const [logDraft, setLogDraft] = useState('');
  const [sendId, setSendId] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [reqAck, setReqAck] = useState(true);
  const [recipOff, setRecipOff] = useState<Record<string, boolean>>({});

  const all = weekly.troubles;
  const patch = (id: string, fn: (x: TroubleItem) => void) =>
    update((w) => {
      const x = w.troubles.find((r) => r.id === id);
      if (x) {
        fn(x);
        x.ver += 1;
      }
    });
  const set = <K extends keyof TroubleItem>(id: string, k: K, v: TroubleItem[K]) => patch(id, (x) => void (x[k] = v));

  const ql = q.trim().toLowerCase();
  const rows = all.filter(
    (r) => (plant === 'All' || r.plant === plant) && (statusFilter === 'All' || r.status === statusFilter) && (!ql || `${r.title} ${r.preventive} ${r.corrective}`.toLowerCase().includes(ql))
  );

  const addTrouble = () => {
    const id = 't' + uid();
    update((w) => void w.troubles.unshift({ id, title: 'New plant trouble', plant: '1', date: new Date().toISOString().slice(0, 10), corrective: '', preventive: '', status: 'In-progress', due: '', owner: '', log: [], ver: 2, sentVer: 0, lastSent: '' }));
    setPlant('All');
    setStatusFilter('All');
    setQ('');
    setEditing(id);
    setLogDraft('');
  };

  const sr = all.find((r) => r.id === sendId);
  const recips = sr ? DIST(sr.plant).map((m) => ({ ...m, on: !recipOff[m.id] })) : [];
  const recipCount = recips.filter((m) => m.on).length;

  const doSend = () => {
    if (!sr) return;
    const at = nowStamp(true);
    update((w) => {
      const x = w.troubles.find((r) => r.id === sr.id);
      if (!x) return;
      x.lastSent = at;
      x.sentVer = x.ver;
      if (x.log[0]) x.log[0].sent = true;
    });
    const body = [sendNote, '', 'Latest update · ' + (sr.log[0]?.text || 'ไม่มี progress update ใหม่'), '', 'Corrective action', sr.corrective, '', 'Preventive action', sr.preventive].join('\n');
    window.open(`mailto:?subject=${encodeURIComponent(`[Plant Trouble Update] ${sr.title} — ${sr.status}`)}&body=${encodeURIComponent(body)}`, '_self');
    setSendId('');
    flash(`Update sent to ${recipCount} people${reqAck ? ' · acknowledge requested' : ''}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1600, margin: '0 auto', color: wk.ink, fontSize: 14, lineHeight: 1.45 }}>
      <PageHead
        title="Plant Trouble Follow-up"
        week={week.label}
        sub="บันทึก corrective / preventive action ของ plant trouble · อัปเดตแล้วกดส่งให้ผู้เกี่ยวข้องได้ทันที"
        right={
          <EditGate>
            <button type="button" onClick={addTrouble} style={{ ...btn('dark', 44), borderRadius: 10, gap: 8 }}>
              <Icon.Plus size={16} />
              New plant trouble
            </button>
          </EditGate>
        }
      />

      <KpiRow min={170}>
        <KpiTile label="All troubles" value={all.length} />
        <KpiTile label="In-progress" value={all.filter((r) => r.status === 'In-progress').length} color={wk.amber} />
        <KpiTile label="Completed" value={all.filter((r) => r.status === 'Completed').length} color={wk.green} />
        <KpiTile label="Updated · not yet sent" value={all.filter(isUnsent).length} color={wk.amber} tone="amber" />
      </KpiRow>

      <Panel pad={false}>
        <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${wk.line2}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Trouble list</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <PlantTabs
              value={plant}
              onChange={setPlant}
              options={[
                ['All', 'All Plants'],
                ['1', 'Plant 1'],
                ['2', 'Plant 2'],
                ['3', 'Plant 3'],
                ['UT', 'UT'],
              ]}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: wk.muted }}>
              Status
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', height: 36, padding: '0 8px' }}>
                <option>All</option>
                <option>In-progress</option>
                <option>Completed</option>
              </select>
            </label>
            <input type="search" aria-label="Search troubles" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment / keyword" style={{ ...inputStyle, width: 220, height: 36 }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1360, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: wk.head, color: wk.text2, textAlign: 'left' }}>
                <th scope="col" style={{ ...th, padding: '10px 14px', width: 200 }}>Plant trouble</th>
                <th scope="col" style={{ ...th, width: 60 }}>Plant</th>
                <th scope="col" style={{ ...th, width: 110 }}>Trouble date</th>
                <th scope="col" style={{ ...th, minWidth: 220 }}>Corrective action</th>
                <th scope="col" style={{ ...th, minWidth: 360 }}>Preventive action</th>
                <th scope="col" style={{ ...th, width: 110 }}>Status</th>
                <th scope="col" style={{ ...th, width: 90 }}>Due date</th>
                <th scope="col" style={{ ...th, width: 160 }}>RA response by</th>
                <th scope="col" style={{ ...th, padding: '10px 14px', width: 150 }}>Notify</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ed = r.id === editing;
                const unsent = isUnsent(r);
                const toggle = () => {
                  setEditing(ed ? '' : r.id);
                  setLogDraft('');
                };
                return (
                  <Fragment key={r.id}>
                    <tr style={{ borderTop: `1px solid ${wk.line3}`, background: ed ? '#F4F8FF' : r.status === 'Completed' ? '#fff' : '#FFFDF8', boxShadow: ed ? `inset 3px 0 0 ${wk.blue}` : undefined }}>
                      <td style={{ ...td, padding: '12px 14px' }}>
                        <button type="button" onClick={toggle} style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left', fontWeight: 600, fontSize: 14, color: wk.ink }}>
                          {r.title}
                        </button>
                        {unsent && (
                          <div style={{ marginTop: 6 }}>
                            <span style={pill(wk.amberBg, wk.amber, 11)}>Updated · not sent</span>
                          </div>
                        )}
                      </td>
                      <td style={td}>
                        <span style={plantBadge(r.plant)}>{r.plant}</span>
                      </td>
                      <td style={{ ...td, color: wk.text2 }}>
                        {fmtDate(r.date, 'long')}
                      </td>
                      <td style={{ ...td, whiteSpace: 'pre-line', color: wk.text2 }}>{r.corrective}</td>
                      <td style={td}>
                        <div style={{ whiteSpace: 'pre-line', color: wk.text2, maxHeight: 132, overflow: 'hidden' }}>{r.preventive}</div>
                      </td>
                      <td style={td}>
                        <span style={statusPill(r.status)}>{r.status}</span>
                      </td>
                      <td style={td}>{r.due}</td>
                      <td style={td}>{r.owner || '—'}</td>
                      <td style={{ ...td, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                          <button type="button" onClick={toggle} aria-expanded={ed} style={{ ...(ed ? btn('dark', 32) : { ...btn('outline', 32), fontWeight: 400 }), fontSize: 12, borderRadius: 6 }}>
                            {ed ? 'Close editor' : isAdmin ? 'Edit / update' : 'View log'}
                          </button>
                          <EditGate>
                            <button
                              type="button"
                              onClick={() => {
                                setSendId(r.id);
                                setSendNote('');
                                setRecipOff({});
                              }}
                              style={{ ...(unsent ? btn('primary', 32) : btn('outlineBlue', 32)), fontSize: 12, borderRadius: 6, border: `1px solid ${wk.blue}` }}
                            >
                              Send update
                            </button>
                          </EditGate>
                          <span style={{ fontSize: 11, color: wk.muted }}>{r.lastSent ? 'Sent ' + r.lastSent : 'Not sent yet'}</span>
                        </div>
                      </td>
                    </tr>
                    {ed && (
                      <tr style={{ background: '#F4F8FF', boxShadow: `inset 3px 0 0 ${wk.blue}` }}>
                        <td colSpan={9} style={{ padding: '0 20px 20px 20px' }}>
                          <div style={{ background: '#fff', border: '1px solid #C7D5F5', borderRadius: 12, display: 'flex', flexDirection: 'column', maxWidth: 1500 }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${wk.line2}`, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 13, color: wk.blue, fontWeight: 600 }}>{isAdmin ? 'กำลังแก้ไขรายการนี้ · เปลี่ยนแล้วบันทึกอัตโนมัติ' : 'View only · ปลดล็อก admin เพื่อแก้ไข'}</span>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" onClick={() => setEditing('')} style={{ ...btn('outline', 40), fontWeight: 400 }}>
                                  Done
                                </button>
                                <EditGate>
                                  <button type="button" onClick={() => { setSendId(r.id); setSendNote(''); setRecipOff({}); }} style={{ ...btn('primary', 40), gap: 8 }}>
                                    <Icon.Send size={15} />
                                    Save &amp; send update
                                  </button>
                                </EditGate>
                              </div>
                            </div>
                            <EditGate>
                              <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                                <div style={{ flex: '2 1 560px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                                  <label style={{ ...labelStyle, gridColumn: 'span 4' }}>
                                    Plant trouble
                                    <input value={r.title} onChange={(e) => set(r.id, 'title', e.target.value)} style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }} />
                                  </label>
                                  <label style={labelStyle}>
                                    Plant
                                    <select value={r.plant} onChange={(e) => set(r.id, 'plant', e.target.value as Plant)} style={inputStyle}>
                                      <option value="1">Plant 1</option>
                                      <option value="2">Plant 2</option>
                                      <option value="3">Plant 3</option>
                                      <option value="UT">UT</option>
                                    </select>
                                  </label>
                                  <label style={labelStyle}>
                                    Trouble date
                                    <input type="date" value={r.date} onChange={(e) => set(r.id, 'date', e.target.value)} style={inputStyle} />
                                  </label>
                                  <label style={labelStyle}>
                                    Status
                                    <select value={r.status} onChange={(e) => set(r.id, 'status', e.target.value as TroubleItem['status'])} style={inputStyle}>
                                      <option>In-progress</option>
                                      <option>Completed</option>
                                    </select>
                                  </label>
                                  <label style={labelStyle}>
                                    Due date
                                    <input value={r.due} onChange={(e) => set(r.id, 'due', e.target.value)} style={inputStyle} />
                                  </label>
                                  <label style={{ ...labelStyle, gridColumn: 'span 4' }}>
                                    RA response by
                                    <input value={r.owner} onChange={(e) => set(r.id, 'owner', e.target.value)} placeholder="Assign…" style={inputStyle} />
                                  </label>
                                  <label style={{ ...labelStyle, gridColumn: 'span 4' }}>
                                    Corrective action
                                    <textarea rows={3} value={r.corrective} onChange={(e) => set(r.id, 'corrective', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
                                  </label>
                                  <label style={{ ...labelStyle, gridColumn: 'span 4' }}>
                                    Preventive action
                                    <textarea rows={8} value={r.preventive} onChange={(e) => set(r.id, 'preventive', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
                                  </label>
                                </div>
                                <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Progress log</h3>
                                  <textarea rows={3} aria-label="New progress update" value={logDraft} onChange={(e) => setLogDraft(e.target.value)} placeholder="อัปเดตความคืบหน้าล่าสุด…" style={{ ...inputStyle, resize: 'vertical' }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const t = logDraft.trim();
                                      if (!t) return;
                                      patch(r.id, (x) => void x.log.unshift({ at: nowStamp(true), text: t, sent: false }));
                                      setLogDraft('');
                                    }}
                                    style={{ ...btn('dark'), alignSelf: 'flex-end', fontWeight: 400 }}
                                  >
                                    Add update
                                  </button>
                                  <ol style={{ margin: '0 0 0 6px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', borderLeft: `2px solid ${wk.line}` }}>
                                    {(r.log.length ? r.log : [{ at: '—', text: 'ยังไม่มี progress update', sent: false, empty: true }]).map((g, k) => (
                                      <li key={k} style={{ position: 'relative', padding: '0 0 14px 16px' }}>
                                        <span style={{ position: 'absolute', left: -7, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'empty' in g ? wk.line : g.sent ? wk.blue : '#9AA4B0' }} />
                                        <div style={{ ...mono, fontSize: 11, color: wk.muted }}>{g.at}</div>
                                        <div style={{ fontSize: 13, whiteSpace: 'pre-line' }}>{g.text}</div>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            </EditGate>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: wk.muted }}>
                    ไม่พบรายการที่ตรงกับตัวกรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {sr && (
        <Modal onClose={() => setSendId('')} maxWidth={760}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${wk.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, color: wk.muted }}>Send update</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{sr.title}</h2>
            </div>
            <CloseBtn onClick={() => setSendId('')} />
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <legend style={{ fontWeight: 700, padding: '0 0 8px' }}>ผู้รับ — {sr.plant === 'UT' ? 'UT' : 'Plant ' + sr.plant} distribution</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                {recips.map((m) => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${wk.line}`, borderRadius: 8, cursor: 'pointer', minHeight: 44 }}>
                    <input type="checkbox" checked={m.on} onChange={() => setRecipOff({ ...recipOff, [m.id]: !recipOff[m.id] })} style={{ width: 18, height: 18, accentColor: wk.blue }} />
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                      <span style={{ fontSize: 12, color: wk.muted }}>{m.role}</span>
                    </span>
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={reqAck} onChange={() => setReqAck(!reqAck)} style={{ width: 18, height: 18, accentColor: wk.blue }} />
                ขอให้กด Acknowledge
              </label>
            </fieldset>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 700 }}>
              Note ถึงผู้รับ
              <textarea rows={2} value={sendNote} onChange={(e) => setSendNote(e.target.value)} placeholder="เช่น ขอ confirm แผน SD / ขอ budget …" style={{ ...inputStyle, fontWeight: 400, resize: 'vertical' }} />
            </label>
            <div style={{ border: `1px solid ${wk.line}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: wk.head, fontSize: 12, color: wk.muted }}>
                Preview · Subject: [Plant Trouble Update] {sr.title} — {sr.status}
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={plantBadge(sr.plant)}>{sr.plant}</span>
                  <span style={statusPill(sr.status)}>{sr.status}</span>
                  <span style={{ color: wk.muted }}>
                    Due {sr.due || '—'} · {sr.owner || '—'}
                  </span>
                </div>
                {sendNote && <div style={{ whiteSpace: 'pre-line' }}>{sendNote}</div>}
                <div>
                  <span style={{ fontWeight: 700 }}>Latest update · </span>
                  <span style={{ whiteSpace: 'pre-line' }}>{sr.log[0]?.text || 'ไม่มี progress update ใหม่'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700 }}>Preventive action</span>
                  <div style={{ whiteSpace: 'pre-line', color: wk.text2, maxHeight: 120, overflow: 'hidden' }}>{sr.preventive}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${wk.line2}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setSendId('')} style={{ ...btn('outline', 44), fontWeight: 400 }}>
              Cancel
            </button>
            <button type="button" onClick={doSend} disabled={!recipCount} style={{ ...btn('primary', 44), opacity: recipCount ? 1 : 0.45 }}>
              Send to {recipCount} people
            </button>
          </div>
        </Modal>
      )}
      {toast}
    </div>
  );
}
