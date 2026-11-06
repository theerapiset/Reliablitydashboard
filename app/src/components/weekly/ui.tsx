import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useStore } from '../../store/StoreContext';
import { seedWeekly } from '../../data/weeklySeed';
import { fonts } from '../../theme';
import type { Top10Link, WeeklyData } from '../../types/models';

// Palette for the weekly monitoring views (Plant Reliability Monitoring design).
export const wk = {
  ink: '#0E1A2B',
  text2: '#3B4756',
  muted: '#54606F',
  faint: '#6B7684',
  line: '#DDE2E8',
  line2: '#E6EAEF',
  line3: '#EEF1F4',
  inputLine: '#CBD2DA',
  soft: '#F7F9FB',
  head: '#F6F8FA',
  blue: '#1D4ED8',
  blueBg: '#E5EDFF',
  blueInk: '#1D3A8A',
  focus: '#DCE7FF',
  red: '#A3171B',
  redBright: '#C62828',
  redBg: '#FDE2E1',
  amber: '#8A4B00',
  amberBg: '#FDEBD3',
  amberBright: '#D97706',
  green: '#1F6B3A',
  greenInk: '#2F5E22',
  greenBg: '#E2F0DC',
  greenDot: '#2E9E5B',
  teal: '#0F6363',
  tealBg: '#DDF3F1',
  brown: '#5C4A2E',
  brownBg: '#F1ECE4',
  tableHead: '#134E73',
  gold: '#F59E0B',
} as const;

export function useWeekly() {
  const { store, setStore } = useStore();
  const weekly = store.weekly || seedWeekly();
  const update = (fn: (w: WeeklyData) => void) =>
    setStore((s) => {
      if (!s.weekly) s.weekly = seedWeekly();
      fn(s.weekly);
    });
  return { weekly, update };
}

export const mono: CSSProperties = { fontFamily: fonts.mono };

export const pill = (bg: string, fg: string, size = 12): CSSProperties => ({
  display: 'inline-block',
  padding: size <= 11 ? '2px 8px' : '3px 10px',
  borderRadius: 999,
  fontSize: size,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  background: bg,
  color: fg,
});

export const inputStyle: CSSProperties = {
  width: '100%',
  border: `1px solid ${wk.inputLine}`,
  background: '#fff',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 13,
  color: wk.ink,
  lineHeight: 1.45,
};

/** Borderless-until-hover inline editor (step rows). */
export const ghostInput: CSSProperties = { ...inputStyle, border: '1px solid transparent', background: 'transparent', padding: '4px 8px' };

export const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: wk.text2 };

type BtnKind = 'primary' | 'dark' | 'outline' | 'outlineBlue' | 'ghost' | 'danger' | 'success';
export const btn = (kind: BtnKind, h = 36): CSSProperties => {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: h,
    padding: h >= 44 ? '0 16px' : '0 12px',
    borderRadius: 8,
    fontSize: h >= 44 ? 14 : 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flex: 'none',
  };
  const map: Record<BtnKind, CSSProperties> = {
    primary: { background: wk.blue, color: '#fff', border: 'none' },
    dark: { background: wk.ink, color: '#fff', border: `1px solid ${wk.ink}` },
    outline: { background: '#fff', color: wk.ink, border: `1px solid ${wk.inputLine}`, fontWeight: 500 },
    outlineBlue: { background: '#fff', color: wk.blue, border: `1px solid ${wk.blue}` },
    ghost: { background: 'transparent', color: wk.faint, border: 'none', padding: 0, width: h },
    danger: { background: wk.red, color: '#fff', border: 'none' },
    success: { background: wk.green, color: '#fff', border: 'none' },
  };
  return { ...base, ...map[kind] };
};

