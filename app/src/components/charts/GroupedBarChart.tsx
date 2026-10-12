import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { niceMax, num } from '../../utils/calc';
import { useTooltip } from '../../store/TooltipContext';
import { colors, fonts } from '../../theme';
import type { ShutdownCostRow } from '../../types/models';

interface Datum {
  label: string;
  plan: number;
  actual: number;
  total?: boolean;
}

function TooltipBody({ d }: { d: Datum }) {
  const diff = d.actual - d.plan;
  const under = diff <= 0;
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.label}</div>
      <div style={{ fontSize: 11.5, color: '#d6e0ec' }}>
        Plan <span style={{ color: '#fff', fontWeight: 700 }}>{d.plan.toFixed(1)} MB</span> · Actual{' '}
        <span style={{ color: '#fff', fontWeight: 700 }}>{d.actual.toFixed(1)} MB</span>
      </div>
      <div style={{ fontSize: 11.5, color: under ? '#8fe3a8' : '#ffb3b3' }}>
        {under ? `▼ ${Math.abs(diff).toFixed(1)} MB under plan` : `▲ ${diff.toFixed(1)} MB over plan`}
      </div>
    </div>
  );
}

function CostBar(props: any) {
  const { x, y, width, height, fill, payload, dataKey } = props;
  const { show, move, hide } = useTooltip();
  const onMove = (e: React.MouseEvent) => move(e.clientX, e.clientY);
  const onEnter = (e: React.MouseEvent) => show(<TooltipBody d={payload} />, e.clientX, e.clientY);
  const isTotal = !!payload.total;
  const barFill = dataKey === 'actual' && isTotal ? colors.navy : fill;
  return (
    <rect x={x} y={y} width={width} height={height} fill={barFill} rx={1} style={{ cursor: 'pointer' }} onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={hide} />
  );
}

export default function GroupedBarChart({ rows }: { rows: ShutdownCostRow[] }) {
  const data: Datum[] = rows.map((r) => ({ label: r.event, plan: num(r.plan), actual: num(r.actual) }));
  const tp = data.reduce((s, d) => s + d.plan, 0);
  const ta = data.reduce((s, d) => s + d.actual, 0);
  data.push({ label: 'Total', plan: tp, actual: ta, total: true });
  const yMax = niceMax(Math.max(...data.map((d) => Math.max(d.plan, d.actual)), 1));

  return (
    <div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 4 }} barGap={4} barCategoryGap="24%">
          <CartesianGrid stroke="#eceff3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9.5, fill: '#46566a', fontFamily: fonts.mono }} />
          <YAxis domain={[0, yMax]} tickLine={false} axisLine={false} width={30} tick={{ fontSize: 9, fill: '#9aa6b3', fontFamily: fonts.mono }} />
          <Bar dataKey="plan" fill={colors.planBar} shape={CostBar} maxBarSize={20} isAnimationActive={false} />
          <Bar dataKey="actual" fill={colors.actualBar} shape={CostBar} maxBarSize={20} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontFamily: fonts.mono, fontSize: 10, color: '#7c8a99', marginTop: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 11, height: 11, background: colors.planBar, borderRadius: 1 }} />
          Plan
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 11, height: 11, background: colors.actualBar, borderRadius: 1 }} />
          Actual
        </span>
      </div>
    </div>
  );
}
