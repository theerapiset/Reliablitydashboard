import type {
  MonitorAsset,
  MonitorGroup,
  Top10Item,
  Top10SnapshotItem,
  Top10Source,
  TroubleItem,
  WeeklyData,
  WeeklyPlant,
  WeeklyRecipient,
} from '../types/models';

// ---------- Risk matrix (5×5 Likelihood × Impact) ----------

export type SevKey = 'C' | 'S' | 'L' | 'V' | 'N';

/** GRID[impact][likelihood-1] */
export const GRID: Record<number, SevKey[]> = {
  5: ['S', 'S', 'C', 'C', 'C'],
  4: ['L', 'S', 'S', 'C', 'C'],
  3: ['L', 'L', 'S', 'S', 'C'],
  2: ['V', 'L', 'L', 'S', 'S'],
  1: ['V', 'V', 'L', 'L', 'L'],
};

export const SEV: Record<SevKey, { label: string; bg: string; fg: string; cell: string; rank: number }> = {
  C: { label: 'Critical', bg: '#FDE2E1', fg: '#A3171B', cell: '#EE8A85', rank: 4 },
  S: { label: 'Significant', bg: '#FDEBD3', fg: '#8A4B00', cell: '#F7BE84', rank: 3 },
  L: { label: 'Low', bg: '#FBF5C8', fg: '#6B5900', cell: '#F6EB93', rank: 2 },
  V: { label: 'Very Low', bg: '#E2F0DC', fg: '#2F5E22', cell: '#BFDDB3', rank: 1 },
  N: { label: 'Not assessed', bg: '#EEF0F3', fg: '#54606F', cell: '#EEF0F3', rank: 0 },
};

export const sevAt = (l: number, i: number): SevKey => (l && i ? GRID[i][l - 1] : 'N');

export const L_SCALE = [
  { n: 1, name: 'Rarely', prob: '< 5%', desc: 'สภาพปกติ ไม่มี abnormal trend' },
  { n: 2, name: 'Unlikely', prob: '5% – 10%', desc: 'มีค่าผิดปกติเล็กน้อย trend คงที่' },
  { n: 3, name: 'Occasional', prob: '> 10% – 25%', desc: 'trend ขึ้นต่อเนื่อง แต่ยังต่ำกว่า alarm' },
  { n: 4, name: 'Likely', prob: '> 25% – 50%', desc: 'ถึง alarm / ยืนยัน defect แล้ว' },
  { n: 5, name: 'Most Likely', prob: '> 50%', desc: 'ถึง danger หรือเสื่อมเร็ว' },
];

export const I_SCALE = [
  { n: 1, name: 'Insignificant', desc: 'ไม่กระทบการผลิต', ex: 'สภาพภายนอกเสื่อมโทรม, งานซ่อมบำรุงทั่วไป' },
  { n: 2, name: 'Minor', desc: 'กระทบประสิทธิภาพเล็กน้อย', ex: 'Centrifugal Pump มีค่า Vibration สูง แต่ยังเดินเครื่องต่อได้' },
  { n: 3, name: 'Moderate', desc: 'APQ Drop หรือหยุดผลิตสั้นๆ (< 2 วัน)', ex: 'Canned Pump รั่ว ต้องสลับใช้ตัว Spare แบบฉุกเฉิน' },
  { n: 4, name: 'Major', desc: 'PTA Re-slurry, Resolvent, CTA load down', ex: 'Main Agitator Shaft สึกหรอต้องถอดซ่อม, ปั๊มหลักพังและไม่มี Spare' },
  { n: 5, name: 'Severe', desc: 'Plant Shutdown หรือหยุดผลิต > 7 วัน', ex: 'Main Compressor เสียหายหนัก, Reactor ปิดตัวฉุกเฉิน' },
];

export const L_OPTIONS = ['1 · Rarely (<5%)', '2 · Unlikely (5–10%)', '3 · Occasional (>10–25%)', '4 · Likely (>25–50%)', '5 · Most Likely (>50%)'];
export const I_OPTIONS = ['1 · Insignificant', '2 · Minor', '3 · Moderate', '4 · Major', '5 · Severe'];

export const VERIFY_METHODS: [string, string][] = [
  ['cm', 'Condition monitoring — trend back to normal'],
  ['insp', 'Inspection / measurement after repair'],
  ['test', 'Performance / functional test'],
  ['run', 'Run without recurrence (observation period)'],
  ['design', 'Root cause eliminated (design / material change)'],
  ['other', 'Other'],
];

