import { useStore } from '../../../store/StoreContext';
import { EffectiveHtml } from '../ui';
import { esc } from '../../../utils/calc';
import { pt, ptFont, ptMono } from '../../../presentTheme';

const Logo = () => (
  <div
    style={{
      width: 46, height: 46, border: `2.5px solid ${pt.blue}`, borderRadius: 7, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'Archivo Narrow',sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 0.9,
      color: pt.blue, transform: 'skewX(-7deg)',
    }}
  >
    <span style={{ transform: 'skewX(7deg)' }}>
      GCM
      <br />
      PTA
    </span>
  </div>
);

export default function PresentTitle() {
  const { store, year } = useStore();

  return (
    <div className="pt-title-row" style={{ display: 'flex', width: '100%', height: '100%', fontFamily: ptFont }}>
      <div style={{ width: '56%', padding: 'clamp(32px,5vh,64px) clamp(36px,5vw,64px)', display: 'flex', flexDirection: 'column' }}>
        <Logo />
        <div style={{ flex: 1 }} />
        <EffectiveHtml ovKey="s1.title" html={esc(year.meta.title || 'Maintenance Monthly')} style={{ fontSize: 'clamp(34px,5vw,62px)', fontWeight: 800, color: pt.text, lineHeight: 1.03, letterSpacing: -1 }} />
        <div style={{ height: 20 }} />
        <EffectiveHtml ovKey="s1.sub" html={`${store.activeMonth} ${store.activeYear} Performance`} style={{ fontSize: 'clamp(18px,2.2vw,26px)', fontWeight: 700, color: pt.blue }} />
        <div style={{ height: 18 }} />
        <div
          style={{
            border: `1.5px solid ${pt.glassBorderStrong}`, borderRadius: 30, padding: '8px 20px', alignSelf: 'flex-start',
            fontFamily: ptMono, fontSize: 'clamp(10px,0.85vw,12px)', letterSpacing: 2, color: pt.textMuted, textTransform: 'uppercase',
          }}
        >
          Executive Summary
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 'clamp(24px,4vw,46px)', flexWrap: 'wrap' }}>
          {[
            ['Presented', year.meta.presented],
            ['Prepared by', year.meta.preparedBy],
            ['Target', year.meta.target],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontFamily: ptMono, fontSize: 11, letterSpacing: 1.5, color: pt.textFaint, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
              <div style={{ color: pt.textMuted, fontSize: 'clamp(13px,1.1vw,16px)' }}>{val || '—'}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-title-image" style={{ flex: 1, position: 'relative', background: pt.bg1, overflow: 'hidden' }}>
        {year.coverImage ? (
          <img src={year.coverImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pt.textFaint, fontSize: 14 }}>No cover image</div>
        )}
      </div>
    </div>
  );
}
