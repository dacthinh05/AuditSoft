import type { Money } from '../../domain/money'
import { MONEY_ZERO, parseMoney } from '../../domain/money'
import { parseDateCell } from '../../domain/parseDate'
import type { DataQualityReport, JournalEntry, RowIssueCode } from '../../shared/types/analytics'
import { isBlankRow, type MatrixRow } from '../excel/WorkbookReader'
import { normalizeAccount } from './AccountClassifier'

import { resolveEntryPartner } from '../../domain/analytics/PartnerExtractor'

export interface JournalColumnMapping {
  postingDate: number | null
  documentNumber: number | null
  description: number | null
  debitAccount: number | null
  creditAccount: number | null
  amount: number | null
  exchangeRate: number | null
  foreignAmount: number | null
  objectCode: number | null
  customerName: number | null
}

export interface NormalizeJournalInput {
  matrix: MatrixRow[]
  mapping: JournalColumnMapping
  headerRowIndex: number
  fileName: string
  sheetName: string
}

function str(v: unknown): string {
  if (v == null) return ''
  return String(v).replace(/\s+/g, ' ').trim()
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const m = parseMoney(v)
    if (m) return Number(m.raw) / Math.pow(10, m.scale)
  }
  return null
}

/** Chuẩn hóa NKC → JournalEntry[]. Không âm thầm bỏ dòng lỗi — gắn issues. */
export function normalizeJournal(input: NormalizeJournalInput): { entries: JournalEntry[]; quality: DataQualityReport } {
  const { matrix, mapping, headerRowIndex, fileName, sheetName } = input
  const entries: JournalEntry[] = []
  const issuesCount = {
    missingDate: 0, invalidDate: 0, missingDebit: 0, missingCredit: 0,
    invalidAmount: 0, zeroAmount: 0, negativeAmount: 0, invalidAccounts: 0, missingDoc: 0,
  }
  const exactDupKeys = new Map<string, number>()
  let totalRows = 0

  const usedCols = Object.values(mapping).filter((v): v is number => v != null)

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!row || isBlankRow(row, usedCols)) continue
    totalRows++

    const get = (col: number | null): unknown => (col == null ? null : row[col] ?? null)

    const issues: RowIssueCode[] = []

    // Date
    let iso: string | null = null
    let month: number | null = null
    const dateCell = get(mapping.postingDate)
    if (dateCell == null || String(dateCell).trim() === '') {
      issues.push('MISSING_DATE')
      issuesCount.missingDate++
    } else {
      const parsed = parseDateCell(dateCell)
      if (!parsed || parsed.iso == null) {
        issues.push('INVALID_DATE')
        issuesCount.invalidDate++
      } else {
        iso = parsed.iso
        month = Number(parsed.iso.slice(5, 7))
      }
    }

    // Accounts
    const debit = normalizeAccount(get(mapping.debitAccount))
    if (debit.code === '') {
      issues.push('MISSING_DEBIT_ACCOUNT')
      issuesCount.missingDebit++
    } else if (!debit.valid) {
      issues.push('INVALID_ACCOUNT_FORMAT')
      issuesCount.invalidAccounts++
    }
    const credit = normalizeAccount(get(mapping.creditAccount))
    if (credit.code === '') {
      issues.push('MISSING_CREDIT_ACCOUNT')
      issuesCount.missingCredit++
    } else if (!credit.valid) {
      issues.push('INVALID_ACCOUNT_FORMAT')
      issuesCount.invalidAccounts++
    }

    // Amount
    const amountRaw = get(mapping.amount)
    let amount: Money = MONEY_ZERO
    if (amountRaw == null || String(amountRaw).trim() === '') {
      issues.push('INVALID_AMOUNT')
      issuesCount.invalidAmount++
    } else {
      const parsedAmt = parseMoney(amountRaw)
      if (!parsedAmt) {
        issues.push('INVALID_AMOUNT')
        issuesCount.invalidAmount++
      } else {
        amount = parsedAmt
        if (amount.raw < 0n) {
          issues.push('NEGATIVE_AMOUNT')
          issuesCount.negativeAmount++
        }
        if (amount.raw === 0n) {
          issues.push('ZERO_AMOUNT')
          issuesCount.zeroAmount++
        }
      }
    }

    // Document
    const doc = str(get(mapping.documentNumber))
    if (doc === '') {
      issues.push('MISSING_DOCUMENT')
      issuesCount.missingDoc++
    }

    const fxRate = toNumber(get(mapping.exchangeRate))
    const foreign = mapping.foreignAmount != null ? parseMoney(get(mapping.foreignAmount)) : null

    const id = `${fileName}::${sheetName}::${r + 1}`
    entries.push({
      id,
      source: { fileName, sheetName, rowNumber: r + 1 },
      postingDate: iso,
      documentNumber: doc === '' ? null : doc,
      description: str(get(mapping.description)),
      debitAccount: debit.code,
      creditAccount: credit.code,
      amount,
      foreignAmount: foreign,
      exchangeRate: fxRate,
      ...(() => {
        const rawObj = str(get(mapping.objectCode)) || null
        const rawCust = str(get(mapping.customerName)) || null
        const resolved = resolveEntryPartner(debit.code, credit.code, rawObj, rawCust, str(get(mapping.description)))
        return {
          objectCode: resolved.partnerCode,
          customerName: resolved.partnerName,
        }
      })(),
      month,
      issues,
    })

    if (iso && doc !== '') {
      const key = `${iso}|${doc}|${debit.code}|${credit.code}|${amount.raw}|${amount.scale}`
      exactDupKeys.set(key, (exactDupKeys.get(key) ?? 0) + 1)
    }
  }

  let duplicateExactRows = 0
  for (const n of exactDupKeys.values()) if (n > 1) duplicateExactRows += n - 1

  const quality = buildQualityReport(totalRows, entries, issuesCount, duplicateExactRows)
  return { entries, quality }
}

