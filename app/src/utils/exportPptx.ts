import PptxGenJS from 'pptxgenjs';
import {
  concernPageContent,
  concernPageCount,
  costTotals,
  ctaEsdHoursAccum,
  esc,
  esdHoursAccum,
  fmt,
  monthOf,
  monthlyByPlant,
  nl2br,
  num,
  safetyRecordable,
  unplannedPct,
} from './calc';
import { MONTHS, type ConcernBlock, type ConcernItem, type ShutdownPerfItem, type Store, type Year } from '../types/models';

const NAVY = '14365C';
const GREEN = '15662F';
const BLUE = '1668C4';
const MUTED = '6B7888';
const DANGER = 'CF2E2E';
const PTA_TARGET = 54;

/** Effective (override-aware) text for a slide field key, as plain lines. */
function ovr(year: Year, key: string, fallback: string): string {
  const html = year.ovr?.[key];
  return html != null ? html : fallback;
}

/**
 * Fetch an image (data URL already, or a remote Firebase Storage URL) and
 * return a data URL pptxgenjs can embed directly. Converting ourselves
 * avoids relying on pptxgenjs's own fetch of a remote URL, which can be
 * blocked by the Storage bucket's CORS policy.
 */
async function toEmbeddableDataUrl(src: string): Promise<string | null> {
  if (src.startsWith('data:')) return src;
  try {
    const blob = await fetch(src).then((r) => r.blob());
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not fetch image for PPTX export (CORS on the Storage bucket?):', src, e);
    return null;
  }
}

function htmlToLines(html: string): string[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  const blocks = Array.from(div.querySelectorAll('div'));
  if (blocks.length === 0) {
    const text = (div.textContent || '').trim();
    return text ? [text] : [];
  }
  return blocks.map((b) => (b.textContent || '').trim()).filter(Boolean);
}

function bullet(txt: string) {
  return `<div>${txt}</div>`;
}

interface PptxRun {
  text: string;
  options: { bold?: boolean; underline?: { style: 'sng' }; color?: string; breakLine?: boolean };
}

function rgbToPptxHex(colorStr: string): string {
  if (colorStr.startsWith('#')) return colorStr.slice(1).toUpperCase();
  const m = colorStr.match(/\d+/g);
  if (!m) return '000000';
  const [r, g, b] = m.map(Number);
  return [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function walkRuns(node: Node, fmt: { bold?: boolean; underline?: { style: 'sng' }; color?: string }): PptxRun[] {
  const runs: PptxRun[] = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text) runs.push({ text, options: { bold: fmt.bold, underline: fmt.underline, color: fmt.color } });
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const nf = { ...fmt };
      const tag = el.tagName.toLowerCase();
      if (tag === 'b' || tag === 'strong') nf.bold = true;
      if (tag === 'u') nf.underline = { style: 'sng' };
      if (el.style?.color) nf.color = rgbToPptxHex(el.style.color);
      runs.push(...walkRuns(el, nf));
    }
  });
  return runs;
}

/** Rich-text HTML (one <div> per line, with <b>/<strong>/<u>/color spans) -> flat pptxgenjs text-run array. */
function htmlToPptxRuns(html: string): PptxRun[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  const lineEls = Array.from(div.children).filter((el) => el.tagName === 'DIV') as HTMLElement[];
  const effectiveLines = lineEls.length ? lineEls : [div];
  const lines = effectiveLines
    .map((el) => {
      const runs = walkRuns(el, {});
      return runs.length ? runs : [{ text: el.textContent || '', options: {} }];
    })
    .filter((line) => line.some((r) => r.text.trim()));
  const out: PptxRun[] = [];
  lines.forEach((line, li) => {
    line.forEach((run, ri) => {
      const opts = { ...run.options };
      if (ri === line.length - 1 && li < lines.length - 1) opts.breakLine = true;
      out.push({ text: run.text, options: opts });
    });
  });
  return out;
}

