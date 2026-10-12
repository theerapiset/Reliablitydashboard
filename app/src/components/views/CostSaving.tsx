import { useStore } from '../../store/StoreContext';
import { useUI } from '../../store/UIContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import { blankRow } from '../editor/blankRow';
import { costTotals, fmt, monthIdx, num } from '../../utils/calc';
import type { CostProject } from '../../types/models';

export default function CostSaving() {
  const { store, year, setStore } = useStore();
  const { openEditor } = useUI();
  const ct = costTotals(year, store.activeMonth, store.activeYear);
  const curM = monthIdx(store.activeMonth);

  const openAdd = () => openEditor({ module: 'cost', idx: -1, data: blankRow('cost', store) });
  const openEdit = (i: number, p: CostProject) => openEditor({ module: 'cost', idx: i, data: JSON.parse(JSON.stringify(p)) });
  const deleteRow = (i: number) => {
    if (!window.confirm('Delete this record?')) return;
    setStore((s) => {
      s.years[String(s.activeYear)].cost.splice(i, 1);
    });
  };

  const th: React.CSSProperties = { padding: '10px 14px', fontWeight: 600 };
  const statCard: React.CSSProperties = { background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, padding: '15px 17px' };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        <div style={{ ...statCard, borderTop: `3px solid ${colors.green}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>Release saving · IL4</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: colors.green, marginTop: 4 }}>
            {fmt(ct.il4, 2)}
            <span style={{ fontSize: 16, color: '#9aa6b3' }}> MB</span>
          </div>
        </div>
        <div style={{ ...statCard, borderTop: `3px solid ${colors.blue}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>Execution · IL3</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: colors.blue, marginTop: 4 }}>
            {fmt(ct.il3, 2)}
            <span style={{ fontSize: 16, color: '#9aa6b3' }}> MB</span>
          </div>
        </div>
        <div style={{ ...statCard, borderTop: `3px solid ${colors.amber}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>SIL4 overdue</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: colors.amber, marginTop: 4 }}>{ct.overdue}</div>
          <div style={{ fontSize: 12, color: colors.muted }}>passed SIL4 month, not yet released</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: 1, fontSize: 13, color: colors.muted }}>
          {ct.count} action plans · <span style={{ color: colors.amber }}>⚠</span> = reached SIL4 month but not released
        </div>
        <EditGate>
          <button
            onClick={openAdd}
            style={{ height: 38, border: 'none', borderRadius: 8, padding: '0 17px', background: colors.navy, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>Add project
          </button>
        </EditGate>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.navy, color: '#fff', textAlign: 'left' }}>
              <th style={th}>Project</th>
              <th style={{ ...th, width: 96 }}>Response</th>
              <th style={{ ...th, textAlign: 'right', width: 84 }}>Plan MB</th>
              <th style={{ ...th, textAlign: 'right', width: 92 }}>USD/T</th>
              <th style={{ ...th, width: 92 }}>SIL4</th>
              <th style={{ ...th, textAlign: 'right', width: 90 }}>Actual MB</th>
              <th style={{ ...th, width: 118 }}>Status</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {year.cost.map((p, i) => {
              const il4 = p.status === 'Release saving (IL4)';
              const overdue = !il4 && p.sil4Year && (num(p.sil4Year) < store.activeYear || (num(p.sil4Year) === store.activeYear && monthIdx(p.sil4Month) <= curM));
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #eef1f5' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#27333f' }}>
                    {overdue && (
                      <span title="SIL4 overdue" style={{ color: colors.amber, fontWeight: 800, marginRight: 5 }}>
                        ⚠
                      </span>
                    )}
                    {p.projectName}
                    <div style={{ fontFamily: fonts.mono, fontSize: 10.5, color: '#9aa6b3', marginTop: 2, textTransform: 'uppercase' }}>
                      {p.registerType} · {p.savingType}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#5a6878' }}>{p.responseBy}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: fonts.mono, fontWeight: 600 }}>{fmt(p.planMB, 2)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: fonts.mono, color: '#5a6878' }}>{fmt(p.planUSDT, 4)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: fonts.mono, fontSize: 12 }}>
                    {p.sil4Month} {p.sil4Year}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: fonts.mono, fontWeight: 600, color: colors.green }}>
                    {il4 ? fmt(p.actualMB || p.planMB, 2) : '–'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, color: il4 ? colors.green : colors.blue, background: il4 ? colors.greenBg : '#e7f0fb',
                        padding: '3px 8px', borderRadius: 5,
                      }}
                    >
                      {il4 ? 'Release (IL4)' : 'Execute (IL3)'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(i, p)} style={{ border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '4px 9px', fontSize: 12, marginRight: 4 }}>
                      Edit
                    </button>
                    <EditGate>
                      <button onClick={() => deleteRow(i)} style={{ border: '1px solid #f0d4d4', background: '#fff', color: '#c0392b', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>
                        ✕
                      </button>
                    </EditGate>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {year.cost.length === 0 && <div style={{ padding: 34, textAlign: 'center', color: '#8895a3', fontSize: 13 }}>No cost-saving projects yet.</div>}
      </div>
    </div>
  );
}
