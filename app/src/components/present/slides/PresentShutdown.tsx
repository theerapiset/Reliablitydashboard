import { SlideFrame, Glass, Kpi, EffectiveHtml, ptLabel } from '../ui';
import { pt } from '../../../presentTheme';
import type { Shutdown } from '../../../types/models';

export default function PresentShutdown({ sd, si, total }: { sd: Shutdown; si: number; total: number }) {
  const headFallback = `Shutdown Activities — ${sd.name || 'SD ' + (si + 1)}${total > 1 ? ` (${si + 1}/${total})` : ''}`;

  return (
    <SlideFrame kicker="03 · Shutdown Activities" title={<EffectiveHtml ovKey={`s4.head.${si}`} html={headFallback} />}>
      <div className="pt-kpi-row" style={{ display: 'flex', gap: 'clamp(10px,1.4vw,16px)', flex: 'none' }}>
        <Kpi label="Shutdown period" value={`${sd.start} → ${sd.end}`} note={`${sd.days} days`} accent={pt.blue} />
        <Kpi label="Contractors" value={`${sd.companies} · ${sd.workers}`} note="companies · workers" accent={pt.blue} />
        <Kpi label="Budget · MB" value={sd.budgetTotal} note={`${sd.budgetMaint} maint · ${sd.budgetOper} oper`} accent={pt.blue} />
        <Kpi label="Total works" value={sd.totalWorks} note={`PM ${sd.pm} · CBM ${sd.cbm} · MOC ${sd.moc}`} accent={pt.blue} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginTop: 'clamp(10px,1.6vh,18px)' }}>
        <div style={{ ...ptLabel, color: pt.text, marginBottom: 8 }}>Critical works</div>
        <Glass style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(14px,1.15vw,17.5px)' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: pt.textMuted, fontFamily: "'Roboto Mono',monospace", fontSize: 'clamp(11px,0.85vw,13px)', textTransform: 'uppercase', position: 'sticky', top: 0, background: pt.glass }}>
                <th style={{ padding: '11px 16px' }}>Equipment</th>
                <th style={{ padding: '11px 16px' }}>Work description</th>
                <th style={{ padding: '11px 16px', width: '18%' }}>Function</th>
              </tr>
            </thead>
            <tbody>
              {sd.critical.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${pt.glassBorder}` }}>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: pt.blue }}>{r.equip}</td>
                  <td style={{ padding: '11px 16px', color: pt.text }}>{r.work}</td>
                  <td style={{ padding: '11px 16px', color: pt.textMuted }}>{r.func}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Glass>
      </div>
    </SlideFrame>
  );
}
