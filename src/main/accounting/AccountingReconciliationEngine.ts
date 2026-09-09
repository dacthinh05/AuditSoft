import { absMoney, addMoney, cmpMoney, MONEY_ZERO, subtractMoney, type Money } from '../../domain/money'
import type { JournalEntry, ReconStatus, ReconciliationResult, ReconciliationRow, TrialBalanceRow } from '../../shared/types/analytics'
import { displayName } from './AccountClassifier'

export interface GlAccountAggregate {
  account: string
  debitTurnover: Money
  creditTurnover: Money
  count: number
}

/** Tổng PS Nợ/Có theo MATK nguyên bản từ NKC (Map-based — §42). */
export function aggregateGlByAccount(entries: readonly JournalEntry[]): Map<string, GlAccountAggregate> {
  const map = new Map<string, GlAccountAggregate>()
  const touch = (acc: string): GlAccountAggregate => {
    let a = map.get(acc)
    if (!a) {
      a = { account: acc, debitTurnover: MONEY_ZERO, creditTurnover: MONEY_ZERO, count: 0 }
      map.set(acc, a)
    }
    return a
  }
  for (const e of entries) {
    if (e.debitAccount) touch(e.debitAccount).debitTurnover = addMoney(touch(e.debitAccount).debitTurnover, e.amount)
    if (e.creditAccount) touch(e.creditAccount).creditTurnover = addMoney(touch(e.creditAccount).creditTurnover, e.amount)
    if (e.debitAccount || e.creditAccount) {
      if (e.debitAccount) touch(e.debitAccount).count++
      if (e.creditAccount && e.creditAccount !== e.debitAccount) touch(e.creditAccount).count++
    }
  }
  return map
}

export interface ReconcileOptions {
  /** dung sai tuyệt đối cho mỗi cột (mặc định 0,5 VND — bỏ qua nhiễu làm tròn thập phân) */
  tolerance?: Money
}

const DEFAULT_TOLERANCE: Money = { raw: 50n, scale: 2 }

/**
 * §8 — Đối chiếu NKC ↔ CĐSPS. KHÔNG mặc định bên nào đúng:
 * chỉ kết luận "Không khớp giữa NKC và CĐSPS" và trả về khác biệt để drill-down.
 */
export function reconcileGlWithTrialBalance(
  entries: readonly JournalEntry[],
  trialBalance: readonly TrialBalanceRow[],
  options: ReconcileOptions = {},
): ReconciliationResult {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE
  const gl = aggregateGlByAccount(entries)

  const rows: ReconciliationRow[] = []
  const unmatchedGlAccounts: string[] = []
  const matchedTb = new Set<string>()

  // 1) Theo từng dòng CĐSPS
  for (const tb of trialBalance) {
    matchedTb.add(tb.account)
    const g = gl.get(tb.account)
    const glDebit = g?.debitTurnover ?? MONEY_ZERO
    const glCredit = g?.creditTurnover ?? MONEY_ZERO
    const diffDebit = subtractMoney(glDebit, tb.movementDebit)
    const diffCredit = subtractMoney(glCredit, tb.movementCredit)
    const hasDiff = beyond(diffDebit, tolerance) || beyond(diffCredit, tolerance)
    let status: ReconStatus = 'PASS'
    let note = ''
    if (!g) {
      status = tb.movementDebit.raw === 0n && tb.movementCredit.raw === 0n ? 'PASS' : 'ERROR'
      note = 'TK có trên CĐSPS nhưng không phát sinh trong NKC'
    } else if (hasDiff) {
      status = 'WARNING'
      note = 'Không khớp giữa NKC và CĐSPS (phát sinh)'
    }
    rows.push({
      account: tb.account,
      accountName: tb.accountName || displayName(tb.account),
      glDebit,
      glCredit,
      tbDebit: tb.movementDebit,
      tbCredit: tb.movementCredit,
      diffDebit,
      diffCredit,
      status,
      note,
    })
  }

  // 2) TK có trên GL nhưng không có trong CĐSPS
  for (const [account, agg] of gl) {
    if (matchedTb.has(account)) continue
    unmatchedGlAccounts.push(account)
    const zeroMovement = agg.debitTurnover.raw === 0n && agg.creditTurnover.raw === 0n
    if (!zeroMovement) {
      rows.push({
        account,
        accountName: displayName(account),
        glDebit: agg.debitTurnover,
        glCredit: agg.creditTurnover,
        tbDebit: MONEY_ZERO,
        tbCredit: MONEY_ZERO,
        diffDebit: agg.debitTurnover,
        diffCredit: agg.creditTurnover,
        status: 'WARNING',
        note: 'TK có phát sinh trên NKC nhưng không có trên CĐSPS',
      })
    }
  }

  rows.sort((a, b) => a.account.localeCompare(b.account))

  // 3) Kiểm tra tổng Nợ = Có của chính NKC — mỗi bút toán góp vào vế theo TK hiện diện
  let totalDebit = MONEY_ZERO
  let totalCredit = MONEY_ZERO
  for (const e of entries) {
    if (e.debitAccount !== '') totalDebit = addMoney(totalDebit, e.amount)
    if (e.creditAccount !== '') totalCredit = addMoney(totalCredit, e.amount)
  }
  const balanced = subtractMoney(totalDebit, totalCredit).raw === 0n

  const anyError = rows.some((r) => r.status === 'ERROR')
  const anyWarning = rows.some((r) => r.status === 'WARNING')
  const status: ReconStatus = !balanced || anyError ? 'ERROR' : anyWarning ? 'WARNING' : 'PASS'

  return { rows, unmatchedGlAccounts, totalGlDebit: totalDebit, totalGlCredit: totalCredit, balanced, status }
}

function beyond(diff: Money, tolerance: Money): boolean {
  return cmpMoney(absMoney(diff), tolerance) > 0
}

/** Kiểm tra công thức DK + PS = CK theo nature tài khoản trên CĐSPS (§9). */
export function checkTrialBalanceEquation(trialBalance: readonly TrialBalanceRow[]): { account: string; issue: string }[] {
  const issues: { account: string; issue: string }[] = []
  for (const r of trialBalance) {
    // Net cuối = net đầu + net PS (dạng hai cột Nợ/Có — không phụ thuộc nature)
    const openingNet = subtractMoney(r.openingDebit, r.openingCredit)
    const movementNet = subtractMoney(r.movementDebit, r.movementCredit)
    const closingNetCalc = subtractMoney(r.closingDebit, r.closingCredit)
    const expected = addMoney(openingNet, movementNet)
    const eqDiff = subtractMoney(expected, closingNetCalc)
    // cho phép nhiễu làm tròn < 0,01 từ số thực nguồn
    if (cmpMoney(absMoney(eqDiff), { raw: 1n, scale: 2 }) > 0) {
      issues.push({
        account: r.account,
        issue: `DK(${openingNet.raw}) + PS(${movementNet.raw}) ≠ CK(${closingNetCalc.raw})`,
      })
    }
    if (r.closingDebit.raw > 0n && r.closingCredit.raw > 0n) {
      issues.push({ account: r.account, issue: 'Cả Nợ và Có cuối kỳ cùng > 0' })
    }
  }
  return issues
}
