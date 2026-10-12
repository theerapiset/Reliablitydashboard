import { useStore } from '../../store/StoreContext';
import Editable from './Editable';
import CoverImageSlot from './CoverImageSlot';
import { esc } from '../../utils/calc';

const Logo = ({ size = 44 }: { size?: number }) => (
  <div
    style={{
      width: size, height: size, border: '2.5px solid #fff', borderRadius: 6, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'Archivo Narrow',sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 0.9,
      color: '#fff', transform: 'skewX(-7deg)',
    }}
  >
    <span style={{ transform: 'skewX(7deg)' }}>
      GCM
      <br />
      PTA
    </span>
  </div>
);

export default function TitleSlide() {
  const { store, year } = useStore();

  return (
    <section style={{ display: 'flex', background: '#fff', fontFamily: "'Archivo','Helvetica Neue',Arial,sans-serif", width: '100%', height: '100%' }}>
      <div style={{ width: '58%', background: '#14365c', padding: '54px 56px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Logo />
        </div>
        <div style={{ flex: 1 }} />
        <Editable ovKey="s1.title" html={esc(year.meta.title || 'Maintenance Monthly')} style={{ fontSize: 58, fontWeight: 800, color: '#fff', lineHeight: 1.02, letterSpacing: -1 }} />
        <div style={{ height: 24 }} />
        <Editable ovKey="s1.sub" html={`${store.activeMonth} ${store.activeYear} Performance`} style={{ fontSize: 25, fontWeight: 700, color: '#8fb2dd' }} />
        <div style={{ height: 18 }} />
        <div
          style={{
            border: '1.5px solid #5e84b0', borderRadius: 30, padding: '8px 20px', alignSelf: 'flex-start',
            fontFamily: "'Roboto Mono',monospace", fontSize: 11, letterSpacing: 2, color: '#cdd9e6', textTransform: 'uppercase',
          }}
        >
          Executive Summary
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 46 }}>
          <div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, letterSpacing: 1.5, color: '#7d99bc', textTransform: 'uppercase', marginBottom: 5 }}>Presented</div>
            <Editable ovKey="s1.presented" html={esc(year.meta.presented)} style={{ color: '#cdd9e6', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, letterSpacing: 1.5, color: '#7d99bc', textTransform: 'uppercase', marginBottom: 5 }}>Prepared by</div>
            <Editable ovKey="s1.prepared" html={esc(year.meta.preparedBy)} style={{ color: '#cdd9e6', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, letterSpacing: 1.5, color: '#7d99bc', textTransform: 'uppercase', marginBottom: 5 }}>Target</div>
            <Editable ovKey="s1.target" html={esc(year.meta.target)} style={{ color: '#cdd9e6', fontSize: 15 }} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', background: '#1c4673' }}>
        <CoverImageSlot />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg,rgba(20,54,92,.45),rgba(20,54,92,.08))', pointerEvents: 'none' }} />
      </div>
    </section>
  );
}
