import { useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { applySlideOrder } from '../../utils/calc';
import type { PresentSlideSpec } from './PresentDeck';
import PresentTitle from './slides/PresentTitle';
import PresentSafetyReliability from './slides/PresentSafetyReliability';
import PresentCost from './slides/PresentCost';
import PresentShutdown from './slides/PresentShutdown';
import PresentShutdownPerf from './slides/PresentShutdownPerf';
import PresentConcern from './slides/PresentConcern';
import PresentBackup from './slides/PresentBackup';

export function usePresentSlides(): PresentSlideSpec[] {
  const { store, year } = useStore();

  return useMemo(() => {
    const concernItems = year.concern.map((c, i) => ({ ...c, globalIdx: i })).filter((c) => c.month === store.activeMonth);
    const concernPages: (typeof concernItems)[] = [];
    for (let i = 0; i < concernItems.length; i += 1) concernPages.push(concernItems.slice(i, i + 1));
    const shutdownPerfItems = (year.shutdownPerf || []).filter((p) => p.month === store.activeMonth);

    const list: PresentSlideSpec[] = [
      { key: 'title', content: <PresentTitle /> },
      { key: 'safety-rel', content: <PresentSafetyReliability /> },
      { key: 'cost', content: <PresentCost /> },
    ];
    year.shutdowns.forEach((sd, si) => {
      list.push({ key: `sd-${si}`, content: <PresentShutdown sd={sd} si={si} total={year.shutdowns.length} /> });
    });
    shutdownPerfItems.forEach((item, pi) => {
      list.push({ key: `sdperf-${pi}`, content: <PresentShutdownPerf item={item} itemIndex={pi} total={shutdownPerfItems.length} /> });
    });
    concernPages.forEach((items, pi) => {
      list.push({ key: `concern-${pi}`, content: <PresentConcern items={items} itemIndex={pi} /> });
    });
    (year.backups || []).forEach((src, i) => {
      list.push({ key: `backup-${i}`, content: <PresentBackup src={src} /> });
    });
    return applySlideOrder(list, year.slideOrder?.[store.activeMonth]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, store.activeMonth]);
}
