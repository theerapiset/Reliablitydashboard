import { useState } from 'react';
import { useUI } from '../../store/UIContext';
import { useStore } from '../../store/StoreContext';
import { useAuth } from '../../store/AuthContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import ImagePicker from './ImagePicker';
import ConcernCanvasEditor from './ConcernCanvasEditor';
import { defaultConcernBlocks, fmt, hoursBetween, monthOf, uid } from '../../utils/calc';
import { MONTHS, type ConcernBlock, type ImageRef, type ShutdownPerfKpiRow } from '../../types/models';

const inputStyle: React.CSSProperties = { width: '100%', height: 38, border: '1px solid #cfd7e0', borderRadius: 8, padding: '0 11px', marginTop: 5 };
const labelStyle: React.CSSProperties = { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' };

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export default function EditorModal() {
  const { editor, closeEditor, setEditorData } = useUI();
  const { setStore } = useStore();
  const { isAdmin } = useAuth();
  const [canvasOpen, setCanvasOpen] = useState(false);

  if (!editor) return null;
  const { module, idx, data } = editor;
  const d = data as Record<string, any>;

  const set = (field: string, v: unknown) => {
    const next = { ...d, [field]: v };
    if ((module === 'cta' || module === 'pta') && (field === 'sdStart' || field === 'suStart')) {
      next.hours = hoursBetween(next.sdStart, next.suStart);
    }
    setEditorData(next);
  };

  const titles: Record<string, string> = { safety: 'safety record', cta: 'CTA shutdown', pta: 'PTA shutdown', cost: 'cost-saving project', concern: 'concerning equipment', shutdownPerf: 'shutdown performance' };
  const title = (idx >= 0 ? 'Edit ' : 'Add ') + titles[module];

  const save = () => {
    const rec = { ...d } as Record<string, any>;
    if (module === 'cta' || module === 'pta') {
      rec.month = monthOf(rec.sdStart) || rec.month || '';
      rec.hours = hoursBetween(rec.sdStart, rec.suStart) || Number(rec.hours) || 0;
    }
    setStore((s) => {
      const arr = (s.years[String(s.activeYear)] as any)[module] as any[];
      if (idx >= 0) arr[idx] = { ...arr[idx], ...rec };
      else arr.push({ id: uid(), ...rec });
    });
    closeEditor();
  };

  const isRel = module === 'cta' || module === 'pta';
  const isMTQuality = isRel && d.rootCause === 'MT quality';
  const isIL4 = module === 'cost' && d.status === 'Release saving (IL4)';

  return (
    <div
      onClick={closeEditor}
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,28,44,.55)', zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '34px 20px', overflowY: 'auto' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', width: 760, maxWidth: '100%', borderRadius: 14, boxShadow: '0 24px 70px rgba(0,0,0,.35)', animation: 'fadein .2s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #eef1f5' }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={closeEditor} style={{ border: 'none', background: '#eef1f5', width: 30, height: 30, borderRadius: 7, fontSize: 16, color: '#5a6878' }}>
            ✕
          </button>
        </div>
        {!isAdmin && (
          <div style={{ background: '#fbf1dd', color: '#8a6417', fontSize: 12, fontWeight: 600, padding: '8px 22px' }}>
            🔒 View only — ปลดล็อกด้วยรหัส Admin (มุมขวาบน) เพื่อแก้ไข
          </div>
        )}
        <EditGate>
        <div style={{ padding: '20px 22px', maxHeight: '70vh', overflowY: 'auto' }}>
          {module === 'safety' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <L label="Date">
                  <input type="date" value={d.date || ''} onChange={(e) => set('date', e.target.value)} style={inputStyle} />
                </L>
                <L label="Type">
                  <select value={d.type || ''} onChange={(e) => set('type', e.target.value)} style={inputStyle}>
                    <option value="">— type —</option>
                    {['PSE Tier 1, Tier 2', 'LOPC, Tier 3a,3b', 'TRIR', 'First Aid', 'Property Damage'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
              </div>
              <div style={{ marginTop: 14 }}>
                <L label="Incident description">
                  <textarea value={d.description || ''} onChange={(e) => set('description', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, height: 'auto' }} />
                </L>
              </div>
            </>
          )}

          {isRel && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <L label="Plant">
                  <select value={d.plant} onChange={(e) => set('plant', e.target.value)} style={inputStyle}>
                    {['Plant 1', 'Plant 2', 'Plant 3'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
                <L label="Equipment">
                  <input value={d.equipment} onChange={(e) => set('equipment', e.target.value)} style={inputStyle} />
                </L>
              </div>
              <div style={{ marginTop: 14 }}>
                <L label="Topic">
                  <input value={d.topic} onChange={(e) => set('topic', e.target.value)} style={inputStyle} />
                </L>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                <L label="Shutdown type">
                  <select value={d.shutdownType} onChange={(e) => set('shutdownType', e.target.value)} style={inputStyle}>
                    {['CTA trouble', 'PTA trouble'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <span style={{ display: 'block', fontSize: 10.5, color: '#9aa6b3', marginTop: 4 }}>
                    Which side the root trouble came from — independent of this tab. A {module === 'cta' ? 'CTA' : 'PTA'} shutdown can be triggered by the other side's issue.
                  </span>
                </L>
                <L label="Plant effect">
                  <select value={d.plantEffect} onChange={(e) => set('plantEffect', e.target.value)} style={inputStyle}>
                    {['ESD', 'CTA load down', 'Re slurry', 'Resolvent'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 96px', gap: 14, marginTop: 14, alignItems: 'end' }}>
                <L label="Shutdown date/time">
                  <input type="datetime-local" value={d.sdStart} onChange={(e) => set('sdStart', e.target.value)} style={{ ...inputStyle, padding: '0 9px' }} />
                </L>
                <L label="Start-up date/time">
                  <input type="datetime-local" value={d.suStart} onChange={(e) => set('suStart', e.target.value)} style={{ ...inputStyle, padding: '0 9px' }} />
                </L>
                <div>
                  <span style={labelStyle}>SD hr</span>
                  <div style={{ height: 38, border: '1px solid #e2e7ee', background: '#f4f6f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontWeight: 700, marginTop: 5 }}>
                    {fmt(d.hours, 2)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
                <L label="CTA vol loss (KT)">
                  <input type="number" step="0.001" value={d.ctaVolLoss} onChange={(e) => set('ctaVolLoss', e.target.value)} style={inputStyle} />
                </L>
                <L label="PE cost loss (MB)">
                  <input type="number" step="0.01" value={d.peCost} onChange={(e) => set('peCost', e.target.value)} style={inputStyle} />
                </L>
                <L label="MT cost loss (MB)">
                  <input type="number" step="0.01" value={d.mtCost} onChange={(e) => set('mtCost', e.target.value)} style={inputStyle} />
                </L>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMTQuality ? '1fr 1fr' : '1fr', gap: 14, marginTop: 14 }}>
                <L label="Root cause">
                  <select value={d.rootCause} onChange={(e) => set('rootCause', e.target.value)} style={inputStyle}>
                    {['Aging', 'Weak design', 'External factor', 'MT quality'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
                {isMTQuality && (
                  <L label="MT quality — from">
                    <select value={d.mtQuality} onChange={(e) => set('mtQuality', e.target.value)} style={{ ...inputStyle, border: '1px solid #e6c98a', background: '#fdf8ee' }}>
                      {['Lack of knowledge', 'Contractor performance', 'Incomplete MT system', 'Human error', 'Other'].map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </L>
                )}
              </div>
              <div style={{ marginTop: 14 }}>
                <L label="Executive summary — background / possible cause / CA / PA">
                  <textarea value={d.execSummary} onChange={(e) => set('execSummary', e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55, fontSize: 13, height: 'auto' }} />
                </L>
              </div>
              <div style={{ marginTop: 14 }}>
                <ImagePicker images={(d.images || []) as ImageRef[]} onChange={(imgs) => set('images', imgs)} pathPrefix="reliability" />
              </div>
            </>
          )}

          {module === 'cost' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <L label="Project name">
                  <input value={d.projectName} onChange={(e) => set('projectName', e.target.value)} style={inputStyle} />
                </L>
                <L label="Response by">
                  <input value={d.responseBy} onChange={(e) => set('responseBy', e.target.value)} style={inputStyle} />
                </L>
                <L label="Register type">
                  <select value={d.registerType} onChange={(e) => set('registerType', e.target.value)} style={inputStyle}>
                    {['Action plan', 'Added'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginTop: 14 }}>
                <L label="Saving type">
                  <select value={d.savingType} onChange={(e) => set('savingType', e.target.value)} style={inputStyle}>
                    {['Recurring', 'Onetime'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
              </div>
              <div style={{ background: '#f5f8fb', border: `1px solid ${colors.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: colors.blue, marginBottom: 10 }}>PLAN BENEFIT · IL3</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <L label="Plan saving (MB/year)">
                    <input type="number" step="0.01" value={d.planMB} onChange={(e) => set('planMB', e.target.value)} style={inputStyle} />
                  </L>
                  <L label="Plan saving (USD/T-PTA)">
                    <input type="number" step="0.0001" value={d.planUSDT} onChange={(e) => set('planUSDT', e.target.value)} style={inputStyle} />
                  </L>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
                <L label="SIL4 month">
                  <select value={d.sil4Month} onChange={(e) => set('sil4Month', e.target.value)} style={inputStyle}>
                    {MONTHS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
                <L label="SIL4 year">
                  <input type="number" value={d.sil4Year} onChange={(e) => set('sil4Year', e.target.value)} style={inputStyle} />
                </L>
                <L label="Status">
                  <select value={d.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                    {['Execute (IL3)', 'Release saving (IL4)'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
              </div>
              {isIL4 && (
                <div style={{ background: '#eef7f1', border: '1px solid #cfe6d7', borderRadius: 10, padding: 14, marginTop: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: colors.green, marginBottom: 10 }}>ACTUAL BENEFIT · IL4 (release saving)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <L label="Actual saving (MB)">
                      <input type="number" step="0.01" value={d.actualMB} onChange={(e) => set('actualMB', e.target.value)} style={inputStyle} />
                    </L>
                    <L label="Actual saving (USD/T)">
                      <input type="number" step="0.0001" value={d.actualUSDT} onChange={(e) => set('actualUSDT', e.target.value)} style={inputStyle} />
                    </L>
                  </div>
                </div>
              )}
            </>
          )}

          {module === 'concern' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 90px 1fr', gap: 14 }}>
                <L label="Equipment / tag">
                  <input value={d.equipment} onChange={(e) => set('equipment', e.target.value)} style={inputStyle} />
                </L>
                <L label="Plant">
                  <select value={d.plant} onChange={(e) => set('plant', e.target.value)} style={inputStyle}>
                    {['P#1', 'P#2', 'P#3'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
                <L label="Status">
                  <select value={d.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                    {['Monitoring', 'Resolved'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </L>
              </div>
              <div style={{ marginTop: 14 }}>
                <L label="Title">
                  <input value={d.title} onChange={(e) => set('title', e.target.value)} style={inputStyle} />
                </L>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!d.canvas?.length}
                    onChange={(e) => {
                      if (e.target.checked) set('canvas', d.canvas?.length ? d.canvas : defaultConcernBlocks());
                      else set('canvas', undefined);
                    }}
                  />
                  Free layout — arrange text/images freely like PowerPoint
                </label>
                {!d.canvas?.length && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!d.fullImage} onChange={(e) => set('fullImage', e.target.checked)} />
                    Full-page screenshot (hide text fields, show image large)
                  </label>
                )}
              </div>

              {d.canvas?.length ? (
                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={() => setCanvasOpen(true)}
                    style={{ height: 40, border: 'none', background: colors.navy, color: '#fff', borderRadius: 8, padding: '0 18px', fontWeight: 700, fontSize: 13 }}
                  >
                    🖊 Edit free layout ({d.canvas.length} block{d.canvas.length === 1 ? '' : 's'})
                  </button>
                  {canvasOpen && (
                    <ConcernCanvasEditor
                      blocks={d.canvas as ConcernBlock[]}
                      onChange={(blocks) => set('canvas', blocks)}
                      onClose={() => setCanvasOpen(false)}
                    />
                  )}
                </div>
              ) : (
                <>
                  {!d.fullImage && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                        <L label="Issue">
                          <textarea value={d.issue} onChange={(e) => set('issue', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 13, height: 'auto' }} />
                        </L>
                        <L label="Possible cause">
                          <textarea value={d.possibleCause} onChange={(e) => set('possibleCause', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 13, height: 'auto' }} />
                        </L>
                        <L label="Action">
                          <textarea value={d.action} onChange={(e) => set('action', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 13, height: 'auto' }} />
                        </L>
                        <L label="Preventive action">
                          <textarea value={d.preventive} onChange={(e) => set('preventive', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 13, height: 'auto' }} />
                        </L>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <L label="Benefit (optional)">
                          <input value={d.benefit} onChange={(e) => set('benefit', e.target.value)} style={inputStyle} />
                        </L>
                      </div>
                    </>
                  )}
                  <div style={{ marginTop: 14 }}>
                    <L label="Notes / free text (optional)">
                      <textarea value={d.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 13, height: 'auto' }} />
                    </L>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <ImagePicker images={(d.images || []) as ImageRef[]} onChange={(imgs) => set('images', imgs)} pathPrefix="concern" />
                  </div>
                </>
              )}
            </>
          )}

          {module === 'shutdownPerf' && (
            <>
              <div style={{ marginTop: 0 }}>
                <L label="Shutdown code">
                  <input value={d.shutdownCode} onChange={(e) => set('shutdownCode', e.target.value)} placeholder="e.g. 2ASD26" style={inputStyle} />
                </L>
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={labelStyle}>KPI · Plan · Actual · Remark</span>
                <div style={{ marginTop: 6, border: '1px solid #e2e7ee', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.7fr 0.7fr 1.3fr 32px', background: '#f5f8fb', padding: '7px 0' }}>
                    {['KPI', 'Plan', 'Actual', 'Remark', ''].map((h, i) => (
                      <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: '#7c8a99', padding: '0 8px', textTransform: 'uppercase' }}>{h}</div>
                    ))}
                  </div>
                  {(d.kpiRows as ShutdownPerfKpiRow[]).map((row, ri) => (
                    <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.7fr 0.7fr 1.3fr 32px', borderTop: '1px solid #eef1f5', alignItems: 'center' }}>
                      {(['kpi', 'plan', 'actual', 'remark'] as const).map((field) => (
                        <input
                          key={field}
                          value={row[field]}
                          onChange={(e) => {
                            const rows = [...(d.kpiRows as ShutdownPerfKpiRow[])];
                            rows[ri] = { ...rows[ri], [field]: e.target.value };
                            set('kpiRows', rows);
                          }}
                          style={{ height: 36, border: 'none', borderRight: '1px solid #eef1f5', padding: '0 8px', fontSize: 12.5, background: 'transparent' }}
                        />
                      ))}
                      <button
                        onClick={() => set('kpiRows', (d.kpiRows as ShutdownPerfKpiRow[]).filter((_, i2) => i2 !== ri))}
                        title="Delete row"
                        style={{ border: 'none', background: 'transparent', color: '#c0392b', fontSize: 14, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => set('kpiRows', [...(d.kpiRows as ShutdownPerfKpiRow[]), { id: uid(), kpi: '', plan: '', actual: '', remark: '' }])}
                  style={{ marginTop: 8, height: 32, border: '1px dashed #cfd7e0', background: '#fff', borderRadius: 7, padding: '0 12px', fontSize: 12.5, fontWeight: 600, color: colors.blue }}
                >
                  + Add row
                </button>
              </div>

              <div style={{ marginTop: 18 }}>
                <span style={labelStyle}>Highlight Activities — free layout</span>
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => setCanvasOpen(true)}
                    style={{ height: 40, border: 'none', background: colors.navy, color: '#fff', borderRadius: 8, padding: '0 18px', fontWeight: 700, fontSize: 13 }}
                  >
                    🖊 Edit highlight activities ({(d.canvas as ConcernBlock[])?.length || 0} block{(d.canvas as ConcernBlock[])?.length === 1 ? '' : 's'})
                  </button>
                  {canvasOpen && (
                    <ConcernCanvasEditor
                      blocks={(d.canvas as ConcernBlock[]) || []}
                      onChange={(blocks) => set('canvas', blocks)}
                      onClose={() => setCanvasOpen(false)}
                      getDefaultBlocks={() => []}
                      resetLabel="↺ Clear canvas"
                      resetConfirm="Clear the canvas? This removes all text and images."
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        </EditGate>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '15px 22px', borderTop: '1px solid #eef1f5' }}>
          <button onClick={closeEditor} style={{ height: 40, border: '1px solid #cfd7e0', background: '#fff', borderRadius: 8, padding: '0 18px', fontWeight: 600 }}>
            Cancel
          </button>
          <EditGate>
            <button onClick={save} style={{ height: 40, border: 'none', background: colors.navy, color: '#fff', borderRadius: 8, padding: '0 22px', fontWeight: 700 }}>
              Save record
            </button>
          </EditGate>
        </div>
      </div>
    </div>
  );
}
