import { uid } from '../utils/calc';
import { SAFETY_CATEGORIES, type Shutdown, type Store, type Year } from '../types/models';

export function blankSafety(): Year['safety'] {
  return { matrix: SAFETY_CATEGORIES.map((c) => ({ cat: c, y25: 0 })), log: [] };
}

export function blankShutdown(): Shutdown {
  return {
    name: '',
    start: '',
    end: '',
    days: '',
    companies: '',
    workers: '',
    budgetTotal: '',
    budgetMaint: '',
    budgetOper: '',
    totalWorks: '',
    pm: '',
    cbm: '',
    moc: '',
    critical: [],
  };
}

export function blankYear(): Year {
  return {
    ovr: {},
    meta: { presented: '', preparedBy: 'Maintenance Department', target: '', title: 'Maintenance Monthly' },
    safety: blankSafety(),
    cta: [],
    pta: [],
    cost: [],
    concern: [],
    shutdownPerf: [],
    maint: {
      dailyYTD: '',
      dailyPlan: '',
      sdYTD: '',
      sdPlan: '',
      byPlant: [
        { plant: 'PTA #1', plan: '', actual: '' },
        { plant: 'PTA #2', plan: '', actual: '' },
        { plant: 'PTA #3', plan: '', actual: '' },
      ],
      majorHighlight: '',
      shutdownCost: [
        { event: '1ASD26', plan: '', actual: '' },
        { event: '1CSD26', plan: '', actual: '' },
        { event: '2ASD26', plan: '', actual: '' },
        { event: '2CSD26', plan: '', actual: '' },
        { event: '3ASD26', plan: '', actual: '' },
        { event: '3CSD26', plan: '', actual: '' },
      ],
      sdNote: '',
    },
    shutdowns: [blankShutdown()],
    backups: [],
  };
}

