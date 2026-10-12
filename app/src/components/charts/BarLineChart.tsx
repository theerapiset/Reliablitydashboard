import { Bar, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ReactNode } from 'react';
import { monthlyByPlant, niceMax, type PlantCase } from '../../utils/calc';
import { useTooltip } from '../../store/TooltipContext';
import { colors, fonts } from '../../theme';
import { MONTHS, type ReliabilityEvent } from '../../types/models';

interface ChartDatum {
  month: string;
  p1: number;
  p2: number;
  p3: number;
  accum: number;
  showLabel: boolean;
  cases: { p1: PlantCase[]; p2: PlantCase[]; p3: PlantCase[] };
}

const PLANT_META: Record<'p1' | 'p2' | 'p3', { name: string; color: string }> = {
  p1: { name: 'Plant 1', color: colors.plant1Chart },
  p2: { name: 'Plant 2', color: colors.plant2Chart },
  p3: { name: 'Plant 3', color: colors.plant3Chart },
};

function buildData(entries: ReliabilityEvent[]): ChartDatum[] {
  const { M, C } = monthlyByPlant(entries);
  let acc = 0;
  return M.map((m, i) => {
    const total = m.p1 + m.p2 + m.p3;
    acc = Math.round((acc + total) * 100) / 100;
    const prevAcc = i === 0 ? -1 : (() => {
      let a = 0;
      for (let j = 0; j < i; j++) a += M[j].p1 + M[j].p2 + M[j].p3;
      return Math.round(a * 100) / 100;
    })();
    return {
      month: MONTHS[i],
      p1: m.p1,
      p2: m.p2,
      p3: m.p3,
      accum: acc,
      showLabel: acc > 0 && acc !== prevAcc,
      cases: C[i],
    };
  });
}

function TooltipBody({ monthName, plantName, total, cases }: { monthName: string; plantName: string; total: number; cases: PlantCase[] }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 5, fontSize: 12.5 }}>
        {monthName} · {plantName} — {total.toFixed(1)} h
      </div>
      {cases.length ? (
        cases.map((c, i) => (
          <div key={i} style={{ margin: '2px 0', color: '#d6e0ec', fontSize: 11.5 }}>
            • {c.topic} <span style={{ color: '#fff', fontWeight: 700 }}>{c.hours.toFixed(1)} h</span>
            {c.effect ? <span style={{ color: '#9fb6cf' }}> · {c.effect}</span> : null}
          </div>
        ))
      ) : (
        <div style={{ color: '#9fb6cf', fontSize: 11.5 }}>No event detail recorded.</div>
      )}
    </div>
  );
}

function PlantBar(props: any) {
  const { x, y, width, height, fill, payload, dataKey } = props;
  const { show, move, hide } = useTooltip();
  const pk = dataKey as 'p1' | 'p2' | 'p3';
  const value: number = payload[pk];
  if (!value) return null;
  const cases: PlantCase[] = payload.cases[pk];
  const onMove = (e: React.MouseEvent) => move(e.clientX, e.clientY);
  const onEnter = (e: React.MouseEvent) => {
    show(
      <TooltipBody monthName={payload.month} plantName={PLANT_META[pk].name} total={value} cases={cases} />,
      e.clientX,
      e.clientY
    );
  };
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={2}
      style={{ cursor: 'pointer' }}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={hide}
    />
  );
}

function AccumDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={2} fill={colors.accumChart} />
      {payload.showLabel && (
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize={8} fill="#9aa6b3" fontFamily={fonts.mono}>
          {payload.accum}
        </text>
      )}
    </g>
  );
}

function Legend(): ReactNode {
  const items: [string, string][] = [
    ['Plant 1', colors.plant1Chart],
    ['Plant 2', colors.plant2Chart],
    ['Plant 3', colors.plant3Chart],
  ];
  return (
    <div style={{ display: 'flex', gap: 13, justifyContent: 'center', fontFamily: fonts.mono, fontSize: 9.5, color: '#8895a3', marginTop: 1 }}>
      {items.map(([label, color]) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
          {label}
        </span>
      ))}
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 13, height: 2, background: colors.accumChart }} />
        Accum
      </span>
    </div>
  );
}

export default function BarLineChart({ entries, height = 186 }: { entries: ReliabilityEvent[]; height?: number }) {
  const data = buildData(entries);
  const yMax = niceMax(Math.max(...data.map((d) => Math.max(d.p1, d.p2, d.p3)), ...data.map((d) => d.accum), 1));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 14, right: 10, left: 0, bottom: 4 }} barGap={2} barCategoryGap="30%">
          <CartesianGrid stroke="#eef1f5" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 8.5, fill: '#9aa6b3', fontFamily: fonts.mono }} />
          <YAxis
            domain={[0, yMax]}
            tickLine={false}
            axisLine={false}
            width={26}
            tick={{ fontSize: 8.5, fill: '#aab4c0', fontFamily: fonts.mono }}
          />
          <Bar dataKey="p1" fill={colors.plant1Chart} shape={PlantBar} maxBarSize={8} isAnimationActive={false} />
          <Bar dataKey="p2" fill={colors.plant2Chart} shape={PlantBar} maxBarSize={8} isAnimationActive={false} />
          <Bar dataKey="p3" fill={colors.plant3Chart} shape={PlantBar} maxBarSize={8} isAnimationActive={false} />
          <Line
            type="linear"
            dataKey="accum"
            stroke={colors.accumChart}
            strokeWidth={1.8}
            dot={AccumDot}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <Legend />
    </div>
  );
}
