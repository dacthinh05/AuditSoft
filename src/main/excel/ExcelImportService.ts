import type { ImportResult, SheetClassification, SheetType } from '../../shared/types/analytics'
import { normalizeJournal, type JournalColumnMapping } from '../accounting/JournalNormalizer'
import { normalizeIncomeStatement } from '../accounting/IncomeStatementNormalizer'
import { normalizeTrialBalance, type TrialBalanceMapping } from '../accounting/TrialBalanceNormalizer'
import path from 'node:path'
import { classifySheet, detectHeaderRow } from './SheetClassifier'
import { GL_FIELDS, IS_FIELDS, TB_FIELDS } from './aliases'
import type { TrialBalanceRow } from '../../shared/types/analytics'
import { readWorkbookMatrix } from './WorkbookReader'

export interface ManualSheetOverride {
  sheetName: string
  type: Exclude<SheetType, 'UNKNOWN'>
  mapping: Record<string, number | null>
  headerRow: number // 1-based như Excel
}

/** Ưước tính số dòng dữ liệu dưới header (sample tối đa 2000 dòng — đủ làm tie-breaker). */
function estimateDataRows(matrix: unknown[][], headerRowIndex: number): number {
  let n = 0
  const limit = Math.min(matrix.length, headerRowIndex + 1 + 2000)
  for (let r = headerRowIndex + 1; r < limit; r++) {
    if ((matrix[r] ?? []).some((c) => c != null && String(c).trim() !== '')) n++
  }
  return n
}

const NAME_PRIOR: Record<Exclude<SheetType, 'UNKNOWN'>, string[]> = {
  GENERAL_LEDGER: ['NKC', 'NHAT KY CHUNG', 'GENERAL LEDGER', 'GL', 'NHAT KY', 'JOURNAL'],
  TRIAL_BALANCE: ['CDFS', 'CDSPS', 'CAN DOI PHAT SINH', 'TRIAL BALANCE', 'SO CAI'],
  INCOME_STATEMENT: ['KQKD', 'KET QUA', 'INCOME'],
  BALANCE_SHEET: ['CDKT', 'BALANCE'],
}

function namePriorBonus(sheetName: string, type: Exclude<SheetType, 'UNKNOWN'>): number {
  const t = sheetName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return NAME_PRIOR[type].some((p) => t === p || t.startsWith(p)) ? 0.05 : 0
}

/** Chọn cột tốt nhất khi header trùng tên: ưu tiên cột có giá trị số hợp lệ trong sample. */
function pickNumericColumn(matrix: unknown[][], startRow: number, candidates: number[]): number | null {
  const valid = candidates.filter((c) => c >= 0)
  if (valid.length <= 1) return valid[0] ?? null
  let best: { col: number; hits: number } | null = null
  const limit = Math.min(matrix.length, startRow + 40)
  for (const col of valid) {
    let hits = 0
    for (let r = startRow; r < limit; r++) {
      const v = matrix[r]?.[col]
      if (typeof v === 'number' && Number.isFinite(v)) hits++
    }
    if (!best || hits > best.hits) best = { col, hits }
  }
  return best?.col ?? valid[0]!
}

