// Data model — mirrors the design prototype (KPI Dashboard.dc.html) exactly.
// See design_handoff_kpi_dashboard/README.md "Data Model" section.

export type Plant = 'Plant 1' | 'Plant 2' | 'Plant 3';
export type ShutdownType = 'CTA trouble' | 'PTA trouble';
export type PlantEffect = 'ESD' | 'CTA load down' | 'Re slurry' | 'Resolvent';
export type RootCause = 'Aging' | 'Weak design' | 'External factor' | 'MT quality';
export type MTQuality =
  | 'Lack of knowledge'
  | 'Contractor performance'
  | 'Incomplete MT system'
  | 'Human error'
  | 'Other'
  | '';
export type RegisterType = 'Action plan' | 'Added';
export type SavingType = 'Recurring' | 'Onetime';
export type CostStatus = 'Execute (IL3)' | 'Release saving (IL4)';
export type ConcernPlant = 'P#1' | 'P#2' | 'P#3';
export type ConcernStatus = 'Monitoring' | 'Resolved';
export type FuncType = 'Rotating' | 'Static' | 'Electrical' | 'Instrument' | 'Production';

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
export type MonthName = typeof MONTHS[number];

export const SAFETY_CATEGORIES = [
  'PSE Tier 1, Tier 2',
  'LOPC, Tier 3a,3b',
  'TRIR',
  'First Aid',
  'Property Damage',
] as const;
export type SafetyCategory = typeof SAFETY_CATEGORIES[number];

export const RECORDABLE_CATEGORIES: SafetyCategory[] = ['PSE Tier 1, Tier 2', 'LOPC, Tier 3a,3b', 'TRIR'];

export interface ImageRef {
  src: string; // data URL or Storage URL
  h: number; // display height px
  caption?: string;
}

export interface SafetyMatrixRow {
  cat: SafetyCategory;
  y25: number | string;
}

export interface SafetyLogEntry {
  id: string;
  date: string; // yyyy-mm-dd
  month: MonthName | '';
  type: SafetyCategory | '';
  description: string;
}

export interface SafetyData {
  matrix: SafetyMatrixRow[];
  log: SafetyLogEntry[];
}

export interface ReliabilityEvent {
  id: string;
  month: MonthName | '';
  plant: Plant;
  topic: string;
  equipment: string;
  shutdownType: ShutdownType;
  plantEffect: PlantEffect;
  sdStart: string; // datetime-local
  suStart: string; // datetime-local
  hours: number;
  ctaVolLoss: number | string;
  peCost: number | string;
  mtCost: number | string;
  rootCause: RootCause;
  mtQuality: MTQuality;
  execSummary: string;
  images: ImageRef[];
}

export interface CostProject {
  id: string;
  projectName: string;
  responseBy: string;
  registerType: RegisterType;
  savingType: SavingType;
  planMB: number | string;
  planUSDT: number | string;
  sil4Month: MonthName;
  sil4Year: number;
  status: CostStatus;
  actualMB: number | string;
  actualUSDT: number | string;
}

/**
 * One free-positioned element on a "free layout" canvas (Concerning
 * Equipment's body, Shutdown Performance's Highlight Activities, …).
 * Coordinates/sizes are percentages (0-100) of the slide's content body
 * area, so the same numbers place the block correctly whether it's
 * rendered in the in-app editor, the live slide, or the PPTX export.
 */
export interface ConcernBlock {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  html?: string; // text blocks: rich-text HTML (bold/underline/color spans, one <div> per line)
  src?: string; // image blocks: image URL/data URL
}

/**
 * The content of one slide/page for a Concerning Equipment case — either
 * the structured issue/possibleCause/... fields, a full-page screenshot, or
 * a free-layout canvas. A case's first page is kept flat on ConcernItem
 * itself (see below) for backward compatibility with existing data/overrides;
 * `extraPages` holds any additional pages (2nd, 3rd, ...) in this same shape.
 */
export interface ConcernPage {
  id: string;
  issue: string;
  possibleCause: string;
  action: string;
  preventive: string;
  benefit: string;
  images: ImageRef[];
  notes?: string;
  fullImage?: boolean;
  canvas?: ConcernBlock[];
}

export interface ConcernItem {
  id: string;
  month: MonthName | '';
  equipment: string;
  plant: ConcernPlant;
  status: ConcernStatus;
  title: string;
  issue: string;
  possibleCause: string;
  action: string;
  preventive: string;
  benefit: string;
  images: ImageRef[];
  notes?: string;
  fullImage?: boolean;
  // When set (non-empty), this concern item uses the free-layout canvas
  // instead of the structured issue/possibleCause/... fields above.
  canvas?: ConcernBlock[];
  // Additional pages/slides for this same case (equipment/plant/status/title
  // stay shared across all of a case's pages) — each one independently
  // structured, full-image, or free-layout.
  extraPages?: ConcernPage[];
}

export interface ShutdownPerfKpiRow {
  id: string;
  kpi: string;
  plan: string;
  actual: string;
  remark: string;
}

export interface ShutdownPerfItem {
  id: string;
  month: MonthName | '';
  shutdownCode: string;
  kpiRows: ShutdownPerfKpiRow[];
  // Highlight Activities — same free-layout canvas as Concerning Equipment.
  canvas: ConcernBlock[];
}

