#!/usr/bin/env node
/**
 * Builds the single coordinated toolkit workbook with ExcelJS.
 *
 *   node deliverables/src/toolkit/build-workbook.mjs [outDir]
 *
 * One workbook, replacing the four the legacy build produced (Inventory
 * Template, Vendor Scorecard, AI Systems Register, Compliance Tracker). Those
 * carried two competing system inventories and a tracker whose 18 broad rows
 * matched nothing in the handbook. Here:
 *
 *  - one Register, with the ten illustrative systems kept on their own tab so
 *    a buyer's live figures never include fictitious rows;
 *  - one set of identifiers used everywhere — SYS-### (systems), VEN-###
 *    (suppliers), ACT-### (actions) and the handbook's own checklist IDs
 *    (A-01, P-01 …), which the Requirements tab reads out of section-4.md;
 *  - an Assessment that scores preparedness only. Exposure answers ("do you
 *    use AI in recruitment?") decide which checklists apply and never move the
 *    readiness score: a Yes to a high-risk use must not look like progress.
 *  - supplier scores that report "Incomplete (n/5)" until all five dimensions
 *    are entered, instead of averaging whatever happens to be filled in.
 */
import ExcelJS from 'exceljs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readChecklist } from './checklist.mjs'
import { questionsByDimension } from './questionnaire.mjs'
import { BANDS, EXPOSURE, READINESS } from './assessment.mjs'
import { DISCLAIMER, PUBLISHER, REGULATORY_REVIEWED, TOOLKIT_EDITION } from './meta.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const WORKBOOK_NAME = 'AI Act Compliance Toolkit — Workbook.xlsx'

// ── Brand tokens (ARGB; mirrors the PDF renderer / globals.css) ──────────────
const SLATE = 'FF1A1F2E'
const TEAL = 'FF4A9B9B'
const AMBER = 'FFF6AD55'
const WHITE = 'FFFFFFFF'
const INK = 'FF1A1F2E'
const MUTED = 'FF4A5568'
const CALC_FILL = 'FFF1F4F8' // calculated columns: read, don't type
const RED_FILL = 'FFF8D7DA'
const AMBER_FILL = 'FFFDE9D2'
const GREEN_FILL = 'FFD7EBD9'
const RED_TXT = 'FFC53030'
const AMBER_TXT = 'FFB7791F'
const GREEN_TXT = 'FF2F855A'
const FONT = 'Calibri'

const FIRST = 5 // first data row on every working tab (title, subtitle, blank, header)
const N_SYSTEMS = 150
const N_VENDORS = 100
const N_ACTIONS = 300
const LAST_SYS = FIRST + N_SYSTEMS - 1
const LAST_VEN = FIRST + N_VENDORS - 1
const LAST_ACT = FIRST + N_ACTIONS - 1

// ── Lists (hidden tab; every drop-down reads a named range) ─────────────────
const LISTS = {
  ExposureAnswers: ['Yes', 'No', 'Unsure'],
  ReadinessAnswers: ['Yes', 'Partly', 'No', 'Unsure', 'N/A'],
  Regions: ['EU', 'EEA', 'UK', 'US', 'China', 'India', 'Other', 'Unknown'],
  Roles: ['Provider', 'Deployer', 'Importer', 'Distributor'],
  Tiers: ['Unassessed', 'Prohibited', 'High-risk', 'Limited risk', 'Minimal'],
  AnnexRoutes: ['N/A', 'Annex III', 'Annex I'],
  SystemStatuses: ['Not started', 'Gap', 'In progress', 'Compliant', 'Not yet in force'],
  Departments: ['HR', 'Operations', 'Sales', 'Marketing', 'IT', 'Finance', 'Legal', 'Customer Service', 'R&D', 'Procurement'],
  ResponseStatuses: ['Not sent', 'Awaiting reply', 'Partial reply', 'Complete reply', 'Refused'],
  ActionStatuses: ['Not started', 'In progress', 'Blocked', 'Complete', 'Not applicable'],
  Priorities: ['Critical', 'High', 'Medium', 'Low'],
  YesNoUnknown: ['Yes', 'No', 'Unknown'],
  AppliesToUs: ['Yes', 'No', 'Not yet decided'],
}

// ── Styling helpers ──────────────────────────────────────────────────────────
function titleBlock(ws, title, subtitle, span) {
  ws.mergeCells(1, 1, 1, span)
  const t = ws.getCell(1, 1)
  t.value = title
  t.font = { name: FONT, size: 16, bold: true, color: { argb: WHITE } }
  t.fill = solid(SLATE)
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 30

  ws.mergeCells(2, 1, 2, span)
  const s = ws.getCell(2, 1)
  s.value = subtitle
  s.font = { name: FONT, size: 10, italic: true, color: { argb: WHITE } }
  s.fill = solid(TEAL)
  s.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true }
  ws.getRow(2).height = 32
}

function solid(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function headerRow(ws, rowIdx, columns) {
  const row = ws.getRow(rowIdx)
  columns.forEach((col, i) => {
    const c = row.getCell(i + 1)
    c.value = col.header
    c.font = { name: FONT, size: 9, bold: true, color: { argb: WHITE } }
    c.fill = solid(col.calc ? TEAL : SLATE)
    c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
    c.border = { bottom: { style: 'thin', color: { argb: AMBER } } }
    if (col.note) c.note = col.note
    ws.getColumn(i + 1).width = col.width
  })
  row.height = 36
}

function bodyCell(c, { bold = false, color = INK, fill = null, align = 'left', wrap = true, italic = false } = {}) {
  c.font = { name: FONT, size: 10, bold, italic, color: { argb: color } }
  c.alignment = { vertical: 'top', horizontal: align, wrapText: wrap, indent: align === 'left' ? 1 : 0 }
  if (fill) c.fill = solid(fill)
  c.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
}

function note(ws, rowIdx, span, text, height = 30) {
  ws.mergeCells(rowIdx, 1, rowIdx, span)
  const c = ws.getCell(rowIdx, 1)
  c.value = text
  c.font = { name: FONT, size: 9, italic: true, color: { argb: MUTED } }
  c.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 }
  ws.getRow(rowIdx).height = height
}

function listValidation(name, { strict = true } = {}) {
  return {
    type: 'list',
    allowBlank: true,
    formulae: [name],
    showErrorMessage: strict,
    errorStyle: strict ? 'stop' : 'information',
    errorTitle: 'Pick from the list',
    error: 'Choose one of the values in the drop-down.',
  }
}

const dateValidation = {
  type: 'date',
  operator: 'greaterThan',
  allowBlank: true,
  formulae: [new Date('2020-01-01T00:00:00Z')],
  showErrorMessage: true,
  errorTitle: 'Date',
  error: 'Enter a date, for example 15/01/2027.',
}

const scoreValidation = {
  type: 'whole',
  operator: 'between',
  allowBlank: true,
  formulae: [1, 5],
  showErrorMessage: true,
  errorTitle: 'Score 1–5',
  error: 'Enter a whole number from 1 (low dependency) to 5 (high dependency).',
}

function textRule(ref, pairs) {
  return {
    ref,
    rules: pairs.map(([text, fill, color], i) => ({
      type: 'containsText',
      operator: 'containsText',
      text,
      priority: i + 1,
      style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: fill } }, font: { color: { argb: color }, bold: true } },
    })),
  }
}

