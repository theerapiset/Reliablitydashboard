import type { ConcernBlock } from '../../types/models';

/**
 * Renders a free-layout canvas's blocks as absolutely-positioned elements.
 * Shared by every place that displays a `ConcernBlock[]` field (Concerning
 * Equipment, Shutdown Performance's Highlight Activities, …) so the
 * stacking/positioning logic — and its history of DOM-order bugs — lives in
 * exactly one place. Blocks stay in stable array order; stacking is purely
 * `zIndex`, never DOM reordering (see ConcernCanvasEditor.tsx for why).
 */
export default function CanvasLayer({
  blocks,
  textColor,
  fontSize,
}: {
  blocks: ConcernBlock[];
  textColor: string;
  fontSize: string | number;
}) {
  return (
    <>
      {blocks.map((b) =>
        b.type === 'text' ? (
          <div
            key={b.id}
            style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, zIndex: b.z, fontSize, lineHeight: 1.5, color: textColor, overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: b.html || '' }}
          />
        ) : (
          <img
            key={b.id}
            src={b.src}
            style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, zIndex: b.z, objectFit: 'contain' }}
          />
        )
      )}
    </>
  );
}
