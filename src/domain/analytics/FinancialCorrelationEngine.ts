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
  CogsBreakdownMonthRow,
  Cogs12MMatrixReport,
  CogsStructureMonth,
  CogsStructureReport,
  CorrelationAnalysisResult,
  GrossMarginPoint,
  GrossMarginReport,
  OpexRatioPoint,
  OpexRatioReport,
  WaterfallStep,
} from './types'
import { ExpenseByNatureEngine } from './ExpenseByNatureEngine'

export class FinancialCorrelationEngine {
  /**
   * 1. Tính toán Tương quan Doanh thu — Giá vốn & Biên Lãi Gộp 12 Tháng
   */
  public static computeGrossMargin(entries: JournalEntry[]): GrossMarginReport {
    const revByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const rawCogsByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const actualProdByMonth: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)

    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      const mIdx = e.month - 1
      const deb = (e.debitAccount || '').trim()
      const cred = (e.creditAccount || '').trim()
      const doc = (e.documentNumber || '').toUpperCase()
      const desc = (e.description || '').toLowerCase()

      if (cred.startsWith('511')) {
        revByMonth[mIdx] = addMoney(revByMonth[mIdx]!, e.amount)
      }
      if (deb.startsWith('632')) {
        rawCogsByMonth[mIdx] = addMoney(rawCogsByMonth[mIdx]!, e.amount)
      }

      // Bóc tách chi phí sản xuất / đầu vào thực tế phát sinh của từng tháng (loại trừ kết chuyển nội bộ)
      const isClosing =
        doc.includes('KC') ||
        doc.includes('KCH') ||
        desc.includes('kết chuyển') ||
        desc.includes('ket chuyen') ||
        desc.includes('tong gia thanh') ||
        desc.includes('tổng giá thành') ||
        desc.includes('gvhb') ||
        (deb.startsWith('154') && cred.startsWith('62')) ||
        (deb.startsWith('155') && cred.startsWith('154')) ||
        (deb.startsWith('632') && cred.startsWith('155') && (doc.includes('KC') || desc.includes('gvhb') || desc.includes('tong')))

