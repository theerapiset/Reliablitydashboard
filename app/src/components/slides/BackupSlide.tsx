export default function BackupSlide({ src }: { src: string }) {
  return (
    <section style={{ background: '#0e1620', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <img src={src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </section>
  );
}
