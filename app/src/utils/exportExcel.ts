// Multi-sheet Excel export (SpreadsheetML) — no dependency needed, mirrors the
// prototype's exportYear(). Opens natively in Excel; numbers stay numeric.
import { num, monthOf } from './calc';
import type { Year } from '../types/models';

function xc(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function xcell(v: unknown): string {
  const isNum =
    typeof v === 'number' ||
    (v !== '' && v != null && typeof v !== 'boolean' && /^-?\d*\.?\d+$/.test(String(v).trim()));
  if (isNum) return `<Cell><Data ss:Type="Number">${xc(v)}</Data></Cell>`;
  return `<Cell><Data ss:Type="String">${xc(v)}</Data></Cell>`;
}

function xrow(cells: unknown[]): string {
  return '<Row>' + cells.map(xcell).join('') + '</Row>';
}

function xsheet(name: string, rows: unknown[][]): string {
  const safe = name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
  return `<Worksheet ss:Name="${xc(safe)}"><Table>` + rows.map(xrow).join('') + '</Table></Worksheet>';
}

export function exportYearToExcel(year: Year, activeYear: number) {
  const sheets: string[] = [];

  const mh: unknown[] = ['Incident', 'Y25', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const catCounts: Record<string, number[]> = {};
  (year.safety.matrix || []).forEach((r) => (catCounts[r.cat] = Array(12).fill(0)));
  (year.safety.log || []).forEach((l) => {
    const mi = months.indexOf(l.month || monthOf(l.date));
    if (mi >= 0 && l.type && catCounts[l.type]) catCounts[l.type][mi]++;
  });
  const mrows: unknown[][] = [
    mh,
    ...(year.safety.matrix || []).map((r) => {
      const m = catCounts[r.cat] || Array(12).fill(0);
      return [r.cat, r.y25, ...m, m.reduce((a, b) => a + b, 0)];
    }),
  ];
  sheets.push(xsheet('Safety Matrix', mrows));

  sheets.push(
    xsheet('Safety Log', [
      ['Date', 'Month', 'Type', 'Description'],
      ...(year.safety.log || []).map((l) => [l.date, l.month, l.type, l.description]),
    ])
  );

  const relHead: unknown[] = [
    'Month', 'Plant', 'Topic', 'Equipment', 'Shutdown type', 'Plant effect', 'Shutdown start', 'Start-up',
    'Shutdown hr', 'CTA vol loss (KT)', 'PE cost (MB)', 'MT cost (MB)', 'Root cause', 'MT quality', 'Executive summary',
  ];
  const relMap = (e: Year['cta'][number]) => [
    e.month || monthOf(e.sdStart), e.plant, e.topic, e.equipment, e.shutdownType, e.plantEffect, e.sdStart,
    e.suStart, e.hours, e.ctaVolLoss, e.peCost, e.mtCost, e.rootCause, e.mtQuality, (e.execSummary || '').replace(/\n/g, ' / '),
  ];
  sheets.push(xsheet('CTA Shutdown', [relHead, ...year.cta.map(relMap)]));
  sheets.push(xsheet('PTA Shutdown', [relHead, ...year.pta.map(relMap)]));

  const ch: unknown[] = ['Project name', 'Response by', 'Register type', 'Saving type', 'Plan MB', 'Plan USD/T', 'SIL4 month', 'SIL4 year', 'Status', 'Actual MB', 'Actual USD/T'];
  sheets.push(
    xsheet('Cost Saving', [
      ch,
      ...year.cost.map((p) => [p.projectName, p.responseBy, p.registerType, p.savingType, p.planMB, p.planUSDT, p.sil4Month, p.sil4Year, p.status, p.actualMB, p.actualUSDT]),
    ])
  );

  const m = year.maint;
  const mrows2: unknown[][] = [['Metric', 'Plan', 'Actual']];
  mrows2.push(['Daily MN cost YTD (MB)', m.dailyPlan, m.dailyYTD]);
  mrows2.push(['Shutdown cost YTD (MB)', m.sdPlan, m.sdYTD]);
  mrows2.push([]);
  mrows2.push(['Daily cost by plant', 'Plan (MB)', 'Actual (MB)']);
  (m.byPlant || []).forEach((p) => mrows2.push([p.plant, p.plan, p.actual]));
  mrows2.push([]);
  mrows2.push(['Shutdown cost by event', 'Plan (MB)', 'Actual (MB)']);
  (m.shutdownCost || []).forEach((p) => mrows2.push([p.event, p.plan, p.actual]));
  mrows2.push([]);
  mrows2.push(['Major highlight', (m.majorHighlight || '').replace(/\n/g, ' / ')]);
  sheets.push(xsheet('Maintenance Cost', mrows2));

  const pl = { p1: 0, p2: 0, p3: 0 };
  [...year.cta, ...year.pta].forEach((e) => {
    const k = e.plant === 'Plant 2' ? 'p2' : e.plant === 'Plant 3' ? 'p3' : 'p1';
    pl[k] += num(e.ctaVolLoss);
  });
  sheets.push(
    xsheet('Production Loss', [
      ['Plant', 'CTA vol loss (KT)'],
      ['Plant 1', pl.p1],
      ['Plant 2', pl.p2],
      ['Plant 3', pl.p3],
      ['Total', pl.p1 + pl.p2 + pl.p3],
    ])
  );

  const sdHead: unknown[] = ['Name', 'Start', 'End', 'Days', 'Companies', 'Workers', 'Budget total (MB)', 'Budget maint (MB)', 'Budget oper (MB)', 'Total works', 'PM', 'CBM', 'MOC'];
  sheets.push(
    xsheet('Shutdown Activities', [
      sdHead,
      ...(year.shutdowns || []).map((sd) => [sd.name, sd.start, sd.end, sd.days, sd.companies, sd.workers, sd.budgetTotal, sd.budgetMaint, sd.budgetOper, sd.totalWorks, sd.pm, sd.cbm, sd.moc]),
    ])
  );

  const xml =
    '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
    sheets.join('') +
    '</Workbook>';
  const blob = new Blob(['﻿' + xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GCM-PTA-KPI-${activeYear}.xls`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 500);
}
