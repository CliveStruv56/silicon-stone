#!/usr/bin/env node
/**
 * Builds the Silicon and Stone EU AI Act spreadsheet deliverables with ExcelJS.
 *
 *   node deliverables/src/build-spreadsheets.mjs
 *   (or: npm run build:deliverables)
 *
 * Outputs to deliverables/dist/:
 *   Gateway Pack (£24):
 *     - AI Systems Inventory Template.xlsx
 *     - Vendor Dependency Scorecard.xlsx
 *   Toolkit (£79/£149):
 *     - AI Systems Register.xlsx
 *     - Compliance Tracker.xlsx
 *
 * Regulatory content reconciled to the post-Omnibus staged timeline:
 *   2 Aug 2026  transparency (Art 50) + penalties/governance only
 *   2 Dec 2027  standalone high-risk (Annex III)
 *   2 Aug 2028  embedded high-risk (Annex I)
 * No "August 2026 cliff". Methodology framing: 3 × 2 (three domains × two methods).
 */

import ExcelJS from 'exceljs'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '..', 'dist')

// ── Brand tokens (ARGB; mirrors the PDF renderer / globals.css) ──────────────
const SLATE = 'FF1A1F2E'
const TEAL = 'FF4A9B9B'
const AMBER = 'FFF6AD55'
const WHITE = 'FFFFFFFF'
const PAPER = 'FFF7FAFC'
const INK = 'FF1A1F2E'
const MUTED = 'FF4A5568'
const RED_FILL = 'FFF8D7DA' // amber/red warning fills (light, for print)
const AMBER_FILL = 'FFFDE9D2'
const GREEN_FILL = 'FFD7EBD9'
const RED_TXT = 'FFC53030'
const AMBER_TXT = 'FFB7791F'
const GREEN_TXT = 'FF2F855A'

const FONT = 'Calibri' // neutral, ships everywhere; xlsx is not the brand-font surface

// ── Styling helpers ──────────────────────────────────────────────────────────
function brandWorkbook() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Silicon and Stone'
  wb.company = 'Silicon and Stone'
  wb.created = new Date('2026-06-25T00:00:00Z')
  return wb
}

function titleBlock(ws, title, subtitle, span) {
  ws.mergeCells(1, 1, 1, span)
  const t = ws.getCell(1, 1)
  t.value = title
  t.font = { name: FONT, size: 16, bold: true, color: { argb: WHITE } }
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE } }
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 30

  ws.mergeCells(2, 1, 2, span)
  const s = ws.getCell(2, 1)
  s.value = subtitle
  s.font = { name: FONT, size: 10, italic: true, color: { argb: WHITE } }
  s.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
  s.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(2).height = 20
}

function headerRow(ws, rowIdx, headers) {
  const row = ws.getRow(rowIdx)
  headers.forEach((h, i) => {
    const c = row.getCell(i + 1)
    c.value = h
    c.font = { name: FONT, size: 9, bold: true, color: { argb: WHITE } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE } }
    c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
    c.border = { bottom: { style: 'thin', color: { argb: AMBER } } }
  })
  row.height = 30
}

