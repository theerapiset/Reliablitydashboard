import { useUI } from '../store/UIContext';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../store/AuthContext';
import { blankYear } from '../data/seed';
import { exportYearToExcel } from '../utils/exportExcel';
import { colors, fonts } from '../theme';
import { MONTHS, type MonthName, type ViewId } from '../types/models';
import AdminLock from './AdminLock';

const TITLES: Record<ViewId, [string, string]> = {
  dashboard: ['Executive Dashboard', 'All KPIs at a glance'],
  safety: ['Safety', 'Recordable incidents & PSE log'],
  reliability: ['Reliability', 'CTA / PTA shutdown & unplanned downtime'],
  cost: ['MN Cost Saving', 'Action plans · IL3 execute / IL4 release'],
  maint: ['Maintenance Cost', 'Daily & shutdown cost vs plan'],
  shutdown: ['Shutdown Activities', 'Shutdown schedule & critical works'],
  shutdownPerf: ['Shutdown Performance', 'KPI vs plan & highlight activities'],
  concern: ['Concerning Equipment', 'Equipment under watch'],
  slides: ['Monthly Slides', 'Preview · edit · export presentation'],
};

const selectStyle: React.CSSProperties = {
  height: 36,
  border: '1px solid #cfd7e0',
  borderRadius: 7,
  padding: '0 10px',
  background: '#fff',
  fontWeight: 700,
};

const SYNC_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  loading: { label: 'Loading…', color: '#8a97a6', dot: '#8a97a6' },
  synced: { label: 'Saved · shared', color: '#15662f', dot: '#3fae6a' },
  saving: { label: 'Saving…', color: '#8a97a6', dot: '#e8b53a' },
  offline: { label: 'Offline — not saved', color: '#cf2e2e', dot: '#cf2e2e' },
  unconfigured: { label: 'Local only — Firebase not set up', color: '#c47e1a', dot: '#e9a23b' },
};

export default function Header() {
  const { view, setView, setPresentOpen } = useUI();
  const { store, year, setStore, syncStatus } = useStore();
  const { isAdmin } = useAuth();
  const sync = SYNC_LABEL[syncStatus];

  const [title, sub] = TITLES[view];
  const subFull = view === 'dashboard' ? `${sub} · ${store.activeMonth} ${store.activeYear}` : sub;

  const years = Object.keys(store.years)
    .map(Number)
    .sort((a, b) => b - a);

  const onMonth = (m: MonthName) => setStore((s) => { s.activeMonth = m; });
  const onYear = (y: number) =>
    setStore((s) => {
      s.activeYear = y;
      if (!s.years[String(y)]) s.years[String(y)] = blankYear();
    });

  const startNewYear = () => {
    const def = String(Math.max(...Object.keys(store.years).map(Number)) + 1);
    const v = window.prompt(
      'Start a new reporting year — a fresh empty dashboard.\nPrevious years stay saved and are reachable from the year dropdown.\n\nYear:',
      def
    );
    if (v == null) return;
    const y = parseInt(v, 10);
    if (!y || y < 2000 || y > 2100) {
      window.alert('Please enter a valid year (2000–2100).');
      return;
    }
    if (store.years[String(y)] && !window.confirm(`Year ${y} already exists. Switch to it? (existing data is kept)`)) {
      return;
    }
    setStore((s) => {
      if (!s.years[String(y)]) s.years[String(y)] = blankYear();
      s.activeYear = y;
      s.activeMonth = 'Jan';
    });
  };

  return (
    <header
      className="appbar"
      style={{
        flex: 'none',
        height: 60,
        background: '#fff',
        borderBottom: '1px solid #dde3ea',
        display: 'flex',
        alignItems: 'center',
        padding: '0 26px',
        gap: 18,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.2 }}>{title}</div>
        <div style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{subFull}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          title="ทุกคนที่เปิดแอปนี้เห็นข้อมูลชุดเดียวกันจากเซิร์ฟเวอร์กลาง"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: sync.color, marginRight: 4 }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sync.dot, flex: 'none' }} />
          {sync.label}
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1, color: '#8a97a6', textTransform: 'uppercase' }}>
          Period
        </span>
        <select value={store.activeMonth} onChange={(e) => onMonth(e.target.value as MonthName)} style={selectStyle}>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={store.activeYear} onChange={(e) => onYear(Number(e.target.value))} style={selectStyle}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {isAdmin && (
          <button
            onClick={startNewYear}
            title="Start a new reporting year — fresh empty dashboard. Previous years stay saved."
            style={{
              height: 36, border: '1px dashed #b6c0cc', borderRadius: 7, padding: '0 12px', background: '#fff',
              color: '#46566a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span>Year
          </button>
        )}
        <button
          onClick={() => exportYearToExcel(year, store.activeYear)}
          title={`Download all ${store.activeYear} data as Excel (Safety, Reliability, Cost, Maintenance)`}
          style={{
            height: 36, border: '1px solid #cfd7e0', borderRadius: 7, padding: '0 14px', background: '#fff',
            color: colors.ink, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          <span style={{ fontSize: 14 }}>⤓</span>Export data
        </button>
        <button
          onClick={() => setView('slides')}
          style={{
            height: 36, border: 'none', borderRadius: 7, padding: '0 16px', background: colors.green,
            color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 1px 2px rgba(0,0,0,.12)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#8fe3a8' }} />Generate Slides
        </button>
        <button
          onClick={() => setPresentOpen(true)}
          style={{
            height: 36, border: 'none', borderRadius: 7, padding: '0 16px', background: colors.navy,
            color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 1px 2px rgba(0,0,0,.12)',
          }}
        >
          ▶ Present
        </button>
        <AdminLock />
      </div>
    </header>
  );
}
