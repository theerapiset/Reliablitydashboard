import { useRef } from 'react';
import { useStore } from '../../store/StoreContext';
import { useAuth } from '../../store/AuthContext';

// Pasting from another app normally carries over its own font/size as
// inline styles on the pasted HTML. Stripping to plain text makes pasted
// content inherit this field's own font/size instead.
function pasteAsPlainText(e: React.ClipboardEvent<HTMLElement>) {
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

export default function Editable({
  ovKey,
  html,
  style,
  tag = 'div',
  resettable = false,
}: {
  ovKey: string;
  html: string;
  style?: React.CSSProperties;
  tag?: 'div' | 'span';
  resettable?: boolean;
}) {
  const { year, setStore } = useStore();
  const { isAdmin } = useAuth();
  const ovr = year.ovr || {};
  const hasOverride = ovr[ovKey] != null;
  const effective = hasOverride ? ovr[ovKey] : html;
  const focusHtmlRef = useRef<string | null>(null);

  const onFocus = (e: React.FocusEvent<HTMLDivElement | HTMLSpanElement>) => {
    focusHtmlRef.current = e.currentTarget.innerHTML;
  };

  const onBlur = (e: React.FocusEvent<HTMLDivElement | HTMLSpanElement>) => {
    if (!isAdmin) return;
    const newHtml = e.currentTarget.innerHTML;
    // Clicking in and out without changing anything must not freeze a
    // data-driven field (e.g. an auto-built event list) against future data.
    if (newHtml === focusHtmlRef.current) return;
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      if (!yr.ovr) yr.ovr = {};
      yr.ovr[ovKey] = newHtml;
    });
  };

  const onReset = () => {
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      if (yr.ovr) delete yr.ovr[ovKey];
    });
  };

  const Tag = tag as any;
  return (
    <div style={{ position: 'relative' }}>
      <Tag
        contentEditable={isAdmin}
        suppressContentEditableWarning
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={isAdmin ? pasteAsPlainText : undefined}
        style={{ outline: 'none', cursor: isAdmin ? 'text' : 'default', ...style }}
        dangerouslySetInnerHTML={{ __html: effective }}
      />
      {resettable && isAdmin && hasOverride && (
        <button
          onClick={onReset}
          title="Reset to auto-generated list from data"
          style={{
            position: 'absolute', top: -2, right: -2, fontSize: 10.5, fontWeight: 600, color: '#8895a3',
            background: '#fff', border: '1px solid #dde3ea', borderRadius: 5, padding: '2px 6px', cursor: 'pointer',
          }}
        >
          ↺ Reset to auto
        </button>
      )}
    </div>
  );
}