interface PptxArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Render a free-layout canvas (Concerning Equipment body / Shutdown Performance highlight activities) into a pptx area, in stable z-order. */
async function renderCanvasBlocks(s: PptxGenJS.Slide, blocks: ConcernBlock[], area: PptxArea) {
  const ordered = [...blocks].sort((a, b) => a.z - b.z);
  for (const b of ordered) {
    const px = area.x + (b.x / 100) * area.w;
    const py = area.y + (b.y / 100) * area.h;
    const pw = (b.w / 100) * area.w;
    const ph = (b.h / 100) * area.h;
    if (b.type === 'image' && b.src) {
      const data = await toEmbeddableDataUrl(b.src);
      if (data) s.addImage({ data, x: px, y: py, w: pw, h: ph, sizing: { type: 'contain', w: pw, h: ph } });
    } else if (b.html) {
      const runs = htmlToPptxRuns(b.html);
      if (runs.length) {
        s.addText(
          runs.map((r) => ({ text: r.text, options: { ...r.options, color: r.options.color || '3A4654' } })),
          { x: px, y: py, w: pw, h: ph, fontFace: 'Arial', fontSize: 11, valign: 'top' }
        );
      }
    }
  }
}

function monthlyChartData(entries: Year['cta']) {
  const { M } = monthlyByPlant(entries);
  let acc = 0;
  const accum = M.map((m) => {
    acc = Math.round((acc + m.p1 + m.p2 + m.p3) * 100) / 100;
    return acc;
  });
  return {
    cats: MONTHS as unknown as string[],
    p1: M.map((m) => m.p1),
    p2: M.map((m) => m.p2),
    p3: M.map((m) => m.p3),
    accum,
  };
}