function bodyCell(c, { bold = false, color = INK, fill = null, align = 'left', wrap = true } = {}) {
  c.font = { name: FONT, size: 10, bold, color: { argb: color } }
  c.alignment = { vertical: 'top', horizontal: align, wrapText: wrap, indent: align === 'left' ? 1 : 0 }
  if (fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
  c.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
}

function listValidation(values) {
  return {
    type: 'list',
    allowBlank: true,
    formulae: [`"${values.join(',')}"`],
    showErrorMessage: true,
    errorTitle: 'Pick from the list',
    error: 'Choose one of the predefined values.',
  }
}

function note(ws, rowIdx, span, text) {
  ws.mergeCells(rowIdx, 1, rowIdx, span)
  const c = ws.getCell(rowIdx, 1)
  c.value = text
  c.font = { name: FONT, size: 8, italic: true, color: { argb: MUTED } }
  c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
  ws.getRow(rowIdx).height = 26
}

const REGIONS = ['EU', 'EEA', 'UK', 'US', 'China', 'India', 'Other']
const EU_INSIDE = ['EU', 'EEA'] // anything else gets a sovereignty flag
const RISK_TIERS = ['Unassessed', 'Prohibited', 'High-Risk', 'Limited Risk', 'Minimal']
const STATUSES = ['Not Started', 'In Progress', 'Complete', 'N/A']
const ROLES = ['Deployer', 'Provider', 'Importer', 'Distributor']
const DEPTS = ['HR', 'Operations', 'Sales', 'Marketing', 'IT', 'Finance', 'Legal', 'Customer Service', 'R&D']

// Conditional formatting: flag any region cell not inside the EU/EEA.
function flagNonEU(ws, colLetter, firstRow, lastRow) {
  ws.addConditionalFormatting({
    ref: `${colLetter}${firstRow}:${colLetter}${lastRow}`,
    rules: [
      {
        type: 'expression',
        formulae: [`AND(${colLetter}${firstRow}<>"",NOT(OR(${colLetter}${firstRow}="EU",${colLetter}${firstRow}="EEA")))`],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: AMBER_FILL } }, font: { color: { argb: AMBER_TXT } } },
        priority: 1,
      },
    ],
  })
}

function statusColours(ws, colLetter, firstRow, lastRow) {
  ws.addConditionalFormatting({
    ref: `${colLetter}${firstRow}:${colLetter}${lastRow}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'Complete', priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: GREEN_FILL } }, font: { color: { argb: GREEN_TXT } } } },
      { type: 'containsText', operator: 'containsText', text: 'In Progress', priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: AMBER_FILL } }, font: { color: { argb: AMBER_TXT } } } },
      { type: 'containsText', operator: 'containsText', text: 'Not Started', priority: 3, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: RED_FILL } }, font: { color: { argb: RED_TXT } } } },
    ],
  })
}

function riskColours(ws, colLetter, firstRow, lastRow) {
  ws.addConditionalFormatting({
    ref: `${colLetter}${firstRow}:${colLetter}${lastRow}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'Prohibited', priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: RED_FILL } }, font: { color: { argb: RED_TXT }, bold: true } } },
      { type: 'containsText', operator: 'containsText', text: 'High-Risk', priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: AMBER_FILL } }, font: { color: { argb: AMBER_TXT }, bold: true } } },
    ],
  })
}

