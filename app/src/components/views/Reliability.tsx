import { useStore } from '../../store/StoreContext';
import { useUI } from '../../store/UIContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import { blankRow } from '../editor/blankRow';
import { esdHoursAccum, fmt, monthOf, unplannedPct } from '../../utils/calc';
import type { ReliabilityEvent } from '../../types/models';

const PTA_TARGET = 54;

export default function Reliability() {
  const { store, year, setStore } = useStore();
  const { relTab, setRelTab, openEditor } = useUI();

  const cta = esdHoursAccum(year.cta);
  const pta = esdHoursAccum(year.pta);
  const ptaOver = pta > PTA_TARGET;
  const rows = relTab === 'cta' ? year.cta : year.pta;
  const unit = relTab === 'cta' ? 'CTA' : 'PTA';

  const openAdd = () => openEditor({ module: relTab, idx: -1, data: blankRow(relTab, store) });
  const openEdit = (i: number, e: ReliabilityEvent) => openEditor({ module: relTab, idx: i, data: JSON.parse(JSON.stringify(e)) });
  const deleteRow = (i: number) => {
    if (!window.confirm('Delete this record?')) return;
    setStore((s) => {
      s.years[String(s.activeYear)][relTab].splice(i, 1);
    });
  };

  const th: React.CSSProperties = { padding: '10px 14px', fontWeight: 600 };
  const statCard: React.CSSProperties = { background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, padding: '15px 17px' };
  const tabBtn = (active: boolean): React.CSSProperties => ({
    border: 'none', cursor: 'pointer', padding: '7px 16px', borderRadius: 7, fontWeight: 700, fontSize: 13,
    background: active ? colors.navy : 'transparent', color: active ? '#fff' : '#5a6878',
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        <div style={{ ...statCard, borderTop: `3px solid ${colors.blue}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>Unplanned downtime</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: colors.blue, marginTop: 4 }}>
            {unplannedPct(year.cta).toFixed(2)}
            <span style={{ fontSize: 16, color: '#9aa6b3' }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: colors.muted }}>CTA trouble + ESD · target &lt; 0.25%</div>
        </div>
        <div style={{ ...statCard, borderTop: `3px solid ${colors.blue}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>CTA ESD hours · accum</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: colors.blue, marginTop: 4 }}>
            {fmt(cta)}
            <span style={{ fontSize: 16, color: '#9aa6b3' }}> hr</span>
          </div>
          <div style={{ fontSize: 12, color: colors.muted }}>Target 65.7 h</div>
        </div>
        <div style={{ ...statCard, borderTop: `3px solid ${ptaOver ? colors.danger : colors.blue}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>PTA ESD hours · accum</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: ptaOver ? colors.danger : colors.blue, marginTop: 4 }}>
            {fmt(pta)}
            <span style={{ fontSize: 16, color: '#9aa6b3' }}> hr</span>
          </div>
          <div style={{ fontSize: 12, color: colors.muted }}>{ptaOver ? `Target <${PTA_TARGET} · over target` : `Target <${PTA_TARGET} h`}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 6 }}>
        <div style={{ display: 'flex', background: '#e6eaf0', borderRadius: 9, padding: 3 }}>
          <button onClick={() => setRelTab('cta')} style={tabBtn(relTab === 'cta')}>
            CTA shutdown
          </button>
          <button onClick={() => setRelTab('pta')} style={tabBtn(relTab === 'pta')}>
            PTA shutdown
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <EditGate>
          <button
            onClick={openAdd}
            style={{ height: 38, border: 'none', borderRadius: 8, padding: '0 17px', background: colors.navy, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>Add {unit} shutdown
          </button>
        </EditGate>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.navy, color: '#fff', textAlign: 'left' }}>
              <th style={{ ...th, width: 56 }}>Mth</th>
              <th style={{ ...th, width: 74 }}>Plant</th>
              <th style={th}>Topic</th>
              <th style={th}>Equipment</th>
              <th style={{ ...th, width: 104 }}>Effect</th>
              <th style={{ ...th, textAlign: 'right', width: 70 }}>SD hr</th>
              <th style={{ ...th, textAlign: 'right', width: 96 }}>CTA Vol loss (KT)</th>
              <th style={{ ...th, width: 120 }}>Root cause</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const detail = `${r.equipment} · ${r.plantEffect} · ${fmt(r.hours, 1)} h · ${r.rootCause}${r.mtQuality ? ' (' + r.mtQuality + ')' : ''}\n\n${r.execSummary || ''}`;
              return (
                <tr key={r.id} style={{ borderTop: '1px solid #eef1f5' }}>
                  <td style={{ padding: '10px 14px', fontFamily: fonts.mono, fontSize: 12, fontWeight: 600 }}>{r.month || monthOf(r.sdStart)}</td>
                  <td style={{ padding: '10px 14px' }}>{r.plant}</td>
                  <td title={detail} style={{ padding: '10px 14px', fontWeight: 600, color: '#27333f', cursor: 'help', borderBottom: '1px dotted #c2ccd7' }}>
                    {r.topic}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#5a6878' }}>{r.equipment}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: r.plantEffect === 'ESD' ? colors.danger : colors.blue }}>{r.plantEffect}</span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: fonts.mono, fontWeight: 600 }}>{fmt(r.hours, 1)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: fonts.mono, color: '#5a6878' }}>{fmt(r.ctaVolLoss, 3)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#5a6878' }}>{r.rootCause}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(i, r)} style={{ border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '4px 9px', fontSize: 12, marginRight: 4 }}>
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
        {rows.length === 0 && <div style={{ padding: 34, textAlign: 'center', color: '#8895a3', fontSize: 13 }}>No {unit} shutdown recorded this year.</div>}
      </div>
    </div>
  );
}