const colLetter = (n) => {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** Map `key -> column letter` from a column spec so formulas never hard-code a letter. */
function letters(columns) {
  return Object.fromEntries(columns.map((c, i) => [c.key, colLetter(i + 1)]))
}

function pageSetup(ws, lastCol) {
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 }
  ws.headerFooter = { oddFooter: `&L${PUBLISHER} — AI Act Compliance Toolkit&R&P / &N` }
  ws.pageSetup.printTitlesRow = '4:4'
  void lastCol
}

// ── Column specs (the single source for headers, widths and formula letters) ─
const REGISTER_COLS = [
  { key: 'id', header: 'System ID', width: 10, calc: true, note: 'Pre-assigned. Use this ID in the Actions tab, tickets and DPIAs. Never reuse a retired ID.' },
  { key: 'name', header: 'System name', width: 26 },
  { key: 'vendorId', header: 'Vendor ID', width: 11, note: 'Pick a VEN- ID from the Suppliers tab, or type In-house.' },
  { key: 'vendor', header: 'Vendor (from Suppliers)', width: 20, calc: true },
  { key: 'vendorHq', header: 'Vendor HQ (from Suppliers)', width: 12, calc: true },
  { key: 'region', header: 'Data storage region', width: 12 },
  { key: 'locFlag', header: 'Location flag', width: 18, calc: true },
  { key: 'role', header: 'Our role', width: 12, note: 'Your role for THIS system. One organisation can hold different roles for different systems.' },
  { key: 'dept', header: 'Department', width: 14 },
  { key: 'use', header: 'Primary use case', width: 30 },
  { key: 'inputs', header: 'Data inputs', width: 22 },
  { key: 'special', header: 'Special-category or biometric data?', width: 13 },
  { key: 'outputs', header: 'Outputs and who acts on them', width: 24 },
  { key: 'tier', header: 'Risk classification', width: 13 },
  { key: 'annex', header: 'Annex route', width: 11 },
  { key: 'reasoning', header: 'Classification reasoning', width: 34, note: 'Why this tier. For high-risk, cite the Annex III point or the Annex I legislation. For a cleared system, say why it is not high-risk.' },
  { key: 'checklists', header: 'Checklists that apply', width: 18, calc: true },
  { key: 'date', header: 'Applicable from', width: 13, calc: true },
  { key: 'obligations', header: 'Key obligations / notes', width: 28 },
  { key: 'status', header: 'Compliance status', width: 14 },
  { key: 'owner', header: 'System owner (named person)', width: 18 },
  { key: 'evidence', header: 'Evidence location', width: 24 },
  { key: 'verified', header: 'Last verified', width: 12 },
  { key: 'next', header: 'Next review', width: 12 },
  { key: 'open', header: 'Open actions', width: 9, calc: true },
  { key: 'checks', header: 'Checks', width: 30, calc: true },
]

const SUPPLIER_COLS = [
  { key: 'id', header: 'Vendor ID', width: 10, calc: true },
  { key: 'name', header: 'Vendor legal entity', width: 24 },
  { key: 'hq', header: 'HQ', width: 10 },
  { key: 'regions', header: 'Data processing regions', width: 20 },
  { key: 'sent', header: 'Questionnaire sent', width: 12 },
  { key: 'response', header: 'Response status', width: 14 },
  { key: 's1', header: 'Data sovereignty', width: 11 },
  { key: 's2', header: 'Contractual lock-in', width: 11 },
  { key: 's3', header: 'Regulatory risk', width: 11 },
  { key: 's4', header: 'Concentration risk', width: 12 },
  { key: 's5', header: 'Alternative availability', width: 12 },
  { key: 'count', header: 'Scores entered', width: 9, calc: true },
  { key: 'overall', header: 'Overall (average)', width: 10, calc: true },
  { key: 'band', header: 'Dependency band', width: 15, calc: true },
  { key: 'systems', header: 'Systems supplied', width: 10, calc: true },
  { key: 'evidence', header: 'Evidence location', width: 22 },
  { key: 'notes', header: 'Notes', width: 30 },
]

const REQ_COLS = [
  { key: 'id', header: 'ID', width: 8, calc: true },
  { key: 'checklist', header: 'Checklist', width: 22, calc: true },
  { key: 'task', header: 'Requirement', width: 60, calc: true },
  { key: 'appliesTo', header: 'Applies to', width: 20, calc: true },
  { key: 'target', header: 'Statutory date', width: 14, calc: true },
  { key: 'applies', header: 'Applies to us?', width: 12, note: 'Decide once. "No" removes the row from the coverage check; record why in Notes.' },
  { key: 'raised', header: 'Actions raised', width: 9, calc: true },
  { key: 'done', header: 'Complete', width: 9, calc: true },
  { key: 'open', header: 'Open', width: 8, calc: true },
  { key: 'coverage', header: 'Coverage', width: 22, calc: true },
  { key: 'notes', header: 'Notes', width: 30 },
]

const ACTION_COLS = [
  { key: 'id', header: 'Action ID', width: 10, calc: true },
  { key: 'sys', header: 'System ID', width: 10, note: 'A SYS- ID from the Register, or ORG for an organisation-wide action.' },
  { key: 'sysName', header: 'System (from Register)', width: 22, calc: true },
  { key: 'req', header: 'Requirement ID', width: 11, note: 'The checklist row this action closes, e.g. A-03 or D-02.' },
  { key: 'reqText', header: 'Requirement (from Requirements)', width: 34, calc: true },
  { key: 'action', header: 'Action', width: 34 },
  { key: 'priority', header: 'Priority', width: 10 },
  { key: 'owner', header: 'Owner', width: 16 },
  { key: 'due', header: 'Due', width: 12 },
  { key: 'status', header: 'Status', width: 13 },
  { key: 'evidence', header: 'Evidence location', width: 22 },
  { key: 'completed', header: 'Completed on', width: 12 },
  { key: 'checks', header: 'Checks', width: 26, calc: true },
]

const RC = letters(REGISTER_COLS)
const SC = letters(SUPPLIER_COLS)
const QC = letters(REQ_COLS)
const AC = letters(ACTION_COLS)

const rng = (sheet, col, first, last) => `'${sheet}'!$${col}$${first}:$${col}$${last}`
const REG = (key) => rng('Register', RC[key], FIRST, LAST_SYS)
const SUP = (key) => rng('Suppliers', SC[key], FIRST, LAST_VEN)
const ACT = (key) => rng('Actions', AC[key], FIRST, LAST_ACT)

// ── Sheets ───────────────────────────────────────────────────────────────────
function buildLists(wb) {
  const ws = wb.addWorksheet('Lists')
  ws.state = 'hidden'
  const names = Object.keys(LISTS)
  names.forEach((name, i) => {
    const col = colLetter(i + 1)
    ws.getCell(`${col}1`).value = name
    LISTS[name].forEach((v, j) => { ws.getCell(`${col}${j + 2}`).value = v })
    wb.definedNames.add(`'Lists'!$${col}$2:$${col}$${LISTS[name].length + 1}`, name)
  })
  // System IDs for the Actions drop-down: ORG first, then every Register ID.
  const col = colLetter(names.length + 1)
  ws.getCell(`${col}1`).value = 'SystemChoices'
  ws.getCell(`${col}2`).value = 'ORG'
  for (let i = 0; i < N_SYSTEMS; i++) ws.getCell(`${col}${i + 3}`).value = { formula: `'Register'!${RC.id}${FIRST + i}` }
  wb.definedNames.add(`'Lists'!$${col}$2:$${col}$${N_SYSTEMS + 2}`, 'SystemChoices')
  wb.definedNames.add(SUP('id'), 'VendorIDs')
}

