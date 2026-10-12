import { useUI } from '../store/UIContext';
import { useStore } from '../store/StoreContext';
import type { ViewId } from '../types/models';
import { colors, fonts } from '../theme';

interface NavItem {
  id: ViewId;
  label: string;
  dot: string;
  badge?: number;
}

export default function Sidebar() {
  const { view, setView } = useUI();
  const { store, year } = useStore();
  const concernCount = year.concern.filter((c) => c.month === store.activeMonth).length;
  const shutdownPerfCount = (year.shutdownPerf || []).filter((p) => p.month === store.activeMonth).length;

  const nav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', dot: '#5a8fd6' },
    { id: 'safety', label: 'Safety', dot: '#3fae6a', badge: year.safety.log.length },
    { id: 'reliability', label: 'Reliability', dot: '#5a8fd6', badge: year.cta.length + year.pta.length },
    { id: 'cost', label: 'Cost Saving', dot: '#e8b53a', badge: year.cost.length },
    { id: 'maint', label: 'Maintenance Cost', dot: '#d98036' },
    { id: 'shutdown', label: 'Shutdown Activities', dot: '#d98036', badge: year.shutdowns.length },
    { id: 'shutdownPerf', label: 'Shutdown Performance', dot: '#d98036', badge: shutdownPerfCount },
    { id: 'concern', label: 'Concerning Equip.', dot: '#cf6a6a', badge: concernCount },
    { id: 'slides', label: 'Monthly Slides', dot: '#8fe3a8' },
  ];

  const recordCount =
    year.safety.log.length + year.cta.length + year.pta.length + year.cost.length + concernCount;

  return (
    <aside
      style={{
        width: 236,
        flex: 'none',
        background: colors.navDark,
        color: '#aebfd0',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #0a1a2a',
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: `1px solid ${colors.navHairline}`,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            flex: 'none',
            border: '2px solid #fff',
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.condensed,
            fontWeight: 700,
            fontSize: 11,
            lineHeight: 0.92,
            color: '#fff',
            letterSpacing: 0.5,
            transform: 'skewX(-7deg)',
          }}
        >
          <span style={{ transform: 'skewX(7deg)' }}>
            GCM
            <br />
            PTA
          </span>
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 0.2 }}>Maintenance KPI</div>
          <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: '#5f7286' }}>
            monthly cockpit
          </div>
        </div>
      </div>
      <nav style={{ padding: 12, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '9px 11px',
                borderRadius: 7,
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                background: active ? colors.navActive : 'transparent',
                color: active ? '#fff' : '#aebfd0',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 2, flex: 'none', background: item.dot }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {!!item.badge && (
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    background: colors.navHairline,
                    color: '#9fb4c8',
                    padding: '1px 6px',
                    borderRadius: 9,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div
        style={{
          padding: '14px 18px',
          borderTop: `1px solid ${colors.navHairline}`,
          fontFamily: fonts.mono,
          fontSize: 10.5,
          color: '#5d7286',
          letterSpacing: 0.3,
        }}
      >
        <div style={{ color: '#7d93a8' }}>DATA · LOCAL BACKLOG</div>
        <div style={{ color: '#48607a', marginTop: 3 }}>
          {recordCount} records · FY {store.activeYear}
        </div>
      </div>
    </aside>
  );
}
