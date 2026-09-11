import { moneyToNumber } from '../money'
import type { JournalEntry } from '../../shared/types/analytics'
import type { NkcTransaction } from '../workingpaper/types'
import type { ExpenseDetailReport } from './types'

/** Dòng phát sinh chuẩn hóa tối thiểu cho phân tích chi tiết chi phí */
export interface ExpenseDetailRow {
  /** Tài khoản Nợ (lấy 4 số đầu) */
  account: string
  month: number
  amount: number
}

function pad4(account: string): string {
  return account.slice(0, 4)
}

/**
 * Lõi thuần: gom phát sinh theo TK 4 số × 12 tháng cho một prefix (641/642).
 * ratios[m] = null khi doanh thu tháng = 0 (hiện '-' thay vì #DIV/0!).
 */
export function buildDetail(
  rows: ExpenseDetailRow[],
  prefix: '641' | '642',
  revenueByMonth: number[],
): ExpenseDetailReport {
  const accountSet = new Set<string>()
  for (const r of rows) {
    if (r.account.startsWith(prefix) && r.month >= 1 && r.month <= 12 && r.amount !== 0) {
      accountSet.add(pad4(r.account))
    }
  }
  const accounts = [...accountSet].sort()

  const months: number[][] = accounts.map(() => Array.from({ length: 12 }, () => 0))
  rows.forEach((r) => {
    if (!r.account.startsWith(prefix) || r.month < 1 || r.month > 12) return
    const idx = accounts.indexOf(pad4(r.account))
    if (idx < 0) return
    const row = months[idx]
    if (row) row[r.month - 1] = (row[r.month - 1] ?? 0) + r.amount
  })

  const totals = months.map((m) => m.reduce((s, v) => s + v, 0))
  const revenue = Array.from({ length: 12 }, (_, i) => revenueByMonth[i] ?? 0)
  const ratios = revenue.map((rev, i) => {
    const total = months.reduce((s, m) => s + (m[i] ?? 0), 0)
    if (rev <= 0) return null
    return Number(((total / rev) * 100).toFixed(1))
  })

  return { prefix, accounts, months, totals, revenue, ratios }
}

function revenue12FromJournal(entries: JournalEntry[]): number[] {
  const revenue = Array.from({ length: 12 }, () => 0)
  for (const e of entries) {
    if (!e.creditAccount.startsWith('511') || !e.month || e.month < 1 || e.month > 12) continue
    revenue[e.month - 1] = (revenue[e.month - 1] ?? 0) + moneyToNumber(e.amount)
  }
  return revenue
}

/** Adapter cho JournalEntry (Money) — dùng cho UI analytics */
export function analyzeJournal(entries: JournalEntry[]): { sell: ExpenseDetailReport; admin: ExpenseDetailReport } {
  const rows: ExpenseDetailRow[] = []
  for (const e of entries) {
    if (!e.debitAccount.startsWith('641') && !e.debitAccount.startsWith('642')) continue
    if (!e.month || e.month < 1 || e.month > 12) continue
    rows.push({ account: e.debitAccount, month: e.month, amount: moneyToNumber(e.amount) })
  }
  const revenue = revenue12FromJournal(entries)
  return {
    sell: buildDetail(rows, '641', revenue),
    admin: buildDetail(rows, '642', revenue),
  }
}

/** Adapter cho NkcTransaction (number) — dùng cho Excel filler */
export function analyzeTransactions(txns: NkcTransaction[]): { sell: ExpenseDetailReport; admin: ExpenseDetailReport } {
  const rows: ExpenseDetailRow[] = []
  const revenue = Array.from({ length: 12 }, () => 0)
  for (const t of txns) {
    if (t.credit.startsWith('511') && t.month >= 1 && t.month <= 12) {
      revenue[t.month - 1] = (revenue[t.month - 1] ?? 0) + t.amount
    }
    if (!t.debit.startsWith('641') && !t.debit.startsWith('642')) continue
    if (t.month < 1 || t.month > 12) continue
    rows.push({ account: t.debit, month: t.month, amount: t.amount })
  }
  return {
    sell: buildDetail(rows, '641', revenue),
    admin: buildDetail(rows, '642', revenue),
  }
}
