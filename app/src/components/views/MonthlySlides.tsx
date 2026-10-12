import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useUI } from '../../store/UIContext';
import { useAuth } from '../../store/AuthContext';
import EditGate from '../EditGate';
import SlideDeck, { type SlideDeckHandle, type SlideSpec } from '../slides/SlideDeck';
import TitleSlide from '../slides/TitleSlide';
import SafetyReliabilitySlide from '../slides/SafetyReliabilitySlide';
import CostSavingsSlide from '../slides/CostSavingsSlide';
import ShutdownSlide from '../slides/ShutdownSlide';
import ShutdownPerformanceSlide from '../slides/ShutdownPerformanceSlide';
import ConcernSlide from '../slides/ConcernSlide';
import BackupSlide from '../slides/BackupSlide';
import { exportYearToPptx } from '../../utils/exportPptx';
import { uploadImages } from '../../utils/uploadImage';
import { applySlideOrder } from '../../utils/calc';
import type { ConcernItem } from '../../types/models';

export default function MonthlySlides() {
  const { store, year, setStore } = useStore();
  const { setView, setPresentOpen, slideBarOpen, setSlideBarOpen } = useUI();
  const { isAdmin } = useAuth();
  const deckRef = useRef<SlideDeckHandle | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const concernItems = year.concern.map((c, i) => ({ ...c, globalIdx: i })).filter((c) => c.month === store.activeMonth);
  const concernPages: (ConcernItem & { globalIdx: number })[][] = [];
  for (let i = 0; i < concernItems.length; i += 1) concernPages.push(concernItems.slice(i, i + 1));
  const shutdownPerfItems = (year.shutdownPerf || []).filter((p) => p.month === store.activeMonth);

  const slides: SlideSpec[] = useMemo(() => {
    const list: SlideSpec[] = [
      { key: 'title', label: 'Title', content: <TitleSlide /> },
      { key: 'safety-rel', label: 'Safety & Reliability', content: <SafetyReliabilitySlide /> },
      { key: 'cost', label: 'Cost & Savings', content: <CostSavingsSlide /> },
    ];
    year.shutdowns.forEach((sd, si) => {
      list.push({ key: `sd-${si}`, label: `Shutdown ${si + 1}`, content: <ShutdownSlide sd={sd} si={si} total={year.shutdowns.length} /> });
    });
    shutdownPerfItems.forEach((item, pi) => {
      list.push({ key: `sdperf-${pi}`, label: `${item.shutdownCode || 'Shutdown'} Performance`, content: <ShutdownPerformanceSlide item={item} itemIndex={pi} total={shutdownPerfItems.length} /> });
    });
    concernPages.forEach((items, pi) => {
      list.push({ key: `concern-${pi}`, label: `Concerning (${pi + 1}/${concernPages.length || 1})`, content: <ConcernSlide items={items} itemIndex={pi} /> });
    });
    (year.backups || []).forEach((src, i) => {
      list.push({ key: `backup-${i}`, label: `Backup ${i + 1}`, content: <BackupSlide src={src} /> });
    });
    return applySlideOrder(list, year.slideOrder?.[store.activeMonth]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, store.activeMonth]);

  const clampedIndex = Math.min(activeIndex, slides.length - 1);

  const addBackupFiles = async (files: FileList | File[]) => {
    const urls = await uploadImages(files, 'backup');
    if (!urls.length) return;
    setStore((s) => {
      const yr = s.years[String(s.activeYear)];
      if (!yr.backups) yr.backups = [];
      yr.backups.push(...urls);
    });
  };

  const onPickBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addBackupFiles(e.target.files);
    e.target.value = '';
  };

  const onPasteBackup = (e: React.ClipboardEvent) => {
    if (!isAdmin) return;
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
      addBackupFiles(files);
    }
  };

  const resetOvr = () => {
    if (!window.confirm('Reset all manual slide edits back to live data?')) return;
    setStore((s) => {
      s.years[String(s.activeYear)].ovr = {};
    });
  };

  const delBackup = (i: number) =>
    setStore((s) => {
      s.years[String(s.activeYear)].backups.splice(i, 1);
    });

  const barBtn: React.CSSProperties = { width: 28, height: 28, border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, fontSize: 13, color: '#46566a', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div onPaste={onPasteBackup} style={{ height: '100%' }}>
      {slideBarOpen ? (
        <div
          className="deck-no-print"
          style={{ position: 'fixed', top: 10, left: 10, zIndex: 2147483600, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.94)', border: '1px solid #d4dbe3', borderRadius: 9, padding: '4px 5px', boxShadow: '0 4px 16px rgba(0,0,0,.26)' }}
        >
          <button onClick={() => setView('dashboard')} title="Back to app" style={{ height: 28, border: 'none', background: '#15355b', color: '#fff', borderRadius: 6, padding: '0 9px', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← App
          </button>
          <EditGate>
            <label title="Add backup slide from image" style={{ ...barBtn, cursor: 'pointer' }}>
              ＋<input type="file" accept="image/*" multiple onChange={onPickBackup} style={{ display: 'none' }} />
            </label>
          </EditGate>
          <EditGate>
            <button onClick={resetOvr} title="Reset manual slide edits" style={barBtn}>
              ↺
            </button>
          </EditGate>
          <button onClick={() => setPresentOpen(true)} title="Present full screen" style={barBtn}>
            ▶
          </button>
          <button onClick={() => deckRef.current?.print()} title="Print / PDF" style={{ height: 28, border: 'none', background: '#15662f', color: '#fff', borderRadius: 6, padding: '0 9px', fontWeight: 700, fontSize: 12 }}>
            ⤓ PDF
          </button>
          <button onClick={() => exportYearToPptx(year, store)} title="Export editable PowerPoint" style={{ height: 28, border: 'none', background: '#c2571f', color: '#fff', borderRadius: 6, padding: '0 9px', fontWeight: 700, fontSize: 12 }}>
            ⤓ PPTX
          </button>
          <button onClick={() => setSlideBarOpen(false)} title="Hide toolbar" style={{ width: 24, height: 28, border: 'none', background: 'none', fontSize: 13, color: '#9aa6b3' }}>
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSlideBarOpen(true)}
          title="Show toolbar"
          className="deck-no-print"
          style={{ position: 'fixed', top: 10, left: 10, zIndex: 2147483600, width: 30, height: 30, border: '1px solid #d4dbe3', background: 'rgba(255,255,255,.82)', borderRadius: 8, fontSize: 13, color: '#46566a', boxShadow: '0 3px 10px rgba(0,0,0,.2)' }}
        >
          ☰
        </button>
      )}

      {(year.backups || []).length > 0 && (
        <div
          className="deck-no-print"
          style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 2147483600, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', background: 'rgba(255,255,255,.97)', border: '1px solid #d4dbe3', borderRadius: 10, padding: '7px 10px', boxShadow: '0 6px 22px rgba(0,0,0,.28)', maxWidth: '60vw' }}
        >
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>Backup</span>
          {(year.backups || []).map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 70, height: 40, borderRadius: 5, overflow: 'hidden', border: '1px solid #d8dee6' }}>
              <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <EditGate>
                <button onClick={() => delBackup(i)} style={{ position: 'absolute', top: 1, right: 1, width: 16, height: 16, border: 'none', borderRadius: 4, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 9, lineHeight: 1 }}>
                  ✕
                </button>
              </EditGate>
            </div>
          ))}
        </div>
      )}

      <div className="deck-print-root">
        <SlideDeck slides={slides} activeIndex={clampedIndex} onIndexChange={setActiveIndex} deckRef={deckRef} />
      </div>
    </div>
  );
}
