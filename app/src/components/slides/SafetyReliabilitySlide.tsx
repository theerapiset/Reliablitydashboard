import { useStore } from '../../store/StoreContext';
import Editable from './Editable';
import BarLineChart from '../charts/BarLineChart';
import { esc, ctaEsdHoursAccum, esdHoursAccum, fmt, monthOf, safetyRecordable, unplannedPct } from '../../utils/calc';

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

function bullet(txt: string, red: boolean) {
  return `<div style="margin:0 0 5px;padding-left:14px;position:relative;${red ? 'color:#cf2e2e;font-weight:700;' : ''}"><span style="position:absolute;left:0;color:${red ? '#cf2e2e' : '#5a6878'}">▪</span>${txt}</div>`;
}

const PTA_TARGET = 54;

export default function SafetyReliabilitySlide() {
  const { store, year } = useStore();
  const ctaEsdEvents = year.cta.filter((e) => e.plantEffect === 'ESD');
  const cta = ctaEsdHoursAccum(year.cta);
  const pta = esdHoursAccum(year.pta);
  const ptaOver = pta > PTA_TARGET;
  const mo = store.activeMonth;

  const ctaHTML = ctaEsdEvents.length
    ? ctaEsdEvents.map((e) => bullet(`${e.month || monthOf(e.sdStart)} — ${esc(e.topic)}, ${fmt(e.hours, 1)} h`, false)).join('')
    : '<div style="color:#8895a3">No CTA ESD event.</div>';
  const ptaHTML = year.pta.length
    ? year.pta
        .map((e) => {
          const m = e.month || monthOf(e.sdStart);
          return bullet(`${m} : ${esc(e.topic)} ${fmt(e.hours, 1)} hrs.`, m === mo);
        })
        .join('')
    : '<div style="color:#8895a3">No PTA ESD event.</div>';
  const rec = safetyRecordable(year);
  const recLine =
    rec === 0
      ? '<div style="color:#15662f;font-weight:600;margin-bottom:4px">No recordable incident YTD — PSE T1/2 &amp; TRIR all clean.</div>'
      : `<div style="color:#cf2e2e;font-weight:700;margin-bottom:4px">${rec} recordable incident(s) YTD</div>`;
  const safetyHTML = recLine + (year.safety.log || []).map((l) => bullet(`${esc(l.month || '')} — ${esc(l.description)}`, false)).join('');

  const kpiCard = (label: string, value: string, unit: string, note: string, color: string) => (
    <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '13px 15px' }}>
      <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1.1 }}>
        {value}
        <span style={{ fontSize: 16, color: '#9aa6b3' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11.5, color: '#6b7888' }}>{note}</div>
    </div>
  );

  return (
    <section style={{ background: '#fff', fontFamily: "'Archivo','Helvetica Neue',Arial,sans-serif", display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ height: 62, background: '#15662f', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 14, flex: 'none' }}>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 13, color: '#8fd5a8', fontWeight: 600 }}>01</span>
        <Editable ovKey="s2.head" html="Safety &amp; Reliability" style={{ fontSize: 25, fontWeight: 800, color: '#fff' }} />
        <div style={{ flex: 1 }} />
        <Logo />
      </div>
      <div style={{ flex: 1, padding: '22px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, flex: 'none' }}>
          {kpiCard('Recordable incidents', String(rec), '', 'YTD · PSE T1/2 · TRIR', '#15662f')}
          {kpiCard('Unplanned downtime', unplannedPct(year.cta).toFixed(2), '%', 'Target < 0.25%', '#1668c4')}
          {kpiCard('CTA ESD hr · accum', fmt(cta), '', 'Target 65.7 h', '#1668c4')}
          {kpiCard('PTA ESD hr · accum', fmt(pta), '', ptaOver ? `Target <${PTA_TARGET} · over target` : `Target <${PTA_TARGET} h`, ptaOver ? '#cf2e2e' : '#1668c4')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: '#33485e' }}>CTA Shutdown hour</div>
            <BarLineChart entries={ctaEsdEvents} height={140} />
            <div style={{ fontWeight: 700, fontSize: 12.5, color: '#33485e', marginTop: 4 }}>PTA Shutdown hour</div>
            <BarLineChart entries={year.pta} height={140} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#eef3f8', borderRadius: 9, padding: '12px 15px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, color: '#1d2733' }}>Safety case</div>
              <Editable ovKey="s2.safety" html={safetyHTML} style={{ fontSize: 13, lineHeight: 1.5, color: '#3a4654' }} />
            </div>
            <div style={{ background: '#eef3f8', borderRadius: 9, padding: '12px 15px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, color: '#1d2733' }}>CTA ESD case</div>
              <Editable ovKey="s2.cta" html={ctaHTML} style={{ fontSize: 13, lineHeight: 1.5, color: '#3a4654' }} />
            </div>
            <div style={{ background: '#eef3f8', borderRadius: 9, padding: '12px 15px', flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, color: '#1d2733' }}>PTA ESD case</div>
              <Editable ovKey="s2.pta" html={ptaHTML} style={{ fontSize: 13, lineHeight: 1.5, color: '#3a4654' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