export function Panel({ children, style, pad = true }: { children: ReactNode; style?: CSSProperties; pad?: boolean }) {
  return (
    <section
      style={{
        background: '#fff',
        border: `1px solid ${wk.line}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        ...(pad ? { padding: '16px 20px', gap: 12 } : {}),
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function PanelHead({ title, sub, right, size = 16, border }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; size?: number; border?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        ...(border ? { padding: '16px 20px', borderBottom: `1px solid ${wk.line2}` } : {}),
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h2 style={{ margin: 0, fontSize: size, fontWeight: 700 }}>{title}</h2>
        {sub && <span style={{ fontSize: 12, color: wk.muted }}>{sub}</span>}
      </div>
      {right}
    </div>
  );
}

export function KpiTile({ label, value, color, suffix, tone }: { label: string; value: ReactNode; color?: string; suffix?: ReactNode; tone?: 'amber' }) {
  return (
    <div
      style={{
        background: tone === 'amber' ? '#FFF4E5' : '#fff',
        border: `1px solid ${tone === 'amber' ? '#F5C98A' : wk.line}`,
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, color: tone === 'amber' ? wk.amber : wk.muted }}>{label}</span>
      <span style={{ ...mono, fontSize: 28, fontWeight: 700, color: color || wk.ink, lineHeight: 1.2 }}>
        {value}
        {suffix && <span style={{ fontSize: 16, color: wk.muted }}>{suffix}</span>}
      </span>
    </div>
  );
}

export function KpiRow({ children, min = 160 }: { children: ReactNode; min?: number }) {
  return <section style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 12 }}>{children}</section>;
}

export function PageHead({ title, sub, week, right }: { title: string; sub: string; week: string; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.2 }}>{title}</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${wk.line}`, background: '#fff', borderRadius: 8, padding: '5px 12px' }}>
            <span style={{ ...mono, fontSize: 11, letterSpacing: 1, color: wk.muted }}>WEEK</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{week}</span>
          </span>
        </div>
        <span style={{ color: wk.muted, fontSize: 13.5 }}>{sub}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{right}</div>
    </div>
  );
}

export function PlantTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div role="group" aria-label="Plant filter" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              background: on ? wk.ink : '#fff',
              color: on ? '#fff' : wk.text2,
              border: `1px solid ${on ? wk.ink : wk.inputLine}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ children, onClose, maxWidth = 980, top = 56, bg = '#fff', z = 50 }: { children: ReactNode; onClose: () => void; maxWidth?: number; top?: number; bg?: string; z?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: `${top}px 16px`, zIndex: z, overflowY: 'auto' }}
    >
      <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth, background: bg, borderRadius: 14, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(14,26,43,.35)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export function CloseBtn({ onClick, size = 44 }: { onClick: () => void; size?: number }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close" style={{ ...btn('outline', size), width: size, padding: 0, borderRadius: size >= 44 ? 10 : 6 }}>
      <Icon.Close size={size >= 44 ? 18 : 14} />
    </button>
  );
}

export function useToast() {
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (t: string, ms = 2600) => {
    setToast(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), ms);
  };
  const node = toast ? (
    <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: wk.ink, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 14, zIndex: 60, boxShadow: '0 10px 30px rgba(14,26,43,.3)' }}>
      {toast}
    </div>
  ) : null;
  return { flash, node };
}

// ---------- Links & PI Vision embed ----------

export const LINK_KIND: Record<Top10Link['kind'], [string, string, string]> = {
  pi: ['PI', wk.ink, '#fff'],
  app: ['APP', wk.tealBg, wk.teal],
  link: ['LINK', wk.blueBg, wk.blue],
};

export function LinkBadge({ kind }: { kind: Top10Link['kind'] }) {
  const [label, bg, fg] = LINK_KIND[kind];
  return <span style={{ ...mono, flex: 'none', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: bg, color: fg }}>{label}</span>;
}

export const piUrl = (url: string, range: string) => url + (url.includes('?') ? '&' : '?') + 'mode=kiosk&StartTime=*-' + range + '&EndTime=*';

const RANGES = ['24h', '7d', '30d', '90d'];

/** PI Vision display in kiosk mode. Only reachable on the company network, so there's a fallback state. */
export function PiEmbed({ link }: { link: Top10Link }) {
  const [range, setRange] = useState('7d');
  const [corp, setCorp] = useState(true);
  const url = piUrl(link.url, range);
  return (
    <div style={{ border: `1px solid ${wk.ink}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 10px', background: wk.ink, color: '#fff' }}>
        <span style={{ ...mono, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fff', color: wk.ink }}>PI</span>
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</span>
        <div role="group" aria-label="Time range" style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              style={{ ...mono, height: 28, padding: '0 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, ...(range === r ? { background: '#fff', color: wk.ink, border: '1px solid #fff' } : { background: 'transparent', color: '#C9D6E3', border: '1px solid #2A3B52' }) }}
            >
              {r}
            </button>
          ))}
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', height: 28, padding: '0 10px', borderRadius: 6, background: '#fff', color: wk.ink, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          Open in PI Vision ↗
        </a>
      </div>
      {corp ? (
        <div style={{ position: 'relative', height: 300, background: wk.soft }}>
          <iframe title={`PI Vision · ${link.label}`} src={url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
          <span style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: wk.greenBg, color: wk.greenInk, fontSize: 11, fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: wk.greenDot }} />
            PTTGC network · last {range}
          </span>
        </div>
      ) : (
        <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, textAlign: 'center', background: wk.soft }}>
          <Icon.Lock />
          <span style={{ fontWeight: 600 }}>ต้องต่อเครือข่ายบริษัท (หรือ VPN) เพื่อดูข้อมูล PI</span>
          <span style={{ fontSize: 12, color: wk.muted }}>ข้อมูลจาก gcmppisvr.pttgc.corp เปิดได้เฉพาะในเครือข่าย PTTGC</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 10px', borderTop: `1px solid ${wk.line2}`, fontSize: 11, color: wk.muted }}>
        <span>{corp ? 'แสดง PI Vision ในหน้านี้ (ต้องอยู่ในเครือข่ายบริษัท)' : 'อยู่นอกเครือข่ายบริษัท → ใช้ปุ่ม Open in PI Vision แทน'}</span>
        <button type="button" onClick={() => setCorp(!corp)} style={{ height: 26, padding: '0 8px', borderRadius: 6, border: '1px dashed #9AA4B0', background: '#fff', color: wk.muted, fontSize: 11 }}>
          {corp ? 'Off network? Hide embed' : 'Show embed'}
        </button>
      </div>
    </div>
  );
}