function buildStart(wb, checklist) {
  const ws = wb.addWorksheet('Start here', { properties: { tabColor: { argb: AMBER } } })
  ws.getColumn(1).width = 26
  ws.getColumn(2).width = 96
  titleBlock(ws, 'AI Act Compliance Toolkit — Workbook', `${PUBLISHER} · ${TOOLKIT_EDITION} · Regulatory content last reviewed ${REGULATORY_REVIEWED}`, 2)

  const rows = [
    ['How this workbook works', 'One workbook, one set of identifiers. Every system has a SYS- ID, every supplier a VEN- ID, every action an ACT- ID, and every requirement the same ID it carries in the handbook checklist (A-01, P-01, B-01 …). Type an ID once and the other tabs look it up.'],
    ['Colours', 'Dark headers: you type. Teal headers and grey cells: calculated — read them, do not overwrite them. Amber and red cells flag something to look at, not necessarily a breach.'],
    ['', ''],
    ['Assessment', 'Twenty questions. Six map your exposure and decide which checklists apply; they are not scored. Fourteen score your preparation. Critical findings override the score.'],
    ['Register', 'One row per AI system, including AI features inside other software. Role, tier and Annex route decide which checklists apply and from when.'],
    ['Register examples', 'Ten fictitious systems showing how rows are filled in and reasoned. They are not counted anywhere.'],
    ['Suppliers', 'One row per vendor. Record the questionnaire, then score five dependency dimensions 1–5. The band stays "Incomplete" until all five are scored.'],
    ['Scoring key', 'What 1 and 5 mean on each dimension, and which questionnaire questions inform it.'],
    [`Requirements`, `The ${checklist.length} rows of the handbook checklist, by ID. Mark whether each applies to you; the tab counts the actions raised against it and flags applicable rows with none.`],
    ['Actions', 'Turn findings into actions: one system (or ORG), one requirement ID, one owner, one due date, and evidence when complete.'],
    ['Dashboard', 'Readiness, exposure, the estate by tier and role, supplier dependency and action progress, for your leadership briefing.'],
    ['', ''],
    ['Suggested order', 'Assess → Catalogue → Classify → Assess suppliers → Assign actions → Brief leadership. The handbook’s quick-start route walks through it.'],
    ['Dates', 'Statutory dates follow the staged timeline as amended by the 2026 Digital Omnibus: prohibitions and AI literacy 2 Feb 2025; Article 50 transparency 2 Aug 2026; further prohibitions and legacy generative-system marking 2 Dec 2026; Annex III high-risk 2 Dec 2027; Annex I high-risk 2 Aug 2028.'],
    ['Updates', 'Updated files arrive for twelve months from purchase. Requirement IDs are stable across editions: a withdrawn row retires its ID and new rows take new numbers, so your actions keep pointing at the right duty.'],
    ['Important', DISCLAIMER],
  ]
  rows.forEach(([k, v], i) => {
    const r = 4 + i
    const a = ws.getCell(r, 1)
    const b = ws.getCell(r, 2)
    a.value = k
    b.value = v
    bodyCell(a, { bold: true })
    bodyCell(b)
    ws.getRow(r).height = v.length > 110 ? 44 : v ? 30 : 10
  })
}

/** Nested IFs over BANDS, highest first; the last band is the fallback. */
function bandFormula(ratio) {
  const [last, ...rest] = [...BANDS].reverse()
  return rest.reduce((inner, band) => `IF(${ratio}>=${band.min},"${band.label}",${inner})`, `"${last.label}"`)
}

