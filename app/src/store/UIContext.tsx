import { createContext, useContext, useState, type ReactNode } from 'react';
import type { EditorModule, ViewId } from '../types/models';

export interface EditorState {
  module: EditorModule;
  idx: number; // -1 = new record
  data: Record<string, unknown>;
}

interface UIContextValue {
  view: ViewId;
  setView: (v: ViewId) => void;
  relTab: 'cta' | 'pta';
  setRelTab: (t: 'cta' | 'pta') => void;
  editor: EditorState | null;
  openEditor: (editor: EditorState) => void;
  closeEditor: () => void;
  setEditorData: (data: Record<string, unknown>) => void;
  carryFrom: string;
  setCarryFrom: (m: string) => void;
  slideBarOpen: boolean;
  setSlideBarOpen: (v: boolean) => void;
  presentOpen: boolean;
  setPresentOpen: (v: boolean) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>('dashboard');
  const [relTab, setRelTab] = useState<'cta' | 'pta'>('cta');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [carryFrom, setCarryFrom] = useState('');
  const [slideBarOpen, setSlideBarOpen] = useState(true);
  const [presentOpen, setPresentOpen] = useState(false);

  const value: UIContextValue = {
    view,
    setView: (v) => {
      setView(v);
      setEditor(null);
    },
    relTab,
    setRelTab,
    editor,
    openEditor: (e) => setEditor(e),
    closeEditor: () => setEditor(null),
    setEditorData: (data) => setEditor((prev) => (prev ? { ...prev, data } : prev)),
    carryFrom,
    setCarryFrom,
    slideBarOpen,
    setSlideBarOpen,
    presentOpen,
    setPresentOpen,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