// ISO 14224 taxonomy (Annex B) — value is the code before " — ".
const opts = (arr: string[]) => arr.map((t) => ({ v: t.split(' — ')[0], t }));
export const ISO_LISTS = {
  eq: opts(['Pump – centrifugal', 'Pump – reciprocating', 'Pump – rotary / canned', 'Compressor – centrifugal', 'Compressor – reciprocating', 'Compressor – screw', 'Blower / fan', 'Steam turbine', 'Electric motor', 'Gearbox / variable drive', 'Agitator / mixer', 'Centrifuge', 'Rotary valve / feeder', 'Dryer (rotary)', 'Heat exchanger', 'Vessel / silo', 'Piping', 'Valve', 'Instrument', 'Other']),
  mode: opts(['VIB — Vibration', 'NOI — Noise', 'OHE — Overheating', 'PDE — Parameter deviation', 'AIR — Abnormal instrument reading', 'ELP — External leakage, process medium', 'ELU — External leakage, utility medium', 'INL — Internal leakage', 'PLU — Plugged / choked', 'LOO — Low output', 'HIO — High output', 'ERO — Erratic output', 'STD — Structural deficiency', 'BRD — Breakdown', 'FTS — Fail to start on demand', 'STP — Fail to stop on demand', 'UST — Spurious stop', 'SER — Minor in-service problems', 'OTH — Other', 'UNK — Unknown']),
  mech: opts(['1.1 — Leakage', '1.2 — Vibration', '1.3 — Clearance / alignment failure', '1.4 — Deformation', '1.5 — Looseness', '1.6 — Sticking', '2.1 — Cavitation', '2.2 — Corrosion', '2.3 — Erosion', '2.4 — Wear', '2.5 — Breakage', '2.6 — Fatigue', '2.7 — Overheating', '2.8 — Burst', '3.1 — Control failure', '3.2 — No signal / indication / alarm', '3.3 — Faulty signal / indication / alarm', '3.4 — Out of adjustment', '4.1 — Short circuiting', '4.2 — Open circuit', '4.3 — No power / voltage', '4.4 — Faulty power / voltage', '4.5 — Earth / isolation fault', '5.1 — Blockage / plugged', '5.2 — Contamination', '5.3 — Miscellaneous external influences', '6.1 — No cause found', '6.2 — Combined causes', '6.3 — Other', '6.4 — Unknown']),
  cause: opts(['1.1 — Improper capacity (design)', '1.2 — Improper material (design)', '2.1 — Fabrication error', '2.2 — Installation error', '3.1 — Off-design service', '3.2 — Operating error', '3.3 — Maintenance error', '3.4 — Expected wear and tear', '4.1 — Documentation error', '4.2 — Management error', '5.1 — Cause not found', '5.2 — Common cause', '5.3 — Combined causes', '5.4 — Other unit / cascading failure', '5.5 — Other', '5.6 — Unknown']),
};

// ---------- Source pools (Plant Concerning Dashboard / Inspection Daily Board) ----------

export interface PoolItem {
  id: string;
  src: Top10Source;
  tag: string;
  plant: WeeklyPlant;
  detail: string;
  condition: string;
  srcSev: string;
  srcAction: string;
}