function buildAssessment(wb) {
  const ws = wb.addWorksheet('Assessment', { views: [{ state: 'frozen', ySplit: 4 }] })
  const cols = [
    { header: 'Ref', width: 6 },
    { header: 'Question', width: 70 },
    { header: 'Guidance', width: 40 },
    { header: 'Answer', width: 11 },
    { header: 'Why N/A, or notes', width: 30 },
    { header: 'Points / adds', width: 22, calc: true },
    { header: 'Check', width: 34, calc: true },
    { header: 'Checklist rows to action', width: 22, calc: true },
  ]
  titleBlock(ws, 'Quick-start gap assessment', 'Part 1 maps exposure and is not scored. Part 2 scores preparation: Yes 2 · Partly 1 · No or Unsure 0 · N/A excluded (only where the linked exposure question is No).', cols.length)
  headerRow(ws, 4, cols)

  let r = FIRST
  const section = (label) => {
    ws.mergeCells(r, 1, r, cols.length)
    const c = ws.getCell(r, 1)
    c.value = label
    c.font = { name: FONT, size: 11, bold: true, color: { argb: INK } }
    c.fill = solid('FFE6F0F0')
    c.alignment = { vertical: 'middle', indent: 1 }
    ws.getRow(r).height = 22
    r++
  }

  section('Part 1 — Exposure: which obligations reach you (not scored)')
  const exposureRow = {}
  for (const x of EXPOSURE) {
    exposureRow[x.ref] = r
    ws.getCell(r, 1).value = x.ref
    ws.getCell(r, 2).value = x.q
    ws.getCell(r, 3).value = x.guide
    ws.getCell(r, 4).dataValidation = listValidation('ExposureAnswers')
    ws.getCell(r, 6).value = { formula: `IF(OR(D${r}="Yes",D${r}="Unsure"),"Adds ${x.adds}","")` }
    ws.getCell(r, 7).value = { formula: `IF(D${r}="","Unanswered",IF(D${r}="Unsure","Treat as Yes until checked",""))` }
    for (let c = 1; c <= cols.length; c++) bodyCell(ws.getCell(r, c), { fill: c >= 6 && c <= 8 ? CALC_FILL : null, bold: c === 1 })
    ws.getRow(r).height = 44
    r++
  }
  const xFirst = exposureRow.X1
  const xLast = exposureRow.X6

  section('Part 2 — Preparedness: what you can already show (scored)')
  const rFirst = r
  for (const q of READINESS) {
    ws.getCell(r, 1).value = q.ref
    ws.getCell(r, 2).value = q.q
    ws.getCell(r, 3).value = q.naIf
      ? `N/A only if ${q.naIf.join(', ')} ${q.naIf.length > 1 ? 'are all' : 'is'} No.${q.critical ? ' Critical.' : ''}`
      : q.critical ? 'Critical: anything but Yes is a finding to resolve first. N/A is not available.' : 'N/A is not available for this question.'
    ws.getCell(r, 4).dataValidation = listValidation('ReadinessAnswers')
    ws.getCell(r, 6).value = { formula: `IF(D${r}="Yes",2,IF(D${r}="Partly",1,IF(OR(D${r}="No",D${r}="Unsure"),0,"")))` }

    const naAllowed = q.naIf
      ? `AND(${q.naIf.map((x) => `$D$${exposureRow[x]}="No"`).join(',')})`
      : 'FALSE'
    const checks = [
      `IF(D${r}="","Unanswered"`,
      `IF(AND(D${r}="N/A",NOT(${naAllowed})),"${q.naIf ? `N/A only if ${q.naIf.join(', ')} answered No` : 'N/A not available here'}"`,
      `IF(AND(D${r}="N/A",E${r}=""),"Record why it does not apply"`,
      q.critical ? `IF(D${r}<>"Yes","CRITICAL — resolve before anything else"` : null,
      `IF(D${r}="Unsure","Find out: Unsure scores 0"`,
      `""`,
    ].filter(Boolean)
    ws.getCell(r, 7).value = { formula: checks.join(',') + ')'.repeat(checks.length - 1) }
    ws.getCell(r, 8).value = q.rows
    for (let c = 1; c <= cols.length; c++) bodyCell(ws.getCell(r, c), { fill: c >= 6 && c <= 8 ? CALC_FILL : null, bold: c === 1 })
    ws.getRow(r).height = 44
    r++
  }
  const rLast = r - 1

  ws.addConditionalFormatting(textRule(`G${FIRST}:G${rLast}`, [
    ['CRITICAL', RED_FILL, RED_TXT],
    ['N/A only', AMBER_FILL, AMBER_TXT],
    ['N/A not', AMBER_FILL, AMBER_TXT],
    ['Record why', AMBER_FILL, AMBER_TXT],
    ['Treat as Yes', AMBER_FILL, AMBER_TXT],
    ['Find out', AMBER_FILL, AMBER_TXT],
  ]))
  ws.addConditionalFormatting(textRule(`F${xFirst}:F${xLast}`, [['Adds', AMBER_FILL, AMBER_TXT]]))

  // Summary block — the Dashboard reads these cells.
  r += 1
  section('Result')
  const pts = `F${rFirst}:F${rLast}`
  const chk = `G${rFirst}:G${rLast}`
  const ans = `D${rFirst}:D${rLast}`
  const summary = [
    ['Preparedness questions answered', `COUNTA(${ans})&" of ${READINESS.length}"`],
    ['Exposure questions answered', `COUNTA(D${xFirst}:D${xLast})&" of ${EXPOSURE.length}"`],
    ['Readiness (applicable questions only)', `IF(COUNT(${pts})=0,"",SUM(${pts})/(2*COUNT(${pts})))`, '0%'],
    ['Critical findings', `COUNTIF(${chk},"CRITICAL*")`],
    ['Answers needing attention', `COUNTIF(${chk},"?*")-COUNTIF(${chk},"Unanswered")-COUNTIF(${chk},"CRITICAL*")`],
    ['Exposure indicators (Yes or Unsure)', `COUNTIF(D${xFirst}:D${xLast},"Yes")+COUNTIF(D${xFirst}:D${xLast},"Unsure")`],
    ['Position', `IF(OR(COUNTA(${ans})<${READINESS.length},COUNTA(D${xFirst}:D${xLast})<${EXPOSURE.length}),"Incomplete — answer every question",IF(COUNTIF(${chk},"CRITICAL*")>0,"Critical findings — resolve these first",IF(COUNTIF(${chk},"N/A*")+COUNTIF(${chk},"Record why*")>0,"Check your N/A answers",${bandFormula(`SUM(${pts})/(2*COUNT(${pts}))`)})))`],
  ]
  const resultCells = {}
  for (const [label, formula, fmt] of summary) {
    ws.mergeCells(r, 1, r, 3)
    ws.getCell(r, 1).value = label
    bodyCell(ws.getCell(r, 1), { bold: true })
    ws.mergeCells(r, 4, r, 7)
    const c = ws.getCell(r, 4)
    c.value = { formula }
    bodyCell(c, { bold: true, fill: CALC_FILL })
    if (fmt) c.numFmt = fmt
    resultCells[label] = `'Assessment'!$D$${r}`
    r++
  }
  ws.addConditionalFormatting(textRule(`D${r - 1}`, [
    ['Critical', RED_FILL, RED_TXT],
    ['Incomplete', AMBER_FILL, AMBER_TXT],
    ['Check', AMBER_FILL, AMBER_TXT],
    ['Early', RED_FILL, RED_TXT],
    ['Developing', AMBER_FILL, AMBER_TXT],
    ['Foundations', GREEN_FILL, GREEN_TXT],
  ]))
  r++
  note(ws, r, cols.length,
    'Readiness measures what you can show, not whether you comply: a high figure is not a compliance conclusion, and an exposure answer never moves it. Raise an action in the Actions tab for each gap, against the checklist rows listed beside the question.', 34)
  pageSetup(ws, cols.length)
  return resultCells
}

