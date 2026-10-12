import { useStore } from '../../../store/StoreContext';
import { useTooltip } from '../../../store/TooltipContext';
import GroupedBarChart from '../../charts/GroupedBarChart';
import CostSavingTooltip from '../../CostSavingTooltip';
import { SlideFrame, Glass, Kpi, EffectiveHtml, ptLabel } from '../ui';
import { costSavingBreakdown, costTotals, fmt, nl2br, num } from '../../../utils/calc';
import { pt } from '../../../presentTheme';

export default function PresentCost() {
  const { store, year } = useStore();
  const { show: showTip, move: moveTip, hide: hideTip } = useTooltip();
  const m = year.maint;
  const ct = costTotals(year, store.activeMonth, store.activeYear);
  const csBreakdown = costSavingBreakdown(year);
  const dailyDiff = num(m.dailyYTD) - num(m.dailyPlan);
  const sdDiff = num(m.sdYTD) - num(m.sdPlan);
  const bpTotalPlan = m.byPlant.reduce((s, p) => s + num(p.plan), 0);
  const bpTotalAct = m.byPlant.reduce((s, p) => s + num(p.actual), 0);
  const bpTotalDiff = bpTotalAct - bpTotalPlan;

  return (
    <SlideFrame kicker="02 · Cost & Savings" title={<EffectiveHtml ovKey="s3.head" html="Maintenance Cost &amp; Savings" />}>
      <div className="pt-kpi-row" style={{ display: 'flex', gap: 'clamp(10px,1.4vw,16px)', flex: 'none' }}>
        <Kpi label="Daily MN cost · YTD" value={fmt(m.dailyYTD)} unit="MB" note={`Plan ${fmt(m.dailyPlan)} · ${dailyDiff <= 0 ? `${Math.abs(dailyDiff).toFixed(1)} under` : `+${dailyDiff.toFixed(1)} over`}`} accent={dailyDiff <= 0 ? pt.green : pt.danger} />
        <Kpi label="Shutdown cost · YTD" value={fmt(m.sdYTD)} unit="MB" note={`Plan ${fmt(m.sdPlan)} · ${sdDiff <= 0 ? `${Math.abs(sdDiff).toFixed(1)} under` : `+${sdDiff.toFixed(1)} over`}`} accent={sdDiff <= 0 ? pt.green : pt.danger} />
        <Kpi
          label="Release IL4 · Execute IL3"
          value={
            <>
              <span
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => showTip(<CostSavingTooltip title="Release (IL4)" projects={csBreakdown.il4} total={ct.il4} />, e.clientX, e.clientY)}
                onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
                onMouseLeave={hideTip}
              >
                {fmt(ct.il4, 2)}
              </span>
              {' / '}
              <span
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => showTip(<CostSavingTooltip title="Execute (IL3)" projects={csBreakdown.il3} total={ct.il3} />, e.clientX, e.clientY)}
                onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
                onMouseLeave={hideTip}
              >
                {fmt(ct.il3, 2)}
              </span>
            </>
          }
          unit="MB"
          note={`${ct.count} action plans`}
          accent={pt.blue}
        />
      </div>
      <div className="pt-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gridTemplateRows: 'minmax(0,1fr)', gap: 'clamp(12px,1.8vw,22px)', flex: 1, minHeight: 0, marginTop: 'clamp(10px,1.6vh,18px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ ...ptLabel, color: pt.text, marginBottom: 8 }}>Daily maintenance cost by plant · MB</div>
          <Glass style={{ padding: '10px 4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(14px,1.1vw,17px)' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: pt.textMuted, fontFamily: "'Roboto Mono',monospace", fontSize: 'clamp(11px,0.85vw,13px)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 14px' }}>Plant</th>
                  <th style={{ padding: '8px 14px', textAlign: 'right' }}>Plan</th>
                  <th style={{ padding: '8px 14px', textAlign: 'right' }}>Actual</th>
                  <th style={{ padding: '8px 14px', textAlign: 'right' }}>vs Plan</th>
                </tr>
              </thead>
              <tbody>
                {m.byPlant.map((p, i) => {
                  const diff = num(p.actual) - num(p.plan);
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${pt.glassBorder}` }}>
                      <td style={{ padding: '9px 14px', fontWeight: 700 }}>{p.plant}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace" }}>{fmt(p.plan, 1)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace" }}>{fmt(p.actual, 1)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 700, color: diff <= 0 ? pt.green : pt.danger }}>
                        {(diff >= 0 ? '+' : '') + diff.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: `1px solid ${pt.glassBorderStrong}` }}>
                  <td style={{ padding: '9px 14px', fontWeight: 800 }}>Total</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 700 }}>{bpTotalPlan.toFixed(1)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 700 }}>{bpTotalAct.toFixed(1)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: "'Roboto Mono',monospace", fontWeight: 800, color: bpTotalDiff <= 0 ? pt.green : pt.danger }}>
                    {(bpTotalDiff >= 0 ? '+' : '') + bpTotalDiff.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Glass>
          <div style={{ ...ptLabel, color: pt.text, margin: '14px 0 6px' }}>Major cost</div>
          <Glass style={{ padding: '14px 18px', flex: 1, minHeight: 0, overflow: 'auto' }}>
            <EffectiveHtml ovKey="s3.major" html={nl2br(m.majorHighlight)} style={{ fontSize: 'clamp(13px,1.05vw,16px)', lineHeight: 1.6, color: pt.textMuted }} />
          </Glass>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ ...ptLabel, color: pt.text, marginBottom: 8 }}>Shutdown cost — plan vs actual · MB</div>
          <Glass style={{ padding: '12px 16px 4px' }}>
            <GroupedBarChart rows={m.shutdownCost} />
          </Glass>
          <EffectiveHtml ovKey="s3.note" html={m.sdNote} style={{ fontSize: 'clamp(12.5px,1vw,15px)', color: pt.textFaint, fontStyle: 'italic', marginTop: 8 }} />
        </div>
      </div>
    </SlideFrame>
  );
}