function buildQualityReport(
  totalRows: number,
  entries: JournalEntry[],
  c: {
    missingDate: number; invalidDate: number; missingDebit: number; missingCredit: number
    invalidAmount: number; zeroAmount: number; negativeAmount: number; invalidAccounts: number; missingDoc: number
  },
  duplicateExactRows: number,
): DataQualityReport {
  const validPostingDate = totalRows - (c.missingDate + c.invalidDate)
  const validDebitAccount = totalRows - c.missingDebit - countFormatIssues(entries, 'debit')
  const validCreditAccount = totalRows - c.missingCredit - countFormatIssues(entries, 'credit')
  const validAmount = totalRows - c.invalidAmount

  const pct = (n: number) => (totalRows === 0 ? 100 : (n / totalRows) * 100)
  const score =
    (pct(validPostingDate) * 0.25 +
      pct(validDebitAccount) * 0.2 +
      pct(validCreditAccount) * 0.2 +
      pct(validAmount) * 0.25 +
      (totalRows === 0 ? 100 : Math.max(0, 100 - (duplicateExactRows / totalRows) * 100)) * 0.1)

  const warnings: string[] = []
  if (c.missingDoc > 0) warnings.push(`${c.missingDoc} dòng thiếu số chứng từ`)
  if (c.invalidDate > 0) warnings.push(`${c.invalidDate} dòng ngày không hợp lệ`)
  if (c.missingDebit + c.missingCredit > 0) warnings.push(`${c.missingDebit + c.missingCredit} dòng thiếu tài khoản Nợ/Có`)
  if (c.negativeAmount > 0) warnings.push(`${c.negativeAmount} dòng số tiền âm`)
  if (duplicateExactRows > 0) warnings.push(`${duplicateExactRows} dòng trùng lặp hoàn toàn`)

  return {
    totalRows,
    validPostingDate,
    validDebitAccount,
    validCreditAccount,
    validAmount,
    missingDocumentNumber: c.missingDoc,
    duplicateExactRows,
    negativeAmounts: c.negativeAmount,
    invalidAccounts: c.invalidAccounts,
    score: Math.round(score * 10) / 10,
    reliable: score >= 80,
    warnings,
  }
}

function countFormatIssues(entries: JournalEntry[], side: 'debit' | 'credit'): number {
  const code: RowIssueCode = 'INVALID_ACCOUNT_FORMAT'
  let n = 0
  for (const e of entries) if (e.issues.includes(code) && (side === 'debit' ? e.debitAccount !== '' : e.creditAccount !== '')) n++
  return n
}