function buildRegister(wb) {
  const ws = wb.addWorksheet('Register', { views: [{ state: 'frozen', ySplit: 4, xSplit: 2 }] })
  titleBlock(ws, 'AI Systems Register', 'The single record of every AI system you build, buy or embed. Role, tier and Annex route decide which checklists apply and from when. Teal columns are calculated.', REGISTER_COLS.length)
  headerRow(ws, 4, REGISTER_COLS)
  const C = RC

  for (let r = FIRST; r <= LAST_SYS; r++) {
    const n = r - FIRST + 1
    const row = ws.getRow(r)
    const set = (key, value) => { row.getCell(REGISTER_COLS.findIndex((c) => c.key === key) + 1).value = value }
    set('id', `SYS-${String(n).padStart(3, '0')}`)
    const name = `${C.name}${r}`
    set('vendor', { formula: `IF(${C.vendorId}${r}="","",IF(${C.vendorId}${r}="In-house","In-house",IFERROR(INDEX(${SUP('name')},MATCH(${C.vendorId}${r},${SUP('id')},0))&"","Unknown vendor ID")))` })
    set('vendorHq', { formula: `IF(OR(${C.vendorId}${r}="",${C.vendorId}${r}="In-house"),"",IFERROR(INDEX(${SUP('hq')},MATCH(${C.vendorId}${r},${SUP('id')},0))&"",""))` })
    set('locFlag', { formula: `IF(${name}="","",IF(OR(${C.region}${r}="",${C.region}${r}="Unknown"),"Data location unknown",IF(OR(${C.region}${r}="EU",${C.region}${r}="EEA"),IF(OR(${C.vendorHq}${r}="",${C.vendorHq}${r}="EU",${C.vendorHq}${r}="EEA"),"","Vendor HQ outside EU/EEA"),"Data outside EU/EEA")))` })
    const tier = `${C.tier}${r}`
    const role = `${C.role}${r}`
    set('checklists', { formula: `IF(${name}="","",IF(${tier}="Prohibited","STOP — withdraw (P rows)",IF(OR(${tier}="",${tier}="Unassessed"),"A — classify first","A"&IF(${tier}="Limited risk",", B","")&IF(${tier}="High-risk",IF(${role}="Provider",", C",IF(${role}="Deployer",", D",IF(OR(${role}="Importer",${role}="Distributor"),", E",", record role"))),""))))` })
    set('date', { formula: `IF(${name}="","",IF(${tier}="Prohibited","Applies now",IF(${tier}="Limited risk","2 Aug 2026",IF(${tier}="High-risk",IF(${C.annex}${r}="Annex III","2 Dec 2027",IF(${C.annex}${r}="Annex I","2 Aug 2028","Record Annex route")),""))))` })
    const id = `${C.id}${r}`
    set('open', { formula: `IF(${name}="","",COUNTIFS(${ACT('sys')},${id},${ACT('action')},"<>")-COUNTIFS(${ACT('sys')},${id},${ACT('status')},"Complete")-COUNTIFS(${ACT('sys')},${id},${ACT('status')},"Not applicable"))` })
    set('checks', { formula: `IF(${name}="","",TRIM(IF(${role}="","Role missing. ","")&IF(OR(${tier}="",${tier}="Unassessed"),"Not classified. ","")&IF(AND(${tier}<>"",${tier}<>"Unassessed",${C.reasoning}${r}=""),"No reasoning. ","")&IF(AND(${tier}="High-risk",${C.annex}${r}<>"Annex III",${C.annex}${r}<>"Annex I"),"Annex route missing. ","")&IF(${C.owner}${r}="","No owner. ","")&IF(${C.evidence}${r}="","No evidence location. ","")&IF(${C.next}${r}="","No review date. ",IF(${C.next}${r}<TODAY(),"Review overdue. ",""))))` })

    ws.getCell(`${C.vendorId}${r}`).dataValidation = listValidation('VendorIDs', { strict: false })
    ws.getCell(`${C.region}${r}`).dataValidation = listValidation('Regions')
    ws.getCell(`${C.role}${r}`).dataValidation = listValidation('Roles')
    ws.getCell(`${C.dept}${r}`).dataValidation = listValidation('Departments', { strict: false })
    ws.getCell(`${C.special}${r}`).dataValidation = listValidation('YesNoUnknown')
    ws.getCell(`${C.tier}${r}`).dataValidation = listValidation('Tiers')
    ws.getCell(`${C.annex}${r}`).dataValidation = listValidation('AnnexRoutes')
    ws.getCell(`${C.status}${r}`).dataValidation = listValidation('SystemStatuses')
    ws.getCell(`${C.verified}${r}`).dataValidation = dateValidation
    ws.getCell(`${C.next}${r}`).dataValidation = dateValidation
    ws.getCell(`${C.verified}${r}`).numFmt = 'dd mmm yyyy'
    ws.getCell(`${C.next}${r}`).numFmt = 'dd mmm yyyy'

    REGISTER_COLS.forEach((col, i) => bodyCell(row.getCell(i + 1), { fill: col.calc ? CALC_FILL : null, bold: col.key === 'id' }))
    row.height = 30
  }

  const col = (k) => `${C[k]}${FIRST}:${C[k]}${LAST_SYS}`
  ws.addConditionalFormatting(textRule(col('locFlag'), [['unknown', RED_FILL, RED_TXT], ['outside', AMBER_FILL, AMBER_TXT]]))
  ws.addConditionalFormatting(textRule(col('tier'), [['Prohibited', RED_FILL, RED_TXT], ['High-risk', AMBER_FILL, AMBER_TXT]]))
  ws.addConditionalFormatting(textRule(col('checklists'), [['STOP', RED_FILL, RED_TXT], ['classify first', AMBER_FILL, AMBER_TXT], ['record role', AMBER_FILL, AMBER_TXT]]))
  ws.addConditionalFormatting(textRule(col('status'), [['Compliant', GREEN_FILL, GREEN_TXT], ['In progress', AMBER_FILL, AMBER_TXT], ['Gap', RED_FILL, RED_TXT], ['Not started', RED_FILL, RED_TXT]]))
  ws.addConditionalFormatting(textRule(col('checks'), [['overdue', RED_FILL, RED_TXT], ['.', AMBER_FILL, AMBER_TXT]]))
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: LAST_SYS, column: REGISTER_COLS.length } }
  pageSetup(ws, REGISTER_COLS.length)
}

/** Ten illustrative systems. Fictitious vendors; classifications reasoned against the pinned Annex III text. */
const EXAMPLES = [
  ['EX-01', 'Recruitment screening — TalentFilter', 'TalentFilter Ltd', 'US', 'US', 'Deployer', 'HR', 'Ranks CVs and shortlists candidates', 'CVs, application forms', 'No', 'Shortlist scores; a recruiter decides', 'High-risk', 'Annex III', 'Annex III point 4(a): analyses and filters job applications and evaluates candidates.', 'Art 26 deployer duties; inform workers’ representatives; check GDPR Art 22', 'Not started'],
  ['EX-02', 'Performance review aid — MeritMap', 'MeritMap Ltd', 'UK', 'UK', 'Deployer', 'HR', 'Scores employee performance inputs', 'Appraisal data, KPIs', 'No', 'Draft ratings; line manager reviews', 'High-risk', 'Annex III', 'Annex III point 4(b): monitors and evaluates the performance of persons in work relationships.', 'Art 26; human oversight by trained managers', 'Not started'],
  ['EX-03', 'Credit decisioning — LendScore', 'LendScore Ltd', 'UK', 'UK', 'Deployer', 'Finance', 'Assesses applicants’ creditworthiness', 'Financial history, income', 'No', 'Credit score and decision', 'High-risk', 'Annex III', 'Annex III point 5(b): evaluates the creditworthiness of natural persons.', 'Art 26; GDPR Art 22 safeguards; Art 86 explanation on request', 'In progress'],
  ['EX-04', 'Fraud detection — GuardRail', 'GuardRail SAS', 'EU', 'EU', 'Deployer', 'Finance', 'Flags anomalous transactions', 'Transaction streams', 'No', 'Risk flags; analysts investigate', 'Minimal', 'N/A', 'Not high-risk: Annex III point 5(b) expressly excludes AI used to detect financial fraud. Re-check if it starts scoring customers.', 'AI literacy for analysts; keep reasoning on file', 'Compliant'],
  ['EX-05', 'Support chatbot — HelpBot', 'HelpBot AB', 'EEA', 'EU', 'Deployer', 'Customer Service', 'Answers first-line customer queries', 'Customer messages', 'No', 'Replies; escalates to staff', 'Limited risk', 'N/A', 'Article 50(1): people interact directly with it. Not an Annex III use.', 'Tell users they are talking to AI at the start of the chat', 'In progress'],
  ['EX-06', 'Marketing image generator — PixelForge', 'PixelForge Inc', 'US', 'US', 'Deployer', 'Marketing', 'Generates campaign imagery', 'Prompts, brand assets', 'No', 'Published images', 'Limited risk', 'N/A', 'Article 50: generates synthetic images; label any deep fake. Provider owes machine-readable marking.', 'Labelling convention; confirm vendor marking', 'Not started'],
  ['EX-07', 'Writing assistant — DraftMate', 'DraftMate Inc', 'US', 'US', 'Deployer', 'Marketing', 'Drafts and edits internal copy', 'Prompts, brand guidelines', 'No', 'Draft text; staff edit before use', 'Minimal', 'N/A', 'Internal drafting with human editing; no Annex III use. Becomes Article 50 if AI text is published to inform the public on matters of public interest without editorial review.', 'AI literacy; acceptable-use rules', 'Compliant'],
  ['EX-08', 'Meeting summariser — NoteWise', 'NoteWise Inc', 'US', 'US', 'Deployer', 'IT', 'Transcribes and summarises calls', 'Audio, transcripts', 'Unknown', 'Summaries and action items', 'Minimal', 'N/A', 'Internal summaries; no Annex III use. Data location and retention unknown — raised with the vendor.', 'Vendor questionnaire outstanding', 'Gap'],
  ['EX-09', 'Demand forecasting — StockSense', 'StockSense BV', 'EU', 'EU', 'Deployer', 'Operations', 'Predicts inventory demand', 'Sales history, seasonality', 'No', 'Reorder forecasts', 'Minimal', 'N/A', 'No effect on individuals; no Annex III use.', 'AI literacy only', 'Compliant'],
  ['EX-10', 'Line-guarding vision module — SafeStop', 'In-house', '', 'EU', 'Provider', 'R&D', 'Stops a press when a hand enters the danger zone', 'Camera feed', 'No', 'Machine stop signal', 'High-risk', 'Annex I', 'Safety component of machinery under Annex I legislation requiring third-party conformity assessment; we build it, so we are its provider.', 'Checklist C from 2 Aug 2028; start technical documentation now', 'Not started'],
]