// ── 1. AI Systems Inventory Template (Gateway, £24) ─────────────────────────
function buildInventory() {
  const wb = brandWorkbook()
  const ws = wb.addWorksheet('AI Systems Inventory', {
    views: [{ state: 'frozen', ySplit: 4 }],
    properties: { defaultColWidth: 18 },
  })

  const headers = [
    'System Name', 'Vendor', 'Vendor HQ', 'Data Storage Region', 'Department',
    'Primary Use Case', 'Data Inputs', 'Data Outputs', 'Risk Classification',
    'Compliance Status', 'System Owner', 'Review Date',
  ]
  const widths = [22, 18, 13, 16, 14, 30, 24, 24, 16, 15, 18, 14]

  titleBlock(ws, 'AI Systems Inventory', 'Catalogue every AI system in use. Amber cells flag data or vendors outside the EU/EEA — your first sovereignty signal.', headers.length)
  headerRow(ws, 3, headers)
  ws.columns = widths.map((w, i) => ({ width: w, key: `c${i}` }))
  // re-apply header text after columns reset keys
  headerRow(ws, 3, headers)

  const examples = [
    ['Recruitment screening — TalentFilter', 'TalentFilter Ltd', 'US', 'US', 'HR', 'Automated CV ranking and candidate shortlisting', 'CVs, application forms', 'Ranked shortlist, fit scores', 'High-Risk', 'Not Started', 'Head of HR', new Date('2026-09-01')],
    ['Writing assistant — DraftMate', 'DraftMate Inc', 'US', 'US', 'Marketing', 'Drafting and editing marketing copy', 'Prompts, brand guidelines', 'Draft text', 'Minimal', 'In Progress', 'Marketing Lead', new Date('2026-08-15')],
    ['Customer analytics — InsightEngine', 'InsightEngine GmbH', 'EU', 'EU', 'Sales', 'Segmenting customers and predicting churn', 'CRM records, usage logs', 'Segments, churn scores', 'Limited Risk', 'Not Started', 'Sales Ops', new Date('2026-09-30')],
    ['Support chatbot — HelpBot', 'HelpBot AB', 'EEA', 'EU', 'Customer Service', 'First-line customer query handling', 'Customer messages', 'Replies, escalation flags', 'Limited Risk', 'In Progress', 'CX Manager', new Date('2026-08-20')],
    ['Credit decisioning — LendScore', 'LendScore Ltd', 'UK', 'UK', 'Finance', 'Automated creditworthiness assessment', 'Financial history, income', 'Credit decision, score', 'High-Risk', 'Not Started', 'Risk Officer', new Date('2026-09-10')],
    ['Demand forecasting — StockSense', 'StockSense BV', 'EU', 'EU', 'Operations', 'Inventory demand prediction', 'Sales history, seasonality', 'Reorder forecasts', 'Minimal', 'Complete', 'Ops Manager', new Date('2026-12-01')],
    ['Meeting summariser — NoteWise', 'NoteWise Inc', 'US', 'US', 'IT', 'Transcribing and summarising calls', 'Audio, transcripts', 'Summaries, action items', 'Limited Risk', 'Not Started', 'IT Lead', new Date('2026-08-25')],
    ['Fraud detection — GuardRail', 'GuardRail SAS', 'EU', 'EU', 'Finance', 'Transaction anomaly detection', 'Transaction streams', 'Risk flags', 'High-Risk', 'In Progress', 'Risk Officer', new Date('2026-09-15')],
    ['Translation — LinguaFlow', 'LinguaFlow Pte', 'Other', 'Other', 'Operations', 'Document and content translation', 'Source documents', 'Translated text', 'Minimal', 'Not Started', 'Ops Manager', new Date('2026-10-01')],
    ['Performance review aid — MeritMap', 'MeritMap Ltd', 'UK', 'UK', 'HR', 'Scoring employee performance inputs', 'Appraisal data, KPIs', 'Performance ratings', 'High-Risk', 'Not Started', 'Head of HR', new Date('2026-09-05')],
  ]

  let r = 4
  for (const row of examples) {
    const xl = ws.getRow(r)
    row.forEach((v, i) => {
      const c = xl.getCell(i + 1)
      c.value = v
      bodyCell(c)
      if (i === 11 && v instanceof Date) c.numFmt = 'dd mmm yyyy'
    })
    xl.height = 30
    r++
  }
  const lastRow = 4 + 60 // give 60 working rows of validation/formatting
  // apply validation + formatting across working range
  for (let rr = 4; rr <= lastRow; rr++) {
    ws.getCell(`C${rr}`).dataValidation = listValidation(REGIONS)
    ws.getCell(`D${rr}`).dataValidation = listValidation(REGIONS)
    ws.getCell(`E${rr}`).dataValidation = listValidation(DEPTS)
    ws.getCell(`I${rr}`).dataValidation = listValidation(RISK_TIERS)
    ws.getCell(`J${rr}`).dataValidation = listValidation(STATUSES)
    if (rr > r - 1) {
      // style empty working rows lightly
      for (let cc = 1; cc <= headers.length; cc++) bodyCell(ws.getCell(rr, cc))
    }
  }
  flagNonEU(ws, 'C', 4, lastRow)
  flagNonEU(ws, 'D', 4, lastRow)
  riskColours(ws, 'I', 4, lastRow)
  statusColours(ws, 'J', 4, lastRow)

  note(ws, lastRow + 2, headers.length,
    'How to use: list every AI-enabled tool, including AI features inside CRM, office and vendor-managed software. Amber = data or vendor outside the EU/EEA (a dependency to record, not necessarily a breach). Risk Classification: run each system through the Compliance Checker or the Toolkit decision tree. This template is an operational aid, not legal advice. Reconciled to the staged AI Act timeline (transparency 2 Aug 2026; standalone high-risk 2 Dec 2027; embedded high-risk 2 Aug 2028).')

  return { wb, name: 'AI Systems Inventory Template.xlsx' }
}

