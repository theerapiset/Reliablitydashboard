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
}: {
  ovKey: string;
  html: string;
  style?: React.CSSProperties;
  tag?: 'div' | 'span';
}) {
  const { year, setStore } = useStore();
  const { isAdmin } = useAuth();
  const ovr = year.ovr || {};
  const effective = ovr[ovKey] != null ? ovr[ovKey] : html;

  const onBlur = (e: React.FocusEvent<HTMLDivElement | HTMLSpanElement>) => {
    if (!isAdmin) return;
    const newHtml = e.currentTarget.innerHTML;
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      if (!yr.ovr) yr.ovr = {};
      yr.ovr[ovKey] = newHtml;
    });
  };

  const Tag = tag as any;
  return (
    <Tag
      contentEditable={isAdmin}
      suppressContentEditableWarning
      onBlur={onBlur}
      onPaste={isAdmin ? pasteAsPlainText : undefined}
      style={{ outline: 'none', cursor: isAdmin ? 'text' : 'default', ...style }}
      dangerouslySetInnerHTML={{ __html: effective }}
    />
  );
}
