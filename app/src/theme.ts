// Design tokens — from design_handoff_kpi_dashboard/README.md "Design Tokens".
// Keep these exact; this is a hifi recreation, not a new design.

export const colors = {
  navDark: '#0d2236',
  navActive: '#1a3a59',
  navHairline: '#15324d',
  appBg: '#eef1f5',
  cardBg: '#ffffff',
  cardBorder: '#e2e7ee',
  rowHairline: '#eef1f5',
  navy: '#15355b',
  navy2: '#14365c',
  ink: '#16202b',
  muted: '#6b7888',
  muted2: '#7c8a99',
  blue: '#1668c4',
  blue2: '#1f76c8',
  green: '#15662f',
  greenBg: '#e6f3ea',
  amber: '#c47e1a',
  amber2: '#e9a23b',
  amberBg: '#fbf1dd',
  danger: '#cf2e2e',
  dangerBg: '#fdecec',
  plant1: '#3a6fc4',
  plant1Chart: '#2f6fd0',
  plant2: '#e07b2e',
  plant2Chart: '#e08a37',
  plant3: '#9aa6b3',
  plant3Chart: '#aab4c0',
  accum: '#e8b53a',
  accumChart: '#e3a92e',
  planBar: '#b9c2cc',
  actualBar: '#1f76c8',
  tooltipSurface: '#0d2236',
  blueBg: '#e7f0fb',
  grayBg: '#e8eaed',
} as const;

export const fonts = {
  primary: "'Archivo','Helvetica Neue',Arial,sans-serif",
  condensed: "'Archivo Narrow','Helvetica Neue',Arial,sans-serif",
  mono: "'Roboto Mono',monospace",
} as const;

export const radii = {
  card: 11,
  input: 7,
  chip: 5,
  modal: 14,
} as const;
