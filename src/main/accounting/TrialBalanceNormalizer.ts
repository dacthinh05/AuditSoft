import type { Money } from '../../domain/money'
import { MONEY_ZERO, parseMoney } from '../../domain/money'
import type { TrialBalanceRow } from '../../shared/types/analytics'
import { isBlankRow, type MatrixRow } from '../excel/WorkbookReader'
import { displayName, normalizeAccount } from './AccountClassifier'

export interface TrialBalanceMapping {
  account: number | null
  accountName: number | null
  openingDebit: number | null
  openingCredit: number | null
  movementDebit: number | null
  movementCredit: number | null
  closingDebit: number | null
  closingCredit: number | null
}

function money(v: unknown): Money {
  if (v == null || String(v).trim() === '') return MONEY_ZERO
  return parseMoney(v) ?? MONEY_ZERO
}

export function normalizeTrialBalance(input: {
  matrix: MatrixRow[]
  mapping: TrialBalanceMapping
  headerRowIndex: number
  fileName: string
  sheetName: string
}): TrialBalanceRow[] {
  const { matrix, mapping, headerRowIndex, fileName, sheetName } = input
  const rows: TrialBalanceRow[] = []
  const usedCols = Object.values(mapping).filter((v): v is number => v != null)

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!row || isBlankRow(row, usedCols)) continue
    const accCell = mapping.account != null ? row[mapping.account] : null
    const acc = normalizeAccount(accCell)
    // Bỏ dòng tổng/không phải TK
    if (!acc.valid) continue
    rows.push({
      account: acc.code,
      accountName: mapping.accountName != null ? String(row[mapping.accountName] ?? '').trim() : displayName(acc.code),
      openingDebit: mapping.openingDebit != null ? money(row[mapping.openingDebit]) : MONEY_ZERO,
      openingCredit: mapping.openingCredit != null ? money(row[mapping.openingCredit]) : MONEY_ZERO,
      movementDebit: mapping.movementDebit != null ? money(row[mapping.movementDebit]) : MONEY_ZERO,
      movementCredit: mapping.movementCredit != null ? money(row[mapping.movementCredit]) : MONEY_ZERO,
      closingDebit: mapping.closingDebit != null ? money(row[mapping.closingDebit]) : MONEY_ZERO,
      closingCredit: mapping.closingCredit != null ? money(row[mapping.closingCredit]) : MONEY_ZERO,
      source: { fileName, sheetName, rowNumber: r + 1 },
    })
  }
  return rows
}