export class ExcelImportService {
  /**
   * Import workbook: classify mọi sheet → chọn best per type → normalize.
   * Không âm thầm guess khi confidence thấp — đẩy vào needsReview.
   */
  async importWorkbook(filePath: string, overrides: ManualSheetOverride[] = []): Promise<ImportResult> {
    const fileName = path.basename(filePath)
    const sheets = await readWorkbookMatrix(filePath)

    const classifications: SheetClassification[] = []
    for (const s of sheets) {
      if (s.matrix.length === 0) continue
      const cls = classifySheet(s.matrix)
      classifications.push({
        sheetName: s.sheetName,
        type: cls.type,
        confidence: Math.round(cls.confidence * 100) / 100,
        evidence: cls.evidence,
        headerRow: cls.headerRow + 1,
        dataRows: cls.type === 'UNKNOWN' ? 0 : estimateDataRows(s.matrix, cls.headerRow),
      })
    }

    // Chọn best per type: confidence → name prior → volume (deterministic)
    const selected: Partial<Record<SheetType, string>> = {}
    const needsReview: SheetClassification[] = []
    for (const type of ['GENERAL_LEDGER', 'TRIAL_BALANCE', 'INCOME_STATEMENT'] as const) {
      const candidates = classifications.filter((c) => c.type === type)
      if (candidates.length === 0) continue
      candidates.sort((a, b) => {
        const d =
          b.confidence + namePriorBonus(b.sheetName, type) - (a.confidence + namePriorBonus(a.sheetName, type))
        if (Math.abs(d) > 1e-9) return d > 0 ? 1 : -1
        if (a.dataRows !== b.dataRows) return b.dataRows - a.dataRows
        return a.sheetName.localeCompare(b.sheetName)
      })
      const top = candidates[0]!
      if (top.confidence < 0.6) {
        needsReview.push(top)
      } else {
        selected[type] = top.sheetName
      }
    }

    // overrides của user thắng auto-detect
    for (const ov of overrides) {
      selected[ov.type] = ov.sheetName
      const idx = needsReview.findIndex((n) => n.sheetName === ov.sheetName)
      if (idx >= 0) needsReview.splice(idx, 1)
    }

    let journal: ImportResult['journal'] = null
    let trialBalance: TrialBalanceRow[] = []
    let trialBalanceSource: ImportResult['trialBalanceSource'] = null
    let incomeStatement: ImportResult['incomeStatement'] = null

    const glName = selected.GENERAL_LEDGER
    if (glName) {
      const sheet = sheets.find((s) => s.sheetName === glName)!
      const override = overrides.find((o) => o.sheetName === glName)
      const detected = detectHeaderRow(sheet.matrix, GL_FIELDS)
      const headerRowIndex = override ? override.headerRow - 1 : detected.headerRow
      const rawMapping = override?.mapping ?? detected.best.mapping
      const mapping = toJournalMapping(rawMapping)
      const { entries, quality } = normalizeJournal({
        matrix: sheet.matrix,
        mapping,
        headerRowIndex,
        fileName,
        sheetName: glName,
      })
      journal = {
        entries,
        headerRow: headerRowIndex + 1,
        mapping: { ...mapping } as Record<string, number | null>,
        quality,
      }
    }

    const tbName = selected.TRIAL_BALANCE
    if (tbName) {
      const sheet = sheets.find((s) => s.sheetName === tbName)!
      const override = overrides.find((o) => o.sheetName === tbName)
      const detected = detectHeaderRow(sheet.matrix, TB_FIELDS)
      const headerRowIndex = override ? override.headerRow - 1 : detected.headerRow
      const mapping = toTbMapping(override?.mapping ?? detected.best.mapping)
      trialBalance = normalizeTrialBalance({
        matrix: sheet.matrix,
        mapping,
        headerRowIndex,
        fileName,
        sheetName: tbName,
      })
      trialBalanceSource = { fileName, sheetName: tbName, rowNumber: headerRowIndex + 1 }
    }

    const isName = selected.INCOME_STATEMENT
    if (isName) {
      const sheet = sheets.find((s) => s.sheetName === isName)!
      const override = overrides.find((o) => o.sheetName === isName)
      const detected = detectHeaderRow(sheet.matrix, IS_FIELDS)
      const headerRowIndex = override ? override.headerRow - 1 : detected.headerRow
      const dup = detected.best.duplicateColumns
      const resolveCurrent = override
        ? num(override.mapping.currentYear)
        : pickNumericColumn(sheet.matrix, headerRowIndex + 1, dup.currentYear ?? [])
      const resolvePrior = override
        ? num(override.mapping.priorYear)
        : pickNumericColumn(sheet.matrix, headerRowIndex + 1, dup.priorYear ?? [])
      incomeStatement = normalizeIncomeStatement({
        matrix: sheet.matrix,
        mapping: {
          maSo: (override?.mapping.maSo ?? detected.best.mapping.maSo) ?? null,
          chiTieu: (override?.mapping.chiTieu ?? detected.best.mapping.chiTieu) ?? null,
          currentYear: resolveCurrent,
          priorYear: resolvePrior,
        },
        headerRowIndex,
        fileName,
        sheetName: isName,
      })
    }

    return { fileName, classifications, selected, needsReview, journal, trialBalance, trialBalanceSource, incomeStatement }
  }
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

function toJournalMapping(m: Record<string, unknown>): JournalColumnMapping {
  return {
    postingDate: num(m.postingDate),
    documentNumber: num(m.documentNumber),
    description: num(m.description),
    debitAccount: num(m.debitAccount),
    creditAccount: num(m.creditAccount),
    amount: num(m.amount),
    exchangeRate: num(m.exchangeRate),
    foreignAmount: num(m.foreignAmount),
    objectCode: num(m.objectCode),
    customerName: num(m.customerName),
  }
}

function toTbMapping(m: Record<string, unknown>): TrialBalanceMapping {
  return {
    account: num(m.account),
    accountName: num(m.accountName),
    openingDebit: num(m.openingDebit),
    openingCredit: num(m.openingCredit),
    movementDebit: num(m.movementDebit),
    movementCredit: num(m.movementCredit),
    closingDebit: num(m.closingDebit),
    closingCredit: num(m.closingCredit),
  }
}