function buildExamples(wb) {
  const ws = wb.addWorksheet('Register examples', { views: [{ state: 'frozen', ySplit: 4, xSplit: 2 }] })
  const cols = [
    ['Example ID', 9], ['System name', 26], ['Vendor', 18], ['Vendor HQ', 10], ['Data storage region', 12], ['Our role', 11],
    ['Department', 13], ['Primary use case', 28], ['Data inputs', 20], ['Special-category or biometric data?', 12], ['Outputs and who acts on them', 24],
    ['Risk classification', 13], ['Annex route', 11], ['Classification reasoning', 46], ['Key obligations / notes', 30], ['Compliance status', 13],
  ].map(([header, width]) => ({ header, width }))
  titleBlock(ws, 'Register examples — illustrative only', 'Ten fictitious systems showing how a row is reasoned. Not counted on the Dashboard. Copy the pattern into the Register, not the rows.', cols.length)
  headerRow(ws, 4, cols)
  EXAMPLES.forEach((ex, i) => {
    const r = FIRST + i
    ex.forEach((v, j) => { const c = ws.getCell(r, j + 1); c.value = v; bodyCell(c, { italic: true, bold: j === 0 }) })
    ws.getRow(r).height = 58
  })
  ws.addConditionalFormatting(textRule(`L${FIRST}:L${FIRST + EXAMPLES.length - 1}`, [['Prohibited', RED_FILL, RED_TXT], ['High-risk', AMBER_FILL, AMBER_TXT]]))
  note(ws, FIRST + EXAMPLES.length + 1, cols.length,
    'Two rows worth studying: EX-04 is cleared from high-risk by an express exclusion, and records it; EX-10 is a provider row on the Annex I route, where the later date is not a reason to start later.', 30)
  pageSetup(ws, cols.length)
}

function buildSuppliers(wb) {
  const ws = wb.addWorksheet('Suppliers', { views: [{ state: 'frozen', ySplit: 4, xSplit: 2 }] })
  titleBlock(ws, 'Suppliers and dependency scores', 'One row per AI vendor. Record the questionnaire, then score each dimension 1 (low dependency) to 5 (high). Overall and band appear only when all five are scored.', SUPPLIER_COLS.length)
  headerRow(ws, 4, SUPPLIER_COLS)
  const C = SC
  for (let r = FIRST; r <= LAST_VEN; r++) {
    const n = r - FIRST + 1
    const row = ws.getRow(r)
    const set = (key, value) => { row.getCell(SUPPLIER_COLS.findIndex((c) => c.key === key) + 1).value = value }
    set('id', `VEN-${String(n).padStart(3, '0')}`)
    const name = `${C.name}${r}`
    const scores = `${C.s1}${r}:${C.s5}${r}`
    set('count', { formula: `IF(${name}="","",COUNT(${scores}))` })
    set('overall', { formula: `IF(OR(${name}="",COUNT(${scores})<5),"",ROUND(AVERAGE(${scores}),1))` })
    set('band', { formula: `IF(${name}="","",IF(COUNT(${scores})<5,"Incomplete ("&COUNT(${scores})&"/5)",IF(${C.overall}${r}>=3.8,"High",IF(${C.overall}${r}>=2.5,"Medium","Low"))))` })
    set('systems', { formula: `IF(${name}="","",COUNTIF(${REG('vendorId')},${C.id}${r}))` })
    ws.getCell(`${C.hq}${r}`).dataValidation = listValidation('Regions')
    ws.getCell(`${C.sent}${r}`).dataValidation = dateValidation
    ws.getCell(`${C.sent}${r}`).numFmt = 'dd mmm yyyy'
    ws.getCell(`${C.response}${r}`).dataValidation = listValidation('ResponseStatuses')
    for (const k of ['s1', 's2', 's3', 's4', 's5']) ws.getCell(`${C[k]}${r}`).dataValidation = scoreValidation
    SUPPLIER_COLS.forEach((col, i) => bodyCell(row.getCell(i + 1), { fill: col.calc ? CALC_FILL : null, bold: col.key === 'id', align: /^s\d$|count|overall|systems/.test(col.key) ? 'center' : 'left' }))
    row.height = 22
  }
  const col = (k) => `${C[k]}${FIRST}:${C[k]}${LAST_VEN}`
  ws.addConditionalFormatting(textRule(col('band'), [['Incomplete', AMBER_FILL, AMBER_TXT], ['High', RED_FILL, RED_TXT], ['Medium', AMBER_FILL, AMBER_TXT], ['Low', GREEN_FILL, GREEN_TXT]]))
  ws.addConditionalFormatting(textRule(col('response'), [['Refused', RED_FILL, RED_TXT], ['Partial', AMBER_FILL, AMBER_TXT], ['Awaiting', AMBER_FILL, AMBER_TXT]]))
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: LAST_VEN, column: SUPPLIER_COLS.length } }
  pageSetup(ws, SUPPLIER_COLS.length)
}

function buildScoringKey(wb) {
  const ws = wb.addWorksheet('Scoring key')
  const cols = [{ header: 'Dimension', width: 22 }, { header: '1 — low dependency', width: 40 }, { header: '5 — high dependency', width: 40 }, { header: 'Questionnaire questions that inform it', width: 26 }]
  titleBlock(ws, 'Supplier scoring key', 'Score from the vendor’s written answers. A refusal to answer is evidence: score that dimension high and say why in Notes.', cols.length)
  headerRow(ws, 4, cols)
  // Question numbers are read from the questionnaire template, never retyped.
  const q = questionsByDimension()
  const rows = [
    ['Data sovereignty', 'Data stored and processed in the EU/EEA; not used for training', 'Data processed in a third country with no adequacy decision; used for training', q['Data Sovereignty'].join(', ')],
    ['Contractual lock-in', 'Short term, easy exit, open export formats', 'Long term, high switching cost, proprietary formats', q['Contractual Lock-In'].join(', ')],
    ['Regulatory risk', 'Vendor documents its role and compliance; low enforcement exposure', 'Vendor squarely in scope and unable to evidence compliance', q['Regulatory Risk'].join(', ')],
    ['Concentration risk', 'One of several tools; failure is survivable', 'Critical workflows depend on this vendor or its single upstream model', q['Concentration Risk'].join(', ')],
    ['Alternative availability', 'Credible EU-hosted or open alternatives exist', 'No realistic alternative without a major rebuild', q['Alternative Availability'].join(', ')],
  ]
  rows.forEach((row, i) => {
    row.forEach((v, j) => { const c = ws.getCell(FIRST + i, j + 1); c.value = v; bodyCell(c, { bold: j === 0 }) })
    ws.getRow(FIRST + i).height = 36
  })
  note(ws, FIRST + rows.length + 1, cols.length,
    'Band = average of all five scores: 1.0–2.4 Low · 2.5–3.7 Medium · 3.8–5.0 High. No band is shown until all five are scored, because an average of two scores reads as a finished assessment. A High band is a concentration to manage — a second source, an EU-hosted alternative, an exit clause — not a verdict on the vendor.', 44)
}

