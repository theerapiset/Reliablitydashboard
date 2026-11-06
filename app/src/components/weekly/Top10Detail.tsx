import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import EditGate from '../EditGate';
import { I_OPTIONS, I_SCALE, ISO_LISTS, L_OPTIONS, L_SCALE, SEV, VERIFY_METHODS } from '../../data/weeklySeed';
import type { StepStatus, Top10Item, WeeklyPlant } from '../../types/models';
import { fmtDate } from '../../utils/week';
import { uploadImages } from '../../utils/uploadImage';
import { useAuth } from '../../store/AuthContext';
import { STATUS, STEP_DOT, resOf, type Row } from './top10Model';
import { AddLinkRow, CloseBtn, Icon, LinkBadge, Modal, PiEmbed, btn, ghostInput, inputStyle, labelStyle, mono, pill, wk } from './ui';

const SRC_STYLE = (s: string): CSSProperties => ({
  ...mono,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: 4,
  ...(s === 'PCD' ? { background: wk.blueBg, color: wk.blue } : s === 'MANUAL' ? { background: wk.brownBg, color: wk.brown } : { background: wk.tealBg, color: wk.teal }),
});
export { SRC_STYLE };

function Card({ title, aside, children, gap = 12 }: { title: string; aside?: ReactNode; children: ReactNode; gap?: number }) {
  return (
    <section style={{ background: '#fff', border: `1px solid ${wk.line}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
        {aside && <span style={{ fontSize: 12, color: wk.muted }}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}

const hint: CSSProperties = { fontWeight: 400, color: wk.muted };

function ScaleMini() {
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${wk.line}`, borderRadius: 8 }}>
      <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ textAlign: 'left', background: wk.head }}>
            {['Lvl', 'Likelihood', 'Probability', 'Impact', 'ผลกระทบต่อ Plant'].map((h) => (
              <th key={h} scope="col" style={{ padding: '6px 8px' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...L_SCALE].reverse().map((l) => {
            const im = I_SCALE[l.n - 1];
            return (
              <tr key={l.n} style={{ borderTop: `1px solid ${wk.line3}` }}>
                <td style={{ ...mono, padding: '6px 8px', fontWeight: 700 }}>{l.n}</td>
                <td style={{ padding: '6px 8px' }}>{l.name}</td>
                <td style={{ ...mono, padding: '6px 8px' }}>{l.prob}</td>
                <td style={{ padding: '6px 8px' }}>{im.name}</td>
                <td style={{ padding: '6px 8px', color: wk.text2 }}>{im.desc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Top10Detail({
  row,
  onClose,
  patch,
  onRemove,
}: {
  row: Row;
  onClose: () => void;
  patch: (fn: (x: Top10Item) => void) => void;
  onRemove: (reason: string) => void;
}) {
  const { isAdmin } = useAuth();
  const s = row;
  const [showScale, setShowScale] = useState(false);
  const [stepDraft, setStepDraft] = useState('');
  const [embedIdx, setEmbedIdx] = useState(() => s.links.findIndex((l) => l.kind === 'pi'));
  const [removing, setRemoving] = useState(false);
  const [removeDraft, setRemoveDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Top10Item>(k: K, v: Top10Item[K]) => patch((x) => void (x[k] = v));
  const setCls = (k: keyof Top10Item['cls'], v: string) => patch((x) => void (x.cls[k] = v));
  const setVer = (k: Exclude<keyof Top10Item['ver'], 'accept'>, v: string) => patch((x) => void (x.ver[k] = v));
  const setStep = (n: number, k: 'text' | 'result' | 'status', v: string) => patch((x) => void ((x.steps[n] as unknown as Record<string, string>)[k] = v));

  const sev = SEV[s.sevKey];
  const rk = resOf(s.ver);
  const stepsDoneN = s.steps.filter((a) => a.status === 'Done').length;
  const stepsDone = s.steps.length > 0 && stepsDoneN === s.steps.length;
  const resAssessed = rk !== 'N';
  const resOk = rk === 'L' || rk === 'V';
  const needAccept = resAssessed && !resOk;
  const evidenceOk = !!(s.ver.method && s.ver.evidence.trim());
  const verifierOk = !!(s.ver.by.trim() && s.ver.date);
  const independent = !s.ver.by.trim() || !s.owner.trim() || s.ver.by.trim().toLowerCase() !== s.owner.trim().toLowerCase();
  const acceptOk = !needAccept || s.ver.accept;
  const canClose = stepsDone && resAssessed && evidenceOk && verifierOk && independent && acceptOk && s.status !== 'closed';
  const scoreLabel = s.l && s.i ? `${s.l}×${s.i} = ${s.l * s.i}` : '—';

  const checks: { ok: boolean; label: string; note?: string; warn?: boolean }[] = [
    { ok: stepsDone, label: 'All mitigation steps Done', note: s.steps.length ? `${stepsDoneN} of ${s.steps.length} done` : 'ยังไม่มี mitigation step' },
    { ok: resAssessed, label: 'Residual risk assessed with the same 5×5 matrix', note: resAssessed ? 'Residual ' + SEV[rk].label : '' },
    { ok: resAssessed && (resOk || s.ver.accept), label: 'Residual ≤ Low — or accepted by manager', note: needAccept ? (s.ver.accept ? 'Risk accepted by manager' : 'Residual still ' + SEV[rk].label) : '', warn: needAccept && !s.ver.accept },
    { ok: evidenceOk, label: 'Verification method + evidence recorded', note: 'เช่น trend กลับมาปกติ, ผลตรวจหลังซ่อม, เดินต่อเนื่องไม่พบซ้ำ' },
    { ok: verifierOk && independent, label: 'Verified by (name + date), independent of Response', note: !independent ? `ผู้ยืนยันควรเป็นคนละคนกับผู้รับผิดชอบ (${s.owner})` : '', warn: !independent },
    { ok: !!s.ver.recheck, label: 'Recurrence check scheduled (recommended)', note: 'ไม่บังคับ แต่ควรมี', warn: !s.ver.recheck && canClose },
  ];

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls = await uploadImages(files, 'weekly/top10');
      patch((x) => {
        urls.forEach((src) => x.photos.push({ src, label: 'Photo ' + (x.photos.length + 1) }));
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addStep = () => {
    const t = stepDraft.trim();
    if (!t) return;
    patch((x) => void x.steps.push({ text: t, result: '', status: 'Open' }));
    setStepDraft('');
  };

  const embedLink = embedIdx >= 0 ? s.links[embedIdx] : undefined;

  return (
    <Modal onClose={onClose} maxWidth={1240} top={32} bg={wk.soft} z={40}>
      <div style={{ background: '#fff', padding: '18px 24px', borderBottom: `1px solid ${wk.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ ...mono, margin: 0, fontSize: 24, fontWeight: 700, color: wk.red }}>{s.tag || '[TAG]'}</h2>
            <span style={pill(STATUS[s.status].bg, STATUS[s.status].fg, 11)}>{STATUS[s.status].label}</span>
            <span style={pill(sev.bg, sev.fg)}>{sev.label}</span>
            <span style={SRC_STYLE(s.src)}>{s.src}</span>
            <span style={{ fontSize: 13, color: wk.muted }}>
              {s.plant} · Response {s.owner || '[Assign]'} · Due {fmtDate(s.due)}
            </span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{s.detail || 'หัวข้อ concerning…'}</div>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <EditGate>
        <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Concern">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <label style={labelStyle}>
                  Equipment tag
                  <input value={s.tag} onChange={(e) => set('tag', e.target.value)} placeholder="TAG no." style={{ ...inputStyle, ...mono, fontWeight: 700, color: wk.red }} />
                </label>
                <label style={labelStyle}>
                  Plant
                  <select value={s.plant} onChange={(e) => set('plant', e.target.value as WeeklyPlant)} style={{ ...inputStyle, fontWeight: 400 }}>
                    {['Plant 1', 'Plant 2', 'Plant 3', 'UT'].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Response
                  <input value={s.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Assign…" style={{ ...inputStyle, fontWeight: 400 }} />
                </label>
                <label style={labelStyle}>
                  Due date
                  <input type="date" value={s.due} onChange={(e) => set('due', e.target.value)} style={{ ...inputStyle, fontWeight: 400 }} />
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 4' }}>
                  Topic
                  <input value={s.detail} onChange={(e) => set('detail', e.target.value)} placeholder="หัวข้อ concerning…" style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }} />
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 4' }}>
                  Situation / Background
                  <textarea rows={5} value={s.background} onChange={(e) => set('background', e.target.value)} placeholder="อาการที่พบ, ค่าที่วัดได้, ประวัติ, สาเหตุที่สงสัย…" style={{ ...inputStyle, fontWeight: 400, resize: 'vertical' }} />
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                  Likelihood
                  <select value={s.l || ''} onChange={(e) => set('l', Number(e.target.value) || 0)} style={{ ...inputStyle, fontWeight: 600 }}>
                    <option value="">– Assess</option>
                    {L_OPTIONS.map((t, k) => (
                      <option key={t} value={k + 1}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span style={hint}>{s.l ? 'Probability ' + L_SCALE[s.l - 1].prob : 'ยังไม่ได้ประเมิน'}</span>
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                  Impact
                  <select value={s.i || ''} onChange={(e) => set('i', Number(e.target.value) || 0)} style={{ ...inputStyle, fontWeight: 600 }}>
                    <option value="">– Assess</option>
                    {I_OPTIONS.map((t, k) => (
                      <option key={t} value={k + 1}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span style={hint}>{s.i ? I_SCALE[s.i - 1].desc : 'ยังไม่ได้ประเมิน'}</span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 8, background: wk.soft }}>
                <span style={{ fontSize: 12, color: wk.muted }}>Severity</span>
                <span style={pill(sev.bg, sev.fg)}>{sev.label}</span>
                <span style={{ ...mono, fontSize: 12, color: wk.muted }}>{scoreLabel}</span>
                <span style={{ fontSize: 12, color: wk.muted }}>· {s.mvText}</span>
                <button type="button" onClick={() => setShowScale(!showScale)} style={{ ...btn('outline', 30), marginLeft: 'auto', fontSize: 12 }}>
                  {showScale ? 'Hide scale guide' : 'L / I scale guide'}
                </button>
              </div>
              {showScale && <ScaleMini />}
            </Card>

            <Card title="Failure classification" aside="ISO 14224 taxonomy (Annex B)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {(
                  [
                    ['eqClass', 'Equipment class', ISO_LISTS.eq, ''],
                    ['mode', 'Failure mode', ISO_LISTS.mode, 'อาการที่สังเกตได้ (what is observed)'],
                    ['mech', 'Failure mechanism', ISO_LISTS.mech, 'กลไกทางกายภาพที่ทำให้เสีย (how it fails)'],
                    ['cause', 'Failure cause', ISO_LISTS.cause, 'ต้นเหตุ (why it failed)'],
                  ] as const
                ).map(([k, label, list, note]) => (
                  <label key={k} style={labelStyle}>
                    {label}
                    <select value={s.cls[k]} onChange={(e) => setCls(k, e.target.value)} style={{ ...inputStyle, fontWeight: 400 }}>
                      <option value="">– Select –</option>
                      {k === 'cause' && <option value="TBD">Under investigation</option>}
                      {list.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.t}
                        </option>
                      ))}
                    </select>
                    {note && <span style={hint}>{note}</span>}
                  </label>
                ))}
              </div>
            </Card>

            <Card title="Mitigation steps" aside={s.steps.length ? `${stepsDoneN}/${s.steps.length} done` : 'No steps yet'} gap={10}>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.steps.map((a, n) => (
                  <li key={n} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 8px 6px 10px', border: `1px solid ${wk.line2}`, borderRadius: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 9, flex: 'none', background: STEP_DOT[a.status] }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <input aria-label="Mitigation step" value={a.text} onChange={(e) => setStep(n, 'text', e.target.value)} placeholder="ขั้นตอน mitigation" style={{ ...ghostInput, fontWeight: 600, fontSize: 14 }} />
                      <textarea aria-label="Step explanation" rows={2} value={a.result} onChange={(e) => setStep(n, 'result', e.target.value)} placeholder="คำอธิบาย / ผลการตรวจ / ค่าที่วัดได้…" style={{ ...ghostInput, fontSize: 12.5, color: wk.muted, resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <select aria-label="Step status" value={a.status} onChange={(e) => setStep(n, 'status', e.target.value as StepStatus)} style={{ ...inputStyle, width: 'auto', fontSize: 12, fontWeight: 600 }}>
                        <option>Open</option>
                        <option>Watch</option>
                        <option>Done</option>
                      </select>
                      <button type="button" aria-label="Remove step" onClick={() => patch((x) => void x.steps.splice(n, 1))} style={btn('ghost', 32)}>
                        <Icon.Trash />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              <div style={{ display: 'flex', gap: 6 }}>
                <input aria-label="New mitigation step" value={stepDraft} onChange={(e) => setStepDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStep()} placeholder="เพิ่มขั้นตอน mitigation…" style={inputStyle} />
                <button type="button" onClick={addStep} style={btn('dark')}>
                  Add
                </button>
              </div>
            </Card>
          </div>

          <div style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Photos, links & PI trend" aside="แนบไปกับ weekly email ด้วย" gap={10}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 8 }}>
                {s.photos.map((p, n) => (
                  <figure key={n} style={{ margin: 0, border: `1px solid ${wk.line}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <img src={p.src} alt={p.label} style={{ height: 80, width: '100%', objectFit: 'cover', background: wk.soft }} />
                    <figcaption style={{ padding: '4px 8px', fontSize: 11, color: wk.text2 }}>{p.label}</figcaption>
                    {isAdmin && (
                      <button type="button" aria-label="Remove photo" onClick={() => patch((x) => void x.photos.splice(n, 1))} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(14,26,43,.6)', color: '#fff', fontSize: 13, lineHeight: 1 }}>
                        ×
                      </button>
                    )}
                  </figure>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()} style={{ minHeight: 104, border: '1.5px dashed #9FB3C8', borderRadius: 8, background: wk.soft, color: wk.blue, fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Icon.Plus size={20} />
                  {uploading ? 'Uploading…' : 'Upload photo'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.links.map((lk, n) => (
                  <li key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 8px', border: `1px solid ${wk.line2}`, borderRadius: 8 }}>
                    <LinkBadge kind={lk.kind} />
                    <a href={lk.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: wk.blue }}>
                      {lk.label}
                    </a>
                    {lk.kind === 'pi' && (
                      <button type="button" onClick={() => setEmbedIdx(embedIdx === n ? -1 : n)} style={{ ...(embedIdx === n ? btn('dark', 28) : { ...btn('outline', 28), border: `1px solid ${wk.ink}`, fontWeight: 600 }), fontSize: 12, padding: '0 10px' }}>
                        {embedIdx === n ? 'Hide' : 'Show here'}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Remove link"
                      onClick={() => {
                        patch((x) => void x.links.splice(n, 1));
                        setEmbedIdx(-1);
                      }}
                      style={btn('ghost', 28)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              {embedLink && embedLink.kind === 'pi' && <PiEmbed key={embedLink.url} link={embedLink} />}
              <AddLinkRow
                kinds={[
                  ['pi', 'PI Vision trend'],
                  ['link', 'Link / report'],
                ]}
                placeholder="ชื่อ เช่น Motor current 30d"
                onAdd={(l) => {
                  const idx = s.links.length;
                  patch((x) => void x.links.push(l));
                  if (l.kind === 'pi') setEmbedIdx(idx);
                }}
              />
            </Card>

            <Card title="Effectiveness verification & close-out" aside="ISO 31000 · ISO 55001 cl. 10">
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                <div style={{ flex: 1, border: `1px solid ${wk.line2}`, borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: wk.muted, fontWeight: 600 }}>INITIAL RISK</span>
                  <span style={{ ...mono, fontSize: 18, fontWeight: 700 }}>{scoreLabel}</span>
                  <span>
                    <span style={pill(sev.bg, sev.fg)}>{sev.label}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: wk.muted }}>
                  <Icon.Arrow />
                </div>
                <div style={{ flex: 1, border: `1px solid ${wk.line2}`, borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: wk.muted, fontWeight: 600 }}>RESIDUAL RISK (after mitigation)</span>
                  <span style={{ ...mono, fontSize: 18, fontWeight: 700 }}>{resAssessed ? `${s.ver.rl}×${s.ver.ri} = ${Number(s.ver.rl) * Number(s.ver.ri)}` : '—'}</span>
                  <span>
                    <span style={pill(SEV[rk].bg, SEV[rk].fg)}>{SEV[rk].label}</span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <label style={labelStyle}>
                  Residual likelihood
                  <select value={s.ver.rl} onChange={(e) => setVer('rl', e.target.value)} style={{ ...inputStyle, fontWeight: 400 }}>
                    <option value="">– Assess</option>
                    {L_OPTIONS.map((t, k) => (
                      <option key={t} value={String(k + 1)}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Residual impact
                  <select value={s.ver.ri} onChange={(e) => setVer('ri', e.target.value)} style={{ ...inputStyle, fontWeight: 400 }}>
                    <option value="">– Assess</option>
                    {I_OPTIONS.map((t, k) => (
                      <option key={t} value={String(k + 1)}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                  Verification method
                  <select value={s.ver.method} onChange={(e) => setVer('method', e.target.value)} style={{ ...inputStyle, fontWeight: 400 }}>
                    <option value="">– Select –</option>
                    {VERIFY_METHODS.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                  Evidence
                  <textarea rows={2} value={s.ver.evidence} onChange={(e) => setVer('evidence', e.target.value)} placeholder="เช่น Overall vib. 7.4 → 2.1 mm/s หลังเปลี่ยน bearing, เดินต่อเนื่อง 30 วันไม่พบซ้ำ" style={{ ...inputStyle, fontWeight: 400, resize: 'vertical' }} />
                </label>
                <label style={labelStyle}>
                  Verified by
                  <input value={s.ver.by} onChange={(e) => setVer('by', e.target.value)} placeholder="ชื่อผู้ยืนยัน" style={{ ...inputStyle, fontWeight: 400 }} />
                </label>
                <label style={labelStyle}>
                  Verified date
                  <input type="date" value={s.ver.date} onChange={(e) => setVer('date', e.target.value)} style={{ ...inputStyle, fontWeight: 400 }} />
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                  Recurrence check date
                  <input type="date" value={s.ver.recheck} onChange={(e) => setVer('recheck', e.target.value)} style={{ ...inputStyle, fontWeight: 400 }} />
                  <span style={hint}>นัดตรวจซ้ำหลังปิด (แนะนำ 30–90 วัน) ว่าไม่กลับมาเกิดอีก</span>
                </label>
                {needAccept && (
                  <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8, background: '#FFF4E5', fontSize: 13, color: '#6B3A00' }}>
                    <input type="checkbox" checked={s.ver.accept} onChange={() => patch((x) => void (x.ver.accept = !x.ver.accept))} style={{ width: 18, height: 18, marginTop: 2, accentColor: wk.amber }} />
                    <span>
                      Residual ยังเป็น <b>{SEV[rk].label}</b> — ต้องมี manager รับความเสี่ยงที่เหลือ (risk acceptance) ก่อนปิด
                    </span>
                  </label>
                )}
              </div>

              <ul style={{ margin: 0, padding: 12, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, background: wk.soft, borderRadius: 10 }}>
                {checks.map((c) => (
                  <li key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                    <span
                      style={{
                        flex: 'none',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        ...(c.ok ? { background: wk.green, color: '#fff' } : c.warn ? { background: wk.gold, color: wk.ink } : { background: '#fff', color: '#9AA4B0', border: `1.5px solid ${wk.inputLine}` }),
                      }}
                    >
                      {c.ok ? '✓' : c.warn ? '!' : '○'}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{c.label}</span>
                      {c.note && <span style={{ fontSize: 12, color: wk.muted }}>{c.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                {s.status !== 'open' && (
                  <button type="button" onClick={() => set('status', 'open')} style={{ ...btn('outline', 44), fontWeight: 400 }}>
                    Reopen
                  </button>
                )}
                <button type="button" onClick={() => set('status', 'verifying')} disabled={!(stepsDone && s.status === 'open')} style={{ ...btn('outline', 44), border: `1px solid ${wk.amber}`, color: wk.amber, fontWeight: 600, opacity: stepsDone && s.status === 'open' ? 1 : 0.45 }}>
                  Submit for verification
                </button>
                <button type="button" onClick={() => set('status', 'closed')} disabled={!canClose} style={{ ...btn('success', 44), opacity: canClose ? 1 : 0.45 }}>
                  Verify &amp; close
                </button>
              </div>
            </Card>
          </div>
        </div>
      </EditGate>

      <div style={{ background: '#fff', padding: '12px 24px', borderTop: `1px solid ${wk.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {!isAdmin ? (
            <span style={{ fontSize: 12, color: wk.muted }}>View only · ปลดล็อก admin เพื่อแก้ไข</span>
          ) : removing ? (
            <>
              <input aria-label="Reason for removing" value={removeDraft} onChange={(e) => setRemoveDraft(e.target.value)} placeholder="เหตุผลที่เอาออกโดยไม่ปิด เช่น รวมกับ 2PJ-301 / ย้ายไป monitor ใน PCD" style={{ ...inputStyle, flex: '1 1 320px', width: 'auto' }} />
              <button type="button" disabled={!removeDraft.trim()} onClick={() => onRemove(removeDraft.trim())} style={{ ...btn('danger', 40), opacity: removeDraft.trim() ? 1 : 0.45 }}>
                Remove
              </button>
              <button type="button" onClick={() => { setRemoving(false); setRemoveDraft(''); }} style={{ ...btn('outline', 40), fontWeight: 400 }}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setRemoving(true)} style={{ ...btn('outline', 40), border: '1px solid #E8B4B2', color: wk.red, fontWeight: 400 }}>
                Remove from board…
              </button>
              <span style={{ fontSize: 12, color: wk.muted }}>การแก้ไขบันทึกอัตโนมัติ</span>
            </>
          )}
        </div>
        <button type="button" onClick={onClose} style={btn('dark', 44)}>
          Done
        </button>
      </div>
    </Modal>
  );
}
