import Editable from './Editable';
import CanvasLayer from './CanvasLayer';
import { colors } from '../../theme';
import { shutdownKpiIcon } from '../../utils/calc';
import type { ShutdownPerfItem } from '../../types/models';

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

export default function ShutdownPerformanceSlide({ item, itemIndex, total }: { item: ShutdownPerfItem; itemIndex: number; total: number }) {
  const headHtml = `${item.shutdownCode || 'Shutdown'} Performance${total > 1 ? ` (${itemIndex + 1}/${total})` : ''}`;

  return (
    <section style={{ background: '#fff', fontFamily: "'Archivo','Helvetica Neue',Arial,sans-serif", display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ height: 62, background: '#14365c', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 14, flex: 'none' }}>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 13, color: '#8fb2dd', fontWeight: 600 }}>04</span>
        <Editable ovKey={`s4b.head.${itemIndex}`} html={headHtml} style={{ fontSize: 25, fontWeight: 800, color: '#fff' }} />
        <div style={{ flex: 1 }} />
        <Logo />
      </div>
      <div style={{ flex: 1, padding: '22px 32px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, flex: 'none' }}>
          <thead>
            <tr style={{ background: '#1f76c8', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '9px 16px', fontWeight: 700, width: '26%' }}>KPI</th>
              <th style={{ padding: '9px 16px', fontWeight: 700, width: '15%' }}>Plan</th>
              <th style={{ padding: '9px 16px', fontWeight: 700, width: '15%' }}>Actual</th>
              <th style={{ padding: '9px 16px', fontWeight: 700 }}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {item.kpiRows.map((r, ri) => (
              <tr key={r.id} style={{ background: ri % 2 === 1 ? '#eef1f5' : '#fff', borderBottom: '1px solid #e2e7ee' }}>
                <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1d2733' }}>
                  <span style={{ marginRight: 8 }}>{shutdownKpiIcon(r.kpi)}</span>
                  {r.kpi}
                </td>
                <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1d2733' }}>{r.plan}</td>
                <td style={{ padding: '10px 16px', fontWeight: 800, color: colors.blue }}>{r.actual}</td>
                <td style={{ padding: '10px 16px', color: '#3a4654', fontSize: 12.5 }}>{r.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1d2733', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `3px solid ${colors.blue}`, paddingBottom: 6, marginBottom: 10, flex: 'none', display: 'inline-block', alignSelf: 'flex-start' }}>
            Highlight Activities
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {item.canvas.length > 0 ? (
              <CanvasLayer blocks={item.canvas} textColor="#3a4654" fontSize={13} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa6b3', fontSize: 13 }}>
                No highlight activities added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
