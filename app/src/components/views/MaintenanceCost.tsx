import { useStore } from '../../store/StoreContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import GroupedBarChart from '../charts/GroupedBarChart';
import { num } from '../../utils/calc';

export default function MaintenanceCost() {
  const { year, setStore } = useStore();
  const m = year.maint;

  const onMaintField = (field: string, v: string) =>
    setStore((s) => {
      (s.years[String(s.activeYear)].maint as any)[field] = v;
    });
  const onMaintPlant = (i: number, field: 'plan' | 'actual', v: string) =>
    setStore((s) => {
      (s.years[String(s.activeYear)].maint.byPlant[i] as any)[field] = v;
    });
  const onMaintSD = (i: number, field: 'plan' | 'actual', v: string) =>
    setStore((s) => {
      (s.years[String(s.activeYear)].maint.shutdownCost[i] as any)[field] = v;
    });

  const dailyDiff = num(m.dailyYTD) - num(m.dailyPlan);
  const sdDiff = num(m.sdYTD) - num(m.sdPlan);
  const bpTotalPlan = m.byPlant.reduce((s, p) => s + num(p.plan), 0);
  const bpTotalAct = m.byPlant.reduce((s, p) => s + num(p.actual), 0);
  const bpTotalDiff = bpTotalAct - bpTotalPlan;

  const card: React.CSSProperties = { background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11 };
  const numInput: React.CSSProperties = { border: 'none', borderBottom: '2px solid #e2e7ee', padding: '2px 0' };
  const label: React.CSSProperties = { fontSize: 10, color: '#9aa6b3', textTransform: 'uppercase', fontFamily: fonts.mono };

  return (
    <EditGate>
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '16px 18px', borderTop: `3px solid ${colors.blue}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>Daily MN cost · YTD (MB)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <div>
              <div style={label}>Actual</div>
              <input
                type="number" step="0.1" value={m.dailyYTD} onChange={(e) => onMaintField('dailyYTD', e.target.value)}
                style={{ ...numInput, width: 108, fontSize: 26, fontWeight: 800, color: colors.blue }}
              />
            </div>
            <div>
              <div style={label}>Plan</div>
              <input
                type="number" step="0.1" value={m.dailyPlan} onChange={(e) => onMaintField('dailyPlan', e.target.value)}
                style={{ ...numInput, width: 90, fontSize: 20, fontWeight: 700, color: '#5a6878' }}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: dailyDiff <= 0 ? colors.green : colors.danger }}>
            {dailyDiff <= 0 ? `${Math.abs(dailyDiff).toFixed(1)} MB under plan` : `+${dailyDiff.toFixed(1)} MB over plan`}
          </div>
        </div>
        <div style={{ ...card, padding: '16px 18px', borderTop: `3px solid ${colors.blue}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>Shutdown cost · YTD (MB)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <div>
              <div style={label}>Actual</div>
              <input
                type="number" step="0.1" value={m.sdYTD} onChange={(e) => onMaintField('sdYTD', e.target.value)}
                style={{ ...numInput, width: 108, fontSize: 26, fontWeight: 800, color: colors.blue }}
              />
            </div>
            <div>
              <div style={label}>Plan</div>
              <input
                type="number" step="0.1" value={m.sdPlan} onChange={(e) => onMaintField('sdPlan', e.target.value)}
                style={{ ...numInput, width: 90, fontSize: 20, fontWeight: 700, color: '#5a6878' }}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: sdDiff <= 0 ? colors.green : colors.danger }}>
            {sdDiff <= 0 ? `${Math.abs(sdDiff).toFixed(1)} MB under plan` : `+${sdDiff.toFixed(1)} MB over plan`}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14 }}>
        <div style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Daily maintenance cost by plant · MB</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#7c8a99', fontFamily: fonts.mono, fontSize: 10, textTransform: 'uppercase' }}>
                <th style={{ padding: '6px 4px' }}>Plant</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Plan</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Actual</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>vs Plan</th>
              </tr>
            </thead>
            <tbody>
              {m.byPlant.map((p, i) => {
                const diff = num(p.actual) - num(p.plan);
                return (
                  <tr key={i} style={{ borderTop: '1px solid #eef1f5' }}>
                    <td style={{ padding: '7px 4px', fontWeight: 600 }}>{p.plant}</td>
                    <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                      <input type="number" step="0.1" value={p.plan} onChange={(e) => onMaintPlant(i, 'plan', e.target.value)} style={{ width: 62, textAlign: 'right', border: '1px solid #e6ebf0', borderRadius: 6, padding: '4px 6px', fontFamily: fonts.mono }} />
                    </td>
                    <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                      <input type="number" step="0.1" value={p.actual} onChange={(e) => onMaintPlant(i, 'actual', e.target.value)} style={{ width: 62, textAlign: 'right', border: '1px solid #e6ebf0', borderRadius: 6, padding: '4px 6px', fontFamily: fonts.mono }} />
                    </td>
                    <td style={{ padding: '7px 4px', textAlign: 'right', fontFamily: fonts.mono, fontWeight: 700, color: diff <= 0 ? colors.green : colors.danger }}>
                      {(diff >= 0 ? '+' : '') + diff.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid #dbe1e8', background: '#f5f8fb' }}>
                <td style={{ padding: '8px 4px', fontWeight: 800 }}>Total</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: fonts.mono, fontWeight: 700 }}>{bpTotalPlan.toFixed(1)}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: fonts.mono, fontWeight: 700 }}>{bpTotalAct.toFixed(1)}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: fonts.mono, fontWeight: 800, color: bpTotalDiff <= 0 ? colors.green : colors.danger }}>
                  {(bpTotalDiff >= 0 ? '+' : '') + bpTotalDiff.toFixed(1)} MB
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase', marginTop: 14 }}>Major highlight</div>
          <textarea
            value={m.majorHighlight} onChange={(e) => onMaintField('majorHighlight', e.target.value)} rows={7}
            style={{ width: '100%', border: '1px solid #cfd7e0', borderRadius: 8, padding: '9px 11px', marginTop: 5, resize: 'vertical', lineHeight: 1.55, fontSize: 12.5 }}
          />
        </div>

        <div style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Shutdown cost — plan vs actual · MB</div>
          <GroupedBarChart rows={m.shutdownCost} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
            {m.shutdownCost.map((r, i) => (
              <div key={i} style={{ border: '1px solid #eef1f5', borderRadius: 8, padding: '7px 9px' }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: '#46566a' }}>{r.event}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                  <input type="number" step="0.1" value={r.plan} onChange={(e) => onMaintSD(i, 'plan', e.target.value)} title="Plan" style={{ width: '100%', border: '1px solid #e6ebf0', borderRadius: 5, padding: '3px 5px', fontSize: 11, fontFamily: fonts.mono }} />
                  <input type="number" step="0.1" value={r.actual} onChange={(e) => onMaintSD(i, 'actual', e.target.value)} title="Actual" style={{ width: '100%', border: '1px solid #e6ebf0', borderRadius: 5, padding: '3px 5px', fontSize: 11, fontFamily: fonts.mono, color: colors.blue2 }} />
                </div>
              </div>
            ))}
          </div>
          <input
            value={m.sdNote} onChange={(e) => onMaintField('sdNote', e.target.value)} placeholder="Shutdown cost note…"
            style={{ width: '100%', border: 'none', borderTop: '1px solid #eef1f5', padding: '10px 2px 0', marginTop: 10, fontSize: 12, color: colors.muted, fontStyle: 'italic' }}
          />
        </div>
      </div>
    </div>
    </EditGate>
  );
}
