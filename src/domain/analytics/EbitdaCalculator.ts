import type { Money } from '../money'
import {
  addMoney,
  cmpMoney,
  isZeroMoney,
  makeMoney,
  MONEY_ZERO,
  moneyToNumber,
  subtractMoney,
  sumMoney,
} from '../money'
import type { IncomeStatementData, JournalEntry } from '../../shared/types/analytics'
import type { EbitdaResult } from './types'

export class EbitdaCalculator {
  private static INTEREST_EXPENSE_REGEX = /lãi\s+vay|tiền\s+vay|lai\s+vay|interest|vay\s+ngân\s+hàng|chi\s+phí\s+lãi/i
  private static INTEREST_INCOME_REGEX = /lãi\s+(tiền\s+gửi|cho\s+vay|tài\s+khoản|tiết\s+kiệm)|lai\s+(tien\s+gui|cho\s+vay)/i

  public static calculate(
    entries: JournalEntry[],
    incomeStatement: IncomeStatementData | null,
  ): EbitdaResult {
    const interestExpenseEntries: Money[] = []
    const interestIncomeEntries: Money[] = []
    const depreciationEntries: Money[] = []

    for (const e of entries) {
      // 1. Chi phí lãi vay: Nợ 635
      if (e.debitAccount.startsWith('635')) {
        const descMatch = this.INTEREST_EXPENSE_REGEX.test(e.description)
        const creditPair =
          e.creditAccount.startsWith('111') ||
          e.creditAccount.startsWith('112') ||
          e.creditAccount.startsWith('338') ||
          e.creditAccount.startsWith('341')

        // Nếu có dấu hiệu lãi vay hoặc đối ứng thanh toán/công nợ vay
        if (descMatch || creditPair || e.debitAccount.startsWith('6351')) {
          interestExpenseEntries.push(e.amount)
        }
      }

      // 2. Doanh thu lãi tiền gửi / cho vay: Có 515
      if (e.creditAccount.startsWith('515')) {
        const descMatch = this.INTEREST_INCOME_REGEX.test(e.description)
        const debitPair =
          e.debitAccount.startsWith('112') ||
          e.debitAccount.startsWith('128') ||
          e.debitAccount.startsWith('138')

        if (descMatch || debitPair || e.creditAccount.startsWith('5151')) {
          interestIncomeEntries.push(e.amount)
        }
      }

      // 3. Khấu hao TSCĐ: Có 214
      if (e.creditAccount.startsWith('214')) {
        depreciationEntries.push(e.amount)
      }
    }
    const interestExpense = sumMoney(interestExpenseEntries)
    const interestIncome = sumMoney(interestIncomeEntries)
    const depreciation = sumMoney(depreciationEntries)

    return this.computeFromTotals(interestExpense, interestIncome, depreciation, incomeStatement, entries)
  }

  public static computeFromTotals(
    interestExpense: Money,
    interestIncome: Money,
    depreciation: Money,
    incomeStatement: IncomeStatementData | null,
    entries?: JournalEntry[]
  ): EbitdaResult {
    // Lãi vay thuần = max(0, Lãi vay phát sinh - Lãi tiền gửi/cho vay)
    const rawNet = subtractMoney(interestExpense, interestIncome)
    const netInterest = cmpMoney(rawNet, MONEY_ZERO) > 0 ? rawNet : MONEY_ZERO
    // 4. Lợi nhuận thuần từ HĐKD (Mã 30)
    let operatingProfit = MONEY_ZERO
    let foundLine30 = false

    if (incomeStatement && incomeStatement.lines && incomeStatement.lines.length > 0) {
      const line30 = incomeStatement.lines.find((l) => l.maSo === '30' || l.maSo === '30.0')
      if (line30 && line30.current) {
        operatingProfit = line30.current
        foundLine30 = true
      }
    }

    // Fallback nếu không nạp KQKD hoặc không có mã 30
    if (!foundLine30) {
      let rev = MONEY_ZERO
      let cogs = MONEY_ZERO
      let sell = MONEY_ZERO
      let adm = MONEY_ZERO
      let fInc = MONEY_ZERO
      let fExp = MONEY_ZERO

      for (const e of entries || []) {
        if (e.creditAccount.startsWith('511')) rev = addMoney(rev, e.amount)
        if (e.debitAccount.startsWith('632')) cogs = addMoney(cogs, e.amount)
        if (e.debitAccount.startsWith('641')) sell = addMoney(sell, e.amount)
        if (e.debitAccount.startsWith('642')) adm = addMoney(adm, e.amount)
        if (e.creditAccount.startsWith('515')) fInc = addMoney(fInc, e.amount)
        if (e.debitAccount.startsWith('635')) fExp = addMoney(fExp, e.amount)
      }

      // Mã 30 = 511 - 632 - 641 - 642 + 515 - 635
      operatingProfit = subtractMoney(
        addMoney(subtractMoney(subtractMoney(subtractMoney(rev, cogs), sell), adm), fInc),
        fExp,
      )
    }

    // 5. EBITDA = Lợi nhuận thuần HĐKD + Chi phí lãi vay thuần + Khấu hao TSCĐ
    const ebitda = addMoney(addMoney(operatingProfit, netInterest), depreciation)

    // 6. Mức khống chế 30% EBITDA theo Nghị định 132/2020/NĐ-CP
    let cap30 = MONEY_ZERO
    let disallowedInterest = MONEY_ZERO
    let isOverCap = false
    let interestToEbitdaRatio: number | null = null
    let note = ''

    if (cmpMoney(ebitda, MONEY_ZERO) > 0) {
      // cap30 = ebitda * 30 / 100
      const capRaw = (ebitda.raw * 30n) / 100n
      cap30 = makeMoney(capRaw, ebitda.scale)

      const ebitdaNum = moneyToNumber(ebitda)
      const netInterestNum = moneyToNumber(netInterest)
      interestToEbitdaRatio = ebitdaNum > 0 ? (netInterestNum / ebitdaNum) * 100 : 0

      if (cmpMoney(netInterest, cap30) > 0) {
        disallowedInterest = subtractMoney(netInterest, cap30)
        isOverCap = true
        note = `Chi phí lãi vay thuần vượt trần 30% EBITDA. Khuyến nghị điều chỉnh tăng lợi nhuận tính thuế tại Chỉ tiêu [B4] trên Tờ khai Quyết toán TNDN (Mẫu 03/TNDN).`
      } else {
        note = `Chi phí lãi vay thuần nằm trong hạn mức 30% EBITDA quy định tại Nghị định 132/2020/NĐ-CP.`
      }
    } else {
      // Nếu EBITDA <= 0: Toàn bộ lãi vay thuần không được trừ theo NĐ 132
      cap30 = MONEY_ZERO
      disallowedInterest = netInterest
      isOverCap = !isZeroMoney(netInterest)
      interestToEbitdaRatio = null
      note = `EBITDA âm hoặc bằng 0. Theo Nghị định 132/2020/NĐ-CP, toàn bộ chi phí lãi vay thuần phát sinh trong kỳ không được trừ khi xác định thuế TNDN và được chuyển sang kỳ sau không quá 5 năm.`
    }

    return {
      interestExpense,
      interestIncome,
      netInterest,
      depreciation,
      operatingProfit,
      ebitda,
      cap30,
      disallowedInterest,
      interestToEbitdaRatio,
      isOverCap,
      note,
    }
  }
}