function buildRequirements(wb, checklist) {
  const ws = wb.addWorksheet('Requirements', { views: [{ state: 'frozen', ySplit: 4 }] })
  titleBlock(ws, 'Requirements — the handbook checklist, by ID', 'Generated from the handbook’s Section 4, so the two always list the same duties. Decide whether each applies to you; the tab counts the actions raised against it.', REQ_COLS.length)
  headerRow(ws, 4, REQ_COLS)
  const C = QC
  const last = FIRST + checklist.length - 1
  checklist.forEach((item, i) => {
    const r = FIRST + i
    const row = ws.getRow(r)
    const set = (key, value) => { row.getCell(REQ_COLS.findIndex((c) => c.key === key) + 1).value = value }
    set('id', item.id)
    set('checklist', item.checklist)
    set('task', item.task)
    set('appliesTo', item.appliesTo)
    set('target', item.target)
    const id = `${C.id}${r}`
    set('raised', { formula: `COUNTIFS(${ACT('req')},${id},${ACT('action')},"<>")` })
    set('done', { formula: `COUNTIFS(${ACT('req')},${id},${ACT('status')},"Complete")` })
    set('open', { formula: `${C.raised}${r}-${C.done}${r}-COUNTIFS(${ACT('req')},${id},${ACT('status')},"Not applicable")` })
    set('coverage', { formula: `IF(${C.applies}${r}="No","",IF(${C.applies}${r}="","Decide whether it applies",IF(${C.raised}${r}=0,"Applies — no action raised",IF(${C.open}${r}=0,"All actions closed",""))))` })
    ws.getCell(`${C.applies}${r}`).dataValidation = listValidation('AppliesToUs')
    REQ_COLS.forEach((col, j) => bodyCell(row.getCell(j + 1), { fill: col.calc ? CALC_FILL : null, bold: col.key === 'id', align: ['raised', 'done', 'open'].includes(col.key) ? 'center' : 'left' }))
    row.height = item.task.length > 110 ? 44 : 30
  })
  wb.definedNames.add(`'Requirements'!$${C.id}$${FIRST}:$${C.id}$${last}`, 'RequirementIDs')
  ws.addConditionalFormatting(textRule(`${C.coverage}${FIRST}:${C.coverage}${last}`, [['no action', RED_FILL, RED_TXT], ['Decide', AMBER_FILL, AMBER_TXT], ['closed', GREEN_FILL, GREEN_TXT]]))
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: last, column: REQ_COLS.length } }
  pageSetup(ws, REQ_COLS.length)
  return last
}

function buildActions(wb) {
  const ws = wb.addWorksheet('Actions', { views: [{ state: 'frozen', ySplit: 4, xSplit: 1 }] })
  titleBlock(ws, 'Action tracker', 'One row per action: one system (or ORG), one requirement ID, one owner, one date. Mark Complete only with an evidence location.', ACTION_COLS.length)
  headerRow(ws, 4, ACTION_COLS)
  const C = AC
  for (let r = FIRST; r <= LAST_ACT; r++) {
    const n = r - FIRST + 1
    const row = ws.getRow(r)
    const set = (key, value) => { row.getCell(ACTION_COLS.findIndex((c) => c.key === key) + 1).value = value }
    set('id', `ACT-${String(n).padStart(3, '0')}`)
    const sys = `${C.sys}${r}`
    set('sysName', { formula: `IF(${sys}="","",IF(${sys}="ORG","Organisation-wide",IFERROR(IF(INDEX(${REG('name')},MATCH(${sys},${REG('id')},0))="","System not yet named",INDEX(${REG('name')},MATCH(${sys},${REG('id')},0))),"Unknown system ID")))` })
    set('reqText', { formula: `IF(${C.req}${r}="","",IFERROR(INDEX('Requirements'!$${QC.task}:$${QC.task},MATCH(${C.req}${r},'Requirements'!$${QC.id}:$${QC.id},0)),"Unknown requirement ID"))` })
    const st = `${C.status}${r}`
    set('checks', { formula: `IF(${C.action}${r}="","",TRIM(IF(${sys}="","No system. ",IF(${C.sysName}${r}="Unknown system ID","Unknown system ID. ",""))&IF(${C.req}${r}="","No requirement ID. ",IF(${C.reqText}${r}="Unknown requirement ID","Unknown requirement ID. ",""))&IF(${C.owner}${r}="","No owner. ","")&IF(${C.due}${r}="","No due date. ",IF(AND(${C.due}${r}<TODAY(),${st}<>"Complete",${st}<>"Not applicable"),"Overdue. ",""))&IF(AND(${st}="Complete",${C.evidence}${r}=""),"Complete without evidence. ","")))` })
    ws.getCell(sys).dataValidation = listValidation('SystemChoices')
    ws.getCell(`${C.req}${r}`).dataValidation = listValidation('RequirementIDs')
    ws.getCell(`${C.priority}${r}`).dataValidation = listValidation('Priorities')
    ws.getCell(st).dataValidation = listValidation('ActionStatuses')
    ws.getCell(`${C.due}${r}`).dataValidation = dateValidation
    ws.getCell(`${C.completed}${r}`).dataValidation = dateValidation
    ws.getCell(`${C.due}${r}`).numFmt = 'dd mmm yyyy'
    ws.getCell(`${C.completed}${r}`).numFmt = 'dd mmm yyyy'
    ACTION_COLS.forEach((col, i) => bodyCell(row.getCell(i + 1), { fill: col.calc ? CALC_FILL : null, bold: col.key === 'id' }))
    row.height = 30
  }
  const col = (k) => `${C[k]}${FIRST}:${C[k]}${LAST_ACT}`
  ws.addConditionalFormatting(textRule(col('status'), [['Complete', GREEN_FILL, GREEN_TXT], ['Blocked', RED_FILL, RED_TXT], ['In progress', AMBER_FILL, AMBER_TXT], ['Not started', RED_FILL, RED_TXT]]))
  ws.addConditionalFormatting(textRule(col('priority'), [['Critical', RED_FILL, RED_TXT], ['High', AMBER_FILL, AMBER_TXT]]))
  ws.addConditionalFormatting(textRule(col('checks'), [['Overdue', RED_FILL, RED_TXT], ['without evidence', RED_FILL, RED_TXT], ['.', AMBER_FILL, AMBER_TXT]]))
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: LAST_ACT, column: ACTION_COLS.length } }
  pageSetup(ws, ACTION_COLS.length)
}

