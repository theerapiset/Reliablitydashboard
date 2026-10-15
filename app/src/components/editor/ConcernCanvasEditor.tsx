import { useEffect, useRef, useState } from 'react';
import { colors, fonts } from '../../theme';
import { defaultConcernBlocks, uid } from '../../utils/calc';
import { uploadImages } from '../../utils/uploadImage';
import type { ConcernBlock } from '../../types/models';

const SWATCHES = ['#16202b', '#1668c4', '#15662f', '#cf2e2e', '#c47e1a'];
const SIZES = [11, 13, 16, 20, 24];
const MIN_W = 6;
const MIN_H = 5;

// Pasting from another app (Word, a webpage, …) normally carries over its
// own font/size as inline styles on the pasted HTML — exactly the "pasted
// text looks small and in a different font" complaint. Stripping to plain
// text makes pasted content inherit this block's own font/size instead.
function pasteAsPlainText(e: React.ClipboardEvent<HTMLDivElement>) {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const lines = text.split(/\r\n|\r|\n/);
  const frag = document.createDocumentFragment();
  let lastNode: Node = frag;
  lines.forEach((line, i) => {
    const node = document.createTextNode(line);
    frag.appendChild(node);
    lastNode = node;
    if (i < lines.length - 1) frag.appendChild(document.createElement('br'));
  });
  range.insertNode(frag);
  const newRange = document.createRange();
  newRange.setStartAfter(lastNode);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

interface DragState {
  id: string;
  mode: 'move' | 'resize';
  type: ConcernBlock['type'];
  wasSelected: boolean;
  startClientX: number;
  startClientY: number;
  startBox: { x: number; y: number; w: number; h: number };
}

// Reused for any free-layout canvas field (Concerning Equipment's body,
// Shutdown Performance's Highlight Activities, …) — `getDefaultBlocks` /
// `resetLabel` let each caller decide what "reset" means for it.
export default function ConcernCanvasEditor({
  blocks,
  onChange,
  onClose,
  getDefaultBlocks = defaultConcernBlocks,
  resetLabel = '↺ Reset to template',
  resetConfirm = 'Reset to the standard template? This replaces the current free layout.',
}: {
  blocks: ConcernBlock[];
  onChange: (blocks: ConcernBlock[]) => void;
  onClose: () => void;
  getDefaultBlocks?: () => ConcernBlock[];
  resetLabel?: string;
  resetConfirm?: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const editRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Click-to-edit shouldn't depend on the OS/browser recognizing a fast
  // double-click — that's finicky (two clicks a beat too far apart never
  // register as one, which is exactly what showed up as "sometimes works,
  // sometimes doesn't"). Instead we decide on mouseup: a click on a block
  // that was already selected before this click (and wasn't a drag) enters
  // edit mode too — see onDragEnd.
  const movedRef = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Setting contentEditable=true on re-render doesn't move DOM focus there
  // by itself — the browser only auto-focuses an element that was already
  // editable at click time. Focus it explicitly once it becomes editable.
  useEffect(() => {
    if (editingId) {
      const el = editRefs.current[editingId];
      el?.focus();
      const sel = window.getSelection();
      if (sel && el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [editingId]);

  const selected = blocks.find((b) => b.id === selectedId) || null;

  const updateBlock = (id: string, patch: Partial<ConcernBlock>, base: ConcernBlock[] = blocks) => {
    onChange(base.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  // Reading `editRefs`/`blocks` live (not via a stale closure) so this can
  // be called synchronously at the start of any handler that's about to
  // change state while a block is mid-edit. execCommand mutates the
  // contentEditable DOM directly, bypassing React — if some other state
  // change re-renders that block before this syncs, React reconciles its
  // dangerouslySetInnerHTML against the last-known (pre-edit) value and
  // wipes the live formatting out from under the user. Committing first
  // means any such re-render uses the just-typed content instead.
  const commitIfEditing = (): ConcernBlock[] => {
    if (editingId) {
      const el = editRefs.current[editingId];
      if (el) {
        const next = blocks.map((b) => (b.id === editingId ? { ...b, html: el.innerHTML } : b));
        onChange(next);
        return next;
      }
    }
    return blocks;
  };

  const bringToFront = (id: string, base: ConcernBlock[]) => {
    const maxZ = Math.max(0, ...base.map((b) => b.z));
    updateBlock(id, { z: maxZ + 1 }, base);
  };

  const addText = () => {
    const base = commitIfEditing();
    const maxZ = Math.max(0, ...base.map((b) => b.z));
    const block: ConcernBlock = { id: uid(), type: 'text', x: 8, y: 8, w: 36, h: 16, z: maxZ + 1, html: '<div>New text — double-click to edit</div>' };
    onChange([...base, block]);
    setSelectedId(block.id);
    setEditingId(null);
  };

  const addImages = async (files: FileList | File[]) => {
    const base = commitIfEditing();
    setEditingId(null);
    setUploading(true);
    try {
      const urls = await uploadImages(files, 'concern');
      const maxZ = Math.max(0, ...base.map((b) => b.z));
      const added = urls.map((src, i) => ({ id: uid(), type: 'image' as const, x: 50, y: 6 + i * 4, w: 42, h: 40, z: maxZ + 1 + i, src }));
      if (added.length) onChange([...base, ...added]);
    } catch (e) {
      console.warn('Image upload failed', e);
      window.alert('อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  const deleteBlock = (id: string) => {
    const base = commitIfEditing();
    onChange(base.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  const resetToTemplate = () => {
    if (!window.confirm(resetConfirm)) return;
    onChange(getDefaultBlocks());
    setSelectedId(null);
    setEditingId(null);
  };

  const startDrag = (e: React.MouseEvent, id: string, mode: 'move' | 'resize') => {
    if (editingId === id) return;
    e.preventDefault();
    e.stopPropagation();
    const base = commitIfEditing();
    setEditingId(null);
    const block = base.find((b) => b.id === id);
    if (!block) return;
    const wasSelected = mode === 'move' && selectedId === id;
    movedRef.current = 0;
    setSelectedId(id);
    bringToFront(id, base);
    dragRef.current = {
      id,
      mode,
      type: block.type,
      wasSelected,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startBox: { x: block.x, y: block.y, w: block.w, h: block.h },
    };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  };

  const onDragMove = (e: MouseEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dxPct = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startClientY) / rect.height) * 100;
    movedRef.current = Math.max(movedRef.current, Math.abs(e.clientX - drag.startClientX), Math.abs(e.clientY - drag.startClientY));
    if (drag.mode === 'move') {
      const x = Math.min(100 - drag.startBox.w, Math.max(0, drag.startBox.x + dxPct));
      const y = Math.min(100 - drag.startBox.h, Math.max(0, drag.startBox.y + dyPct));
      updateBlock(drag.id, { x, y });
    } else {
      const w = Math.min(100 - drag.startBox.x, Math.max(MIN_W, drag.startBox.w + dxPct));
      const h = Math.min(100 - drag.startBox.y, Math.max(MIN_H, drag.startBox.h + dyPct));
      updateBlock(drag.id, { w, h });
    }
  };

  const onDragEnd = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    // Nothing moved and the block was already selected before this click —
    // treat it as "click again to edit" instead of requiring a real dblclick.
    if (drag && drag.wasSelected && drag.type === 'text' && movedRef.current < 4) {
      setEditingId(drag.id);
    }
  };

  const applyFormat = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
  };

  // execCommand('fontSize') only supports the legacy 1-7 scale and produces
  // non-exportable <font> tags, so size is applied by hand: wrap the
  // selection in a span with an inline font-size instead.
  const applyFontSize = (px: number) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${px}px`;
    try {
      range.surroundContents(span);
    } catch {
      // Selection crosses more than one element (e.g. spans two lines) —
      // surroundContents can't wrap that directly, so move the content in.
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
  };

  const onPasteImage = (e: React.ClipboardEvent) => {
    if (editingId) return; // pasting into a text block should paste text, not intercept as an image
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      addImages(files);
    }
  };

  const commitEditingHtml = (id: string, el: HTMLElement) => {
    updateBlock(id, { html: el.innerHTML });
  };

  const btnStyle: React.CSSProperties = {
    height: 32, border: '1px solid #cfd7e0', background: '#fff', borderRadius: 7, padding: '0 12px', fontSize: 12.5, fontWeight: 600, color: colors.ink,
  };

  return (
    <div onPaste={onPasteImage} style={{ position: 'fixed', inset: 0, background: 'rgba(13,28,44,.72)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 70px rgba(0,0,0,.4)', width: 'min(1180px, 100%)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #eef1f5', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginRight: 8 }}>Free layout — drag to move, corner handle to resize, click a text box then click again (or double-click) to edit it, paste (Ctrl/⌘+V) an image anywhere</div>
          <div style={{ flex: 1 }} />
          <button onClick={addText} style={btnStyle}>＋ Text</button>
          <label style={{ ...btnStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            {uploading ? 'Uploading…' : '＋ Image'}
            <input
              type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={uploading}
              onChange={(e) => { if (e.target.files?.length) addImages(e.target.files); e.target.value = ''; }}
            />
          </label>
          <button onClick={resetToTemplate} style={btnStyle}>{resetLabel}</button>
          <button onClick={onClose} style={{ ...btnStyle, background: colors.navy, color: '#fff', border: 'none' }}>Done</button>
        </div>

        {/* Always rendered (even with nothing selected) so this row's height
            never changes mid-interaction — otherwise selecting a block on
            the first click of a double-click shifts the canvas down and the
            second click lands on the wrong spot. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderBottom: '1px solid #eef1f5', background: '#f8fafc', height: 48, boxSizing: 'border-box', flex: 'none', visibility: selected ? 'visible' : 'hidden' }}>
          <span style={{ fontSize: 11, color: colors.muted, marginRight: 4 }}>Selected:</span>
          {selected?.type === 'text' && (
            <>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('bold')} style={{ ...btnStyle, width: 32, padding: 0, fontWeight: 800 }}>B</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('underline')} style={{ ...btnStyle, width: 32, padding: 0, textDecoration: 'underline' }}>U</button>
              <div style={{ width: 1, height: 20, background: '#e2e7ee', margin: '0 2px' }} />
              {SIZES.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFontSize(s)}
                  title={`${s}px`}
                  style={{ ...btnStyle, width: 'auto', padding: '0 8px', fontSize: Math.min(16, 10 + s / 4) }}
                >
                  {s}
                </button>
              ))}
              <div style={{ width: 1, height: 20, background: '#e2e7ee', margin: '0 2px' }} />
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('foreColor', c)}
                  title={c}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #fff', outline: '1px solid #cfd7e0', background: c, padding: 0 }}
                />
              ))}
              <span style={{ fontSize: 11, color: colors.muted, marginLeft: 6 }}>(double-click the text box, select text, then pick a style or size)</span>
            </>
          )}
          <div style={{ flex: 1 }} />
          {selected && (
            <button onClick={() => deleteBlock(selected.id)} style={{ ...btnStyle, borderColor: '#f0d4d4', color: '#c0392b' }}>🗑 Delete block</button>
          )}
        </div>

        <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
          <div
            ref={canvasRef}
            onMouseDown={() => {
              commitIfEditing();
              setSelectedId(null);
              setEditingId(null);
            }}
            style={{ position: 'relative', width: '100%', maxWidth: 1040, aspectRatio: '2.25 / 1', background: '#eef3f8', borderRadius: 11, border: '1px solid #d8dee6', overflow: 'hidden' }}
          >
            {blocks.map((b) => {
              const isSelected = b.id === selectedId;
              const isEditing = b.id === editingId;
              return (
                <div
                  key={b.id}
                  onMouseDown={(e) => startDrag(e, b.id, 'move')}
                  onDoubleClick={(e) => {
                    if (b.type !== 'text') return;
                    e.stopPropagation();
                    setSelectedId(b.id);
                    setEditingId(b.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`,
                    // Stacking is purely a CSS zIndex concern — the blocks
                    // stay in stable DOM order (keyed by id) regardless of
                    // which one is on top. Reordering the DOM on every click
                    // (bringToFront used to resort the array) could move a
                    // block's node between the two clicks of a double-click,
                    // which intermittently broke the browser's dblclick
                    // detection — exactly the "sometimes works" symptom.
                    zIndex: b.z,
                    border: isSelected ? `2px solid ${colors.blue}` : '1px dashed transparent',
                    cursor: isEditing ? 'text' : 'move',
                    boxSizing: 'border-box',
                    background: b.type === 'text' ? 'rgba(255,255,255,.55)' : 'transparent',
                    overflow: 'hidden',
                  }}
                >
                  {b.type === 'text' ? (
                    <div
                      ref={(el) => { editRefs.current[b.id] = el; }}
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
                      onPaste={isEditing ? pasteAsPlainText : undefined}
                      onBlur={(e) => { commitEditingHtml(b.id, e.currentTarget); setEditingId(null); }}
                      style={{ width: '100%', height: '100%', padding: '6px 8px', fontSize: 13, lineHeight: 1.5, outline: 'none', overflow: 'auto', cursor: isEditing ? 'text' : 'inherit' }}
                      dangerouslySetInnerHTML={{ __html: b.html || '' }}
                    />
                  ) : (
                    <img src={b.src} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                  )}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => startDrag(e, b.id, 'resize')}
                      style={{ position: 'absolute', right: -6, bottom: -6, width: 14, height: 14, borderRadius: 4, background: colors.blue, border: '2px solid #fff', cursor: 'nwse-resize' }}
                    />
                  )}
                </div>
              );
            })}
            {blocks.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8895a3', fontSize: 13 }}>
                Empty canvas — click ＋ Text or ＋ Image (or paste an image), or "{resetLabel}".
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '0 20px 18px', fontSize: 11.5, color: colors.muted, fontFamily: fonts.mono }}>
          Layout shown here matches the exported slide/PDF/PPTX exactly.
        </div>
      </div>
    </div>
  );
}
