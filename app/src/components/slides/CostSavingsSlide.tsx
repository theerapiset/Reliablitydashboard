import { useStore } from '../../store/StoreContext';
import Editable from './Editable';
import GroupedBarChart from '../charts/GroupedBarChart';
import { costTotals, fmt, nl2br, num } from '../../utils/calc';

const Logo = () => (
  <div
    style={{
      width: 34, height: 34, border: '2px solid #fff', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Archivo Narrow',sans-serif", fontWeight: 700, fontSize: 10, lineHeight: 0.9, color: '#fff', transform: 'skewX(-7deg)',
    }}
  >
    <span style={{ transform: 'skewX(7deg)' }}>
      GCM
      <br />
      PTA
    </span>
  </div>
);

export default function CostSavingsSlide() {
  const { store, year } = useStore();
  const m = year.maint;
  const ct = costTotals(year, store.activeMonth, store.activeYear);
  const dailyDiff = num(m.dailyYTD) - num(m.dailyPlan);
  const sdDiff = num(m.sdYTD) - num(m.sdPlan);
  const bpTotalPlan = m.byPlant.reduce((s, p) => s + num(p.plan), 0);
  const bpTotalAct = m.byPlant.reduce((s, p) => s + num(p.actual), 0);
  const bpTotalDiff = bpTotalAct - bpTotalPlan;

  return (
    <section style={{ background: '#fff', fontFamily: "'Archivo','Helvetica Neue',Arial,sans-serif", display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ height: 62, background: '#14365c', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 14, flex: 'none' }}>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 13, color: '#8fb2dd', fontWeight: 600 }}>02</span>
        <Editable ovKey="s3.head" html="Maintenance Cost &amp; Savings" style={{ fontSize: 25, fontWeight: 800, color: '#fff' }} />
        <div style={{ flex: 1 }} />
        <Logo />
      </div>
      <div style={{ flex: 1, padding: '22px 32px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 14, flex: 'none' }}>
          <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '13px 15px' }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Daily MN cost · YTD</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#1668c4', lineHeight: 1.1 }}>
              {fmt(m.dailyYTD)}
              <span style={{ fontSize: 15, color: '#9aa6b3' }}> MB</span>
            </div>
            <div style={{ fontSize: 11.5, color: dailyDiff <= 0 ? '#15662f' : '#cf2e2e' }}>
              Plan {fmt(m.dailyPlan)} · {dailyDiff <= 0 ? `${Math.abs(dailyDiff).toFixed(1)} MB under` : `+${dailyDiff.toFixed(1)} MB over`}
            </div>
          </div>
          <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '13px 15px' }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Shutdown cost · YTD</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#1668c4', lineHeight: 1.1 }}>
              {fmt(m.sdYTD)}
              <span style={{ fontSize: 15, color: '#9aa6b3' }}> MB</span>
            </div>
            <div style={{ fontSize: 11.5, color: sdDiff <= 0 ? '#15662f' : '#cf2e2e' }}>
              Plan {fmt(m.sdPlan)} · {sdDiff <= 0 ? `${Math.abs(sdDiff).toFixed(1)} MB under` : `+${sdDiff.toFixed(1)} MB over`}
            </div>
          </div>
          <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '13px 15px' }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Cost-saving pipeline</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 3 }}>
              <div>
                <span style={{ fontSize: 12, color: '#15662f', fontWeight: 700 }}>Release IL4</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#15662f' }}>
                  {fmt(ct.il4, 2)}
                  <span style={{ fontSize: 12, color: '#9aa6b3' }}> MB</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#1668c4', fontWeight: 700 }}>Execute IL3</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1668c4' }}>
                  {fmt(ct.il3, 2)}
                  <span style={{ fontSize: 12, color: '#9aa6b3' }}> MB</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#6b7888', marginTop: 2 }}>{ct.count} action plans</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 18, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: '#33485e', marginBottom: 7 }}>Daily maintenance cost by plant · MB</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#14365c', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '7px 12px', fontWeight: 600 }}>Plant</th>
                  <th style={{ padding: '7px 12px', fontWeight: 600, textAlign: 'right' }}>Plan</th>
                  <th style={{ padding: '7px 12px', fontWeight: 600, textAlign: 'right' }}>Actual</th>
                  <th style={{ padding: '7px 12px', fontWeight: 600, textAlign: 'right' }}>vs Plan</th>
                </tr>
              </thead>
              <tbody>
                {m.byPlant.map((p, i) => {
                  const diff = num(p.actual) - num(p.plan);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #eef1f5' }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{p.plant}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace" }}>{fmt(p.plan, 1)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace" }}>{fmt(p.actual, 1)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 700, color: diff <= 0 ? '#15662f' : '#cf2e2e' }}>
                        {(diff >= 0 ? '+' : '') + diff.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f5f8fb' }}>
                  <td style={{ padding: '7px 12px', fontWeight: 800 }}>Total</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 700 }}>{bpTotalPlan.toFixed(1)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 700 }}>{bpTotalAct.toFixed(1)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 800, color: bpTotalDiff <= 0 ? '#15662f' : '#cf2e2e' }}>
                    {(bpTotalDiff >= 0 ? '+' : '') + bpTotalDiff.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase', margin: '12px 0 4px' }}>Major cost</div>
            <Editable ovKey="s3.major" html={nl2br(m.majorHighlight)} style={{ fontSize: 12.5, lineHeight: 1.55, color: '#3a4654' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: '#33485e', marginBottom: 4 }}>Shutdown cost — plan vs actual · MB</div>
            <GroupedBarChart rows={m.shutdownCost} />
            <div style={{ marginTop: 6 }}>
              <Editable ovKey="s3.note" html={m.sdNote} style={{ fontSize: 12, color: '#6b7888', fontStyle: 'italic' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
