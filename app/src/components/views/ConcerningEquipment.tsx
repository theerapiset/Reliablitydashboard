import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useUI } from '../../store/UIContext';
import EditGate from '../EditGate';
import { colors, fonts } from '../../theme';
import { blankRow } from '../editor/blankRow';
import { uid } from '../../utils/calc';
import { MONTHS, type ConcernItem } from '../../types/models';

export default function ConcerningEquipment() {
  const { store, year, setStore } = useStore();
  const { openEditor } = useUI();
  const [carryFrom, setCarryFrom] = useState('');

  const curMonth = store.activeMonth;
  const ci = MONTHS.indexOf(curMonth);
  const cards = year.concern.filter((c) => c.month === curMonth);
  const monitoring = cards.filter((c) => c.status === 'Monitoring').length;
  const resolved = cards.filter((c) => c.status === 'Resolved').length;
  const carryMonths = MONTHS.filter((mn, mi) => mi < ci && year.concern.some((c) => c.month === mn));
  const prevConcern = year.concern
    .map((c, i) => ({ i, ...c }))
    .filter((c) => MONTHS.indexOf(c.month as (typeof MONTHS)[number]) < ci)
    .reverse();

  const openAdd = () => openEditor({ module: 'concern', idx: -1, data: blankRow('concern', store) });
  const openEdit = (i: number, c: ConcernItem) => openEditor({ module: 'concern', idx: i, data: JSON.parse(JSON.stringify(c)) });
  const deleteRow = (i: number) => {
    if (!window.confirm('Delete this record?')) return;
    setStore((s) => {
      s.years[String(s.activeYear)].concern.splice(i, 1);
    });
  };

  const carryForward = () => {
    if (!carryFrom) {
      window.alert('Choose a month to carry items from.');
      return;
    }
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      const src = yr.concern.filter((c) => c.month === carryFrom);
      const existing = new Set(yr.concern.filter((c) => c.month === curMonth).map((c) => c.equipment));
      src.forEach((c) => {
        if (existing.has(c.equipment)) return;
        yr.concern.push({ ...JSON.parse(JSON.stringify(c)), id: uid(), month: curMonth });
      });
    });
  };
  const carryOne = (i: number) =>
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      const c = yr.concern[i];
      if (c) yr.concern.push({ ...JSON.parse(JSON.stringify(c)), id: uid(), month: curMonth });
    });

  const statusColors = (status: string) => (status === 'Resolved' ? { color: colors.green, bg: colors.greenBg } : { color: colors.amber, bg: colors.amberBg });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 9, padding: '8px 14px' }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Showing</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            {curMonth} {store.activeYear}
          </span>
        </div>
        <span style={{ fontSize: 13, color: colors.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: colors.amber2 }} />
          {monitoring} monitoring
        </span>
        <span style={{ fontSize: 13, color: colors.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: colors.green }} />
          {resolved} resolved
        </span>
        <div style={{ flex: 1 }} />
        {carryMonths.length > 0 && (
          <EditGate>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #cfd7e0', borderRadius: 8, padding: '5px 7px' }}>
              <span style={{ fontSize: 12, color: colors.muted }}>Carry from</span>
              <select value={carryFrom} onChange={(e) => setCarryFrom(e.target.value)} style={{ height: 28, border: '1px solid #cfd7e0', borderRadius: 6, padding: '0 6px', fontWeight: 600, fontSize: 12 }}>
                <option value="">month…</option>
                {carryMonths.map((mn) => (
                  <option key={mn} value={mn}>
                    {mn}
                  </option>
                ))}
              </select>
              <button onClick={carryForward} style={{ height: 28, border: 'none', borderRadius: 6, padding: '0 11px', background: '#2a6fae', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                ↩ Bring forward
              </button>
            </div>
          </EditGate>
        )}
        <EditGate>
          <button
            onClick={openAdd}
            style={{ height: 38, border: 'none', borderRadius: 8, padding: '0 17px', background: colors.navy, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>Add equipment
          </button>
        </EditGate>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {cards.map((c) => {
          const i = year.concern.indexOf(c);
          const sc = statusColors(c.status);
          return (
            <div key={c.id} style={{ background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.blue, fontWeight: 700, fontSize: 14 }}>{c.equipment}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1d2733', marginTop: 1 }}>{c.title}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#e7f0fb', color: colors.blue, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>{c.plant}</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>{c.status}</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.55, color: '#3a4654' }}>
                {c.issue && (
                  <div style={{ marginBottom: 4 }}>
                    <strong style={{ color: '#1d2733' }}>Issue</strong> {c.issue}
                  </div>
                )}
                {c.possibleCause && (
                  <div style={{ marginBottom: 4 }}>
                    <strong style={{ color: '#1d2733' }}>Possible cause</strong> {c.possibleCause}
                  </div>
                )}
                {c.action && (
                  <div style={{ marginBottom: 4 }}>
                    <strong style={{ color: '#1d2733' }}>Action</strong> {c.action}
                  </div>
                )}
                {c.preventive && (
                  <div style={{ marginBottom: 4 }}>
                    <strong style={{ color: '#1d2733' }}>Preventive</strong> {c.preventive}
                  </div>
                )}
                {c.benefit && (
                  <div style={{ color: colors.green }}>
                    <strong>Benefit</strong> {c.benefit}
                  </div>
                )}
              </div>
              {c.images.length > 0 && (
                <div style={{ display: 'flex', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
                  {c.images.map((img, ii) => (
                    <img key={ii} src={img.src} style={{ height: Math.min(80, img.h), maxWidth: '100%', borderRadius: 6, border: '1px solid #d8dee6', objectFit: 'contain', background: '#fff' }} />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, borderTop: '1px solid #f0f2f5', paddingTop: 10 }}>
                <button onClick={() => openEdit(i, c)} style={{ border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>
                  Edit
                </button>
                <EditGate>
                  <button onClick={() => deleteRow(i)} style={{ border: '1px solid #f0d4d4', background: '#fff', color: '#c0392b', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}>
                    Delete
                  </button>
                </EditGate>
              </div>
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div style={{ padding: 36, textAlign: 'center', color: '#8895a3', fontSize: 13, background: '#fff', border: `1px solid ${colors.cardBorder}`, borderRadius: 11 }}>
          No concerning equipment for <strong>{curMonth} {store.activeYear}</strong> yet.
          <br />
          <span style={{ fontSize: 12, color: '#a7b2bd' }}>Click "Add equipment", or use "Bring forward" to carry items from a previous month and update them.</span>
        </div>
      )}

      {prevConcern.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.2, color: '#8895a3', textTransform: 'uppercase', marginBottom: 8 }}>
            From earlier months — click ↩ to bring into {curMonth} {store.activeYear}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {prevConcern.map((p) => {
              const sc = statusColors(p.status);
              return (
                <div key={p.i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #eef1f5', borderRadius: 9, padding: '9px 13px' }}>
                  <span style={{ width: 42, flex: 'none', fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: '#7c8a99' }}>{p.month}</span>
                  <span style={{ flex: 'none', color: colors.blue, fontWeight: 700, fontSize: 13 }}>{p.equipment}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: '#46566a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                  <span style={{ flex: 'none', fontSize: 10.5, fontWeight: 700, background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 5 }}>{p.status}</span>
                  <EditGate>
                    <button onClick={() => carryOne(p.i)} title={`Copy into ${curMonth} ${store.activeYear}`} style={{ flex: 'none', border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#2a6fae' }}>
                      ↩ Bring
                    </button>
                  </EditGate>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