export const POOL: PoolItem[] = [
  { id: '2PJ-301', src: 'PCD', tag: '2PJ-301', plant: 'Plant 2', detail: 'Current shift up from normal 50 → 55 A', condition: 'Detected 09 Oct 2026 · Response Jakrapan A. · Section RA', srcSev: 'Keep monitor · ★ NEW', srcAction: 'Closely monitor 2 times per week' },
  { id: 'P-298AB', src: 'IDB', tag: 'P-298AB', plant: 'Plant 1', detail: 'Vibration increase (Danger)', condition: 'Spectrum, overall vibration', srcSev: '★', srcAction: 'Grease up' },
  { id: 'PP-681ABC', src: 'IDB', tag: 'PP-681ABC', plant: 'Plant 1', detail: 'High temp', condition: 'Hot oil contaminate', srcSev: '★★', srcAction: 'Treat oil and cleaning' },
  { id: 'TM-384-2', src: 'IDB', tag: 'TM-384-2', plant: 'Plant 1', detail: '2X and 4X has increasing vibration', condition: 'Overall vibration', srcSev: '★', srcAction: 'Monitoring by PM' },
  { id: 'TC-383C', src: 'IDB', tag: 'TC-383C', plant: 'Plant 1', detail: 'Vibration alarm (high frequency, may be bearing stage 1)', condition: 'Spectrum, overall vibration', srcSev: '★', srcAction: 'Monitoring by PM' },
  { id: 'TC-383A', src: 'IDB', tag: 'TC-383A', plant: 'Plant 1', detail: 'Vibration alarm (high frequency, may be bearing stage 1)', condition: 'Spectrum, overall vibration', srcSev: '★', srcAction: 'Monitoring by PM' },
  { id: 'TP-182A', src: 'IDB', tag: 'TP-182A', plant: 'Plant 1', detail: 'Vibration swing', condition: 'Overall vibration', srcSev: '★ · Keep monitor', srcAction: 'Fill up grease' },
  { id: 'PJ-303', src: 'IDB', tag: 'PJ-303', plant: 'Plant 1', detail: 'Looseness of rotating part', condition: 'PeakVue', srcSev: '★', srcAction: 'Monitoring by PM, bearing defect not found' },
];

export function blankTop10(id: string, src: Top10Source, plant: WeeklyPlant): Top10Item {
  return {
    id, src, tag: '', plant, detail: '', background: '', l: 0, i: 0, owner: '', due: '',
    steps: [], photos: [], links: [], status: 'open',
    cls: { eqClass: '', mode: '', mech: '', cause: '' },
    ver: { rl: '', ri: '', method: '', evidence: '', by: '', date: '', recheck: '', accept: false },
  };
}

/** New board item from a source pool entry, carrying last snapshot's L × I if the item was on it. */
export function top10FromPool(p: PoolItem, prev?: Top10SnapshotItem): Top10Item {
  const r = blankTop10(p.id, p.src, p.plant);
  r.tag = p.tag;
  r.detail = p.detail;
  if (prev) {
    r.l = prev.l;
    r.i = prev.i;
  }
  r.background = p.src === 'IDB' ? 'Condition abnormal: ' + p.condition : '';
  r.steps = [{ text: p.srcAction, result: 'From ' + (p.src === 'PCD' ? 'Plant Concerning Dashboard' : 'Inspection Daily Board'), status: 'Watch' }];
  return r;
}

// ---------- Seed ----------

function seedTop10(prev: Top10SnapshotItem[]): Top10Item[] {
  const byId = Object.fromEntries(prev.map((p) => [p.id, p]));
  const pick = (id: string) => {
    const p = POOL.find((x) => x.id === id)!;
    return top10FromPool(p, byId[id]);
  };
  const first = pick('2PJ-301');
  Object.assign(first, {
    l: 4, i: 4, due: '2026-12-10', owner: 'Jakrapan A.',
    background: 'Motor current shift up from normal 50 A → 55 A, detected 09 Oct 2026. Found abnormal sound. Grease Fe contamination at thrust bearing rose from 815 ppm (02 Oct) to 1,609 ppm (08 Oct).',
    steps: [
      { text: 'Closely monitor 2 times per week', result: 'Until replacement', status: 'Watch' },
      { text: 'Check tightness of bolts — lantern, GB and M/S', result: 'Good', status: 'Done' },
      { text: 'Abnormal sound', result: 'Found abnormal sound → keep monitor', status: 'Watch' },
      { text: 'SPMHD thrust bearing / M/S bearing', result: 'Normal', status: 'Done' },
      { text: 'MV DIW seal', result: 'Normal', status: 'Done' },
      { text: 'Grease Fe contamination — thrust bearing', result: '815 → 1,609 ppm', status: 'Watch' },
      { text: 'All spare parts ready for replacement', result: 'Target 15 Oct 26', status: 'Open' },
    ],
    links: [
      { kind: 'link', label: 'Plant Concerning Dashboard', url: 'https://plant-concerning.theerapiset.workers.dev/' },
      { kind: 'pi', label: '2PJ-301-SAM', url: 'https://gcmppisvr.pttgc.corp/PIVision/#/Displays/1930/2PJ-301-SAM' },
    ],
  } satisfies Partial<Top10Item>);
  const tm = pick('TM-384-2');
  tm.l = 2;
  return [first, pick('P-298AB'), pick('PP-681ABC'), pick('TC-383C'), tm];
}

