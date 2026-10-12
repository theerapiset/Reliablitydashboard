import { pt } from '../../../presentTheme';

export default function PresentBackup({ src }: { src: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pt.bg0, padding: 'clamp(24px,4vh,56px)', boxSizing: 'border-box' }}>
      <img src={src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 10, boxShadow: '0 10px 40px rgba(20,40,70,.18)' }} />
    </div>
  );
}