export async function exportYearToPptx(year: Year, store: Store) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'DECK', width: 13.333, height: 7.5 });
  pptx.layout = 'DECK';
  const W = 13.333;
  const H = 7.5;
  const mo = store.activeMonth;
  const yr = store.activeYear;

  // ---------- Slide 1 · Title ----------
  {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape('rect', { x: 0, y: 0, w: W * 0.58, h: H, fill: { color: NAVY } });
    const coverData = year.coverImage ? await toEmbeddableDataUrl(year.coverImage) : null;
    if (coverData) {
      s.addImage({ data: coverData, x: W * 0.58, y: 0, w: W * 0.42, h: H, sizing: { type: 'cover', w: W * 0.42, h: H } });
    } else {
      s.addShape('rect', { x: W * 0.58, y: 0, w: W * 0.42, h: H, fill: { color: '1C4673' } });
    }
    const titleTxt = htmlToLines(ovr(year, 's1.title', esc(year.meta.title || 'Maintenance Monthly'))).join(' ') || 'Maintenance Monthly';
    s.addText(titleTxt, { x: 0.6, y: 2.3, w: 6.8, h: 1.1, fontFace: 'Arial', fontSize: 40, bold: true, color: 'FFFFFF' });
    const subTxt = htmlToLines(ovr(year, 's1.sub', `${mo} ${yr} Performance`)).join(' ') || `${mo} ${yr} Performance`;
    s.addText(subTxt, { x: 0.6, y: 3.25, w: 6.8, h: 0.6, fontFace: 'Arial', fontSize: 20, bold: true, color: '8FB2DD' });
    s.addText('EXECUTIVE SUMMARY', { x: 0.6, y: 4.0, w: 3.5, h: 0.4, fontFace: 'Arial', fontSize: 11, color: 'CDD9E6', charSpacing: 2 });
    const cols = [
      ['PRESENTED', htmlToLines(ovr(year, 's1.presented', esc(year.meta.presented))).join(' ')],
      ['PREPARED BY', htmlToLines(ovr(year, 's1.prepared', esc(year.meta.preparedBy))).join(' ')],
      ['TARGET', htmlToLines(ovr(year, 's1.target', esc(year.meta.target))).join(' ')],
    ];
    cols.forEach(([label, val], i) => {
      const x = 0.6 + i * 2.3;
      s.addText(label, { x, y: 5.9, w: 2.2, h: 0.3, fontFace: 'Arial', fontSize: 10, color: '7D99BC', charSpacing: 1.5 });
      s.addText(val, { x, y: 6.2, w: 2.2, h: 0.4, fontFace: 'Arial', fontSize: 13, color: 'CDD9E6' });
    });
  }

  // ---------- Slide 2 · Safety & Reliability ----------
  {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape('rect', { x: 0, y: 0, w: W, h: 0.65, fill: { color: GREEN } });
    const headTxt = htmlToLines(ovr(year, 's2.head', 'Safety &amp; Reliability')).join(' ') || 'Safety & Reliability';
    s.addText(headTxt, { x: 0.5, y: 0.08, w: 8, h: 0.5, fontFace: 'Arial', fontSize: 20, bold: true, color: 'FFFFFF' });

    const ctaEsdEvents = year.cta.filter((e) => e.plantEffect === 'ESD');
    const rec = safetyRecordable(year);
    const cta = ctaEsdHoursAccum(year.cta);
    const pta = esdHoursAccum(year.pta);
    const ptaOver = pta > PTA_TARGET;
    const kpis: [string, string, string][] = [
      ['Recordable incidents', String(rec), 'YTD · PSE T1/2 · TRIR'],
      ['Unplanned downtime', `${unplannedPct(year.cta).toFixed(2)}%`, 'Target < 0.25%'],
      ['CTA ESD hr · accum', fmt(cta), 'Target 65.7 h'],
      ['PTA ESD hr · accum', fmt(pta), ptaOver ? 'Over target' : `Target <${PTA_TARGET} h`],
    ];
    kpis.forEach(([label, value, note], i) => {
      const x = 0.5 + i * 3.1;
      s.addShape('rect', { x, y: 0.85, w: 2.9, h: 1.15, line: { color: 'E2E7EE', width: 1 }, fill: { color: 'FFFFFF' } });
      s.addText(label.toUpperCase(), { x: x + 0.15, y: 0.92, w: 2.6, h: 0.3, fontFace: 'Arial', fontSize: 9, color: '7C8A99' });
      s.addText(value, { x: x + 0.15, y: 1.18, w: 2.6, h: 0.5, fontFace: 'Arial', fontSize: 22, bold: true, color: i === 3 && ptaOver ? DANGER : i === 0 ? GREEN : BLUE });
      s.addText(note, { x: x + 0.15, y: 1.68, w: 2.6, h: 0.3, fontFace: 'Arial', fontSize: 9, color: MUTED });
    });

    const ctaData = monthlyChartData(ctaEsdEvents);
    const ptaData = monthlyChartData(year.pta);
    const asChart = (d: ReturnType<typeof monthlyChartData>) => [
      { name: 'Plant 1', labels: d.cats, values: d.p1 },
      { name: 'Plant 2', labels: d.cats, values: d.p2 },
      { name: 'Plant 3', labels: d.cats, values: d.p3 },
    ];
    s.addText('CTA Shutdown hour', { x: 0.5, y: 2.25, w: 4, h: 0.3, fontFace: 'Arial', fontSize: 12, bold: true, color: '33485E' });
    s.addChart(pptx.ChartType.bar, asChart(ctaData), { x: 0.5, y: 2.55, w: 6, h: 1.9, barGrouping: 'clustered', showLegend: true, legendPos: 'b', legendFontSize: 8, catAxisLabelFontSize: 7, valAxisLabelFontSize: 7, chartColors: ['3A6FC4', 'E07B2E', '9AA6B3'] });
    s.addText('PTA Shutdown hour', { x: 0.5, y: 4.55, w: 4, h: 0.3, fontFace: 'Arial', fontSize: 12, bold: true, color: '33485E' });
    s.addChart(pptx.ChartType.bar, asChart(ptaData), { x: 0.5, y: 4.85, w: 6, h: 1.9, barGrouping: 'clustered', showLegend: true, legendPos: 'b', legendFontSize: 8, catAxisLabelFontSize: 7, valAxisLabelFontSize: 7, chartColors: ['3A6FC4', 'E07B2E', '9AA6B3'] });

    const caseCol = (label: string, key: string, fallback: string, y: number, h: number) => {
      s.addShape('rect', { x: 6.9, y, w: 5.9, h, fill: { color: 'EEF3F8' } });
      s.addText(label, { x: 7.05, y: y + 0.08, w: 5.6, h: 0.3, fontFace: 'Arial', fontSize: 12, bold: true, color: '1D2733' });
      const lines = htmlToLines(ovr(year, key, fallback));
      s.addText(lines.length ? lines.map((l) => ({ text: l, options: { bullet: true, breakLine: true } })) : [{ text: 'None recorded.', options: {} }], {
        x: 7.05, y: y + 0.4, w: 5.6, h: h - 0.5, fontFace: 'Arial', fontSize: 10, color: '3A4654', valign: 'top',
      });
    };
    const safetyFallback = (safetyRecordable(year) === 0 ? '<div>No recordable incident YTD.</div>' : `<div>${safetyRecordable(year)} recordable incident(s) YTD</div>`) +
      (year.safety.log || []).map((l) => bullet(`${esc(l.month || '')} — ${esc(l.description)}`)).join('');
    const ctaFallback = ctaEsdEvents.length ? ctaEsdEvents.map((e) => bullet(`${e.month || monthOf(e.sdStart)} — ${esc(e.topic)}, ${fmt(e.hours, 1)} h`)).join('') : '<div>No CTA ESD event.</div>';
    const ptaFallback = year.pta.length ? year.pta.map((e) => bullet(`${e.month || monthOf(e.sdStart)} : ${esc(e.topic)} ${fmt(e.hours, 1)} hrs.`)).join('') : '<div>No PTA ESD event.</div>';
    caseCol('Safety case', 's2.safety', safetyFallback, 2.25, 1.5);
    caseCol('CTA ESD case', 's2.cta', ctaFallback, 3.85, 1.5);
    caseCol('PTA ESD case', 's2.pta', ptaFallback, 5.45, 1.3);
  }

  // ---------- Slide 3 · Cost & Savings ----------
  {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape('rect', { x: 0, y: 0, w: W, h: 0.65, fill: { color: NAVY } });
    const headTxt = htmlToLines(ovr(year, 's3.head', 'Maintenance Cost &amp; Savings')).join(' ') || 'Maintenance Cost & Savings';
    s.addText(headTxt, { x: 0.5, y: 0.08, w: 8, h: 0.5, fontFace: 'Arial', fontSize: 20, bold: true, color: 'FFFFFF' });

    const m = year.maint;
    const ct = costTotals(year, mo, yr);
    const dailyDiff = num(m.dailyYTD) - num(m.dailyPlan);
    const sdDiff = num(m.sdYTD) - num(m.sdPlan);
    const kpis: [string, string, string][] = [
      ['Daily MN cost · YTD', `${fmt(m.dailyYTD)} MB`, `Plan ${fmt(m.dailyPlan)} · ${dailyDiff <= 0 ? 'under' : 'over'} plan`],
      ['Shutdown cost · YTD', `${fmt(m.sdYTD)} MB`, `Plan ${fmt(m.sdPlan)} · ${sdDiff <= 0 ? 'under' : 'over'} plan`],
      ['Cost-saving pipeline', `Release ${fmt(ct.il4, 2)} · Execute ${fmt(ct.il3, 2)} MB`, `${ct.count} action plans`],
    ];
    kpis.forEach(([label, value, note], i) => {
      const x = 0.5 + i * 4.1;
      s.addShape('rect', { x, y: 0.85, w: 3.9, h: 1.1, line: { color: 'E2E7EE', width: 1 } });
      s.addText(label.toUpperCase(), { x: x + 0.15, y: 0.92, w: 3.6, h: 0.3, fontFace: 'Arial', fontSize: 9, color: '7C8A99' });
      s.addText(value, { x: x + 0.15, y: 1.2, w: 3.6, h: 0.45, fontFace: 'Arial', fontSize: 16, bold: true, color: BLUE });
      s.addText(note, { x: x + 0.15, y: 1.62, w: 3.6, h: 0.3, fontFace: 'Arial', fontSize: 9, color: dailyDiff <= 0 || i === 2 ? GREEN : DANGER });
    });

    s.addText('Daily maintenance cost by plant · MB', { x: 0.5, y: 2.25, w: 5, h: 0.3, fontFace: 'Arial', fontSize: 12, bold: true, color: '33485E' });
    const rows: any[][] = [
      [
        { text: 'Plant', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Plan', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Actual', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'vs Plan', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
      ],
      ...m.byPlant.map((p) => {
        const diff = num(p.actual) - num(p.plan);
        return [
          { text: p.plant, options: {} },
          { text: fmt(p.plan, 1), options: { align: 'right' as const } },
          { text: fmt(p.actual, 1), options: { align: 'right' as const } },
          { text: (diff >= 0 ? '+' : '') + diff.toFixed(1), options: { align: 'right' as const, color: diff <= 0 ? GREEN : DANGER } },
        ];
      }),
    ];
    s.addTable(rows, { x: 0.5, y: 2.6, w: 5.8, colW: [2, 1.27, 1.27, 1.27], fontSize: 10, border: { type: 'solid', color: 'EEF1F5', pt: 0.5 } });

    s.addText('Major cost', { x: 0.5, y: 5.1, w: 5, h: 0.3, fontFace: 'Arial', fontSize: 10, color: '7C8A99' });
    const majorText = htmlToLines(ovr(year, 's3.major', nl2br(m.majorHighlight)));
    s.addText(majorText.join('\n') || '—', { x: 0.5, y: 5.4, w: 5.8, h: 1.7, fontFace: 'Arial', fontSize: 10.5, color: '3A4654', valign: 'top' });

    s.addText('Shutdown cost — plan vs actual · MB', { x: 6.6, y: 2.25, w: 6.2, h: 0.3, fontFace: 'Arial', fontSize: 12, bold: true, color: '33485E' });
    const sdChart = [
      { name: 'Plan', labels: m.shutdownCost.map((r) => r.event), values: m.shutdownCost.map((r) => num(r.plan)) },
      { name: 'Actual', labels: m.shutdownCost.map((r) => r.event), values: m.shutdownCost.map((r) => num(r.actual)) },
    ];
    s.addChart(pptx.ChartType.bar, sdChart, { x: 6.6, y: 2.55, w: 6.2, h: 2.9, barGrouping: 'clustered', showLegend: true, legendPos: 'b', legendFontSize: 8, catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, chartColors: ['B9C2CC', '1F76C8'] });
    const noteText = htmlToLines(ovr(year, 's3.note', esc(m.sdNote))).join(' ');
    if (noteText) s.addText(noteText, { x: 6.6, y: 5.55, w: 6.2, h: 0.5, fontFace: 'Arial', fontSize: 9.5, italic: true, color: MUTED });
  }

  // ---------- Slide 4+ · Shutdown Activities (one per shutdown) ----------
  const shutdowns = year.shutdowns || [];
  shutdowns.forEach((sd, si) => {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape('rect', { x: 0, y: 0, w: W, h: 0.65, fill: { color: NAVY } });
    const headFallback = `Shutdown Activities — ${sd.name || 'SD ' + (si + 1)}${shutdowns.length > 1 ? ` (${si + 1}/${shutdowns.length})` : ''}`;
    const headTxt = htmlToLines(ovr(year, `s4.head.${si}`, headFallback)).join(' ') || headFallback;
    s.addText(headTxt, { x: 0.5, y: 0.08, w: 10, h: 0.5, fontFace: 'Arial', fontSize: 20, bold: true, color: 'FFFFFF' });

    const cards: [string, string, string][] = [
      ['Shutdown period', `${sd.start} → ${sd.end}`, `${sd.days} days`],
      ['Contractors', `${sd.companies} cos · ${sd.workers} ppl`, ''],
      ['Budget · MB', String(sd.budgetTotal), `${sd.budgetMaint} maint · ${sd.budgetOper} oper`],
      ['Total works', String(sd.totalWorks), `PM ${sd.pm} · CBM ${sd.cbm} · MOC ${sd.moc}`],
    ];
    cards.forEach(([label, value, note], i) => {
      const x = 0.5 + i * 3.1;
      s.addShape('rect', { x, y: 0.85, w: 2.9, h: 1.15, line: { color: 'E2E7EE', width: 1 } });
      s.addText(label.toUpperCase(), { x: x + 0.15, y: 0.92, w: 2.6, h: 0.3, fontFace: 'Arial', fontSize: 9, color: '7C8A99' });
      s.addText(value, { x: x + 0.15, y: 1.2, w: 2.6, h: 0.45, fontFace: 'Arial', fontSize: 16, bold: true, color: BLUE });
      s.addText(note, { x: x + 0.15, y: 1.62, w: 2.6, h: 0.3, fontFace: 'Arial', fontSize: 9, color: MUTED });
    });

    s.addText('Critical works', { x: 0.5, y: 2.3, w: 5, h: 0.3, fontFace: 'Arial', fontSize: 12, bold: true, color: '33485E' });
    const rows: any[][] = [
      [
        { text: 'Equipment', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Work description', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Function', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
      ],
      ...sd.critical.map((r) => [{ text: r.equip, options: { color: BLUE } }, { text: r.work, options: {} }, { text: r.func, options: {} }]),
    ];
    s.addTable(rows, { x: 0.5, y: 2.65, w: 12.3, colW: [3.5, 6.8, 2], fontSize: 10.5, border: { type: 'solid', color: 'EEF1F5', pt: 0.5 } });
  });

  // ---------- Slide 4b+ · Shutdown Performance (one per record, active month) ----------
  const shutdownPerfItems: ShutdownPerfItem[] = (year.shutdownPerf || []).filter((p) => p.month === mo);
  for (const [pi, item] of shutdownPerfItems.entries()) {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape('rect', { x: 0, y: 0, w: W, h: 0.65, fill: { color: '14365C' } });
    const headFallback = `${item.shutdownCode || 'Shutdown'} Performance${shutdownPerfItems.length > 1 ? ` (${pi + 1}/${shutdownPerfItems.length})` : ''}`;
    s.addText(headFallback, { x: 0.5, y: 0.08, w: 10, h: 0.5, fontFace: 'Arial', fontSize: 20, bold: true, color: 'FFFFFF' });

    const rows: any[][] = [
      [
        { text: 'KPI', options: { bold: true, fill: { color: '1F76C8' }, color: 'FFFFFF' } },
        { text: 'Plan', options: { bold: true, fill: { color: '1F76C8' }, color: 'FFFFFF' } },
        { text: 'Actual', options: { bold: true, fill: { color: '1F76C8' }, color: 'FFFFFF' } },
        { text: 'Remark', options: { bold: true, fill: { color: '1F76C8' }, color: 'FFFFFF' } },
      ],
      ...item.kpiRows.map((r) => [
        { text: r.kpi, options: { bold: true, color: '1D2733' } },
        { text: r.plan, options: { bold: true, color: '1D2733' } },
        { text: r.actual, options: { bold: true, color: BLUE } },
        { text: r.remark, options: { color: '3A4654', fontSize: 10 } },
      ]),
    ];
    s.addTable(rows, { x: 0.5, y: 0.85, w: 12.333, colW: [3.2, 1.85, 1.85, 5.43], fontSize: 11, border: { type: 'solid', color: 'E2E7EE', pt: 0.5 } });

    const tableH = 0.42 * rows.length;
    const canvasTop = 0.85 + tableH + 0.5;
    s.addText('HIGHLIGHT ACTIVITIES', { x: 0.5, y: canvasTop - 0.35, w: 6, h: 0.3, fontFace: 'Arial', fontSize: 11, bold: true, color: '1D2733', charSpacing: 1 });
    if (item.canvas?.length) {
      await renderCanvasBlocks(s, item.canvas, { x: 0.5, y: canvasTop, w: 12.333, h: Math.max(1, 6.95 - canvasTop) });
    } else {
      s.addText('No highlight activities added yet.', { x: 0.5, y: canvasTop, w: 12.333, h: 1, fontFace: 'Arial', fontSize: 11, color: '9AA6B3', align: 'center', valign: 'middle' });
    }
  }

  // ---------- Slide 5+ · Concerning Equipment (one slide per page; a case with extraPages gets several in a row) ----------
  const concernItems = year.concern.map((c, i) => ({ ...c, globalIdx: i })).filter((c) => c.month === mo);
  const concernPageRefs: { item: ConcernItem & { globalIdx: number }; pageIndex: number; pageCount: number }[] = [];
  concernItems.forEach((item) => {
    const pageCount = concernPageCount(item);
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) concernPageRefs.push({ item, pageIndex, pageCount });
  });
  for (const [si, ref] of concernPageRefs.entries()) {
    const { item: c, pageIndex, pageCount } = ref;
    const page = concernPageContent(c, pageIndex);
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape('rect', { x: 0, y: 0, w: W, h: 0.65, fill: { color: '16202B' } });
    const headFallback = concernPageRefs.length > 1 ? `Concerning Equipment (${si + 1}/${concernPageRefs.length})` : 'Concerning Equipment';
    const headTxt = htmlToLines(ovr(year, `s5.head.${si}`, headFallback)).join(' ') || headFallback;
    s.addText(headTxt, { x: 0.5, y: 0.08, w: 10, h: 0.5, fontFace: 'Arial', fontSize: 20, bold: true, color: 'FFFFFF' });

    s.addShape('rect', { x: 0.5, y: 0.85, w: 12.333, h: 6.15, fill: { color: 'EEF3F8' } });
    s.addText(c.equipment, { x: 0.75, y: 1.0, w: 10, h: 0.35, fontFace: 'Arial', fontSize: 14, bold: true, color: BLUE });
    s.addText(c.title, { x: 0.75, y: 1.35, w: 9, h: 0.4, fontFace: 'Arial', fontSize: 17, bold: true, color: '16202B' });
    if (pageCount > 1) {
      s.addShape('roundRect', { x: 9.75, y: 1.0, w: 1.05, h: 0.3, fill: { color: 'E2E7EE' }, rectRadius: 0.04 });
      s.addText(`Page ${pageIndex + 1}/${pageCount}`, { x: 9.75, y: 1.0, w: 1.05, h: 0.3, fontFace: 'Arial', fontSize: 8.5, bold: true, color: '5A6878', align: 'center', valign: 'middle' });
    }
    s.addShape('roundRect', { x: 10.9, y: 1.0, w: 0.95, h: 0.3, fill: { color: 'DCE8F6' }, rectRadius: 0.04 });
    s.addText(c.plant, { x: 10.9, y: 1.0, w: 0.95, h: 0.3, fontFace: 'Arial', fontSize: 9, bold: true, color: BLUE, align: 'center', valign: 'middle' });
    s.addShape('roundRect', { x: 11.95, y: 1.0, w: 0.9, h: 0.3, fill: { color: c.status === 'Resolved' ? 'DCF3E3' : 'F7E6CC' }, rectRadius: 0.04 });
    s.addText(c.status, { x: 11.95, y: 1.0, w: 0.9, h: 0.3, fontFace: 'Arial', fontSize: 9, bold: true, color: c.status === 'Resolved' ? GREEN : 'C47E1A', align: 'center', valign: 'middle' });

    const bodyArea: PptxArea = { x: 0.75, y: 1.5, w: 11.83, h: 5.3 };
    if (page.canvas?.length) {
      await renderCanvasBlocks(s, page.canvas, bodyArea);
    } else if (page.fullImage) {
      const imgs = page.images.slice(0, 1);
      if (imgs[0]) {
        const imgData = await toEmbeddableDataUrl(imgs[0].src);
        if (imgData) s.addImage({ data: imgData, x: bodyArea.x, y: bodyArea.y, w: bodyArea.w, h: bodyArea.h, sizing: { type: 'contain', w: bodyArea.w, h: bodyArea.h } });
      } else {
        s.addText('No screenshot attached.', { x: bodyArea.x, y: bodyArea.y, w: bodyArea.w, h: bodyArea.h, fontFace: 'Arial', fontSize: 12, color: '9AA6B3', align: 'center', valign: 'middle' });
      }
    } else {
      const bodyFallback =
        (page.issue ? bullet(`<strong>Issue</strong> ${esc(page.issue)}`) : '') +
        (page.possibleCause ? bullet(`<strong>Possible cause</strong> ${esc(page.possibleCause)}`) : '') +
        (page.action ? bullet(`<strong>Action</strong> ${esc(page.action)}`) : '') +
        (page.preventive ? bullet(`<strong>Preventive</strong> ${esc(page.preventive)}`) : '') +
        (page.benefit ? bullet(`<strong>Benefit</strong> ${esc(page.benefit)}`) : '') +
        (page.notes ? bullet(`<strong>Notes</strong> ${esc(page.notes)}`) : '');
      const bodyOvKey = pageIndex === 0 ? `s5.body.${c.globalIdx}` : `s5.body.${c.globalIdx}.extra.${pageIndex - 1}`;
      const override = year.ovr?.[bodyOvKey];
      const runs = htmlToPptxRuns(override || bodyFallback || '<div>—</div>');
      const textH = page.images.length ? bodyArea.h * 0.55 : bodyArea.h;
      s.addText(runs, { x: bodyArea.x, y: bodyArea.y, w: bodyArea.w, h: textH, fontFace: 'Arial', fontSize: 12, color: '3A4654', valign: 'top' });
      if (page.images.length) {
        const imgY = bodyArea.y + textH + 0.15;
        const imgH = bodyArea.h - textH - 0.15;
        const imgW = Math.min(3.6, bodyArea.w / Math.max(1, page.images.length) - 0.15);
        for (const [ii, img] of page.images.entries()) {
          const imgData = await toEmbeddableDataUrl(img.src);
          if (imgData) s.addImage({ data: imgData, x: bodyArea.x + ii * (imgW + 0.15), y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
        }
      }
    }
  }

  // ---------- Backup slides ----------
  for (const src of year.backups || []) {
    const s = pptx.addSlide();
    s.background = { color: '0E1620' };
    const imgData = await toEmbeddableDataUrl(src);
    if (imgData) s.addImage({ data: imgData, x: 0.5, y: 0.5, w: W - 1, h: H - 1, sizing: { type: 'contain', w: W - 1, h: H - 1 } });
  }

  await pptx.writeFile({ fileName: `GCM-PTA-Monthly-Slides-${mo}-${yr}.pptx` });
}