// ── 2. Vendor Dependency Scorecard (Gateway, £24) ───────────────────────────
function buildScorecard() {
  const wb = brandWorkbook()

  // Scoring key sheet
  const key = wb.addWorksheet('Scoring Key', { properties: { defaultColWidth: 22 } })
  titleBlock(key, 'Vendor Dependency Scorecard — Scoring Key', 'Score each dimension 1 (low dependency / low risk) to 5 (high dependency / high risk).', 3)
  headerRow(key, 3, ['Dimension', '1 — Low', '5 — High'])
  const keyRows = [
    ['Data Sovereignty', 'Data trained and processed inside the EU/EEA', 'Data processed in a third country with no adequacy decision'],
    ['Contractual Lock-In', 'Short term, easy exit, portable data', 'Long contract, high switching cost, proprietary formats'],
    ['Regulatory Risk', 'Vendor unlikely to be hit by EU enforcement', 'Vendor squarely in scope of AI Act / GDPR enforcement'],
    ['Concentration Risk', 'One of several tools; failure is survivable', 'Critical workflows depend on this single vendor'],
    ['Alternative Availability', 'Credible open-source or EU-hosted alternatives exist', 'No realistic alternative without major rebuild'],
  ]
  let kr = 4
  for (const row of keyRows) {
    const xl = key.getRow(kr)
    row.forEach((v, i) => { const c = xl.getCell(i + 1); c.value = v; bodyCell(c, { bold: i === 0 }) })
    xl.height = 34
    key.getColumn(1).width = 22; key.getColumn(2).width = 40; key.getColumn(3).width = 40
    kr++
  }
  note(key, kr + 1, 3, 'Band: average of the five scores. 1.0–2.4 Low · 2.5–3.7 Medium · 3.8–5.0 High. A High band is a concentration to manage, not a verdict on the vendor.')

  // Scorecard sheet
  const ws = wb.addWorksheet('Scorecard', { views: [{ state: 'frozen', ySplit: 4 }], properties: { defaultColWidth: 16 } })
  const headers = ['Vendor', 'Data Sovereignty', 'Contractual Lock-In', 'Regulatory Risk', 'Concentration Risk', 'Alternative Availability', 'Overall (avg)', 'Dependency Band', 'Notes']
  const widths = [22, 14, 14, 13, 14, 16, 12, 15, 30]
  titleBlock(ws, 'Vendor Dependency Scorecard', 'Average is auto-calculated; the band flags High-dependency vendors. See the Scoring Key tab.', headers.length)
  headerRow(ws, 3, headers)
  ws.columns = widths.map((w) => ({ width: w }))
  headerRow(ws, 3, headers)

  const examples = [
    ['TalentFilter Ltd (US)', 4, 4, 5, 3, 3],
    ['InsightEngine GmbH (EU)', 1, 3, 2, 4, 2],
    ['LendScore Ltd (UK)', 3, 4, 5, 4, 4],
    ['DraftMate Inc (US)', 4, 2, 2, 1, 1],
    ['HelpBot AB (EEA)', 1, 2, 2, 3, 2],
  ]
  let r = 4
  const lastRow = 4 + 50
  for (let rr = 4; rr <= lastRow; rr++) {
    const xl = ws.getRow(rr)
    const ex = examples[rr - 4]
    if (ex) ex.forEach((v, i) => { xl.getCell(i + 1).value = v })
    for (let cc = 1; cc <= headers.length; cc++) bodyCell(xl.getCell(cc), { align: cc >= 2 && cc <= 7 ? 'center' : 'left' })
    // score validation 1-5
    for (let cc = 2; cc <= 6; cc++) {
      ws.getCell(rr, cc).dataValidation = { type: 'whole', operator: 'between', allowBlank: true, formulae: [1, 5], showErrorMessage: true, errorTitle: 'Score 1–5', error: 'Enter a whole number from 1 to 5.' }
    }
    // overall average (blank-safe)
    ws.getCell(rr, 7).value = { formula: `IF(COUNT(B${rr}:F${rr})=0,"",ROUND(AVERAGE(B${rr}:F${rr}),1))` }
    ws.getCell(rr, 7).alignment = { horizontal: 'center', vertical: 'top' }
    ws.getCell(rr, 7).font = { name: FONT, size: 10, bold: true, color: { argb: INK } }
    // band
    ws.getCell(rr, 8).value = { formula: `IF(G${rr}="","",IF(G${rr}>=3.8,"High",IF(G${rr}>=2.5,"Medium","Low")))` }
    ws.getCell(rr, 8).alignment = { horizontal: 'center', vertical: 'top' }
    if (rr > r - 1 && !ex) { /* leave blank working rows */ }
  }
  // colour the band
  ws.addConditionalFormatting({
    ref: `H4:H${lastRow}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'High', priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: RED_FILL } }, font: { color: { argb: RED_TXT }, bold: true } } },
      { type: 'containsText', operator: 'containsText', text: 'Medium', priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: AMBER_FILL } }, font: { color: { argb: AMBER_TXT }, bold: true } } },
      { type: 'containsText', operator: 'containsText', text: 'Low', priority: 3, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: GREEN_FILL } }, font: { color: { argb: GREEN_TXT }, bold: true } } },
    ],
  })
  note(ws, lastRow + 2, headers.length, 'Score each dimension 1–5 using the Scoring Key. Overall and Band update automatically. Treat High-band vendors as concentration risks to mitigate (second source, EU-hosted alternative, exit clause). Operational aid, not legal advice.')

  return { wb, name: 'Vendor Dependency Scorecard.xlsx' }
}

// ── 3. AI Systems Register (Toolkit) — the evidence repository ───────────────
function buildRegister() {
  const wb = brandWorkbook()
  const ws = wb.addWorksheet('AI Systems Register', { views: [{ state: 'frozen', ySplit: 4 }], properties: { defaultColWidth: 18 } })
  const headers = [
    'System ID', 'System Name', 'Vendor', 'Vendor HQ', 'Data Storage Region', 'Our Role',
    'Department', 'Primary Use Case', 'Data Inputs', 'Data Outputs', 'Risk Classification',
    'Annex', 'Key Obligations Trigger', 'Compliance Status', 'System Owner', 'Evidence Location', 'Review Date',
  ]
  const widths = [10, 22, 16, 12, 15, 12, 13, 26, 22, 22, 15, 9, 26, 15, 16, 22, 13]
  titleBlock(ws, 'AI Systems Register', 'The single source of truth for market-surveillance evidence. Role and Annex drive which obligations apply.', headers.length)
  headerRow(ws, 3, headers)
  ws.columns = widths.map((w) => ({ width: w }))
  headerRow(ws, 3, headers)

  const examples = [
    ['SYS-001', 'Recruitment screening — TalentFilter', 'TalentFilter Ltd', 'US', 'US', 'Deployer', 'HR', 'Automated CV ranking', 'CVs', 'Ranked shortlist', 'High-Risk', 'III', 'Art 26 deployer duties; human oversight; FRIA where applicable', 'Not Started', 'Head of HR', '\\\\gov\\ai\\sys-001', new Date('2026-09-01')],
    ['SYS-002', 'Credit decisioning — LendScore', 'LendScore Ltd', 'UK', 'UK', 'Deployer', 'Finance', 'Creditworthiness assessment', 'Financial history', 'Credit decision', 'High-Risk', 'III', 'Art 26; GDPR Art 22 solely-automated decision safeguards', 'Not Started', 'Risk Officer', '\\\\gov\\ai\\sys-002', new Date('2026-09-10')],
    ['SYS-003', 'Support chatbot — HelpBot', 'HelpBot AB', 'EEA', 'EU', 'Deployer', 'Customer Service', 'First-line support', 'Customer messages', 'Replies', 'Limited Risk', 'N/A', 'Art 50 transparency — disclose users are interacting with AI', 'In Progress', 'CX Manager', '\\\\gov\\ai\\sys-003', new Date('2026-08-20')],
    ['SYS-004', 'Demand forecasting — StockSense', 'StockSense BV', 'EU', 'EU', 'Deployer', 'Operations', 'Inventory demand', 'Sales history', 'Forecasts', 'Minimal', 'N/A', 'No mandatory duties; voluntary good practice + AI literacy', 'Complete', 'Ops Manager', '\\\\gov\\ai\\sys-004', new Date('2026-12-01')],
  ]
  let r = 4
  for (const row of examples) {
    const xl = ws.getRow(r)
    row.forEach((v, i) => { const c = xl.getCell(i + 1); c.value = v; bodyCell(c); if (i === 16 && v instanceof Date) c.numFmt = 'dd mmm yyyy' })
    xl.height = 32
    r++
  }
  const lastRow = 4 + 80
  for (let rr = 4; rr <= lastRow; rr++) {
    ws.getCell(`D${rr}`).dataValidation = listValidation(REGIONS)
    ws.getCell(`E${rr}`).dataValidation = listValidation(REGIONS)
    ws.getCell(`F${rr}`).dataValidation = listValidation(ROLES)
    ws.getCell(`G${rr}`).dataValidation = listValidation(DEPTS)
    ws.getCell(`K${rr}`).dataValidation = listValidation(RISK_TIERS)
    ws.getCell(`L${rr}`).dataValidation = listValidation(['N/A', 'III', 'I'])
    ws.getCell(`N${rr}`).dataValidation = listValidation(STATUSES)
    if (rr >= r) for (let cc = 1; cc <= headers.length; cc++) bodyCell(ws.getCell(rr, cc))
  }
  flagNonEU(ws, 'D', 4, lastRow)
  flagNonEU(ws, 'E', 4, lastRow)
  riskColours(ws, 'K', 4, lastRow)
  statusColours(ws, 'N', 4, lastRow)
  note(ws, lastRow + 2, headers.length, 'Maintain continuously — this is the record an authority would ask for first. Role: Provider (you build/badge it), Deployer (you use a third-party system), Importer/Distributor (you place a non-EU system on the EU market). Annex III = standalone high-risk (rules 2 Dec 2027); Annex I = embedded/product-safety high-risk (rules 2 Aug 2028). Operational aid, not legal advice.')

  return { wb, name: 'AI Systems Register.xlsx' }
}

// ── 4. Compliance Tracker (Toolkit) — requirements + live dashboard ─────────
function buildTracker() {
  const wb = brandWorkbook()

  // Requirements sheet
  const ws = wb.addWorksheet('Requirements', { views: [{ state: 'frozen', ySplit: 4 }], properties: { defaultColWidth: 18 } })
  const headers = ['Req ID', 'Requirement', 'Applies To', 'Risk Tier', 'Owner', 'Status', 'Target Deadline', 'Evidence Location', 'Notes']
  const widths = [10, 38, 14, 13, 16, 14, 15, 22, 26]
  titleBlock(ws, 'Compliance Tracker — Requirements', 'Each Article-level duty as a tracked task. Status drives the Dashboard tab.', headers.length)
  headerRow(ws, 3, headers)
  ws.columns = widths.map((w) => ({ width: w }))
  headerRow(ws, 3, headers)

  // Reconciled deadlines: governance/transparency 2 Aug 2026; standalone HR 2 Dec 2027; embedded HR 2 Aug 2028.
  const reqs = [
    ['REQ-01', 'Art 4 — AI literacy: ensure staff operating AI have sufficient understanding', 'Provider & Deployer', 'All', new Date('2025-02-02')],
    ['REQ-02', 'Art 5 — Confirm no prohibited practices in use (e.g. workplace emotion inference, social scoring)', 'Provider & Deployer', 'All', new Date('2025-02-02')],
    ['REQ-03', 'Art 50 — Transparency: disclose AI interaction; label synthetic/generated content', 'Provider & Deployer', 'Limited Risk', new Date('2026-08-02')],
    ['REQ-04', 'Governance & penalties framework operational; designate internal AI accountability owner', 'Provider & Deployer', 'All', new Date('2026-08-02')],
    ['REQ-05', 'Art 9 — Risk management system established and maintained', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-06', 'Art 10 — Data governance: training/validation data quality and bias controls', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-07', 'Art 11 + Annex IV — Technical documentation compiled and kept current', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-08', 'Art 12 — Automatic logging / record-keeping over the system lifecycle', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-09', 'Art 13 — Instructions for use enabling deployer transparency', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-10', 'Art 14 — Human oversight measures designed and implemented', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-11', 'Art 15 — Accuracy, robustness and cybersecurity to state of the art', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-12', 'Art 16 / 17 — Quality management system for high-risk provider duties', 'Provider', 'High-Risk', new Date('2027-12-02')],
    ['REQ-13', 'Art 26 — Deployer duties: use per instructions, assign human oversight, monitor', 'Deployer', 'High-Risk', new Date('2027-12-02')],
    ['REQ-14', 'Art 27 — Fundamental Rights Impact Assessment where required (public bodies / specified deployers)', 'Deployer', 'High-Risk', new Date('2027-12-02')],
    ['REQ-15', 'Annex I — Embedded/product-safety high-risk: third-party conformity assessment', 'Provider', 'High-Risk', new Date('2028-08-02')],
    ['REQ-16', 'Registration in the EU database for standalone high-risk systems', 'Provider & Deployer', 'High-Risk', new Date('2027-12-02')],
    ['REQ-17', 'GDPR Art 22 — Safeguards for solely-automated decisions with legal/significant effect', 'Deployer', 'High-Risk', new Date('2026-08-02')],
    ['REQ-18', 'Post-market monitoring plan and serious-incident reporting route', 'Provider', 'High-Risk', new Date('2027-12-02')],
  ]
  let r = 4
  for (const [id, req, applies, tier, deadline] of reqs) {
    const xl = ws.getRow(r)
    xl.getCell(1).value = id
    xl.getCell(2).value = req
    xl.getCell(3).value = applies
    xl.getCell(4).value = tier
    xl.getCell(5).value = '' // owner
    xl.getCell(6).value = 'Not Started'
    xl.getCell(7).value = deadline
    xl.getCell(8).value = ''
    xl.getCell(9).value = ''
    for (let cc = 1; cc <= headers.length; cc++) bodyCell(xl.getCell(cc))
    xl.getCell(7).numFmt = 'dd mmm yyyy'
    xl.getCell(6).dataValidation = listValidation(STATUSES)
    xl.getCell(4).dataValidation = listValidation(['All', 'Limited Risk', 'High-Risk'])
    xl.height = 30
    r++
  }
  const lastReq = r - 1
  statusColours(ws, 'F', 4, lastReq)
  note(ws, lastReq + 2, headers.length, 'Deadlines reflect the post-Omnibus staged timeline: AI literacy & prohibitions live since Feb 2025; transparency, governance and penalties from 2 Aug 2026; standalone high-risk (Annex III) from 2 Dec 2027; embedded high-risk (Annex I) from 2 Aug 2028. Adjust Owner, Status and Evidence as you progress. Operational aid, not legal advice.')

  // Dashboard sheet
  const db = wb.addWorksheet('Dashboard', { properties: { defaultColWidth: 22 } })
  titleBlock(db, 'Compliance Dashboard', 'Live readout of programme readiness. Updates as you set Status on the Requirements tab.', 4)
  const total = lastReq - 4 + 1
  const statRange = `Requirements!F4:F${lastReq}`

  db.getCell('A4').value = 'Metric'; db.getCell('B4').value = 'Count'
  ;['A4', 'B4'].forEach((a) => { const c = db.getCell(a); c.font = { name: FONT, size: 9, bold: true, color: { argb: WHITE } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE } }; c.alignment = { horizontal: 'left', indent: 1 } })
  const metrics = [
    ['Total requirements', `${total}`],
    ['Complete', `COUNTIF(${statRange},"Complete")`],
    ['In Progress', `COUNTIF(${statRange},"In Progress")`],
    ['Not Started', `COUNTIF(${statRange},"Not Started")`],
    ['N/A', `COUNTIF(${statRange},"N/A")`],
  ]
  let dr = 5
  for (const [label, val] of metrics) {
    db.getCell(`A${dr}`).value = label
    bodyCell(db.getCell(`A${dr}`))
    const bc = db.getCell(`B${dr}`)
    bc.value = dr === 5 ? Number(val) : { formula: val }
    bodyCell(bc, { align: 'center', bold: true })
    dr++
  }
  // % complete (exclude N/A from denominator)
  db.getCell(`A${dr}`).value = 'Readiness (% of applicable complete)'
  bodyCell(db.getCell(`A${dr}`), { bold: true })
  const pc = db.getCell(`B${dr}`)
  pc.value = { formula: `IF((B5-B9)=0,0,B6/(B5-B9))` }
  pc.numFmt = '0%'
  bodyCell(pc, { align: 'center', bold: true, color: TEAL })
  const pctRow = dr
  dr += 2

  // RAG status banner
  db.getCell(`A${dr}`).value = 'Programme status'
  bodyCell(db.getCell(`A${dr}`), { bold: true })
  const rag = db.getCell(`B${dr}`)
  rag.value = { formula: `IF(B${pctRow}>=0.8,"GREEN — broadly on track",IF(B${pctRow}>=0.4,"AMBER — significant work outstanding","RED — substantial gaps"))` }
  bodyCell(rag, { bold: true })
  db.addConditionalFormatting({
    ref: `B${dr}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'GREEN', priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: GREEN_FILL } }, font: { color: { argb: GREEN_TXT }, bold: true } } },
      { type: 'containsText', operator: 'containsText', text: 'AMBER', priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: AMBER_FILL } }, font: { color: { argb: AMBER_TXT }, bold: true } } },
      { type: 'containsText', operator: 'containsText', text: 'RED', priority: 3, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: RED_FILL } }, font: { color: { argb: RED_TXT }, bold: true } } },
    ],
  })
  db.getColumn(1).width = 38; db.getColumn(2).width = 26
  note(db, dr + 2, 4, 'Mark requirements that do not apply to your systems as N/A so the readiness percentage reflects only what is genuinely in scope. Critical-path duties (Art 9–15 high-risk) cluster at the 2 Dec 2027 standalone deadline — start them well ahead.')

  return { wb, name: 'Compliance Tracker.xlsx' }
}

async function main() {
  await fs.mkdir(DIST, { recursive: true })
  const builders = [buildInventory, buildScorecard, buildRegister, buildTracker]
  for (const build of builders) {
    const { wb, name } = build()
    const out = path.join(DIST, name)
    await wb.xlsx.writeFile(out)
    console.log(`✓ ${path.relative(process.cwd(), out)}`)
  }
  console.log('\nAll spreadsheet deliverables written to deliverables/dist/.')
}

main().catch((err) => { console.error(err); process.exit(1) })
