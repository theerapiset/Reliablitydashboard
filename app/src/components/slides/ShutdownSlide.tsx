import Editable from './Editable';
import type { Shutdown } from '../../types/models';

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

export default function ShutdownSlide({ sd, si, total }: { sd: Shutdown; si: number; total: number }) {
  const headHtml = `Shutdown Activities — ${sd.name || 'SD ' + (si + 1)}${total > 1 ? ` (${si + 1}/${total})` : ''}`;

  return (
    <section style={{ background: '#fff', fontFamily: "'Archivo','Helvetica Neue',Arial,sans-serif", display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ height: 62, background: '#14365c', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 14, flex: 'none' }}>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 13, color: '#8fb2dd', fontWeight: 600 }}>03</span>
        <Editable ovKey={`s4.head.${si}`} html={headHtml} style={{ fontSize: 25, fontWeight: 800, color: '#fff' }} />
        <div style={{ flex: 1 }} />
        <Logo />
      </div>
      <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, flex: 'none' }}>
          <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Shutdown period</div>
            <div style={{ fontSize: 23, fontWeight: 800, color: '#1668c4', marginTop: 4 }}>
              {sd.start} → {sd.end}
            </div>
            <div style={{ fontSize: 12, color: '#6b7888', marginTop: 6 }}>{sd.days} days</div>
          </div>
          <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Contractors</div>
            <div style={{ fontSize: 23, fontWeight: 800, color: '#1d2733', marginTop: 4 }}>
              {sd.companies} <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7888' }}>cos</span> · {sd.workers} <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7888' }}>ppl</span>
            </div>
          </div>
          <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Budget · MB</div>
            <div style={{ fontSize: 23, fontWeight: 800, color: '#1668c4', marginTop: 4 }}>{sd.budgetTotal}</div>
            <div style={{ fontSize: 12, color: '#6b7888', marginTop: 6 }}>
              {sd.budgetMaint} maint · {sd.budgetOper} oper
            </div>
          </div>
          <div style={{ border: '1px solid #e2e7ee', borderRadius: 9, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9.5, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Total works</div>
            <div style={{ fontSize: 23, fontWeight: 800, color: '#1d2733', marginTop: 4 }}>{sd.totalWorks}</div>
            <div style={{ fontSize: 12, color: '#6b7888', marginTop: 6 }}>
              <span style={{ color: '#1668c4' }}>PM {sd.pm}</span> · <span style={{ color: '#d98036' }}>CBM {sd.cbm}</span> · MOC {sd.moc}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: '#33485e', marginBottom: 7 }}>Critical works</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#14365c', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '8px 14px', fontWeight: 600 }}>Equipment</th>
                <th style={{ padding: '8px 14px', fontWeight: 600 }}>Work description</th>
                <th style={{ padding: '8px 14px', fontWeight: 600, width: 150 }}>Function</th>
              </tr>
            </thead>
            <tbody>
              {sd.critical.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eef1f5' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#1668c4' }}>{r.equip}</td>
                  <td style={{ padding: '8px 14px', color: '#27333f' }}>{r.work}</td>
                  <td style={{ padding: '8px 14px', color: '#5a6878' }}>{r.func}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
