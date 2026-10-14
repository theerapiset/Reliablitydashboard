import { SlideFrame, Glass, Pill, EffectiveHtml } from '../ui';
import CanvasLayer from '../../slides/CanvasLayer';
import { esc, nl2br, concernPageContent } from '../../../utils/calc';
import { pt } from '../../../presentTheme';
import type { ConcernItem, ConcernPage } from '../../../types/models';

function cardBody(p: ConcernPage): string {
  const row = (l: string, v: string, col?: string) =>
    v ? `<div style="margin-bottom:7px"><strong style="color:${col || pt.text}">${esc(l)}</strong> <span style="color:${pt.textMuted}">${nl2br(v)}</span></div>` : '';
  return (
    row('Issue', p.issue) +
    row('Possible cause', p.possibleCause) +
    row('Action', p.action) +
    row('Preventive', p.preventive) +
    row('Benefit', p.benefit, pt.green) +
    row('Notes', p.notes || '', pt.textFaint)
  );
}

export default function PresentConcern({
  item,
  pageIndex,
  pageCount,
  slideIndex,
}: {
  item: ConcernItem & { globalIdx: number };
  pageIndex: number;
  pageCount: number;
  slideIndex: number;
}) {
  const c = item;
  const page = concernPageContent(item, pageIndex);
  const statusColor = c.status === 'Resolved' ? pt.green : pt.amber;
  const bodyOvKey = pageIndex === 0 ? `s5.body.${c.globalIdx}` : `s5.body.${c.globalIdx}.extra.${pageIndex - 1}`;

  return (
    <SlideFrame kicker="05 · Concerning Equipment" title={<EffectiveHtml ovKey={`s5.head.${slideIndex}`} html="Concerning Equipment" />}>
      <Glass style={{ flex: 1, minHeight: 0, padding: page.fullImage ? 'clamp(10px,1.6vh,18px) clamp(14px,2vw,24px)' : 'clamp(16px,2.4vh,26px) clamp(20px,2.8vw,32px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: pt.blue, fontWeight: 700, fontSize: page.fullImage ? 'clamp(14px,1.15vw,17px)' : 'clamp(16px,1.3vw,19px)' }}>{c.equipment}</div>
            <div style={{ fontWeight: 800, fontSize: page.fullImage ? 'clamp(18px,1.6vw,22px)' : 'clamp(20px,1.9vw,27px)', color: pt.text, marginTop: 2 }}>{c.title}</div>
          </div>
          {pageCount > 1 && <Pill color={pt.textMuted}>Page {pageIndex + 1}/{pageCount}</Pill>}
          <Pill color={pt.blue}>{c.plant}</Pill>
          <Pill color={statusColor}>{c.status}</Pill>
        </div>

        {page.canvas?.length ? (
          <div style={{ flex: 1, minHeight: 0, marginTop: 16, position: 'relative' }}>
            <CanvasLayer blocks={page.canvas} textColor={pt.textMuted} fontSize="clamp(13px,1.05vw,16px)" />
          </div>
        ) : page.fullImage ? (
          <div style={{ flex: 1, minHeight: 0, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {page.images.length > 0 ? (
              page.images.map((img, ii) => (
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
            <div style={{ marginTop: 16, flex: page.images.length ? 'none' : 1, minHeight: 0, overflow: 'auto' }}>
              <EffectiveHtml ovKey={bodyOvKey} html={cardBody(page)} style={{ fontSize: 'clamp(14px,1.2vw,18px)', lineHeight: 1.7 }} />
            </div>
            {page.images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, flex: 1, minHeight: 0, overflow: 'auto', alignContent: 'flex-start' }}>
                {page.images.map((img, ii) => (
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
