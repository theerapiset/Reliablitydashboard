import { useStore } from '../../../store/StoreContext';
import { useTooltip } from '../../../store/TooltipContext';
import BarLineChart from '../../charts/BarLineChart';
import { SlideFrame, Glass, Kpi, EffectiveHtml, ptLabel } from '../ui';
import { esc, ctaEsdHoursAccum, esdHoursAccum, fmt, monthOf, safetyRecordable, unplannedPct } from '../../../utils/calc';
import { RECORDABLE_CATEGORIES, type SafetyCategory } from '../../../types/models';
import { pt } from '../../../presentTheme';

const PTA_TARGET = 54;
const CTA_TARGET = 65.7;
const UNPLANNED_TARGET_PCT = 0.25;

function bullet(txt: string, red: boolean) {
  return `<div style="margin:0 0 6px;padding-left:14px;position:relative;${red ? `color:${pt.danger};font-weight:700;` : ''}"><span style="position:absolute;left:0;color:${red ? pt.danger : pt.textFaint}">▪</span>${txt}</div>`;
}

// Which case(s) a KPI tile's total is made of — hovering shows the underlying
// event/record list, matching the same hover behaviour on the Dashboard page.
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

export default function PresentSafetyReliability() {
  const { store, year } = useStore();
  const { show: showTip, move: moveTip, hide: hideTip } = useTooltip();
  const mo = store.activeMonth;
  const ctaEsdEvents = year.cta.filter((e) => e.plantEffect === 'ESD');
  const cta = ctaEsdHoursAccum(year.cta);
  const pta = esdHoursAccum(year.pta);
  const ptaOver = pta > PTA_TARGET;
  const ctaOver = cta > CTA_TARGET;
  const rec = safetyRecordable(year);
  const recordableOver = rec > 0;
  const unplannedPctVal = unplannedPct(year.cta);
  const unplannedOver = unplannedPctVal > UNPLANNED_TARGET_PCT;

  const recordableRows = (year.safety.log || [])
    .filter((l) => RECORDABLE_CATEGORIES.includes(l.type as SafetyCategory))
    .map((l) => ({ label: l.description || '(no description)', value: l.type }));
  const unplannedRows = ctaEsdEvents.map((e) => ({ label: e.topic || e.equipment, value: `${fmt(e.hours, 1)} h` }));
  const ctaRows = ctaEsdEvents.map((e) => ({ label: e.topic || e.equipment, value: `${fmt(e.hours, 1)} h` }));
  const ptaRows = year.pta.map((e) => ({ label: e.topic || e.equipment, value: `${fmt(e.hours, 1)} h` }));

  const ctaHTML = ctaEsdEvents.length
    ? ctaEsdEvents.map((e) => bullet(`${e.month || monthOf(e.sdStart)} — ${esc(e.topic)}, ${fmt(e.hours, 1)} h`, false)).join('')
    : `<div style="color:${pt.textFaint}">No CTA ESD event.</div>`;
  const ptaHTML = year.pta.length
    ? year.pta.map((e) => {
        const m = e.month || monthOf(e.sdStart);
        return bullet(`${m} : ${esc(e.topic)} ${fmt(e.hours, 1)} hrs.`, m === mo);
      }).join('')
    : `<div style="color:${pt.textFaint}">No PTA ESD event.</div>`;
  const recLine =
    rec === 0
      ? `<div style="color:${pt.green};font-weight:700;margin-bottom:5px">No recordable incident YTD — PSE T1/2 &amp; TRIR all clean.</div>`
      : `<div style="color:${pt.danger};font-weight:700;margin-bottom:5px">${rec} recordable incident(s) YTD</div>`;
  const safetyHTML = recLine + (year.safety.log || []).map((l) => bullet(`${esc(l.month || '')} — ${esc(l.description)}`, false)).join('');

  return (
    <SlideFrame kicker="01 · Safety & Reliability" title={<EffectiveHtml ovKey="s2.head" html="Safety &amp; Reliability" />}>
      <div className="pt-kpi-row" style={{ display: 'flex', gap: 'clamp(10px,1.4vw,16px)', flex: 'none' }}>
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="Recordable incidents" total={String(rec)} rows={recordableRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <Kpi label="Recordable incidents" value={rec} note="YTD · PSE T1/2 · TRIR" accent={recordableOver ? pt.danger : pt.green} />
        </div>
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="Unplanned downtime" total={`${unplannedPctVal.toFixed(2)}%`} rows={unplannedRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <Kpi
            label="Unplanned downtime"
            value={unplannedPctVal.toFixed(2)}
            unit="%"
            note={unplannedOver ? `Target <${UNPLANNED_TARGET_PCT}% · over target` : `Target < ${UNPLANNED_TARGET_PCT}%`}
            accent={unplannedOver ? pt.danger : pt.blue}
          />
        </div>
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="CTA ESD hours · accum" total={`${fmt(cta)} hr`} rows={ctaRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <Kpi label="CTA ESD hr · accum" value={fmt(cta)} note={ctaOver ? `Target ${CTA_TARGET} h · over target` : `Target ${CTA_TARGET} h`} accent={ctaOver ? pt.danger : pt.blue} />
        </div>
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onMouseEnter={(e) => showTip(<EventListTooltip title="PTA ESD hours · accum" total={`${fmt(pta)} hr`} rows={ptaRows} />, e.clientX, e.clientY)}
          onMouseMove={(e) => moveTip(e.clientX, e.clientY)}
          onMouseLeave={hideTip}
        >
          <Kpi
            label="PTA ESD hr · accum"
            value={fmt(pta)}
            note={ptaOver ? `Target <${PTA_TARGET} · over target` : `Target <${PTA_TARGET} h`}
            accent={ptaOver ? pt.danger : pt.blue}
          />
        </div>
      </div>
      <div className="pt-two-col" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gridTemplateRows: 'minmax(0,1fr)', gap: 'clamp(12px,1.8vw,22px)', flex: 1, minHeight: 0, marginTop: 'clamp(10px,1.6vh,18px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <div style={{ ...ptLabel, color: pt.text }}>CTA Shutdown hour</div>
          <Glass style={{ padding: '10px 14px 2px', flex: 1, minHeight: 0 }}>
            <BarLineChart entries={ctaEsdEvents} height={130} />
          </Glass>
          <div style={{ ...ptLabel, color: pt.text, marginTop: 2 }}>PTA Shutdown hour</div>
          <Glass style={{ padding: '10px 14px 2px', flex: 1, minHeight: 0 }}>
            <BarLineChart entries={year.pta} height={130} />
          </Glass>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <Glass style={{ padding: '14px 18px', flex: 1, minHeight: 0, overflow: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px,1.15vw,17px)', marginBottom: 7 }}>Safety case</div>
            <EffectiveHtml ovKey="s2.safety" html={safetyHTML} style={{ fontSize: 'clamp(13px,1.05vw,16px)', lineHeight: 1.55, color: pt.textMuted }} />
          </Glass>
          <Glass style={{ padding: '14px 18px', flex: 1, minHeight: 0, overflow: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px,1.15vw,17px)', marginBottom: 7 }}>CTA ESD case</div>
            <EffectiveHtml ovKey="s2.cta" html={ctaHTML} style={{ fontSize: 'clamp(13px,1.05vw,16px)', lineHeight: 1.55, color: pt.textMuted }} />
          </Glass>
          <Glass style={{ padding: '14px 18px', flex: 1, minHeight: 0, overflow: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px,1.15vw,17px)', marginBottom: 7 }}>PTA ESD case</div>
            <EffectiveHtml ovKey="s2.pta" html={ptaHTML} style={{ fontSize: 'clamp(13px,1.05vw,16px)', lineHeight: 1.55, color: pt.textMuted }} />
          </Glass>
        </div>
      </div>
    </SlideFrame>
  );
}
