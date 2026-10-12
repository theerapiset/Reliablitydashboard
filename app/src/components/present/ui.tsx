import type { ReactNode } from 'react';
import { useStore } from '../../store/StoreContext';
import { pt, ptFont, ptMono } from '../../presentTheme';

/**
 * Static (non-editable) render of a slide field, respecting manual
 * overrides saved from the editor deck. Present mode is a live, full-screen
 * view — text here is deliberately not contentEditable so a stray click
 * while presenting can't start an edit.
 */
export function EffectiveHtml({ ovKey, html, style }: { ovKey: string; html: string; style?: React.CSSProperties }) {
  const { year } = useStore();
  const effective = year.ovr?.[ovKey] != null ? year.ovr[ovKey] : html;
  return <div style={style} dangerouslySetInnerHTML={{ __html: effective }} />;
}

export function SlideFrame({
  kicker,
  title,
  titleOvr,
  children,
}: {
  kicker: string;
  title: ReactNode;
  titleOvr?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="pt-slide-frame"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: ptFont,
        color: pt.text,
        padding: 'clamp(26px,4vh,58px) clamp(30px,5vw,76px)',
        // Extra bottom clearance so card content never sits under the
        // floating prev/next/exit pill, which overlaps the bottom of the
        // slide by design.
        paddingBottom: 'clamp(84px,11vh,116px)',
        boxSizing: 'border-box',
        gap: 'clamp(16px,2.6vh,30px)',
      }}
    >
      <div style={{ flex: 'none' }}>
        <div style={{ fontFamily: ptMono, fontSize: 'clamp(13px,1.1vw,16px)', letterSpacing: 2.5, color: pt.blue, textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>
          {kicker}
        </div>
        <div style={{ fontSize: 'clamp(26px,3.4vw,44px)', fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.08 }}>
          {titleOvr ?? title}
        </div>
      </div>
      <div className="pt-slide-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

export function Glass({ children, style, className }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: pt.glass,
        border: `1.5px solid ${pt.glassBorder}`,
        borderRadius: 16,
        boxShadow: '0 2px 10px rgba(20,40,70,.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  unit,
  note,
  accent = pt.blue,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: ReactNode;
  accent?: string;
}) {
  return (
    <Glass className="pt-kpi-card" style={{ padding: 'clamp(14px,1.8vw,24px) clamp(16px,2vw,26px)', flex: 1, minWidth: 0, borderTop: `4px solid ${accent}` }}>
      <div style={{ fontFamily: ptMono, fontSize: 'clamp(11px,0.85vw,13.5px)', letterSpacing: 1.4, color: pt.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(24px,2.6vw,44px)', fontWeight: 800, color: accent, lineHeight: 1.15, marginTop: 8, overflowWrap: 'break-word' }}>
        {value}
        {unit && <span style={{ fontSize: '0.38em', color: pt.textFaint, fontWeight: 700 }}> {unit}</span>}
      </div>
      {note && <div style={{ fontSize: 'clamp(13px,1.05vw,16.5px)', color: pt.textMuted, marginTop: 6, fontWeight: 500 }}>{note}</div>}
    </Glass>
  );
}

export function Pill({ children, color = pt.blue, bg }: { children: ReactNode; color?: string; bg?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', fontSize: 'clamp(13px,1vw,16px)', fontWeight: 700,
        color, background: bg || `${color}1c`, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export const ptLabel: React.CSSProperties = {
  fontFamily: ptMono,
  fontSize: 'clamp(12px,0.95vw,14.5px)',
  letterSpacing: 1.2,
  color: pt.textMuted,
  textTransform: 'uppercase',
  fontWeight: 700,
};