export interface ByPlantCost {
  plant: string;
  plan: number | string;
  actual: number | string;
}

export interface ShutdownCostRow {
  event: string;
  plan: number | string;
  actual: number | string;
}

export interface MaintenanceData {
  dailyYTD: number | string;
  dailyPlan: number | string;
  sdYTD: number | string;
  sdPlan: number | string;
  byPlant: ByPlantCost[];
  majorHighlight: string;
  shutdownCost: ShutdownCostRow[];
  sdNote: string;
}

export interface CriticalWork {
  equip: string;
  work: string;
  func: FuncType;
}

export interface Shutdown {
  name: string;
  start: string;
  end: string;
  days: number | string;
  companies: number | string;
  workers: number | string;
  budgetTotal: number | string;
  budgetMaint: number | string;
  budgetOper: number | string;
  totalWorks: number | string;
  pm: number | string;
  cbm: number | string;
  moc: number | string;
  critical: CriticalWork[];
}

export interface YearMeta {
  presented: string;
  preparedBy: string;
  target: string;
  title: string;
}

export interface Year {
  meta: YearMeta;
  ovr: Record<string, string>; // manual slide text overrides, keyed by slide field key
  safety: SafetyData;
  cta: ReliabilityEvent[];
  pta: ReliabilityEvent[];
  cost: CostProject[];
  concern: ConcernItem[];
  shutdownPerf: ShutdownPerfItem[];
  maint: MaintenanceData;
  shutdowns: Shutdown[];
  backups: string[]; // pasted/uploaded backup slide images (data URLs)
  coverImage?: string; // title-slide cover photo (data URL)
  slideOrder?: Record<string, string[]>; // month -> custom slide key order
}

export interface Store {
  activeYear: number;
  activeMonth: MonthName;
  years: Record<string, Year>;
  weekly?: WeeklyData; // week-based monitoring (not tied to a reporting year)
}

// ---------- Weekly reliability monitoring ----------

export type WeeklyPlant = 'Plant 1' | 'Plant 2' | 'Plant 3' | 'UT';
export type Top10Source = 'PCD' | 'IDB' | 'MANUAL';
export type Top10Status = 'open' | 'verifying' | 'closed';
export type StepStatus = 'Open' | 'Watch' | 'Done';

export interface MitigationStep {
  text: string;
  result: string;
  status: StepStatus;
}

export interface Top10Link {
  kind: 'pi' | 'link' | 'app';
  label: string;
  url: string;
}

export interface Top10Item {
  id: string;
  src: Top10Source;
  tag: string;
  plant: WeeklyPlant;
  detail: string; // topic
  background: string;
  l: number; // likelihood 1–5, 0 = not assessed
  i: number; // impact 1–5, 0 = not assessed
  owner: string;
  due: string; // yyyy-mm-dd
  steps: MitigationStep[];
  photos: { src: string; label: string }[];
  links: Top10Link[];
  status: Top10Status;
  cls: { eqClass: string; mode: string; mech: string; cause: string };
  ver: { rl: string; ri: string; method: string; evidence: string; by: string; date: string; recheck: string; accept: boolean };
}

export interface Top10SnapshotItem {
  id: string;
  tag: string;
  l: number;
  i: number;
  status: Top10Status;
}

export interface WeeklyRecipient {
  id: string;
  name: string;
  role: string;
  on: boolean;
  ack: string; // acknowledged-at stamp, '' = pending
}

export interface TroubleLog {
  at: string;
  text: string;
  sent: boolean;
}

export interface TroubleItem {
  id: string;
  title: string;
  plant: '1' | '2' | '3' | 'UT';
  date: string;
  corrective: string;
  preventive: string;
  status: 'In-progress' | 'Completed';
  due: string;
  owner: string;
  log: TroubleLog[];
  ver: number; // bumped on every edit
  sentVer: number; // ver at last send
  lastSent: string;
}

export type MonitorIcon = 'motor' | 'compressor' | 'agitator' | 'centrifuge' | 'hx';

export interface MonitorGroup {
  id: string;
  name: string;
  icon: MonitorIcon;
  links: Top10Link[];
}

export interface MonitorAsset {
  id: string;
  group: string;
  tag: string;
  plant: string;
  service: string;
  param: string;
  unit: string;
  alert: number;
  danger: number;
  sample: boolean;
  note: string;
  readings: { d: string; v: number }[];
}

export interface WeeklyData {
  top10: Top10Item[];
  snapshots: Record<string, Top10SnapshotItem[]>; // ISO week key (e.g. 2026-W42) -> frozen board at send time
  removed: { id: string; tag: string; reason: string; week: string }[];
  recips: WeeklyRecipient[];
  sentAt: string;
  sentWeek: string;
  troubles: TroubleItem[];
  groups: MonitorGroup[];
  assets: MonitorAsset[];
}

export type ViewId =
  | 'dashboard'
  | 'safety'
  | 'reliability'
  | 'cost'
  | 'maint'
  | 'shutdown'
  | 'shutdownPerf'
  | 'concern'
  | 'slides'
  | 'weeklyTop10'
  | 'plantTrouble'
  | 'critMonitor';

export type RelModule = 'cta' | 'pta';
export type EditorModule = 'safety' | RelModule | 'cost' | 'concern' | 'shutdownPerf';