function buildDashboard(wb, assessment, reqLast) {
  const ws = wb.addWorksheet('Dashboard', { properties: { tabColor: { argb: TEAL } } })
  ws.getColumn(1).width = 44
  ws.getColumn(2).width = 22
  ws.getColumn(3).width = 4
  ws.getColumn(4).width = 44
  ws.getColumn(5).width = 22
  titleBlock(ws, 'Dashboard', 'Everything here is calculated from the other tabs. Use it to fill in the Board-Ready Risk Summary.', 5)

  const regName = REG('name')
  const inReg = (key, value) => `COUNTIFS(${regName},"<>",${REG(key)},"${value}")`
  const sysCount = `COUNTIF(${regName},"?*")`

  const left = [
    ['Assessment', null],
    ['Position', { formula: assessment['Position'] }],
    ['Readiness (applicable questions)', { formula: assessment['Readiness (applicable questions only)'] }, '0%'],
    ['Critical findings', { formula: assessment['Critical findings'] }],
    ['Exposure indicators', { formula: assessment['Exposure indicators (Yes or Unsure)'] }],
    ['', null],
    ['AI systems', null],
    ['Systems catalogued', { formula: sysCount }],
    ['Not yet classified', { formula: `${sysCount}-${inReg('tier', 'Prohibited')}-${inReg('tier', 'High-risk')}-${inReg('tier', 'Limited risk')}-${inReg('tier', 'Minimal')}` }],
    ['Prohibited — stop', { formula: inReg('tier', 'Prohibited') }],
    ['High-risk — Annex III (from 2 Dec 2027)', { formula: `COUNTIFS(${regName},"<>",${REG('tier')},"High-risk",${REG('annex')},"Annex III")` }],
    ['High-risk — Annex I (from 2 Aug 2028)', { formula: `COUNTIFS(${regName},"<>",${REG('tier')},"High-risk",${REG('annex')},"Annex I")` }],
    ['High-risk — route not recorded', { formula: `${inReg('tier', 'High-risk')}-COUNTIFS(${regName},"<>",${REG('tier')},"High-risk",${REG('annex')},"Annex III")-COUNTIFS(${regName},"<>",${REG('tier')},"High-risk",${REG('annex')},"Annex I")` }],
    ['Limited risk — transparency (since 2 Aug 2026)', { formula: inReg('tier', 'Limited risk') }],
    ['Minimal', { formula: inReg('tier', 'Minimal') }],
    ['Provider of / deployer of', { formula: `${inReg('role', 'Provider')}&" / "&${inReg('role', 'Deployer')}` }],
    ['Data outside EU/EEA or unknown', { formula: `COUNTIF(${REG('locFlag')},"Data*")` }],
    ['Without a named owner', { formula: `COUNTIFS(${regName},"?*",${REG('owner')},"")` }],
    ['Reviews overdue', { formula: `COUNTIF(${REG('checks')},"*Review overdue*")` }],
  ]
  const right = [
    ['Suppliers', null],
    ['Suppliers recorded', { formula: `COUNTIF(${SUP('name')},"?*")` }],
    ['High dependency', { formula: `COUNTIF(${SUP('band')},"High")` }],
    ['Medium dependency', { formula: `COUNTIF(${SUP('band')},"Medium")` }],
    ['Low dependency', { formula: `COUNTIF(${SUP('band')},"Low")` }],
    ['Scoring incomplete', { formula: `COUNTIF(${SUP('band')},"Incomplete*")` }],
    ['Questionnaires unanswered or refused', { formula: `COUNTIF(${SUP('response')},"Awaiting reply")+COUNTIF(${SUP('response')},"Refused")` }],
    ['', null],
    ['Actions', null],
    ['Actions raised', { formula: `COUNTIF(${ACT('action')},"?*")` }],
    ['Complete', { formula: `COUNTIFS(${ACT('action')},"?*",${ACT('status')},"Complete")` }],
    ['In progress', { formula: `COUNTIFS(${ACT('action')},"?*",${ACT('status')},"In progress")` }],
    ['Blocked', { formula: `COUNTIFS(${ACT('action')},"?*",${ACT('status')},"Blocked")` }],
    ['Overdue', { formula: `COUNTIF(${ACT('checks')},"*Overdue*")` }],
    ['Complete without evidence', { formula: `COUNTIF(${ACT('checks')},"*without evidence*")` }],
    ['', null],
    ['Requirements', null],
    ['Marked as applying to us', { formula: `COUNTIF('Requirements'!$${QC.applies}$${FIRST}:$${QC.applies}$${reqLast},"Yes")` }],
    ['Applying with no action raised', { formula: `COUNTIF('Requirements'!$${QC.coverage}$${FIRST}:$${QC.coverage}$${reqLast},"Applies — no action raised")` }],
    ['Not yet decided', { formula: `COUNTIF('Requirements'!$${QC.coverage}$${FIRST}:$${QC.coverage}$${reqLast},"Decide*")` }],
  ]

  const place = (items, labelCol, valueCol) => {
    items.forEach(([label, value, fmt], i) => {
      const r = 4 + i
      const a = ws.getCell(r, labelCol)
      a.value = label
      if (value === null && label) {
        a.font = { name: FONT, size: 11, bold: true, color: { argb: WHITE } }
        a.fill = solid(SLATE)
        a.alignment = { indent: 1, vertical: 'middle' }
        const b = ws.getCell(r, valueCol)
        b.fill = solid(SLATE)
        return
      }
      if (!label) return
      bodyCell(a)
      const b = ws.getCell(r, valueCol)
      b.value = value
      bodyCell(b, { bold: true, fill: CALC_FILL, align: 'center' })
      if (fmt) b.numFmt = fmt
    })
  }
  place(left, 1, 2)
  place(right, 4, 5)
  for (let r = 4; r < 4 + Math.max(left.length, right.length); r++) ws.getRow(r).height = 20
  ws.getRow(5).height = 32
  ws.addConditionalFormatting(textRule('B5', [
    ['Critical', RED_FILL, RED_TXT], ['Incomplete', AMBER_FILL, AMBER_TXT], ['Check', AMBER_FILL, AMBER_TXT],
    ['Early', RED_FILL, RED_TXT], ['Developing', AMBER_FILL, AMBER_TXT], ['Foundations', GREEN_FILL, GREEN_TXT],
  ]))
  note(ws, 5 + Math.max(left.length, right.length), 5, DISCLAIMER, 24)
  pageSetup(ws, 5)
}

export async function buildWorkbook(outDir) {
  const checklist = readChecklist()
  const wb = new ExcelJS.Workbook()
  wb.creator = PUBLISHER
  wb.company = PUBLISHER
  wb.title = 'AI Act Compliance Toolkit — Workbook'
  wb.created = new Date('2026-09-28T00:00:00Z')
  wb.calcProperties = { fullCalcOnLoad: true }

  buildStart(wb, checklist)
  const assessment = buildAssessment(wb)
  buildRegister(wb)
  buildExamples(wb)
  buildSuppliers(wb)
  buildScoringKey(wb)
  const reqLast = buildRequirements(wb, checklist)
  buildActions(wb)
  buildDashboard(wb, assessment, reqLast)
  buildLists(wb)

  await fs.mkdir(outDir, { recursive: true })
  const out = path.join(outDir, WORKBOOK_NAME)
  await wb.xlsx.writeFile(out)
  return { out, requirements: checklist.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outDir = process.argv[2] ?? path.resolve(__dirname, '..', '..', 'dist', 'AI Act Compliance Toolkit')
  buildWorkbook(outDir)
    .then(({ out, requirements }) => console.log(`✓ ${path.relative(process.cwd(), out)} (${requirements} requirements)`))
    .catch((err) => { console.error(err); process.exit(1) })
}
