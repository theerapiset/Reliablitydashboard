import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { colors, fonts } from '../theme';

interface TooltipContextValue {
  show: (content: ReactNode, clientX: number, clientY: number) => void;
  move: (clientX: number, clientY: number) => void;
  hide: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ content: ReactNode; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  // The Fullscreen API only paints the fullscreen element and its DOM
  // descendants — everything else, including this tooltip (normally a
  // sibling up near the document root), goes dark. Presenting a slide deck
  // requests fullscreen on an inner container, so re-target the portal to
  // whatever element is actually fullscreen right now, falling back to
  // document.body otherwise. This keeps hover tooltips on charts working
  // both in and out of Present mode.
  const [portalTarget, setPortalTarget] = useState<Element>(() => document.body);

  useEffect(() => {
    const onFsChange = () => setPortalTarget(document.fullscreenElement || document.body);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Safety net for a stuck tooltip. `onMouseLeave` never fires if the
  // hovered element is removed from the DOM before the pointer moves off
  // it — e.g. clicking a row that navigates to another view, or clicking
  // ▶ Present, unmounts the element mid-hover. The tooltip then stays
  // pinned on screen (visible on whatever page/mode loads next) until
  // something else happens to call hide(). A click/keypress/tab-switch is
  // exactly the moment the user is done just hovering, so clearing the
  // tooltip on any of these is both a safe default and closes every such
  // gap at once, regardless of what unmounted the hovered element.
  useEffect(() => {
    const hide = () => setState(null);
    document.addEventListener('pointerdown', hide, true);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('keydown', hide);
    return () => {
      document.removeEventListener('pointerdown', hide, true);
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('keydown', hide);
    };
  }, []);

  const place = (clientX: number, clientY: number) => {
    const w = ref.current?.offsetWidth || 260;
    const h = ref.current?.offsetHeight || 60;
    let x = clientX + 15;
    let y = clientY + 15;
    if (x + w > window.innerWidth - 8) x = clientX - w - 15;
    if (y + h > window.innerHeight - 8) y = clientY - h - 15;
    return { x, y };
  };

  const value: TooltipContextValue = {
    show: (content, clientX, clientY) => {
      const { x, y } = place(clientX, clientY);
      setState({ content, x, y });
    },
    move: (clientX, clientY) => {
      setState((prev) => (prev ? { ...prev, ...place(clientX, clientY) } : prev));
    },
    hide: () => setState(null),
  };

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          ref={ref}
          style={{
            position: 'fixed',
            zIndex: 2147483600,
            pointerEvents: 'none',
            background: colors.tooltipSurface,
            color: '#fff',
            padding: '10px 13px',
            borderRadius: 9,
            fontFamily: fonts.primary,
            lineHeight: 1.4,
            maxWidth: 340,
            boxShadow: '0 10px 30px rgba(0,0,0,.42)',
            opacity: state ? 1 : 0,
            transition: 'opacity .12s',
            left: state?.x ?? -9999,
            top: state?.y ?? -9999,
          }}
        >
          {state?.content}
        </div>,
        portalTarget
      )}
    </TooltipContext.Provider>
  );
}

export function useTooltip(): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error('useTooltip must be used within TooltipProvider');
  return ctx;
}
