import { useEffect, useRef, useState, type ReactNode } from 'react';
import { pt, ptMono } from '../../presentTheme';

export interface PresentSlideSpec {
  key: string;
  content: ReactNode;
}

const AUTOHIDE_MS = 2600;

export default function PresentDeck({
  open,
  slides,
  initialIndex = 0,
  onClose,
}: {
  open: boolean;
  slides: PresentSlideSpec[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) setIndex(Math.min(initialIndex, slides.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    el?.requestFullscreen?.().catch(() => {});
    const onFsChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') setIndex((i) => Math.min(slides.length - 1, i + 1));
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slides.length]);

  const wake = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), AUTOHIDE_MS);
  };

  useEffect(() => {
    if (!open) return;
    wake();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const s = slides[index];
  const progress = slides.length > 1 ? index / (slides.length - 1) : 1;

  return (
    <div
      ref={containerRef}
      className="pt-present-root"
      onMouseMove={(e) => {
        wake();
        setLaserPos({ x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => setLaserPos(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647, cursor: 'none',
        background: `radial-gradient(120% 100% at 15% 0%, ${pt.bg2} 0%, ${pt.bg1} 45%, ${pt.bg0} 100%)`,
        overflow: 'hidden',
      }}
    >
      {s && (
        <div key={s.key} className="pt-slide-in" style={{ position: 'absolute', inset: 0 }}>
          {s.content}
        </div>
      )}

      <div
        className="pt-controls"
        style={{
          position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#ffffff', border: `1.5px solid ${pt.glassBorder}`, borderRadius: 999,
          padding: '10px 12px', boxShadow: '0 6px 22px rgba(20,40,70,.14)',
          opacity: showControls ? 1 : 0, transition: 'opacity .35s ease', pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} style={{ ...ctrlBtn, opacity: index === 0 ? 0.35 : 1 }}>
          ‹
        </button>
        <span style={{ fontFamily: ptMono, fontSize: 15, fontWeight: 700, color: pt.textMuted, minWidth: 56, textAlign: 'center' }}>
          {index + 1} / {slides.length}
        </span>
        <button onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))} disabled={index === slides.length - 1} style={{ ...ctrlBtn, opacity: index === slides.length - 1 ? 0.35 : 1 }}>
          ›
        </button>
        <div style={{ width: 1.5, height: 22, background: pt.glassBorderStrong, margin: '0 2px' }} />
        <button onClick={onClose} title="Exit (Esc)" style={{ ...ctrlBtn, width: 'auto', padding: '0 16px', fontSize: 15, fontWeight: 700, color: pt.textMuted }}>
          ✕ Exit
        </button>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: pt.glassBorder }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: pt.blue, transition: 'width .3s ease' }} />
      </div>

      {laserPos && (
        <div
          style={{
            position: 'fixed', left: laserPos.x, top: laserPos.y, transform: 'translate(-50%,-50%)',
            zIndex: 2147483647, pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 26, height: 26, borderRadius: '50%', background: 'rgba(224,30,30,.35)', filter: 'blur(3px)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', background: '#e01e1e', boxShadow: '0 0 6px 1px rgba(224,30,30,.8)' }} />
        </div>
      )}

      <style>{`
        /* Keep the laser-dot illusion everywhere in Present mode — without
           this, elements with their own cursor:pointer (hover-tooltip KPI
           tiles, the floating controls, …) would reveal the native arrow. */
        .pt-present-root, .pt-present-root * { cursor: none !important; }

        @keyframes ptFadeIn { from { opacity: 0; transform: translateY(16px) scale(.985); } to { opacity: 1; transform: none; } }
        .pt-slide-in { animation: ptFadeIn .38s cubic-bezier(.2,.8,.2,1); }

        /* Narrow phone-portrait screens: the desktop/tablet layout (side-by-side
           columns, single-row KPI strip) doesn't fit — stack everything and let
           each slide scroll internally instead of clipping or overlapping. */
        @media (max-width: 720px) {
          .pt-slide-frame { padding: 20px 18px 74px !important; gap: 12px !important; }
          .pt-kpi-row { flex-wrap: wrap !important; gap: 8px !important; }
          .pt-kpi-row > * { flex: 1 1 45% !important; min-width: 130px; }
          .pt-kpi-card { padding: 10px 14px !important; }
          .pt-two-col { grid-template-columns: 1fr !important; grid-template-rows: none !important; overflow-y: auto !important; gap: 10px !important; }
          .pt-two-col > * { min-height: auto !important; }
          .pt-slide-body { overflow-y: auto !important; }
          .pt-title-row { flex-direction: column !important; overflow-y: auto !important; padding: 24px 20px !important; }
          .pt-title-image { flex: none !important; min-height: 120px !important; }
        }
      `}</style>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f0f3f7', color: pt.text,
  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
