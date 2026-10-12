import { useStore } from '../../store/StoreContext';
import { useAuth } from '../../store/AuthContext';

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
      style={{ outline: 'none', cursor: isAdmin ? 'text' : 'default', ...style }}
      dangerouslySetInnerHTML={{ __html: effective }}
    />
  );
}