export function seedStore(): Store {
  const y2026: Year = {
    ovr: {},
    meta: { presented: '16 June 2026', preparedBy: 'Maintenance Department', target: 'FY 2026', title: 'Maintenance Monthly' },
    safety: {
      matrix: SAFETY_CATEGORIES.map((c) => ({ cat: c, y25: 0 })),
      log: [
        { id: uid(), date: '2026-01-18', month: 'Jan', type: 'Property Damage', description: 'Maintenance truck reversed and hit the pickup car.' },
        { id: uid(), date: '2026-02-05', month: 'Feb', type: 'Property Damage', description: 'Minor property damage during material handling.' },
      ],
    },
    cta: [
      {
        id: uid(), month: 'Feb', plant: 'Plant 1', topic: 'P#1 ESD from GLOW frequency swing', equipment: 'EP GLOW / Air-flow PAC interlock',
        shutdownType: 'CTA trouble', plantEffect: 'ESD', sdStart: '2026-02-12T02:00', suStart: '2026-02-12T10:00', hours: 8,
        ctaVolLoss: 0.607, peCost: '', mtCost: '', rootCause: 'External factor', mtQuality: '',
        execSummary: 'Background : ESD triggered by GPSC/GLOW abnormal frequency & voltage swing affecting Air-flow PAC interlock.\nPossible cause : External grid frequency swing (GLOW).\nCA : Reset interlock and restart once grid stabilised.\nPA : Coordinate with GPSC on grid stability; review interlock setting.',
        images: [],
      },
    ],
    pta: [
      {
        id: uid(), month: 'Feb', plant: 'Plant 1', topic: 'Re-slurry — PM-404 Dryer steam tube leak', equipment: 'PTA Dryer PM-404',
        shutdownType: 'PTA trouble', plantEffect: 'Re slurry', sdStart: '2026-02-10T06:00', suStart: '2026-02-11T09:20', hours: 27.33,
        ctaVolLoss: 0.827, peCost: '', mtCost: '', rootCause: 'Aging', mtQuality: '',
        execSummary: 'Background : PTA re-slurry from PM-404 dryer steam tube leakage.\nPossible cause : Tube wall thinning after long service.\nCA : Plug leaking tube, dry-out and restart.\nPA : Include tube thickness survey in next shutdown work-list.',
        images: [],
      },
      {
        id: uid(), month: 'Feb', plant: 'Plant 2', topic: '2PM-404 Dryer screw-feeder chain loosen', equipment: '2PM-404 screw feeder',
        shutdownType: 'PTA trouble', plantEffect: 'Re slurry', sdStart: '2026-02-26T14:00', suStart: '2026-02-26T14:20', hours: 0.33,
        ctaVolLoss: 0, peCost: '', mtCost: '', rootCause: 'MT quality', mtQuality: 'Incomplete MT system',
        execSummary: 'Background : Re-slurry 20 min to stop screw and replace loosened chain.\nPossible cause : Chain tension not in PM scope.\nCA : Re-tension / replace chain.\nPA : Add chain tension check to PM.',
        images: [],
      },
      {
        id: uid(), month: 'Mar', plant: 'Plant 3', topic: 'Auto feeder 3PM-102 powder leakage', equipment: '3PM-101-2 / 3PM-102',
        shutdownType: 'PTA trouble', plantEffect: 'Re slurry', sdStart: '2026-03-13T07:00', suStart: '2026-03-13T15:18', hours: 8.3,
        ctaVolLoss: 0, peCost: '', mtCost: '', rootCause: 'Aging', mtQuality: '',
        execSummary: 'Background : Replace new seal 3PM-101-2 due to powder leakage at auto feeder.\nPossible cause : Seal wear.\nCA : Replace mechanical seal.\nPA : Review seal life & spare readiness.',
        images: [],
      },
      {
        id: uid(), month: 'Mar', plant: 'Plant 1', topic: 'Hot-oil Jacket pipe PD-301 leakage', equipment: 'PD-301 hot-oil jacket pipe',
        shutdownType: 'PTA trouble', plantEffect: 'Re slurry', sdStart: '2026-03-24T05:00', suStart: '2026-03-25T23:00', hours: 42,
        ctaVolLoss: 1.26, peCost: '', mtCost: '', rootCause: 'Weak design', mtQuality: '',
        execSummary: 'Background : Hot-oil jacket pipe PD-301 leakage forcing re-slurry.\nPossible cause : Branch/purge line weak point.\nCA : Repair jacket pipe.\nPA : Modify jacket pipe to remove MPW purge line (see Concerning equip).',
        images: [],
      },
      {
        id: uid(), month: 'May', plant: 'Plant 3', topic: 'Overhaul 3PM-101-2 due to leakage', equipment: '3PM-101-2',
        shutdownType: 'PTA trouble', plantEffect: 'Re slurry', sdStart: '2026-05-04T08:00', suStart: '2026-05-04T16:48', hours: 8.8,
        ctaVolLoss: 0, peCost: '', mtCost: '', rootCause: 'Aging', mtQuality: '',
        execSummary: 'Background : Overhaul 3PM-101-2 following recurrent leakage.\nPossible cause : Component aging.\nCA : Overhaul and replace worn parts.\nPA : Track MTBF; consider redesign.',
        images: [],
      },
    ],
    cost: ([
      ['MN#7-1 : TC-1331 replace new design cooling fan blade (postponed from Y2025)', 'Thanakorn', 0.0383, 1.74, 'IL3', 'Sep', 2026],
      ['MN#5 : Replace 2TZ-213 WG sampling line & 2TD-211→2TT-210 SS to Ti', 'Jakrapan', 0.00288, 0.14, 'IL3', 'Sep', 2026],
      ['MN#1 : Local 3PJ-301 shaft sleeve', 'Jiradet', 0.008, 0.392, 'IL4', 'Apr', 2026],
      ['MN#2 : Local RPF shaft sealing ring', 'Jiradet', 0.0026, 0.13, 'IL4', 'Apr', 2026],
      ['MN#3 : 2TC-1331A-F redesign cooling fan blade', 'Thanakorn', 0.0563, 2.5569, 'IL3', 'Dec', 2026],
      ['MN#4 : Alternative source O-ring IIR', 'Thanakorn', 0.0333, 1.62, 'IL4', 'Jan', 2026],
      ['MN#7-2 : New Pd/C recovery unit', 'Thanakorn', 0.17, 8.29, 'IL3', 'Nov', 2026],
      ['MN#7-3 : xPD-201 recondition John screen', 'Jakrapan', 0.0167, 0.81, 'IL3', 'Aug', 2026],
      ['MN#7-4 : 2C-525ABC change supplier oil & separator filter', 'Tanaphat', 0.0043, 0.21, 'IL3', 'Oct', 2026],
      ['MN#7-5 : 2C-525ABC change supplier lubrication oil', 'Tanaphat', 0.0028, 0.14, 'IL4', 'May', 2026],
      ['MN#7-6 : PM-802C change screen specification', 'Tanaphat', 0.0014, 0.07, 'IL3', 'Apr', 2026],
      ['2TZ-1131 replace vane type separator', 'Jakrapan', 0.034, 1.64, 'IL3', 'Dec', 2026],
    ] as [string, string, number, number, string, string, number][]).map((r) => ({
      id: uid(),
      projectName: r[0],
      responseBy: r[1],
      registerType: 'Action plan' as const,
      savingType: 'Recurring' as const,
      planUSDT: r[2],
      planMB: r[3],
      sil4Month: r[5] as Year['cost'][number]['sil4Month'],
      sil4Year: r[6],
      status: (r[4] === 'IL4' ? 'Release saving (IL4)' : 'Execute (IL3)') as Year['cost'][number]['status'],
      actualMB: r[4] === 'IL4' ? r[3] : '',
      actualUSDT: r[4] === 'IL4' ? r[2] : '',
    })),
    concern: [
      { id: uid(), month: 'May', equipment: '2TC-201 PA Compressor', plant: 'P#2', status: 'Monitoring', title: 'Bearing IGV st.1 shown vibration swing high', issue: 'Vibration stage 1 spiked from ~25 → 39 µm; recovers within minutes (I/L = 63 µm).', possibleCause: '', action: 'MAN inspection + impeller ST1 cleaning planned at next shutdown.', preventive: '', benefit: '', images: [] },
      { id: uid(), month: 'May', equipment: '2PCM-201B · H2 Compressor', plant: 'P#2', status: 'Resolved', title: 'High vibration', issue: 'Abnormal noise & current swing; analysis confirmed motor bearing damage.', possibleCause: 'ZZ bearing grease degradation due to no re-lubrication after 6 years operation.', action: 'Replaced with Plant#1 motor; send Plant#2 motor to overhaul and install at Plant#1.', preventive: 'Review PM motor overhaul interval from 6 years to 4 years.', benefit: '', images: [] },
      { id: uid(), month: 'May', equipment: '2PM-401D · RPF', plant: 'P#2', status: 'Monitoring', title: 'High torque & G/P contamination', issue: 'G/P changed BHS → Pilar; torque baseline shifted (alarm 350 / interlock 700 Nm).', possibleCause: 'Too much tightening torque that destroyed gland packing.', action: 'Loosened G/P after torque fluctuation — no contamination found.', preventive: 'Review gland-packing pre-tightening procedure.', benefit: '', images: [] },
      { id: uid(), month: 'May', equipment: 'PD-301, 302 · Hot-oil line', plant: 'P#1', status: 'Resolved', title: 'Modify MPW purge line', issue: '', possibleCause: '', action: 'Modify jacket pipe to remove purge line & eliminate leakage risk.', preventive: '', benefit: 'Stops PE-503 (MPW heater) — cost saving ~0.3 MB/month.', images: [] },
    ],
    shutdownPerf: [
      {
        id: uid(), month: 'May', shutdownCode: '2ASD26',
        kpiRows: [
          { id: uid(), kpi: 'Incident Case', plan: '0', actual: '2', remark: 'There are 1 incident case ( Valve dropped) and 1 near-mis case (Shoulder dislocation)' },
          { id: uid(), kpi: 'Shutdown Cost (MB)', plan: '36.2', actual: '29.0 +', remark: 'Some cost from additional works is under negotiation' },
          { id: uid(), kpi: 'Shutdown Day', plan: '15', actual: '15', remark: '' },
        ],
        canvas: [],
      },
    ],
    maint: {
      dailyYTD: 39.9, dailyPlan: 46.3, sdYTD: 70.8, sdPlan: 122.6,
      byPlant: [
        { plant: 'PTA #1', plan: 2.8, actual: 1.9 },
        { plant: 'PTA #2', plan: 2.4, actual: 2.8 },
        { plant: 'PTA #3', plan: 2.1, actual: 3.4 },
      ],
      majorHighlight:
        'PTA#2 :\nRecondition manual valve from 2ASD26 (0.5 MB).\n2PM-802C replace new vibration screen due to damage (0.24 MB).\nPTA#3 :\n3TM-300C fabrication local gearbox (0.64 MB).\n3PM-101-2 powder leakage (0.30 MB).\n3PC-201B leak detector alarm due to diaphragm leak (0.24 MB).',
      shutdownCost: [
        { event: '1ASD26', plan: 30.0, actual: 0.1 },
        { event: '1CSD26', plan: 7.0, actual: 1.2 },
        { event: '2ASD26', plan: 36.2, actual: 30.8 },
        { event: '2CSD26', plan: 6.0, actual: 1.8 },
        { event: '3ASD26', plan: 37.4, actual: 36.8 },
        { event: '3CSD26', plan: 6.0, actual: 0.1 },
      ],
      sdNote: 'Savings mainly from minimized work-list scope on completed shutdowns.',
    },
    shutdowns: [
      {
        name: '1CmSD26', start: '09 Apr', end: '10 Jun', days: 63, companies: 7, workers: 80,
        budgetTotal: 11.5, budgetMaint: 6.87, budgetOper: 4.65, totalWorks: 88, pm: 25, cbm: 61, moc: 2,
        critical: [
          { equip: 'Crystallizer Agitator · PJ-302', work: 'Replace mechanical seal', func: 'Rotating' },
          { equip: 'HO Jacket pipe · PD-301~304', work: 'Modify hot-oil jacket pipe', func: 'Static' },
          { equip: 'PA Compressor motor · TCM-201', work: 'Install ZCT switchgear', func: 'Electrical' },
          { equip: 'PTA Reactor · PD-201', work: 'Replace catalyst (Pd)', func: 'Production' },
          { equip: 'TP-201D · HZV-1201', work: 'Overhaul valve', func: 'Instrument' },
          { equip: 'PTA Dryer · KCV-1403', work: 'Overhaul valve', func: 'Instrument' },
        ],
      },
    ],
    backups: [],
  };
  return { activeYear: 2026, activeMonth: 'May', years: { '2026': y2026 } };
}