const T = (o: Omit<TroubleItem, 'log' | 'ver' | 'sentVer' | 'lastSent'>): TroubleItem => ({ log: [], ver: 1, sentVer: 0, lastSent: '', ...o });

function seedTroubles(): TroubleItem[] {
  return [
    T({ id: 't1', title: '3PD-403 bottom plugged', plant: '3', date: '2022-09-01', corrective: '1. Switch plant to re-slurry operation\n2. Up-Down NaOH to dissolve PTA lump inside the drum', preventive: '1. Study the effective way to eradicate accumulated powder at the bottom of 3PD-403.\n - Feed NaOH for washing at the stand line of 3PD-403 → after we discussed, it may be not effective as expected since the scanty amount of NaOH feed is attenuated by a lot of slurry from RPF that causes meaningless cleaning.\n - Feed NaOH to 3PD-403 during RPF washing is under feasible study → it has to revise the procedures and other related concerns.', status: 'Completed', due: 'February 27', owner: '' }),
    T({ id: 't2', title: '#3CTA dryer plugging', plant: '3', date: '2022-01-01', corrective: '', preventive: '8. Plan to install steam tracing at chute in 3CSD26 (expedite to install in 3ASD26)\n** Concerning: high temp from tracing will effect to powder temp, may be difficult to control operation (need to confirm MES) => install control valve with skin temp 4 points at chute and 1 point at outlet pipe\n** Concerning to high temp at rotary valve.\n** 3ASD26: tie in, daily lay down instrument cable; 3CSD26 install steam tracing and control valve\nProgress >>> Cancel action plan for redesign steam tracing, keep monitor after install insulation\n\n2026 >> Inspect condition chute 3CSD26 >> condition is good.\nNeed to install steam tracing >> cheap design.', status: 'In-progress', due: 'June 30', owner: 'Tanaphat Kittilugsanawong' }),
    T({ id: 't3', title: 'TTK-400 plugging', plant: '1', date: '', corrective: '1. Use special tool for breaking lump under TTK-400', preventive: '1. Study to modify line for clear plug in shortpipe upper rotary valve\n - Lump breaker contact to 6 vendors but 2 vendors possible and have experience.\n 1. Franklin Miller: negotiate to send sample 200 kg to test, budget 0.2 MB for shipping.\n 2. BEPEX: under discussed.\n3. Add aeration ring >> Completed\nAccording to plant#1 will commercial SD in next year, we decided to cancel action plan. However, lump testing still required or not? Sam will present within Jan.', status: 'Completed', due: 'September 30', owner: 'Jakrapan Apiwattananan' }),
    T({ id: 't4', title: '2TTK-400 bottom plugging', plant: '2', date: '', corrective: '1. After CTA washing RVF, PTA#2 will tempo load down and up weight of 2PTK-101 for preventing weight loss.', preventive: "1. HPWJ of 2TTK-400 in 2ASD'25\n2. Consider to modify nozzle BTM silo (same as P#1)\n3. Study to add aeration ring", status: 'Completed', due: 'September 30', owner: 'Jakrapan Apiwattananan' }),
    T({ id: 't5', title: '3TTK-400 plugging', plant: '3', date: '', corrective: '1. Use special tool for breaking lump under 3TTK-400', preventive: "1. Set plan to HPWJ silo 3TTK-400 on 3ASD'24\n2. Study to improve aeration BTM silo", status: 'Completed', due: 'September 30', owner: 'Jakrapan Apiwattananan' }),
    T({ id: 't6', title: 'Low H2 pressure PTA reactor / PC-201 and 2PC-201 operate 2 unit (no standby)', plant: '2', date: '', corrective: '1. Run two operation PC-201A/B', preventive: '1. Change alarm leak detector from 1.1 to 0.5\n2. Supply header high pressure drop.\n3. Check critical sparepart\n - Consult manufacturer performance.\n\nConsult Mfg. complete.\n - The propose 2 options,\n 1) increase to max speed at 400 rpm by size up pulley motor.\n 2) redesign head, >>> need ensure flow.\n\nAfter present in morning meeting >> propose to quick win increase speed. May be in next SD.', status: 'In-progress', due: 'July 31', owner: 'Theera Piset' }),
  ];
}