/** Kind / label / URL row for adding a link. */
export function AddLinkRow({ onAdd, kinds, placeholder, cta = 'Add' }: { onAdd: (l: Top10Link) => void; kinds: [Top10Link['kind'], string][]; placeholder: string; cta?: string }) {
  const [kind, setKind] = useState<Top10Link['kind']>(kinds[0][0]);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const add = () => {
    const u = url.trim();
    if (!u) return;
    onAdd({ kind, label: label.trim() || u, url: u });
    setLabel('');
    setUrl('');
  };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <select aria-label="Link type" value={kind} onChange={(e) => setKind(e.target.value as Top10Link['kind'])} style={{ ...inputStyle, width: 'auto', flex: 'none' }}>
        {kinds.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <input aria-label="Link label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, flex: '1 1 140px', width: 'auto' }} />
      <input aria-label="Link URL" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="https://…" style={{ ...inputStyle, flex: '2 1 180px', width: 'auto' }} />
      <button type="button" onClick={add} style={btn('outlineBlue')}>
        {cta}
      </button>
    </div>
  );
}

// ---------- Icons ----------

const svg = (size: number, sw = 2) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const Icon = {
  Plus: ({ size = 14 }: { size?: number }) => (
    <svg {...svg(size, 2.4)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Chevron: ({ size = 12 }: { size?: number }) => (
    <svg {...svg(size, 2.4)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Info: ({ size = 15 }: { size?: number }) => (
    <svg {...svg(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
  Sort: ({ size = 14 }: { size?: number }) => (
    <svg {...svg(size)}>
      <path d="M7 4v16M3 16l4 4 4-4" />
      <path d="M14 6h7M14 12h5M14 18h3" />
    </svg>
  ),
  Close: ({ size = 14 }: { size?: number }) => (
    <svg {...svg(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Edit: ({ size = 14 }: { size?: number }) => (
    <svg {...svg(size)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  Mail: ({ size = 16 }: { size?: number }) => (
    <svg {...svg(size)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  Send: ({ size = 16 }: { size?: number }) => (
    <svg {...svg(size)}>
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </svg>
  ),
  Swap: ({ size = 14 }: { size?: number }) => (
    <svg {...svg(size)}>
      <path d="M7 7h11l-3-3M17 17H6l3 3" />
    </svg>
  ),
  Trash: ({ size = 15 }: { size?: number }) => (
    <svg {...svg(size)}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  ),
  Arrow: ({ size = 20 }: { size?: number }) => (
    <svg {...svg(size)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Image: ({ size = 22 }: { size?: number }) => (
    <svg {...svg(size, 1.8)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  ),
  Lock: ({ size = 28 }: { size?: number }) => (
    <svg {...svg(size, 1.8)} stroke={wk.muted}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  External: ({ size = 16 }: { size?: number }) => (
    <svg {...svg(size)} stroke={wk.blue}>
      <path d="M15 3h6v6M21 3l-8 8" />
      <path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  ),
  Alert: ({ size = 14 }: { size?: number }) => (
    <svg {...svg(size)} style={{ flex: 'none' }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  ),
};
