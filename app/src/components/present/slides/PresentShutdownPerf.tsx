import { SlideFrame, Glass, EffectiveHtml, ptLabel } from '../ui';
import CanvasLayer from '../../slides/CanvasLayer';
import { pt } from '../../../presentTheme';
import { shutdownKpiIcon } from '../../../utils/calc';
import type { ShutdownPerfItem } from '../../../types/models';

export default function PresentShutdownPerf({ item, itemIndex, total }: { item: ShutdownPerfItem; itemIndex: number; total: number }) {
  const headFallback = `${item.shutdownCode || 'Shutdown'} Performance${total > 1 ? ` (${itemIndex + 1}/${total})` : ''}`;

  return (
    <SlideFrame kicker="04 · Shutdown Performance" title={<EffectiveHtml ovKey={`s4b.head.${itemIndex}`} html={headFallback} />}>
      <Glass style={{ flex: 'none', overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(14px,1.15vw,17.5px)' }}>
          <thead>
            <tr style={{ background: pt.blue, color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '10px 18px', fontWeight: 700, width: '26%' }}>KPI</th>
              <th style={{ padding: '10px 18px', fontWeight: 700, width: '15%' }}>Plan</th>
              <th style={{ padding: '10px 18px', fontWeight: 700, width: '15%' }}>Actual</th>
              <th style={{ padding: '10px 18px', fontWeight: 700 }}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {item.kpiRows.map((r, ri) => (
              <tr key={r.id} style={{ background: ri % 2 === 1 ? pt.bg1 : pt.glass, borderTop: `1px solid ${pt.glassBorder}` }}>
                <td style={{ padding: '11px 18px', fontWeight: 700, color: pt.text }}>
                  <span style={{ marginRight: 8 }}>{shutdownKpiIcon(r.kpi)}</span>
                  {r.kpi}
                </td>
                <td style={{ padding: '11px 18px', fontWeight: 700, color: pt.text }}>{r.plan}</td>
                <td style={{ padding: '11px 18px', fontWeight: 800, color: pt.blue }}>{r.actual}</td>
                <td style={{ padding: '11px 18px', color: pt.textMuted, fontSize: '0.85em' }}>{r.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginTop: 'clamp(10px,1.6vh,18px)' }}>
        <div style={{ ...ptLabel, color: pt.text, marginBottom: 8 }}>Highlight Activities</div>
        <Glass style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {item.canvas.length > 0 ? (
            <CanvasLayer blocks={item.canvas} textColor={pt.textMuted} fontSize="clamp(13px,1.05vw,16px)" />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pt.textFaint, fontSize: 'clamp(14px,1.15vw,17px)' }}>
              No highlight activities added yet.
            </div>
          )}
        </Glass>
      </div>
    </SlideFrame>
  );
}
