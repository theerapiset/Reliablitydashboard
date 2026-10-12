import type { ReactNode } from 'react';
import { colors, fonts } from '../../theme';

export default function StatCard({
  label,
  value,
  unit,
  note,
  accent = colors.blue,
  valueColor,
  size = 'lg',
  bg,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: ReactNode;
  accent?: string;
  valueColor?: string;
  size?: 'lg' | 'md';
  bg?: string;
}) {
  return (
    <div
      style={{
        background: bg || colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 11,
        padding: size === 'lg' ? '16px 17px' : '15px 17px',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.3, color: '#7c8a99', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: size === 'lg' ? 40 : 34,
          fontWeight: 800,
          color: valueColor || accent,
          lineHeight: 1.05,
          marginTop: 6,
        }}
      >
        {value}
        {unit && <span style={{ fontSize: size === 'lg' ? 18 : 16, color: '#9aa6b3' }}> {unit}</span>}
      </div>
      {note && <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{note}</div>}
    </div>
  );
}
