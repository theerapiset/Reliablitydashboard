import { useStore } from '../../store/StoreContext';
import { useUI } from '../../store/UIContext';
import { useTooltip } from '../../store/TooltipContext';
import StatCard from '../ui/StatCard';
import BarLineChart from '../charts/BarLineChart';
import CostSavingTooltip from '../CostSavingTooltip';
import { colors, fonts } from '../../theme';
import { RECORDABLE_CATEGORIES, type SafetyCategory } from '../../types/models';
import {
  costSavingBreakdown,
  costTotals,
  ctaEsdHoursAccum,
  esdHoursAccum,
  fmt,
  impactColor,
  monthOf,
  num,
  safetyRecordable,
  unplannedPct,
} from '../../utils/calc';

const PTA_TARGET = 54;
const CTA_TARGET = 65.7;
const UNPLANNED_TARGET_PCT = 0.25;

interface ProdLossCase {
  label: string;
  hours: number;
}

function ProdLossTooltip({ plant, cases, total }: { plant: string; cases: ProdLossCase[]; total: number }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {plant} — {total.toFixed(3)} KT
      </div>
      {cases.length ? (
        cases.map((c, i) => (
          <div key={i} style={{ fontSize: 11.5, color: '#d6e0ec', margin: '2px 0' }}>
            • {c.label} <span style={{ color: '#fff', fontWeight: 700 }}>{c.hours.toFixed(3)}</span>
          </div>
        ))
      ) : (
        <div style={{ fontSize: 11.5, color: '#9fb6cf' }}>No event detail recorded.</div>
      )}
    </div>
  );
}

// Which case(s) a stat-card total is made of — hovering "Recordable incidents",
// "Unplanned downtime", "CTA/PTA ESD hours" shows the underlying event list.
function EventListTooltip({ title, total, rows }: { title: string; total: string; rows: { label: string; value: string }[] }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {title} — {total}
      </div>
      {rows.length ? (
        rows.map((r, i) => (
          <div key={i} style={{ fontSize: 11.5, color: '#d6e0ec', margin: '2px 0' }}>
            • {r.label} {r.value && <span style={{ color: '#fff', fontWeight: 700 }}>({r.value})</span>}
          </div>
        ))
      ) : (
        <div style={{ fontSize: 11.5, color: '#9fb6cf' }}>No event recorded.</div>
      )}
    </div>
  );
}

