import { getWorkingPaperRef } from './RefDictionary'
import type { NkcTransaction } from './types'

export interface CounterpartStatItem {
  ref: string
  account: string // mã 3 số (vd: 111, 112, 131...)
  amount: number
  percent?: number
}

export interface AccountCounterpartResult {
  debitItems: CounterpartStatItem[] // TK đối ứng bên Có (khi TK chính ghi Nợ)
  creditItems: CounterpartStatItem[] // TK đối ứng bên Nợ (khi TK chính ghi Có)
  totalDebitAmount: number
  totalCreditAmount: number
}

/**
 * Trích xuất và gom nhóm phát sinh đối ứng theo mã tài khoản 3 số cho một tài khoản đích
 * @param transactions Danh sách nghiệp vụ NKC
 * @param targetPrefix Tiền tố tài khoản đích (vd: '511', '521', '515', '711', '331'...)
 * @param isPeriod1 Chỉ lọc tháng 1 -> 6 (Đợt 1). Mặc định false (cả năm).
 */
export function extractCounterpartStats(
  transactions: readonly NkcTransaction[],
  targetPrefix: string,
  isPeriod1 = false,
): AccountCounterpartResult {
  const debitMap = new Map<string, number>()
  const creditMap = new Map<string, number>()
  let totalDebitAmount = 0
  let totalCreditAmount = 0

  for (const t of transactions) {
    if (isPeriod1 && (t.month < 1 || t.month > 6)) {
      continue
    }

    // 1. Khi TK đích ghi NỢ -> đối ứng là TK bên CÓ
    if (t.debit.startsWith(targetPrefix)) {
      const counterpartAcc = t.credit.slice(0, 3) || t.credit
      debitMap.set(counterpartAcc, (debitMap.get(counterpartAcc) || 0) + t.amount)
      totalDebitAmount += t.amount
    }

    // 2. Khi TK đích ghi CÓ -> đối ứng là TK bên NỢ
    if (t.credit.startsWith(targetPrefix)) {
      const counterpartAcc = t.debit.slice(0, 3) || t.debit
      creditMap.set(counterpartAcc, (creditMap.get(counterpartAcc) || 0) + t.amount)
      totalCreditAmount += t.amount
    }
  }

  const buildItems = (map: Map<string, number>, total: number): CounterpartStatItem[] => {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1]) // Sắp xếp giảm dần theo số tiền
      .map(([acc, amt]) => ({
        account: acc,
        amount: amt,
        ref: getWorkingPaperRef(acc),
        percent: total > 0 ? amt / total : 0,
      }))
  }

  return {
    debitItems: buildItems(debitMap, totalDebitAmount),
    creditItems: buildItems(creditMap, totalCreditAmount),
    totalDebitAmount,
    totalCreditAmount,
  }
}

export interface MonthlyExpenseMatrixRow {
  month: number // 1 -> 12
  tk627: number
  tk641: number
  tk642: number
  total: number
}

export interface ExpenseMatrix12MResult {
  monthly: MonthlyExpenseMatrixRow[]
  totalYear: {
    tk627: number
    tk641: number
    tk642: number
    total: number
  }
}

/**
 * Bóc tách ma trận chi phí 12 tháng (Tháng 1 đến 12) phân bổ vào 627, 641, 642
 * @param transactions Danh sách nghiệp vụ NKC
 * @param creditPrefix Tiền tố TK ghi Có (ví dụ: '242' hoặc '214')
 */
export function extract12MonthExpenseMatrix(
  transactions: readonly NkcTransaction[],
  creditPrefix: '242' | '214' | string,
): ExpenseMatrix12MResult {
  const monthly: MonthlyExpenseMatrixRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    tk627: 0,
    tk641: 0,
    tk642: 0,
    total: 0,
  }))

  for (const t of transactions) {
    if (t.amount <= 0) continue
    if (t.credit.startsWith(creditPrefix)) {
      const m = t.month >= 1 && t.month <= 12 ? t.month : 1
      const row = monthly[m - 1]
      if (!row) continue

      if (t.debit.startsWith('627')) {
        row.tk627 += t.amount
      } else if (t.debit.startsWith('641')) {
        row.tk641 += t.amount
      } else if (t.debit.startsWith('642')) {
        row.tk642 += t.amount
      }
    }
  }

  let sum627 = 0
  let sum641 = 0
  let sum642 = 0
  let sumAll = 0
  for (const r of monthly) {
    r.total = r.tk627 + r.tk641 + r.tk642
    sum627 += r.tk627
    sum641 += r.tk641
    sum642 += r.tk642
    sumAll += r.total
  }

  return {
    monthly,
    totalYear: {
      tk627: sum627,
      tk641: sum641,
      tk642: sum642,
      total: sumAll,
    },
  }
}