function seedMonitor(): { groups: MonitorGroup[]; assets: MonitorAsset[] } {
  const W = ['W36', 'W37', 'W38', 'W39', 'W40', 'W41', 'W42', 'W43'];
  const S = (vals: number[]) => vals.map((v, i) => ({ d: W[i], v }));
  return {
    groups: [
      { id: 'motor', name: 'Main Motor', icon: 'motor', links: [{ kind: 'app', label: '3TCM-201 Motor Temp Recorder', url: 'https://service-3tcm-201-motor-temp-recorder.ai.studio/' }] },
      { id: 'pac', name: 'Process Air Compressor', icon: 'compressor', links: [] },
      { id: 'agitator', name: 'Agitator', icon: 'agitator', links: [] },
      { id: 'centrifuge', name: 'Centrifuge', icon: 'centrifuge', links: [] },
      { id: 'hx', name: 'Heat Exchanger', icon: 'hx', links: [] },
    ],
    assets: [
      { id: 'a1', group: 'motor', tag: '3TCM-201', plant: 'Plant 3', service: 'Main motor', param: 'Temperature', unit: '°C', alert: 120, danger: 135, sample: true, note: '', readings: S([96, 97, 99, 98, 101, 104, 107, 109]) },
      { id: 'a2', group: 'pac', tag: '[PAC tag]', plant: '[Plant]', service: 'Process air compressor', param: 'Vibration', unit: 'mm/s', alert: 4.5, danger: 7.1, sample: true, note: '', readings: S([2.1, 2.2, 2.0, 2.3, 2.4, 2.3, 2.5, 2.6]) },
      { id: 'a3', group: 'pac', tag: '[PAC tag]', plant: '[Plant]', service: 'Thrust bearing', param: 'Temperature', unit: '°C', alert: 95, danger: 105, sample: true, note: '', readings: S([78, 79, 81, 80, 83, 86, 88, 91]) },
      { id: 'a4', group: 'agitator', tag: '[Agitator tag]', plant: '[Plant]', service: 'Gearbox', param: 'Vibration', unit: 'mm/s', alert: 4.5, danger: 7.1, sample: true, note: '', readings: S([3.1, 3.3, 3.6, 3.9, 4.2, 4.4, 4.7, 4.9]) },
      { id: 'a5', group: 'centrifuge', tag: '[Centrifuge tag]', plant: '[Plant]', service: 'Bowl bearing', param: 'Vibration', unit: 'mm/s', alert: 4.5, danger: 7.1, sample: true, note: '', readings: S([3.0, 3.2, 3.8, 4.6, 5.5, 6.2, 6.9, 7.4]) },
      { id: 'a6', group: 'hx', tag: '[HX tag]', plant: '[Plant]', service: 'Shell side fouling', param: 'Differential pressure', unit: 'kPa', alert: 80, danger: 100, sample: true, note: '', readings: S([52, 54, 55, 58, 60, 63, 65, 68]) },
    ],
  };
}

export function seedWeekly(): WeeklyData {
  // Sample snapshot of last week's emailed board, so the week-over-week panel has something to compare against.
  const prev: Top10SnapshotItem[] = [
    { id: '2PJ-301', tag: '2PJ-301', l: 3, i: 4, status: 'open' },
    { id: 'P-298AB', tag: 'P-298AB', l: 4, i: 3, status: 'open' },
    { id: 'PP-681ABC', tag: 'PP-681ABC', l: 2, i: 3, status: 'open' },
    { id: 'TM-384-2', tag: 'TM-384-2', l: 3, i: 2, status: 'open' },
    { id: 'TC-383A', tag: 'TC-383A', l: 3, i: 2, status: 'open' },
  ];
  const recips: WeeklyRecipient[] = [
    { id: 'r1', name: '[RA Section Manager]', role: 'Manager · acknowledge required', on: true, ack: '' },
    { id: 'r2', name: '[Plant 2 Manager]', role: 'Plant manager', on: true, ack: '' },
    { id: 'r3', name: '[MM Section Head]', role: 'Maintenance', on: true, ack: '' },
  ];
  return {
    top10: seedTop10(prev),
    snapshots: { '2026-W42': prev },
    removed: [],
    recips,
    sentAt: '',
    sentWeek: '',
    troubles: seedTroubles(),
    ...seedMonitor(),
  };
}