// Full Executive summary / Description behind a yearly-log row — the row
// itself truncates with an ellipsis, so hover reveals the rest.
function LogDetailTooltip({ heading, text }: { heading: string; text: string }) {
  return (
    <div style={{ maxWidth: 300 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{heading}</div>
      <div style={{ fontSize: 11.5, color: '#d6e0ec', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{text || 'No detail recorded.'}</div>
    </div>
  );
}

export default function Dashboard() {
  const { store, year } = useStore();
  const { setView, setRelTab, openEditor } = useUI();
  const { show: showTip, move: moveTip, hide: hideTip } = useTooltip();

  const ctaEsdEvents = year.cta.filter((e) => e.plantEffect === 'ESD');
  const cta = ctaEsdHoursAccum(year.cta);
  const pta = esdHoursAccum(year.pta);
  const ptaOver = pta > PTA_TARGET;
  const ctaOver = cta > CTA_TARGET;
  const recordableCount = safetyRecordable(year);
  const recordableOver = recordableCount > 0;
  const unplannedPctVal = unplannedPct(year.cta);
  const unplannedOver = unplannedPctVal > UNPLANNED_TARGET_PCT;
  const ct = costTotals(year, store.activeMonth, store.activeYear);
  const csBreakdown = costSavingBreakdown(year);
  const m = year.maint;
  const dailyDiff = num(m.dailyYTD) - num(m.dailyPlan);
  const sdDiff = num(m.sdYTD) - num(m.sdPlan);

  const recordableRows = (year.safety.log || [])
    .filter((l) => RECORDABLE_CATEGORIES.includes(l.type as SafetyCategory))
    .map((l) => ({ label: l.description || '(no description)', value: l.type }));
  const unplannedRows = ctaEsdEvents.map((e) => ({ label: e.topic || e.equipment, value: `${fmt(e.hours, 1)} h` }));
  const ctaHourRows = ctaEsdEvents.map((e) => ({ label: e.topic || e.equipment, value: `${fmt(e.hours, 1)} h` }));
  const ptaHourRows = year.pta.map((e) => ({ label: e.topic || e.equipment, value: `${fmt(e.hours, 1)} h` }));

  const pl = { p1: 0, p2: 0, p3: 0 };
  const plCases: Record<'p1' | 'p2' | 'p3', ProdLossCase[]> = { p1: [], p2: [], p3: [] };
  [...year.cta, ...year.pta].forEach((e) => {
    const k = e.plant === 'Plant 2' ? 'p2' : e.plant === 'Plant 3' ? 'p3' : 'p1';
    const v = num(e.ctaVolLoss);
    pl[k] += v;
    if (v) plCases[k].push({ label: e.topic || e.equipment, hours: v });
  });
  const plTotal = pl.p1 + pl.p2 + pl.p3;
  const mx = Math.max(pl.p1, pl.p2, pl.p3, 0.0001);

  interface LogRow {
    date: string;
    dateLabel: string;
    module: 'cta' | 'pta' | 'safetylog';
    idx: number;
    title: string;
    sub: string;
    impact: string;
    color: string;
    detailHeading: string;
    detail: string;
  }
  const yl: LogRow[] = [];
  year.cta.forEach((e, i) =>
    yl.push({
      date: e.sdStart || '', dateLabel: `${e.month || monthOf(e.sdStart)} ${store.activeYear}`, module: 'cta', idx: i,
      title: e.topic, sub: `${e.equipment} · ${e.plant} · ${fmt(e.hours, 1)} h`, impact: e.plantEffect, color: impactColor(e.plantEffect),
      detailHeading: 'Executive summary', detail: e.execSummary,
    })
  );
  year.pta.forEach((e, i) =>
    yl.push({
      date: e.sdStart || '', dateLabel: `${e.month || monthOf(e.sdStart)} ${store.activeYear}`, module: 'pta', idx: i,
      title: e.topic, sub: `${e.equipment} · ${e.plant} · ${fmt(e.hours, 1)} h`, impact: e.plantEffect, color: impactColor(e.plantEffect),
      detailHeading: 'Executive summary', detail: e.execSummary,
    })
  );
  year.safety.log.forEach((l, i) =>
    yl.push({
      date: l.date || '', dateLabel: `${l.month || ''} ${store.activeYear}`, module: 'safetylog', idx: i,
      title: l.description, sub: 'Safety event', impact: 'Safety',
      color: RECORDABLE_CATEGORIES.includes(l.type as SafetyCategory) ? colors.amber2 : colors.green,
      detailHeading: 'Description', detail: l.description,
    })
  );
  yl.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const openLogDetail = (row: LogRow) => {
    if (row.module === 'cta' || row.module === 'pta') {
      setRelTab(row.module);
      setView('reliability');
      const data = year[row.module][row.idx];
      if (data) openEditor({ module: row.module, idx: row.idx, data: JSON.parse(JSON.stringify(data)) });
    } else {
      setView('safety');
    }
  };

  const card: React.CSSProperties = { background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 11 };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <div
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="Recordable incidents" total={String(recordableCount)} rows={recordableRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <StatCard
            label="Recordable incidents"
            value={recordableCount}
            accent={recordableOver ? colors.danger : colors.green}
            note={recordableOver ? 'Target 0 · recordable incident' : 'YTD · PSE T1/2 · TRIR'}
            bg={recordableOver ? colors.dangerBg : colors.greenBg}
          />
        </div>
        <div
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="Unplanned downtime" total={`${unplannedPctVal.toFixed(2)}%`} rows={unplannedRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <StatCard
            label="Unplanned downtime"
            value={unplannedPctVal.toFixed(2)}
            unit="%"
            accent={unplannedOver ? colors.danger : colors.blue}
            note={unplannedOver ? `Target <${UNPLANNED_TARGET_PCT}% · over target` : `Target <${UNPLANNED_TARGET_PCT}% · CTA ESD`}
            bg={unplannedOver ? colors.dangerBg : colors.blueBg}
          />
        </div>
        <div
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="CTA ESD hours · accum" total={`${fmt(cta)} hr`} rows={ctaHourRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <StatCard
            label="CTA ESD hours · accum"
            value={fmt(cta)}
            unit="hr"
            accent={ctaOver ? colors.danger : colors.blue}
            note={ctaOver ? `Target ${CTA_TARGET} h · over target` : `Target ${CTA_TARGET} h`}
            bg={ctaOver ? colors.dangerBg : colors.blueBg}
          />
        </div>
        <div
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="PTA ESD hours · accum" total={`${fmt(pta)} hr`} rows={ptaHourRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <StatCard
            label="PTA ESD hours · accum"
            value={fmt(pta)}
            unit="hr"
            accent={ptaOver ? colors.danger : colors.blue}
            note={ptaOver ? `Target <${PTA_TARGET} · over target` : `Target <${PTA_TARGET} h`}
            bg={ptaOver ? colors.dangerBg : colors.grayBg}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ ...card, background: colors.blueBg, padding: '16px 18px 10px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>CTA Shutdown hour</div>
          <BarLineChart entries={ctaEsdEvents} />
        </div>
        <div style={{ ...card, background: colors.grayBg, padding: '16px 18px 10px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>PTA Shutdown hour</div>
          <BarLineChart entries={year.pta} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Maintenance cost · YTD</div>
          <div style={{ display: 'flex', gap: 22 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Daily MN</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: colors.blue }}>
                {fmt(m.dailyYTD)}
                <span style={{ fontSize: 14, color: '#9aa6b3' }}> MB</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 1, color: dailyDiff <= 0 ? colors.green : colors.danger }}>
                Plan {fmt(m.dailyPlan)} · {dailyDiff <= 0 ? `${Math.abs(dailyDiff).toFixed(1)} MB under` : `+${dailyDiff.toFixed(1)} MB over`}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Shutdown</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: colors.blue }}>
                {fmt(m.sdYTD)}
                <span style={{ fontSize: 14, color: '#9aa6b3' }}> MB</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 1, color: sdDiff <= 0 ? colors.green : colors.danger }}>
                Plan {fmt(m.sdPlan)} · {sdDiff <= 0 ? `${Math.abs(sdDiff).toFixed(1)} MB under` : `+${sdDiff.toFixed(1)} MB over`}
              </div>
            </div>
          </div>
        </div>
        <div style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Cost saving · {store.activeYear}</div>
          <div
            style={{ display: 'flex', alignItems: 'baseline', gap: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => showTip(<CostSavingTooltip title="Release (IL4)" projects={csBreakdown.il4} total={ct.il4} />, e.clientX, e.clientY)}
            onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
            onMouseLeave={hideTip}
          >
            <span style={{ fontSize: 13, color: colors.green, fontWeight: 700 }}>Release (IL4)</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: colors.green }}>{fmt(ct.il4, 2)}</span>
            <span style={{ fontSize: 12, color: '#9aa6b3' }}>MB</span>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, cursor: 'pointer' }}
            onMouseEnter={(e) => showTip(<CostSavingTooltip title="Execute (IL3)" projects={csBreakdown.il3} total={ct.il3} />, e.clientX, e.clientY)}
            onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
            onMouseLeave={hideTip}
          >
            <span style={{ fontSize: 13, color: colors.blue, fontWeight: 700 }}>Execute (IL3)</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: colors.blue }}>{fmt(ct.il3, 2)}</span>
            <span style={{ fontSize: 12, color: '#9aa6b3' }}>MB</span>
          </div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
            {ct.count} action plans
            {ct.overdue > 0 && (
              <>
                {' '}
                · <span style={{ color: colors.danger, fontWeight: 700 }}>{ct.overdue} overdue SIL4</span>
              </>
            )}
          </div>
        </div>
        <div style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Production vol loss · KT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([['Plant 1', pl.p1, '#2f6fd0', 'p1'], ['Plant 2', pl.p2, '#e08a37', 'p2'], ['Plant 3', pl.p3, colors.plant3Chart, 'p3']] as [string, number, string, 'p1' | 'p2' | 'p3'][]).map(
              ([label, val, color, key]) => (
                <div
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(<ProdLossTooltip plant={label} cases={plCases[key]} total={val} />, e.clientX, e.clientY)}
                  onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
                  onMouseLeave={hideTip}
                >
                  <span style={{ width: 52, fontSize: 12, color: '#5a6878', fontWeight: 600 }}>{label}</span>
                  <div style={{ flex: 1, height: 8, background: colors.appBg, borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(val / mx) * 100}%`, background: color }} />
                  </div>
                  <span style={{ width: 48, textAlign: 'right', fontFamily: fonts.mono, fontWeight: 700, color }}>{fmt(val, 3)}</span>
                </div>
              )
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${colors.appBg}`, paddingTop: 8 }}>
              <span style={{ width: 52, fontSize: 12, color: colors.ink, fontWeight: 800 }}>Total</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 16 }}>
                {fmt(plTotal, 3)} <span style={{ fontSize: 11, color: '#9aa6b3' }}>KT</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: '16px 18px', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>Yearly log · {store.activeYear}</div>
          <div style={{ fontSize: 11.5, color: '#9aa6b3' }}>{yl.length} events · click a row for detail</div>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {yl.map((e, i) => (
            <div
              key={i}
              onClick={() => openLogDetail(e)}
              onMouseEnter={(ev) => showTip(<LogDetailTooltip heading={e.detailHeading} text={e.detail} />, ev.clientX, ev.clientY)}
              onMouseMove={(ev) => moveTip(ev.clientX, ev.clientY)}
              onMouseLeave={hideTip}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 6px', borderTop: '1px solid #f0f2f5', cursor: 'pointer' }}
            >
              <span style={{ width: 70, flex: 'none', fontFamily: fonts.mono, fontSize: 11, color: '#7c8a99' }}>{e.dateLabel}</span>
              <span style={{ width: 96, flex: 'none' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', background: e.color, padding: '2px 9px', borderRadius: 5, whiteSpace: 'nowrap' }}>
                  {e.impact}
                </span>
              </span>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13, color: '#27333f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.title}
              </span>
              <span style={{ flex: 'none', fontSize: 11.5, color: '#8895a3', whiteSpace: 'nowrap' }}>{e.sub}</span>
              <span style={{ flex: 'none', color: '#c2ccd7', fontSize: 14 }}>›</span>
            </div>
          ))}
          {yl.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#8895a3', fontSize: 13 }}>No events logged this year yet.</div>}
        </div>
      </div>
    </div>
  );
}
