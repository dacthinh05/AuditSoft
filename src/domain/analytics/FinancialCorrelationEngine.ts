import type { Money } from '../money'
import {
  addMoney,
  cmpMoney,
  makeMoney,
  MONEY_ZERO,
  moneyToNumber,
  subtractMoney,
  sumMoney,
} from '../money'
import type { IncomeStatementData, JournalEntry } from '../../shared/types/analytics'
import type {
  CogsStructureMonth,
  CogsStructureReport,
  CorrelationAnalysisResult,
  GrossMarginPoint,
  GrossMarginReport,
  OpexRatioPoint,
  OpexRatioReport,
  WaterfallStep,
} from './types'

export class FinancialCorrelationEngine {
  /**
   * 1. Tính toán Tương quan Doanh thu — Giá vốn & Biên Lãi Gộp 12 Tháng
   */
  public static computeGrossMargin(entries: JournalEntry[]): GrossMarginReport {
    const revByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const cogsByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)

    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      const mIdx = e.month - 1
      if (e.creditAccount.startsWith('511')) {
        revByMonth[mIdx] = addMoney(revByMonth[mIdx]!, e.amount)
      }
      if (e.debitAccount.startsWith('632')) {
        cogsByMonth[mIdx] = addMoney(cogsByMonth[mIdx]!, e.amount)
      }
    }

    const totalRevenue = sumMoney(revByMonth)
    const totalCogs = sumMoney(cogsByMonth)
    const totalGrossProfit = subtractMoney(totalRevenue, totalCogs)

    const totalRevNum = moneyToNumber(totalRevenue)
    const totalGpNum = moneyToNumber(totalGrossProfit)
    const annualGrossMarginPct =
      totalRevNum > 0 ? Number(((totalGpNum / totalRevNum) * 100).toFixed(2)) : 0

    const points: GrossMarginPoint[] = []
    const anomalousMonths: number[] = []

    for (let m = 0; m < 12; m++) {
      const rev = revByMonth[m]!
      const cogs = cogsByMonth[m]!
      const grossProfit = subtractMoney(rev, cogs)

      const revNum = moneyToNumber(rev)
      const gpNum = moneyToNumber(grossProfit)
      const grossMarginPct =
        revNum > 0 ? Number(((gpNum / revNum) * 100).toFixed(2)) : 0
      const isNegative = cmpMoney(grossProfit, MONEY_ZERO) < 0

      // Điểm bất thường: Biên âm hoặc lệch quá +-12% so với baseline cả năm
      const isAnomaly =
        revNum > 0 &&
        (isNegative || Math.abs(grossMarginPct - annualGrossMarginPct) > 12)

      if (isAnomaly) {
        anomalousMonths.push(m + 1)
      }

      points.push({
        month: m + 1,
        revenue: rev,
        cogs,
        grossProfit,
        grossMarginPct,
        isNegative,
        isAnomaly,
      })
    }

    let auditWarning: string | null = null
    if (points.some((p) => p.isNegative)) {
      auditWarning =
        'Phát hiện tháng có biên lợi nhuận gộp âm (kinh doanh dưới giá vốn). Cần rà soát chính sách giá bán hoặc hạch toán thiếu doanh thu.'
    } else if (anomalousMonths.length > 0) {
      auditWarning = `Biên lãi gộp biến động mạnh tại Tháng ${anomalousMonths.join(', ')} (lệch > 12% so với mức trung bình ${annualGrossMarginPct}%). Kiểm tra tính đúng kỳ giữa doanh thu và giá vốn.`
    }

    return {
      points,
      annualGrossMarginPct,
      totalRevenue,
      totalCogs,
      totalGrossProfit,
      anomalousMonths,
      auditWarning,
    }
  }

  /**
   * 2. Bóc tách Cơ cấu Chi phí Giá vốn (621, 622, 627, 154/156) 12 Tháng
   */
  public static computeCogsStructure(entries: JournalEntry[]): CogsStructureReport {
    const matByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const labByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const ovhByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const wipByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)

    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      const mIdx = e.month - 1

      if (e.debitAccount.startsWith('621')) {
        matByMonth[mIdx] = addMoney(matByMonth[mIdx]!, e.amount)
      } else if (e.debitAccount.startsWith('622')) {
        labByMonth[mIdx] = addMoney(labByMonth[mIdx]!, e.amount)
      } else if (e.debitAccount.startsWith('627')) {
        ovhByMonth[mIdx] = addMoney(ovhByMonth[mIdx]!, e.amount)
      } else if (
        e.debitAccount.startsWith('154') ||
        (e.debitAccount.startsWith('632') && e.creditAccount.startsWith('156'))
      ) {
        wipByMonth[mIdx] = addMoney(wipByMonth[mIdx]!, e.amount)
      } else if (e.debitAccount.startsWith('632')) {
        wipByMonth[mIdx] = addMoney(wipByMonth[mIdx]!, e.amount)
      }
    }

    const months: CogsStructureMonth[] = []
    let totalMat = MONEY_ZERO
    let totalLab = MONEY_ZERO
    let totalOvh = MONEY_ZERO
    let totalWip = MONEY_ZERO

    for (let m = 0; m < 12; m++) {
      const mat = matByMonth[m]!
      const lab = labByMonth[m]!
      const ovh = ovhByMonth[m]!
      const wip = wipByMonth[m]!

      totalMat = addMoney(totalMat, mat)
      totalLab = addMoney(totalLab, lab)
      totalOvh = addMoney(totalOvh, ovh)
      totalWip = addMoney(totalWip, wip)

      const sumCost = addMoney(addMoney(addMoney(mat, lab), ovh), wip)
      const sumNum = moneyToNumber(sumCost)

      const matPct = sumNum > 0 ? Number(((moneyToNumber(mat) / sumNum) * 100).toFixed(1)) : 0
      const labPct = sumNum > 0 ? Number(((moneyToNumber(lab) / sumNum) * 100).toFixed(1)) : 0
      const ovhPct = sumNum > 0 ? Number(((moneyToNumber(ovh) / sumNum) * 100).toFixed(1)) : 0
      const wipPct = sumNum > 0 ? Number(((moneyToNumber(wip) / sumNum) * 100).toFixed(1)) : 0

      months.push({
        month: m + 1,
        directMaterials: mat,
        directLabor: lab,
        overhead: ovh,
        wipOrTrade: wip,
        totalCosts: sumCost,
        materialPct: matPct,
        laborPct: labPct,
        overheadPct: ovhPct,
        wipOrTradePct: wipPct,
      })
    }

    const annualTotalCost = addMoney(addMoney(addMoney(totalMat, totalLab), totalOvh), totalWip)
    const annualTotalNum = moneyToNumber(annualTotalCost)

    return {
      months,
      annualTotals: {
        directMaterials: totalMat,
        directLabor: totalLab,
        overhead: totalOvh,
        wipOrTrade: totalWip,
        totalCosts: annualTotalCost,
      },
      annualPcts: {
        materialPct:
          annualTotalNum > 0
            ? Number(((moneyToNumber(totalMat) / annualTotalNum) * 100).toFixed(1))
            : 0,
        laborPct:
          annualTotalNum > 0
            ? Number(((moneyToNumber(totalLab) / annualTotalNum) * 100).toFixed(1))
            : 0,
        overheadPct:
          annualTotalNum > 0
            ? Number(((moneyToNumber(totalOvh) / annualTotalNum) * 100).toFixed(1))
            : 0,
        wipOrTradePct:
          annualTotalNum > 0
            ? Number(((moneyToNumber(totalWip) / annualTotalNum) * 100).toFixed(1))
            : 0,
      },
    }
  }

  /**
   * 3. Tính toán Tỷ lệ Chi phí Hoạt động trên Doanh thu (OPEX Ratio 12M)
   */
  public static computeOpexRatios(entries: JournalEntry[]): OpexRatioReport {
    const revByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const sellByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const admByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)

    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      const mIdx = e.month - 1
      if (e.creditAccount.startsWith('511')) {
        revByMonth[mIdx] = addMoney(revByMonth[mIdx]!, e.amount)
      }
      if (e.debitAccount.startsWith('641')) {
        sellByMonth[mIdx] = addMoney(sellByMonth[mIdx]!, e.amount)
      }
      if (e.debitAccount.startsWith('642')) {
        admByMonth[mIdx] = addMoney(admByMonth[mIdx]!, e.amount)
      }
    }

    const points: OpexRatioPoint[] = []
    let totalSelling = MONEY_ZERO
    let totalAdmin = MONEY_ZERO
    let totalRev = MONEY_ZERO

    for (let m = 0; m < 12; m++) {
      const rev = revByMonth[m]!
      const sell = sellByMonth[m]!
      const adm = admByMonth[m]!
      const totalOpex = addMoney(sell, adm)

      totalRev = addMoney(totalRev, rev)
      totalSelling = addMoney(totalSelling, sell)
      totalAdmin = addMoney(totalAdmin, adm)

      const revNum = moneyToNumber(rev)
      const sellNum = moneyToNumber(sell)
      const admNum = moneyToNumber(adm)

      const sellingRatioPct =
        revNum > 0 ? Number(((sellNum / revNum) * 100).toFixed(2)) : 0
      const adminRatioPct =
        revNum > 0 ? Number(((admNum / revNum) * 100).toFixed(2)) : 0
      const totalOpexRatioPct = Number((sellingRatioPct + adminRatioPct).toFixed(2))

      points.push({
        month: m + 1,
        revenue: rev,
        sellingExpense: sell,
        adminExpense: adm,
        totalOpex,
        sellingRatioPct,
        adminRatioPct,
        totalOpexRatioPct,
      })
    }

    const annualRevNum = moneyToNumber(totalRev)
    const annualSellNum = moneyToNumber(totalSelling)
    const annualAdmNum = moneyToNumber(totalAdmin)

    const annualTotalOpex = addMoney(totalSelling, totalAdmin)

    return {
      points,
      annualTotals: {
        sellingExpense: totalSelling,
        adminExpense: totalAdmin,
        totalOpex: annualTotalOpex,
      },
      annualPcts: {
        sellingRatioPct:
          annualRevNum > 0 ? Number(((annualSellNum / annualRevNum) * 100).toFixed(2)) : 0,
        adminRatioPct:
          annualRevNum > 0 ? Number(((annualAdmNum / annualRevNum) * 100).toFixed(2)) : 0,
        totalOpexRatioPct:
          annualRevNum > 0
            ? Number((((annualSellNum + annualAdmNum) / annualRevNum) * 100).toFixed(2))
            : 0,
      },
    }
  }

  /**
   * 4. Xây dựng Dòng chảy Cầu nối Lợi nhuận (Profit Bridge Waterfall)
   */
  public static computeProfitWaterfall(
    entries: JournalEntry[],
    incomeStatement: IncomeStatementData | null,
  ): WaterfallStep[] {
    let rev = MONEY_ZERO
    let cogs = MONEY_ZERO
    let fInc = MONEY_ZERO
    let fExp = MONEY_ZERO
    let sell = MONEY_ZERO
    let adm = MONEY_ZERO
    let otherInc = MONEY_ZERO
    let otherExp = MONEY_ZERO

    for (const e of entries) {
      if (e.creditAccount.startsWith('511')) rev = addMoney(rev, e.amount)
      if (e.debitAccount.startsWith('632')) cogs = addMoney(cogs, e.amount)
      if (e.creditAccount.startsWith('515')) fInc = addMoney(fInc, e.amount)
      if (e.debitAccount.startsWith('635')) fExp = addMoney(fExp, e.amount)
      if (e.debitAccount.startsWith('641')) sell = addMoney(sell, e.amount)
      if (e.debitAccount.startsWith('642')) adm = addMoney(adm, e.amount)
      if (e.creditAccount.startsWith('711')) otherInc = addMoney(otherInc, e.amount)
      if (e.debitAccount.startsWith('811')) otherExp = addMoney(otherExp, e.amount)
    }

    // Nếu có KQKD chính thức từ B02, ưu tiên các con số B02
    if (incomeStatement && incomeStatement.lines && incomeStatement.lines.length > 0) {
      const getLine = (code: string) => {
        const found = incomeStatement.lines.find((l) => l.maSo === code)
        return found?.current || null
      }
      const l10 = getLine('10') // Doanh thu thuần
      const l11 = getLine('11') // Giá vốn
      const l21 = getLine('21') // Doanh thu tài chính
      const l22 = getLine('22') // Chi phí tài chính
      const l25 = getLine('25') // Chi phí bán hàng
      const l26 = getLine('26') // Chi phí QLDN
      const l31 = getLine('31') // Thu nhập khác
      const l32 = getLine('32') // Chi phí khác

      if (l10) rev = l10
      if (l11) cogs = l11
      if (l21) fInc = l21
      if (l22) fExp = l22
      if (l25) sell = l25
      if (l26) adm = l26
      if (l31) otherInc = l31
      if (l32) otherExp = l32
    }

    const grossProfit = subtractMoney(rev, cogs)
    const opProfit = subtractMoney(
      addMoney(subtractMoney(subtractMoney(grossProfit, sell), adm), fInc),
      fExp,
    )
    const netOther = subtractMoney(otherInc, otherExp)
    const pbt = addMoney(opProfit, netOther)

    const steps: WaterfallStep[] = [
      {
        key: 'REV_511',
        label: 'Doanh thu thuần (511)',
        amount: rev,
        type: 'start',
        cumulative: rev,
      },
      {
        key: 'COGS_632',
        label: 'Giá vốn hàng bán (632)',
        amount: makeMoney(-cogs.raw, cogs.scale),
        type: 'decrease',
        cumulative: grossProfit,
      },
      {
        key: 'GROSS_PROFIT',
        label: 'Lợi nhuận gộp',
        amount: grossProfit,
        type: 'subtotal',
        cumulative: grossProfit,
      },
      {
        key: 'FIN_INC_515',
        label: 'Doanh thu tài chính (515)',
        amount: fInc,
        type: 'increase',
        cumulative: addMoney(grossProfit, fInc),
      },
      {
        key: 'FIN_EXP_635',
        label: 'Chi phí tài chính (635)',
        amount: makeMoney(-fExp.raw, fExp.scale),
        type: 'decrease',
        cumulative: subtractMoney(addMoney(grossProfit, fInc), fExp),
      },
      {
        key: 'SELL_EXP_641',
        label: 'Chi phí bán hàng (641)',
        amount: makeMoney(-sell.raw, sell.scale),
        type: 'decrease',
        cumulative: subtractMoney(subtractMoney(addMoney(grossProfit, fInc), fExp), sell),
      },
      {
        key: 'ADM_EXP_642',
        label: 'Chi phí QLDN (642)',
        amount: makeMoney(-adm.raw, adm.scale),
        type: 'decrease',
        cumulative: opProfit,
      },
      {
        key: 'OTHER_NET',
        label: 'Lợi nhuận khác (711 - 811)',
        amount: netOther,
        type: cmpMoney(netOther, MONEY_ZERO) >= 0 ? 'increase' : 'decrease',
        cumulative: pbt,
      },
      {
        key: 'PBT',
        label: 'LNTT Kế toán',
        amount: pbt,
        type: 'total',
        cumulative: pbt,
      },
    ]

    return steps
  }

  /**
   * Tổng hợp toàn bộ kết quả phân tích tương quan
   */
  public static analyze(
    entries: JournalEntry[],
    incomeStatement: IncomeStatementData | null,
  ): CorrelationAnalysisResult {
    return {
      grossMargin: this.computeGrossMargin(entries),
      cogsStructure: this.computeCogsStructure(entries),
      opexRatios: this.computeOpexRatios(entries),
      waterfall: this.computeProfitWaterfall(entries, incomeStatement),
    }
  }
}
