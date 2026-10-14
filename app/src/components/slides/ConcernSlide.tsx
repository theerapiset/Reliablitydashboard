import Editable from './Editable';
import CanvasLayer from './CanvasLayer';
import { colors } from '../../theme';
import { esc, nl2br, concernPageContent } from '../../utils/calc';
import type { ConcernItem, ConcernPage } from '../../types/models';

const Logo = () => (
  <div
    style={{
      width: 34, height: 34, border: '2px solid #fff', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Archivo Narrow',sans-serif", fontWeight: 700, fontSize: 10, lineHeight: 0.9, color: '#fff', transform: 'skewX(-7deg)',
    }}
  >
    <span style={{ transform: 'skewX(7deg)' }}>
      GCM
      <br />
      PTA
    </span>
  </div>
);

function cardBody(p: ConcernPage): string {
  const row = (l: string, v: string, col?: string) => (v ? `<div style="margin-bottom:5px"><strong style="color:${col || '#1d2733'}">${esc(l)}</strong> ${nl2br(v)}</div>` : '');
  return (
    row('Issue', p.issue) +
    row('Possible cause', p.possibleCause) +
    row('Action', p.action) +
    row('Preventive', p.preventive) +
    row('Benefit', p.benefit, '#15662f') +
    row('Notes', p.notes || '', '#5a6878')
  );
}

export default function ConcernSlide({
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
  const headHtml = 'Concerning Equipment';
  const c = item;
  const page = concernPageContent(item, pageIndex);
  const statusColor = c.status === 'Resolved' ? colors.green : colors.amber;
  const statusBg = c.status === 'Resolved' ? colors.greenBg : colors.amberBg;
  // Page 0's body override key is unchanged from before multi-page support
  // existed, so existing manual edits on single-page cases keep working.
  const bodyOvKey = pageIndex === 0 ? `s5.body.${c.globalIdx}` : `s5.body.${c.globalIdx}.extra.${pageIndex - 1}`;

  return (
    <section style={{ background: '#fff', fontFamily: "'Archivo','Helvetica Neue',Arial,sans-serif", display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ height: 62, background: '#16202b', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 14, flex: 'none' }}>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 13, color: '#9aa6b3', fontWeight: 600 }}>05</span>
        <Editable ovKey={`s5.head.${slideIndex}`} html={headHtml} style={{ fontSize: 25, fontWeight: 800, color: '#fff' }} />
        <div style={{ flex: 1 }} />
        <Logo />
      </div>
      <div style={{ flex: 1, padding: page.fullImage ? '10px 18px' : '22px 32px', minHeight: 0 }}>
        <div style={{ background: '#eef3f8', borderRadius: 11, padding: page.fullImage ? '10px 16px' : '20px 26px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.blue, fontWeight: 700, fontSize: page.fullImage ? 13 : 16 }}>{c.equipment}</div>
              <div style={{ fontWeight: 700, fontSize: page.fullImage ? 15 : 19, color: '#16202b', marginTop: 1 }}>{c.title}</div>
            </div>
            {pageCount > 1 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#e2e7ee', color: '#5a6878', padding: '4px 11px', borderRadius: 5, whiteSpace: 'nowrap' }}>
                Page {pageIndex + 1}/{pageCount}
              </span>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, background: '#dce8f6', color: colors.blue, padding: '4px 11px', borderRadius: 5, whiteSpace: 'nowrap' }}>{c.plant}</span>
            <span style={{ fontSize: 12, fontWeight: 700, background: statusBg, color: statusColor, padding: '4px 11px', borderRadius: 5, whiteSpace: 'nowrap' }}>{c.status}</span>
          </div>

          {page.canvas?.length ? (
            <div style={{ flex: 1, minHeight: 0, marginTop: 14, position: 'relative' }}>
              <CanvasLayer blocks={page.canvas} textColor="#3a4654" fontSize={14} />
            </div>
          ) : page.fullImage ? (
            <div style={{ flex: 1, minHeight: 0, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {page.images.length > 0 ? (
                page.images.map((img, ii) => (
                  <div key={ii} style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={img.src} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6, border: '1px solid #d8dee6', objectFit: 'contain', background: '#fff' }} />
                    {img.caption && <div style={{ fontSize: 12.5, color: '#5a6878', marginTop: 4, flex: 'none' }}>{img.caption}</div>}
                  </div>
                ))
              ) : (
                <div style={{ color: '#9aa6b3', fontSize: 13 }}>No screenshot attached.</div>
              )}
            </div>
          ) : (
            <>
              <div style={{ marginTop: 14, flex: page.images.length ? 'none' : 1, minHeight: 0, overflow: 'auto' }}>
                <Editable ovKey={bodyOvKey} html={cardBody(page)} style={{ fontSize: 14, lineHeight: 1.6, color: '#3a4654' }} />
              </div>
              {page.images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, flex: 1, minHeight: 0, overflow: 'auto', alignContent: 'flex-start' }}>
                  {page.images.map((img, ii) => (
                    <div key={ii} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <img src={img.src} style={{ height: img.h, maxWidth: '100%', borderRadius: 6, border: '1px solid #d8dee6', objectFit: 'contain', background: '#fff' }} />
                      {img.caption && <span style={{ fontSize: 11.5, color: '#7c8a99' }}>{img.caption}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
