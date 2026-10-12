import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const DESIGN_W = 1280;
const DESIGN_H = 720;

export interface SlideSpec {
  key: string;
  label: string;
  content: ReactNode;
}

export interface SlideDeckHandle {
  print: () => void;
  present: () => void;
}

export default function SlideDeck({
  slides,
  activeIndex,
  onIndexChange,
  deckRef,
}: {
  slides: SlideSpec[];
  activeIndex: number;
  onIndexChange: (i: number) => void;
  deckRef?: React.MutableRefObject<SlideDeckHandle | null>;
}) {
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [presenting, setPresenting] = useState(false);

  useLayoutEffect(() => {
    const el = stageWrapRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(w / DESIGN_W, h / DESIGN_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [presenting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') onIndexChange(Math.min(slides.length - 1, activeIndex + 1));
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') onIndexChange(Math.max(0, activeIndex - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, slides.length, onIndexChange]);

  useEffect(() => {
    const onFsChange = () => setPresenting(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (deckRef) {
    deckRef.current = {
      print: () => window.print(),
      present: () => containerRef.current?.requestFullscreen?.(),
    };
  }

  return (
    <div ref={containerRef} className="deck-outer" style={{ position: 'fixed', inset: 0, background: '#1f2a36', display: 'flex' }}>
      {!presenting && (
        <div className="deck-no-print" style={{ width: 168, flex: 'none', background: '#161f29', borderRight: '1px solid #2a3846', overflowY: 'auto', padding: '10px 8px' }}>
          {slides.map((s, i) => (
            <button
              key={s.key}
              onClick={() => onIndexChange(i)}
              style={{
                display: 'block', width: '100%', border: i === activeIndex ? '2px solid #4a90d9' : '2px solid transparent',
                borderRadius: 6, padding: 0, marginBottom: 8, background: 'none', cursor: 'pointer',
              }}
            >
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#0e1620', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0, width: DESIGN_W, height: DESIGN_H,
                    transform: `scale(${152 / DESIGN_W})`, transformOrigin: 'top left', pointerEvents: 'none',
                  }}
                >
                  {s.content}
                </div>
              </div>
              <div style={{ color: i === activeIndex ? '#fff' : '#8a97a6', fontSize: 10, marginTop: 3, textAlign: 'left', paddingLeft: 2 }}>
                {i + 1}. {s.label}
              </div>
            </button>
          ))}
        </div>
      )}
      <div ref={stageWrapRef} className="deck-stage" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {slides.map((s, i) => (
          <div
            key={s.key}
            className={i === activeIndex ? 'deck-slide-active' : 'deck-slide-inactive'}
            style={{
              position: 'absolute', width: DESIGN_W, height: DESIGN_H,
              transform: `scale(${scale})`,
              boxShadow: '0 20px 60px rgba(0,0,0,.5)',
              display: i === activeIndex ? 'block' : 'none',
              overflow: 'hidden',
            }}
          >
            {s.content}
          </div>
        ))}
        {!presenting && slides.length > 1 && (
          <div className="deck-no-print" style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => onIndexChange(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 14 }}
            >
              ‹
            </button>
            <span style={{ color: '#c7d2dc', fontSize: 12, fontFamily: "'Roboto Mono',monospace" }}>
              {activeIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => onIndexChange(Math.min(slides.length - 1, activeIndex + 1))}
              disabled={activeIndex === slides.length - 1}
              style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 14 }}
            >
              ›
            </button>
          </div>
        )}
      </div>
      {/* print stylesheet: each slide becomes a full page, one per page */}
      <style>{`
        @media print {
          @page { size: 1280px 720px; margin: 0; }
          body * { visibility: hidden; }
          .deck-print-root, .deck-print-root * { visibility: visible; }
          .deck-print-root { position: absolute; inset: 0; }
          .deck-no-print { display: none !important; }
          /* position:fixed + display:flex ancestors clip content to one
             viewport and don't let children flow across printed pages —
             force them to lay out as normal block content instead. */
          .deck-outer, .deck-stage {
            position: static !important;
            display: block !important;
            height: auto !important;
            width: auto !important;
            background: none !important;
          }
          .deck-slide-inactive, .deck-slide-active {
            display: block !important;
            position: relative !important;
            transform: none !important;
            width: 1280px !important;
            height: 720px !important;
            box-shadow: none !important;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
