import { SlideFrame, Glass, Pill, EffectiveHtml } from '../ui';
import CanvasLayer from '../../slides/CanvasLayer';
import { esc, nl2br } from '../../../utils/calc';
import { pt } from '../../../presentTheme';
import type { ConcernItem } from '../../../types/models';

function cardBody(c: ConcernItem): string {
  const row = (l: string, v: string, col?: string) =>
    v ? `<div style="margin-bottom:7px"><strong style="color:${col || pt.text}">${esc(l)}</strong> <span style="color:${pt.textMuted}">${nl2br(v)}</span></div>` : '';
  return (
    row('Issue', c.issue) +
    row('Possible cause', c.possibleCause) +
    row('Action', c.action) +
    row('Preventive', c.preventive) +
    row('Benefit', c.benefit, pt.green) +
    row('Notes', c.notes || '', pt.textFaint)
  );
}

export default function PresentConcern({ items, itemIndex }: { items: (ConcernItem & { globalIdx: number })[]; itemIndex: number }) {
  const c = items[0];
  if (!c) return null;
  const statusColor = c.status === 'Resolved' ? pt.green : pt.amber;

  return (
    <SlideFrame kicker="05 · Concerning Equipment" title={<EffectiveHtml ovKey={`s5.head.${itemIndex}`} html="Concerning Equipment" />}>
      <Glass style={{ flex: 1, minHeight: 0, padding: c.fullImage ? 'clamp(10px,1.6vh,18px) clamp(14px,2vw,24px)' : 'clamp(16px,2.4vh,26px) clamp(20px,2.8vw,32px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: pt.blue, fontWeight: 700, fontSize: c.fullImage ? 'clamp(14px,1.15vw,17px)' : 'clamp(16px,1.3vw,19px)' }}>{c.equipment}</div>
            <div style={{ fontWeight: 800, fontSize: c.fullImage ? 'clamp(18px,1.6vw,22px)' : 'clamp(20px,1.9vw,27px)', color: pt.text, marginTop: 2 }}>{c.title}</div>
          </div>
          <Pill color={pt.blue}>{c.plant}</Pill>
          <Pill color={statusColor}>{c.status}</Pill>
        </div>

        {c.canvas?.length ? (
          <div style={{ flex: 1, minHeight: 0, marginTop: 16, position: 'relative' }}>
            <CanvasLayer blocks={c.canvas} textColor={pt.textMuted} fontSize="clamp(13px,1.05vw,16px)" />
          </div>
        ) : c.fullImage ? (
          <div style={{ flex: 1, minHeight: 0, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {c.images.length > 0 ? (
              c.images.map((img, ii) => (
                <div key={ii} style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={img.src} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10, border: `1px solid ${pt.glassBorderStrong}`, objectFit: 'contain' }} />
                  {img.caption && <div style={{ fontSize: 'clamp(13px,1.05vw,16px)', color: pt.textMuted, marginTop: 6, flex: 'none' }}>{img.caption}</div>}
                </div>
              ))
            ) : (
              <div style={{ color: pt.textFaint, fontSize: 'clamp(14px,1.15vw,17px)' }}>No screenshot attached.</div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginTop: 16, flex: c.images.length ? 'none' : 1, minHeight: 0, overflow: 'auto' }}>
              <EffectiveHtml ovKey={`s5.body.${c.globalIdx}`} html={cardBody(c)} style={{ fontSize: 'clamp(14px,1.2vw,18px)', lineHeight: 1.7 }} />
            </div>
            {c.images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, flex: 1, minHeight: 0, overflow: 'auto', alignContent: 'flex-start' }}>
                {c.images.map((img, ii) => (
                  <div key={ii} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <img src={img.src} style={{ height: img.h, maxWidth: '100%', borderRadius: 8, border: `1px solid ${pt.glassBorderStrong}`, objectFit: 'contain' }} />
                    {img.caption && <span style={{ fontSize: 'clamp(12px,1vw,14px)', color: pt.textFaint }}>{img.caption}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Glass>
    </SlideFrame>
  );
}
