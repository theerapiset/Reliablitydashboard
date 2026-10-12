import { useStore } from '../../store/StoreContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import { blankShutdown } from '../../data/seed';
import type { FuncType } from '../../types/models';

const FUNC_TYPES: FuncType[] = ['Rotating', 'Static', 'Electrical', 'Instrument', 'Production'];

export default function ShutdownActivities() {
  const { year, setStore } = useStore();

  const onSDField = (si: number, field: string, v: string) =>
    setStore((s) => {
      (s.years[String(s.activeYear)].shutdowns[si] as any)[field] = v;
    });
  const onCritField = (si: number, i: number, field: string, v: string) =>
    setStore((s) => {
      (s.years[String(s.activeYear)].shutdowns[si].critical[i] as any)[field] = v;
    });
  const addCrit = (si: number) =>
    setStore((s) => {
      s.years[String(s.activeYear)].shutdowns[si].critical.push({ equip: '', work: '', func: 'Rotating' });
    });
  const delCrit = (si: number, i: number) =>
    setStore((s) => {
      s.years[String(s.activeYear)].shutdowns[si].critical.splice(i, 1);
    });
  const addShutdown = () =>
    setStore((s) => {
      s.years[String(s.activeYear)].shutdowns.push(blankShutdown());
    });
  const delShutdown = (si: number) => {
    if (!window.confirm('Delete this shutdown?')) return;
    setStore((s) => {
      const arr = s.years[String(s.activeYear)].shutdowns;
      arr.splice(si, 1);
      if (arr.length === 0) arr.push(blankShutdown());
    });
  };

  const card: React.CSSProperties = { background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11 };
  const label: React.CSSProperties = { fontSize: 10, color: '#9aa6b3', textTransform: 'uppercase', fontFamily: fonts.mono };

  return (
    <EditGate>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 4px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>Shutdown activities</div>
          <button onClick={addShutdown} style={{ height: 36, border: 'none', borderRadius: 8, padding: '0 15px', background: colors.navy, color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>Add shutdown
          </button>
        </div>

        {year.shutdowns.map((sd, si) => (
          <div key={si} style={{ ...card, padding: '16px 18px', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#9aa6b3', textTransform: 'uppercase' }}>Shutdown {si + 1}</span>
              <input
                value={sd.name} onChange={(e) => onSDField(si, 'name', e.target.value)} placeholder="1CmSD26"
                style={{ border: '1px solid #cfd7e0', borderRadius: 7, padding: '5px 10px', fontWeight: 700, fontFamily: fonts.mono, width: 130 }}
              />
              <div style={{ flex: 1 }} />
              {year.shutdowns.length > 1 && (
                <button onClick={() => delShutdown(si)} style={{ border: '1px solid #f0d4d4', background: '#fff', color: '#c0392b', borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 600 }}>
                  ✕ Delete
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              <div style={{ background: '#f5f8fb', borderRadius: 9, padding: '11px 13px' }}>
                <div style={label}>Period</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 5 }}>
                  <input value={sd.start} onChange={(e) => onSDField(si, 'start', e.target.value)} style={{ width: 60, border: '1px solid #e6ebf0', borderRadius: 5, padding: '3px 5px', fontWeight: 700, color: colors.blue }} />→
                  <input value={sd.end} onChange={(e) => onSDField(si, 'end', e.target.value)} style={{ width: 60, border: '1px solid #e6ebf0', borderRadius: 5, padding: '3px 5px', fontWeight: 700, color: colors.blue }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
                  <input type="number" value={sd.days} onChange={(e) => onSDField(si, 'days', e.target.value)} style={{ width: 46, border: '1px solid #e6ebf0', borderRadius: 5, padding: '2px 5px', fontFamily: fonts.mono }} /> days
                </div>
              </div>
              <div style={{ background: '#f5f8fb', borderRadius: 9, padding: '11px 13px' }}>
                <div style={label}>Contractors</div>
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <input type="number" value={sd.companies} onChange={(e) => onSDField(si, 'companies', e.target.value)} style={{ width: 46, fontSize: 22, fontWeight: 800, color: colors.blue, border: 'none', borderBottom: '1px solid #e2e7ee' }} />
                  <span style={{ fontSize: 12, color: colors.muted }}>companies</span>
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <input type="number" value={sd.workers} onChange={(e) => onSDField(si, 'workers', e.target.value)} style={{ width: 56, fontSize: 18, fontWeight: 700, border: 'none', borderBottom: '1px solid #e2e7ee' }} />
                  <span style={{ fontSize: 12, color: colors.muted }}>workers</span>
                </div>
              </div>
              <div style={{ background: '#f5f8fb', borderRadius: 9, padding: '11px 13px' }}>
                <div style={label}>Budget · MB</div>
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <input type="number" step="0.1" value={sd.budgetTotal} onChange={(e) => onSDField(si, 'budgetTotal', e.target.value)} style={{ width: 64, fontSize: 22, fontWeight: 800, color: colors.blue, border: 'none', borderBottom: '1px solid #e2e7ee' }} />
                </div>
                <div style={{ marginTop: 5, fontSize: 11, color: colors.muted, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type="number" step="0.01" value={sd.budgetMaint} onChange={(e) => onSDField(si, 'budgetMaint', e.target.value)} style={{ width: 46, border: '1px solid #e6ebf0', borderRadius: 4, padding: '2px 4px', fontFamily: fonts.mono }} />maint ·
                  <input type="number" step="0.01" value={sd.budgetOper} onChange={(e) => onSDField(si, 'budgetOper', e.target.value)} style={{ width: 46, border: '1px solid #e6ebf0', borderRadius: 4, padding: '2px 4px', fontFamily: fonts.mono }} />oper
                </div>
              </div>
              <div style={{ background: '#f5f8fb', borderRadius: 9, padding: '11px 13px' }}>
                <div style={label}>Total works</div>
                <div style={{ marginTop: 5 }}>
                  <input type="number" value={sd.totalWorks} onChange={(e) => onSDField(si, 'totalWorks', e.target.value)} style={{ width: 64, fontSize: 22, fontWeight: 800, border: 'none', borderBottom: '1px solid #e2e7ee' }} />
                </div>
                <div style={{ marginTop: 5, fontSize: 11, color: colors.muted, display: 'flex', gap: 3, alignItems: 'center' }}>
                  <input type="number" value={sd.pm} onChange={(e) => onSDField(si, 'pm', e.target.value)} style={{ width: 36, border: '1px solid #e6ebf0', borderRadius: 4, padding: '2px 3px', fontFamily: fonts.mono, color: colors.blue }} />PM
                  <input type="number" value={sd.cbm} onChange={(e) => onSDField(si, 'cbm', e.target.value)} style={{ width: 36, border: '1px solid #e6ebf0', borderRadius: 4, padding: '2px 3px', fontFamily: fonts.mono, color: '#d98036' }} />CBM
                  <input type="number" value={sd.moc} onChange={(e) => onSDField(si, 'moc', e.target.value)} style={{ width: 30, border: '1px solid #e6ebf0', borderRadius: 4, padding: '2px 3px', fontFamily: fonts.mono }} />MOC
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 8px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>Critical works</div>
              <button onClick={() => addCrit(si)} style={{ border: '1px solid #cfd7e0', background: '#fff', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>
                + Add work
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: colors.navy, color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Equipment</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Work description</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: 130 }}>Function</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {sd.critical.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #eef1f5' }}>
                    <td style={{ padding: '5px 10px' }}>
                      <input value={r.equip} onChange={(e) => onCritField(si, i, 'equip', e.target.value)} style={{ width: '100%', border: '1px solid #f0f2f5', borderRadius: 5, padding: '5px 7px', fontWeight: 600 }} />
                    </td>
                    <td style={{ padding: '5px 10px' }}>
                      <input value={r.work} onChange={(e) => onCritField(si, i, 'work', e.target.value)} style={{ width: '100%', border: '1px solid #f0f2f5', borderRadius: 5, padding: '5px 7px' }} />
                    </td>
                    <td style={{ padding: '5px 10px' }}>
                      <select value={r.func} onChange={(e) => onCritField(si, i, 'func', e.target.value)} style={{ width: '100%', border: '1px solid #f0f2f5', borderRadius: 5, padding: '5px 7px' }}>
                        {FUNC_TYPES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                      <button onClick={() => delCrit(si, i)} style={{ border: 'none', background: 'none', color: '#c0392b', fontSize: 14 }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </EditGate>
  );
}
