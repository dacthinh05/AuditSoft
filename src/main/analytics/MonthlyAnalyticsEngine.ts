import { addMoney, type Money } from '../../domain/money'
import { MONEY_ZERO } from '../../domain/money'
import type { JournalEntry, MonthlyBucket } from '../../shared/types/analytics'
import { isAccount } from '../accounting/AccountClassifier'

export const ACCOUNT_GROUPS: Record<string, string[]> = {
  REVENUE: ['511'],
  COGS: ['632'],
  SELLING: ['641'],
  ADMIN: ['642'],
  FIN_COST: ['635'],
  OTHER_EXPENSE: ['811'],
  CASH: ['111', '112'],
  RECEIVABLE: ['131'],
  PAYABLE: ['331'],
  INVENTORY: ['151', '152', '153', '154', '155', '156', '157'],
  VAT_IN: ['133'],
  VAT_OUT: ['3331'],
}

export interface MonthlyGroupStats {
  group: string
  buckets: MonthlyBucket[]
  /** share của tháng lớn nhất trên tổng năm (chỉ tính tháng có phát sinh) */
  maxMonthShare: number | null
  maxMonth: number | null
  totalAmount: Money
  count: number
}

/** Bucket Nợ/Có theo tháng cho từng nhóm TK chuẩn — thay sheet TK của Excel. */
export function computeMonthlyByGroup(entries: readonly JournalEntry[]): Map<string, MonthlyGroupStats> {
  const result = new Map<string, MonthlyGroupStats>()
  for (const [group, prefixes] of Object.entries(ACCOUNT_GROUPS)) {
    const debitBuckets = new Array<Money>(13).fill(MONEY_ZERO)
    const creditBuckets = new Array<Money>(13).fill(MONEY_ZERO)
    const counts = new Array<number>(13).fill(0)
    let total = MONEY_ZERO
    let count = 0
    for (const e of entries) {
      const isDebit = prefixes.some((p) => isAccount(e.debitAccount, p))
      const isCredit = prefixes.some((p) => isAccount(e.creditAccount, p))
      if (!isDebit && !isCredit) continue
      const m = e.month
      if (m == null || m < 1 || m > 12) continue
      // nhóm nội bộ (111↔112) chỉ đếm một lần
      let counted = false
      if (isDebit) {
        debitBuckets[m] = addMoney(debitBuckets[m]!, e.amount)
        counts[m] = (counts[m] ?? 0) + 1
        counted = true
      }
      if (isCredit && !isDebit) {
        creditBuckets[m] = addMoney(creditBuckets[m]!, e.amount)
        counts[m] = (counts[m] ?? 0) + 1
        counted = true
      }
      if (counted) {
        total = addMoney(total, e.amount)
        count++
      }
    }
    const buckets: MonthlyBucket[] = []
    for (let m = 1; m <= 12; m++) {
      buckets.push({ month: m, debit: debitBuckets[m]!, credit: creditBuckets[m]!, count: counts[m]! })
    }
    // share tính theo tổng |phát sinh| nhóm
    let maxAmt = MONEY_ZERO
    let maxMonth: number | null = null
    let sumAbs = MONEY_ZERO
    for (const b of buckets) {
      const amt = addMoney(b.debit, b.credit)
      sumAbs = addMoney(sumAbs, amt)
      if (amt.raw > maxAmt.raw) {
        maxAmt = amt
        maxMonth = b.month
      }
    }
    const share = sumAbs.raw === 0n ? null : Number((maxAmt.raw * 10000n) / sumAbs.raw) / 100
    result.set(group, { group, buckets, maxMonthShare: share == null ? null : share / 100, maxMonth, totalAmount: total, count })
  }
  return result
}

/** Tháng đột biến: > mean(các tháng có phát sinh T1–T11) + 2σ và amount ≥ minAmount. */
export function detectMonthSpikes(stats: MonthlyGroupStats, minAmount: Money): number[] {
  const base = stats.buckets.slice(0, 11).map((b) => Number(addMoney(b.debit, b.credit).raw)).filter((v) => v > 0)
  if (base.length === 0) return []
  const mean = base.reduce((s, v) => s + v, 0) / base.length
  const variance = base.reduce((s, v) => s + (v - mean) ** 2, 0) / base.length
  const sigma = Math.sqrt(variance)
  const spikes: number[] = []
  for (let m = 1; m <= 12; m++) {
    const amt = Number(addMoney(stats.buckets[m - 1]!.debit, stats.buckets[m - 1]!.credit).raw)
    if (amt <= 0) continue
    if (amt >= Number(minAmount.raw) && amt > mean + 2 * sigma) spikes.push(m)
  }
  return spikes
}