      if (!isClosing) {
        if (
          deb.startsWith('621') ||
          deb.startsWith('622') ||
          deb.startsWith('627') ||
          (deb.startsWith('632') && cred.startsWith('156')) ||
          (deb.startsWith('154') && (cred.startsWith('331') || cred.startsWith('111') || cred.startsWith('112') || cred.startsWith('141'))) ||
          (cred.startsWith('152') && (deb.startsWith('6') || deb.startsWith('154'))) ||
          (cred.startsWith('334') && (deb.startsWith('6') || deb.startsWith('154')))
        ) {
          actualProdByMonth[mIdx] = addMoney(actualProdByMonth[mIdx]!, e.amount)
        }
      }
    }

    const totalRevenue = sumMoney(revByMonth)
    const totalCogs = sumMoney(rawCogsByMonth)
    const totalGrossProfit = subtractMoney(totalRevenue, totalCogs)

    const totalRevNum = moneyToNumber(totalRevenue)
    const totalGpNum = moneyToNumber(totalGrossProfit)
    const totalCogsNum = moneyToNumber(totalCogs)
    const annualGrossMarginPct =
      totalRevNum > 0 ? Number(((totalGpNum / totalRevNum) * 100).toFixed(2)) : 0

    // Kiểm tra hiện tượng kết chuyển dồn 1 lần cuối kỳ:
    // Tháng 12 chiếm trên 70% tổng giá vốn cả năm và các tháng trước hầu như không hạch toán giá vốn
    const decCogsNum = moneyToNumber(rawCogsByMonth[11]!)
    const isLumpSumClosingAtYearEnd =
      totalCogsNum > 0 &&
      decCogsNum / totalCogsNum >= 0.7 &&
      rawCogsByMonth.slice(0, 11).filter((c) => moneyToNumber(c) > 0).length <= 2

    let cogsByMonth: Money[] = rawCogsByMonth
    let isNormalizedByActualCost = false

    if (isLumpSumClosingAtYearEnd) {
      const sumActualProd = sumMoney(actualProdByMonth)
      const sumActualNum = moneyToNumber(sumActualProd)
      const baseCostMap = sumActualNum > 0 ? actualProdByMonth : revByMonth
      const sumBaseNum = sumActualNum > 0 ? sumActualNum : totalRevNum

      if (sumBaseNum > 0) {
        cogsByMonth = baseCostMap.map((act) => {
          const actNum = moneyToNumber(act)
          const share = actNum / sumBaseNum
          const normalizedAmt = Math.round(totalCogsNum * share)
          return makeMoney(BigInt(normalizedAmt), 0)
        })
        isNormalizedByActualCost = true
      }
    }

    const buildPoints = (cogsArr: Money[]): GrossMarginPoint[] => {
      const pts: GrossMarginPoint[] = []
      for (let m = 0; m < 12; m++) {
        const rev = revByMonth[m]!
        const cogs = cogsArr[m]!
        const grossProfit = subtractMoney(rev, cogs)
        const revNum = moneyToNumber(rev)
        const gpNum = moneyToNumber(grossProfit)
        const grossMarginPct =
          revNum > 0 ? Number(((gpNum / revNum) * 100).toFixed(2)) : 0
        const isNegative = cmpMoney(grossProfit, MONEY_ZERO) < 0
        const isAnomaly =
          revNum > 0 &&
          (isNegative || Math.abs(grossMarginPct - annualGrossMarginPct) > 12)

        pts.push({
          month: m + 1,
          revenue: rev,
          cogs,
          grossProfit,
          grossMarginPct,
          isNegative,
          isAnomaly,
        })
      }
      return pts
    }

    const points = buildPoints(cogsByMonth)
    const rawPoints = isNormalizedByActualCost ? buildPoints(rawCogsByMonth) : undefined

    const anomalousMonths = points.filter((p) => p.isAnomaly).map((p) => p.month)

    let auditWarning: string | null = null
    if (isNormalizedByActualCost) {
      auditWarning =
        'Doanh nghiệp kết chuyển dồn toàn bộ giá vốn vào ngày 31/12. Biểu đồ đã chuẩn hóa giá vốn theo chi phí phát sinh thực tế từng tháng để phản ánh đúng tương quan doanh thu - chi phí.'
    } else if (points.some((p) => p.isNegative)) {
      auditWarning =
        'Phát hiện tháng có biên lợi nhuận gộp âm (kinh doanh dưới giá vốn). Cần rà soát chính sách giá bán hoặc hạch toán thiếu doanh thu.'
    } else if (anomalousMonths.length > 0) {
      auditWarning = `Biên lãi gộp biến động mạnh tại Tháng ${anomalousMonths.join(', ')} (lệch > 12% so với mức trung bình ${annualGrossMarginPct}%). Kiểm tra tính đúng kỳ giữa doanh thu và giá vốn.`
    }

    return {
      points,
      rawPoints,
      annualGrossMarginPct,
      totalRevenue,
      totalCogs,
      totalGrossProfit,
      anomalousMonths,
      auditWarning,
      isNormalizedByActualCost,
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

      const deb = (e.debitAccount || '').trim()
      const cred = (e.creditAccount || '').trim()
      const doc = (e.documentNumber || '').toUpperCase()
      const desc = (e.description || '').toLowerCase()

      // Bỏ qua các bút toán kết chuyển kỹ thuật, kết chuyển giá thành, kết chuyển 911
      if (deb.startsWith('911') || cred.startsWith('911')) continue
      if (doc.includes('KC') || doc.includes('KCH')) continue
      if (desc.includes('kết chuyển') || desc.includes('ket chuyen') || desc.includes('tong gia thanh') || desc.includes('tổng giá thành') || desc.includes('gvhb') || desc.includes('kch')) continue
      if (deb.startsWith('154') && cred.startsWith('62')) continue // Loại trừ kết chuyển chi phí vào 154
      if (deb.startsWith('155') && cred.startsWith('154')) continue // Loại trừ nhập kho thành phẩm từ 154
      if (deb.startsWith('632') && cred.startsWith('155')) continue // Loại trừ giá vốn thành phẩm sản xuất (đã có ở chi phí đầu vào)

      if (deb.startsWith('621') || (cred.startsWith('152') && (deb.startsWith('6') || deb.startsWith('154')))) {
        matByMonth[mIdx] = addMoney(matByMonth[mIdx]!, e.amount)
      } else if (deb.startsWith('622') || (cred.startsWith('334') && (deb.startsWith('6') || deb.startsWith('154')))) {
        labByMonth[mIdx] = addMoney(labByMonth[mIdx]!, e.amount)
      } else if (deb.startsWith('627')) {
        ovhByMonth[mIdx] = addMoney(ovhByMonth[mIdx]!, e.amount)
      } else if (deb.startsWith('632') && cred.startsWith('156')) {
        // Giá vốn hàng hóa mua đi bán lại thực tế
        wipByMonth[mIdx] = addMoney(wipByMonth[mIdx]!, e.amount)
      } else if (deb.startsWith('154') && (cred.startsWith('331') || cred.startsWith('111') || cred.startsWith('112') || cred.startsWith('141'))) {
        // Chi phí gia công, dịch vụ ngoài trực tiếp vào 154
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
   * 2b. Bóc tách Ma trận Chi Phí Cấu Thành Giá Vốn 12 Tháng TRƯỚC KHI KẾT CHUYỂN SANG 911
   * - Tuyệt đối loại bỏ các bút toán kết chuyển 911.
   * - Tách chi phí sản xuất đầu vào thực tế (621, 622, 627, 154, 156) và giá vốn xuất bán 632 theo đối ứng.
   */
  public static computeCogs12MMatrix(entries: JournalEntry[]): Cogs12MMatrixReport {
    const mat621: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const lab622: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const ovh627: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const wip154: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const purch156: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)

    const cogsTrade156: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const cogsFinished155: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const cogsWip154: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const cogsOther: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const totalCogs632: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)
    const rev511: Money[] = Array.from({ length: 12 }, () => MONEY_ZERO)

    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      // QUY TẮC CỐT LÕI: Bỏ qua toàn bộ bút toán kết chuyển 911
      if (e.debitAccount.startsWith('911') || e.creditAccount.startsWith('911')) continue

      const mIdx = e.month - 1

      // 1. Chi phí đầu vào phát sinh thực tế
      if (e.debitAccount.startsWith('621')) {
        mat621[mIdx] = addMoney(mat621[mIdx]!, e.amount)
      } else if (e.debitAccount.startsWith('622')) {
        lab622[mIdx] = addMoney(lab622[mIdx]!, e.amount)
      } else if (e.debitAccount.startsWith('627')) {
        ovh627[mIdx] = addMoney(ovh627[mIdx]!, e.amount)
      } else if (e.debitAccount.startsWith('154')) {
        wip154[mIdx] = addMoney(wip154[mIdx]!, e.amount)
      } else if (e.debitAccount.startsWith('156')) {
        purch156[mIdx] = addMoney(purch156[mIdx]!, e.amount)
      }

      // 2. Giá vốn xuất bán hạch toán vào 632
      if (e.debitAccount.startsWith('632')) {
        totalCogs632[mIdx] = addMoney(totalCogs632[mIdx]!, e.amount)
        if (e.creditAccount.startsWith('156')) {
          cogsTrade156[mIdx] = addMoney(cogsTrade156[mIdx]!, e.amount)
        } else if (e.creditAccount.startsWith('155')) {
          cogsFinished155[mIdx] = addMoney(cogsFinished155[mIdx]!, e.amount)
        } else if (e.creditAccount.startsWith('154')) {
          cogsWip154[mIdx] = addMoney(cogsWip154[mIdx]!, e.amount)
        } else {
          cogsOther[mIdx] = addMoney(cogsOther[mIdx]!, e.amount)
        }
      }

      // 3. Doanh thu 511
      if (e.creditAccount.startsWith('511')) {
        rev511[mIdx] = addMoney(rev511[mIdx]!, e.amount)
      }
    }

    const annualTotalCogs = sumMoney(totalCogs632)
    const annualTotalCogsNum = moneyToNumber(annualTotalCogs)
    const annualTotalRev = sumMoney(rev511)
    const annualTotalRevNum = moneyToNumber(annualTotalRev)

    const rows: CogsBreakdownMonthRow[] = []
    const summaryWarnings: string[] = []

    for (let m = 0; m < 12; m++) {
      const mat = mat621[m]!
      const lab = lab622[m]!
      const ovh = ovh627[m]!
      const wip = wip154[m]!
      const purch = purch156[m]!

      // Tổng chi phí SX trong kỳ = 621 + 622 + 627 (nếu không có thì lấy 154 hoặc 156)
      const directProd = addMoney(addMoney(mat, lab), ovh)
      const totalProd =
        cmpMoney(directProd, MONEY_ZERO) > 0
          ? directProd
          : cmpMoney(wip, MONEY_ZERO) > 0
            ? wip
            : purch
      const cogsTrade = cogsTrade156[m]!
      const cogsFinished = cogsFinished155[m]!
      const cogsWip = cogsWip154[m]!
      const cogsOth = cogsOther[m]!
      const cogsMonth = totalCogs632[m]!
      const revMonth = rev511[m]!

      const cogsNum = moneyToNumber(cogsMonth)
      const revNum = moneyToNumber(revMonth)
      const prodNum = moneyToNumber(totalProd)

      const cogsToRevPct = revNum > 0 ? Number(((cogsNum / revNum) * 100).toFixed(1)) : 0
      const prodToRevPct = revNum > 0 ? Number(((prodNum / revNum) * 100).toFixed(1)) : 0

      let auditFlag: string | null = null
      let isLumpSum = false
      let isSuspiciousDef = false

      // Kiểm tra dồn giá vốn cuối năm (Tháng 12)
      if (m === 11 && annualTotalCogsNum > 0 && cogsNum / annualTotalCogsNum >= 0.5) {
        const pct = Math.round((cogsNum / annualTotalCogsNum) * 100)
        auditFlag = `Dồn giá vốn cuối năm: Tháng 12 chiếm ${pct}% tổng giá vốn cả năm!`
        isLumpSum = true
        summaryWarnings.push(`Tháng 12 ghi nhận đột biến ${pct}% tổng giá vốn cả năm (${cogsNum.toLocaleString('vi-VN')} đ). Cần rà soát tính đúng kỳ (Cutoff) và nguyên tắc phù hợp.`)
      } else if (revNum > 0 && cogsNum === 0 && prodNum > 0) {
        auditFlag = 'Treo chi phí dở dang: Có phát sinh chi phí SX & doanh thu nhưng không ghi nhận giá vốn.'
        isSuspiciousDef = true
      } else if (revNum > 0 && cogsNum === 0) {
        auditFlag = 'Doanh thu phát sinh nhưng chưa ghi nhận giá vốn tương ứng.'
      }

      rows.push({
        month: m + 1,
        monthLabel: `Tháng ${String(m + 1).padStart(2, '0')}`,
        directMaterials621: mat,
        directLabor622: lab,
        overhead627: ovh,
        wipIncurred154: wip,
        inventoryPurchased156: purch,
        totalProductionCost: totalProd,
        cogsTradeGoods156: cogsTrade,
        cogsFinishedGoods155: cogsFinished,
        cogsServiceWip154: cogsWip,
        cogsDirectOther: cogsOth,
        totalCogs632: cogsMonth,
        revenue511: revMonth,
        cogsToRevenuePct: cogsToRevPct,
        prodCostToRevenuePct: prodToRevPct,
        auditFlag,
        isLumpSumYearEnd: isLumpSum,
        isSuspiciousDeferred: isSuspiciousDef,
      })
    }

    const annualMat = sumMoney(mat621)
    const annualLab = sumMoney(lab622)
    const annualOvh = sumMoney(ovh627)
    const annualWip = sumMoney(wip154)
    const annualPurch = sumMoney(purch156)
    const annualDirectProd = addMoney(addMoney(annualMat, annualLab), annualOvh)
    const annualTotalProd =
      cmpMoney(annualDirectProd, MONEY_ZERO) > 0
        ? annualDirectProd
        : cmpMoney(annualWip, MONEY_ZERO) > 0
          ? annualWip
          : annualPurch
    const annualTrade = sumMoney(cogsTrade156)
    const annualFinished = sumMoney(cogsFinished155)
    const annualServiceWip = sumMoney(cogsWip154)
    const annualOther = sumMoney(cogsOther)

    const hasMfg = cmpMoney(annualDirectProd, MONEY_ZERO) > 0 || cmpMoney(annualWip, MONEY_ZERO) > 0
    const hasTrd = cmpMoney(annualTrade, MONEY_ZERO) > 0 || cmpMoney(annualPurch, MONEY_ZERO) > 0
    const businessType: 'MANUFACTURING' | 'TRADING' | 'HYBRID' =
      hasMfg && hasTrd ? 'HYBRID' : hasMfg ? 'MANUFACTURING' : 'TRADING'

    return {
      rows,
      annualTotals: {
        directMaterials621: annualMat,
        directLabor622: annualLab,
        overhead627: annualOvh,
        wipIncurred154: annualWip,
        inventoryPurchased156: annualPurch,
        totalProductionCost: annualTotalProd,
        cogsTradeGoods156: annualTrade,
        cogsFinishedGoods155: annualFinished,
        cogsServiceWip154: annualServiceWip,
        cogsDirectOther: annualOther,
        totalCogs632: annualTotalCogs,
        revenue511: annualTotalRev,
      },
      annualPcts: {
        materialPct: annualTotalCogsNum > 0 ? Number(((moneyToNumber(annualMat) / annualTotalCogsNum) * 100).toFixed(1)) : 0,
        laborPct: annualTotalCogsNum > 0 ? Number(((moneyToNumber(annualLab) / annualTotalCogsNum) * 100).toFixed(1)) : 0,
        overheadPct: annualTotalCogsNum > 0 ? Number(((moneyToNumber(annualOvh) / annualTotalCogsNum) * 100).toFixed(1)) : 0,
        tradeGoodsPct: annualTotalCogsNum > 0 ? Number(((moneyToNumber(annualTrade) / annualTotalCogsNum) * 100).toFixed(1)) : 0,
        finishedGoodsPct: annualTotalCogsNum > 0 ? Number(((moneyToNumber(annualFinished) / annualTotalCogsNum) * 100).toFixed(1)) : 0,
        annualCogsToRevenuePct: annualTotalRevNum > 0 ? Number(((annualTotalCogsNum / annualTotalRevNum) * 100).toFixed(1)) : 0,
        annualProdCostToRevenuePct: annualTotalRevNum > 0 ? Number(((moneyToNumber(annualTotalProd) / annualTotalRevNum) * 100).toFixed(1)) : 0,
      },
      businessType,
      summaryWarnings,
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
    cdfsAccounts?: Map<string, { matk: string; tentk: string; sdndk?: number; sdcdk?: number; psndk?: number; pscdk?: number; nock?: number; cock?: number }>,
  ): CorrelationAnalysisResult {
    return {
      grossMargin: this.computeGrossMargin(entries),
      cogsStructure: this.computeCogsStructure(entries),
      cogs12mMatrix: this.computeCogs12MMatrix(entries),
      expenseByNature: ExpenseByNatureEngine.analyze(entries, cdfsAccounts as never),
      opexRatios: this.computeOpexRatios(entries),
      waterfall: this.computeProfitWaterfall(entries, incomeStatement),
    }
  }
}
