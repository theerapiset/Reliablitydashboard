import { useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useUI } from '../../store/UIContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import { blankRow } from '../editor/blankRow';
import { shutdownKpiIcon } from '../../utils/calc';
import type { ShutdownPerfItem } from '../../types/models';

// Local draft while typing, committed to the store on blur — same
// commit-on-blur convention as Editable.tsx, so a keystroke here can't
// trigger a full-store re-render that fights the input for its own value.
function ShutdownCodeInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      placeholder="Shutdown code e.g. 2ASD26"
      style={{ fontSize: 16, fontWeight: 800, color: '#1d2733', border: '1px solid #cfd7e0', borderRadius: 6, padding: '5px 10px', minWidth: 170 }}
    />
  );
}

export default function ShutdownPerformance() {
  const { store, year, setStore } = useStore();
  const { openEditor } = useUI();

  const curMonth = store.activeMonth;
  const items = (year.shutdownPerf || []).filter((p) => p.month === curMonth);

  const openAdd = () => openEditor({ module: 'shutdownPerf', idx: -1, data: blankRow('shutdownPerf', store) });
  const openEdit = (i: number, item: ShutdownPerfItem) => openEditor({ module: 'shutdownPerf', idx: i, data: JSON.parse(JSON.stringify(item)) });
  const deleteRow = (i: number) => {
    if (!window.confirm('Delete this record?')) return;
    setStore((s) => {
      s.years[String(s.activeYear)].shutdownPerf.splice(i, 1);
    });
  };
  const setShutdownCode = (i: number, code: string) =>
    setStore((s) => {
      const arr = s.years[String(s.activeYear)].shutdownPerf;
      if (arr[i]) arr[i].shutdownCode = code;
    });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 9, padding: '8px 14px' }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Showing</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            {curMonth} {store.activeYear}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <EditGate>
          <button
            onClick={openAdd}
            style={{ height: 38, border: 'none', borderRadius: 8, padding: '0 17px', background: colors.navy, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>Add shutdown
          </button>
        </EditGate>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item) => {
          const i = year.shutdownPerf.indexOf(item);
          return (
            <div key={item.id} style={{ background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EditGate>
                    <ShutdownCodeInput value={item.shutdownCode} onCommit={(v) => setShutdownCode(i, v)} />
                  </EditGate>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#1d2733' }}>Performance</span>
                </div>
                <span style={{ fontSize: 11, color: colors.muted }}>
                  {item.kpiRows.length} KPI{item.kpiRows.length === 1 ? '' : 's'} · {item.canvas.length} highlight block{item.canvas.length === 1 ? '' : 's'}
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginTop: 10 }}>
                <thead>
                  <tr style={{ background: '#f5f8fb', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px', fontWeight: 700, color: '#7c8a99' }}>KPI</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700, color: '#7c8a99' }}>Plan</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700, color: '#7c8a99' }}>Actual</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700, color: '#7c8a99' }}>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {item.kpiRows.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #eef1f5' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>
                        <span style={{ marginRight: 6 }}>{shutdownKpiIcon(r.kpi)}</span>
                        {r.kpi}
                      </td>
                      <td style={{ padding: '6px 10px' }}>{r.plan}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: colors.blue }}>{r.actual}</td>
                      <td style={{ padding: '6px 10px', color: '#5a6878' }}>{r.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, borderTop: '1px solid #f0f2f5', paddingTop: 10 }}>
                <button onClick={() => openEdit(i, item)} style={{ border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>
                  Edit
                </button>
                <EditGate>
                  <button onClick={() => deleteRow(i)} style={{ border: '1px solid #f0d4d4', background: '#fff', color: '#c0392b', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}>
                    Delete
                  </button>
                </EditGate>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div style={{ padding: 36, textAlign: 'center', color: '#8895a3', fontSize: 13, background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11 }}>
          No shutdown performance record for <strong>{curMonth} {store.activeYear}</strong> yet.
          <br />
          <span style={{ fontSize: 12, color: '#a7b2bd' }}>Click "Add shutdown" to create one.</span>
        </div>
      )}
    </div>
  );
}
