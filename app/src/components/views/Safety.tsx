import { useStore } from '../../store/StoreContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import { MONTHS, RECORDABLE_CATEGORIES, SAFETY_CATEGORIES, type SafetyCategory } from '../../types/models';
import { monthOf, safetyMonthlyCounts, safetyRecordable, uid } from '../../utils/calc';

export default function Safety() {
  const { year, setStore } = useStore();
  const counts = safetyMonthlyCounts(year);
  const recordable = safetyRecordable(year);

  const onCellY25 = (i: number, v: string) =>
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      yr.safety.matrix[i].y25 = v;
    });

  const addLog = () =>
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      yr.safety.log.push({ id: uid(), date: '', month: s.activeMonth, type: 'Property Damage', description: '' });
    });

  const onLogField = (i: number, field: 'date' | 'type' | 'description', v: string) =>
    setStore((s) => {
      const l = s.years[String(s.activeYear)].safety.log[i];
      (l as any)[field] = v;
      if (field === 'date' && v) l.month = monthOf(v);
    });

  const delLog = (i: number) =>
    setStore((s) => {
      s.years[String(s.activeYear)].safety.log.splice(i, 1);
    });

  const th: React.CSSProperties = { padding: '9px 14px', fontWeight: 600 };

  return (
    <EditGate>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: colors.green, borderRadius: 9, padding: '10px 18px' }}>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1, color: '#fff' }}>SAFETY</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 9, padding: '9px 16px' }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: '#7c8a99', textTransform: 'uppercase' }}>Recordable YTD</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: colors.green }}>{recordable}</span>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 780 }}>
            <thead>
              <tr style={{ background: colors.green, color: '#fff' }}>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, minWidth: 170 }}>Incident</th>
                <th style={{ padding: '9px 8px', fontWeight: 600, background: '#11502590' }}>Y25</th>
                {MONTHS.map((mn) => (
                  <th key={mn} style={{ padding: '9px 4px', fontWeight: 600, width: 48 }}>
                    {mn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAFETY_CATEGORIES.map((cat, i) => {
                const isRec = RECORDABLE_CATEGORIES.includes(cat as SafetyCategory);
                const m = counts[cat];
                return (
                  <tr key={cat} style={{ borderTop: '1px solid #eef1f5' }}>
                    <td style={{ padding: '7px 14px', fontWeight: 700, color: isRec ? colors.green : '#5a6878' }}>{cat}</td>
                    <td style={{ padding: '5px 6px', textAlign: 'center', background: '#f6f8fa' }}>
                      <input
                        type="number"
                        value={year.safety.matrix[i].y25}
                        onChange={(e) => onCellY25(i, e.target.value)}
                        style={{ width: 40, textAlign: 'center', border: '1px solid #e6ebf0', borderRadius: 5, padding: '4px 2px', fontFamily: fonts.mono, color: '#8895a3' }}
                      />
                    </td>
                    {m.map((v, mi) => (
                      <td key={mi} style={{ padding: '5px 3px', textAlign: 'center' }}>
                        <div
                          style={{
                            width: 40, margin: '0 auto', textAlign: 'center', borderRadius: 5, padding: '5px 2px',
                            fontFamily: fonts.mono, fontWeight: 700,
                            background: v > 0 ? colors.dangerBg : 'transparent', color: v > 0 ? colors.danger : '#c2ccd7',
                          }}
                        >
                          {v || ''}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>Incident log</div>
        <button onClick={addLog} style={{ height: 36, border: 'none', borderRadius: 8, padding: '0 15px', background: colors.navy, color: '#fff', fontWeight: 700, fontSize: 13 }}>
          + Add log
        </button>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.navy, color: '#fff', textAlign: 'left' }}>
              <th style={{ ...th, width: 140 }}>Date</th>
              <th style={{ ...th, width: 180 }}>Type</th>
              <th style={th}>Description</th>
              <th style={{ width: 46 }} />
            </tr>
          </thead>
          <tbody>
            {year.safety.log.map((l, i) => (
              <tr key={l.id} style={{ borderTop: '1px solid #eef1f5' }}>
                <td style={{ padding: '6px 12px' }}>
                  <input
                    type="date"
                    value={l.date}
                    onChange={(e) => onLogField(i, 'date', e.target.value)}
                    style={{ border: '1px solid #eef1f5', borderRadius: 6, padding: '5px 7px', fontFamily: fonts.mono, fontSize: 12 }}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <select
                    value={l.type}
                    onChange={(e) => onLogField(i, 'type', e.target.value)}
                    style={{ width: '100%', border: '1px solid #f0f2f5', borderRadius: 6, padding: '6px 7px', fontSize: 12 }}
                  >
                    <option value="">— type —</option>
                    {SAFETY_CATEGORIES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <input
                    value={l.description}
                    onChange={(e) => onLogField(i, 'description', e.target.value)}
                    placeholder="Incident description…"
                    style={{ width: '100%', border: '1px solid #f0f2f5', borderRadius: 6, padding: '6px 9px' }}
                  />
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <button onClick={() => delLog(i)} style={{ border: 'none', background: 'none', color: '#c0392b', fontSize: 14 }}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {year.safety.log.length === 0 && (
          <div style={{ padding: 28, textAlign: 'center', color: '#8895a3', fontSize: 13 }}>No incident logged — click “Add log”.</div>
        )}
      </div>
    </div>
    </EditGate>
  );
}
