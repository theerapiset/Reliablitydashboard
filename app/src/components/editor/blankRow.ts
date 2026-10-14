import { defaultShutdownKpiRows } from '../../utils/calc';
import type { EditorModule, Store } from '../../types/models';

export function blankRow(module: EditorModule, store: Store): Record<string, unknown> {
  if (module === 'safety') return { type: '', date: '', description: '' };
  if (module === 'cta' || module === 'pta')
    return {
      plant: 'Plant 1', topic: '', equipment: '', shutdownType: module === 'cta' ? 'CTA trouble' : 'PTA trouble',
      plantEffect: 'ESD', sdStart: '', suStart: '', hours: 0, ctaVolLoss: '', peCost: '', mtCost: '',
      rootCause: 'Aging', mtQuality: '', execSummary: '', images: [],
    };
  if (module === 'cost')
    return {
      projectName: '', responseBy: '', registerType: 'Action plan', savingType: 'Recurring', planUSDT: '', planMB: '',
      sil4Month: 'Jan', sil4Year: store.activeYear, status: 'Execute (IL3)', actualMB: '', actualUSDT: '',
    };
  if (module === 'concern')
    return {
      month: store.activeMonth, equipment: '', plant: 'P#1', status: 'Monitoring', title: '', issue: '',
      possibleCause: '', action: '', preventive: '', benefit: '', images: [], notes: '', fullImage: false,
      extraPages: [],
    };
  if (module === 'shutdownPerf')
    return { month: store.activeMonth, shutdownCode: '', kpiRows: defaultShutdownKpiRows(), canvas: [] };
  return {};
}
