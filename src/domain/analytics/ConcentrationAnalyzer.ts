import type { Money } from '../money'
import {
  addMoney,
  cmpMoney,
  MONEY_ZERO,
  moneyToNumber,
} from '../money'
import type { JournalEntry } from '../../shared/types/analytics'
import type { ParetoItem, ParetoReport } from './types'
import { extractPartnerCodeFromAccount } from './PartnerExtractor'
interface GroupAccumulator {
  objectCode: string | null
  name: string
  amount: Money
}

export class ConcentrationAnalyzer {
  public static analyze(entries: JournalEntry[]): ParetoReport {
    const customerMap = new Map<string, GroupAccumulator>()
    const supplierMap = new Map<string, GroupAccumulator>()

    let totalRevenue = MONEY_ZERO
    let totalPurchases = MONEY_ZERO

    for (const e of entries) {
      // 1. Doanh thu: Có 511 đối ứng Nợ 131...
      if (e.creditAccount.startsWith('511')) {
        totalRevenue = addMoney(totalRevenue, e.amount)
        const extractedCode = e.objectCode || extractPartnerCodeFromAccount(e.debitAccount)
        const key = (extractedCode || e.customerName || 'KH_LE').trim().toUpperCase()
        let c = customerMap.get(key)
        if (!c) {
          c = {
            objectCode: extractedCode || null,
            name: e.customerName || (extractedCode ? `Khách hàng ${extractedCode}` : 'Khách hàng vãng lai / Bán lẻ'),
            amount: MONEY_ZERO,
          }
          customerMap.set(key, c)
        }
        c.amount = addMoney(c.amount, e.amount)
      }

      // 2. Mua hàng / Chi phí: Nợ 15x, 632, 641, 642 đối ứng Có 331, 111, 112
      const isPurchaseDebit =
        e.debitAccount.startsWith('15') ||
        e.debitAccount.startsWith('632') ||
        e.debitAccount.startsWith('641') ||
        e.debitAccount.startsWith('642')

      const isPaymentOrPayableCredit =
        e.creditAccount.startsWith('331') ||
        e.creditAccount.startsWith('111') ||
        e.creditAccount.startsWith('112')

      if (isPurchaseDebit && isPaymentOrPayableCredit) {
        totalPurchases = addMoney(totalPurchases, e.amount)
        const extractedCode = e.objectCode || extractPartnerCodeFromAccount(e.creditAccount) || extractPartnerCodeFromAccount(e.debitAccount)
        const key = (extractedCode || e.customerName || 'NCC_LE').trim().toUpperCase()
        let s = supplierMap.get(key)
        if (!s) {
          s = {
            objectCode: extractedCode || null,
            name: e.customerName || (extractedCode ? `NCC ${extractedCode}` : 'Nhà cung cấp khác'),
            amount: MONEY_ZERO,
          }
          supplierMap.set(key, s)
        }
        s.amount = addMoney(s.amount, e.amount)
      }
    }

    const sortedCustomers = Array.from(customerMap.values()).sort((a, b) =>
      cmpMoney(b.amount, a.amount),
    )
    const revTotalNum = moneyToNumber(totalRevenue)
    let custCumulPct = 0

    const topCustomers: ParetoItem[] = sortedCustomers.slice(0, 10).map((c, idx) => {
      const cNum = moneyToNumber(c.amount)
      const pct = revTotalNum > 0 ? (cNum / revTotalNum) * 100 : 0
      custCumulPct += pct
      return {
        rank: idx + 1,
        objectCode: c.objectCode,
        name: c.name,
        amount: c.amount,
        percentage: Number(pct.toFixed(2)),
        cumulativePercentage: Number(Math.min(100, custCumulPct).toFixed(2)),
      }
    })

    const customerConcentrationRatio1 = topCustomers[0]?.percentage || 0
    const customerConcentrationRatio5 = topCustomers[4]?.cumulativePercentage || (topCustomers.length > 0 ? topCustomers[topCustomers.length - 1]?.cumulativePercentage || 0 : 0)

    let customerRiskWarning: string | null = null
    if (customerConcentrationRatio1 > 30) {
      customerRiskWarning = `Khách hàng lớn nhất (${topCustomers[0]?.name || ''}) chiếm ${customerConcentrationRatio1}% tổng doanh thu. Rủi ro trọng yếu về tính hoạt động liên tục (VSA 570) nếu mất khách hàng này.`
    } else if (customerConcentrationRatio5 > 70) {
      customerRiskWarning = `Top 5 khách hàng lớn nhất chiếm ${customerConcentrationRatio5}% tổng doanh thu. Doanh nghiệp có độ tập trung khách hàng cao.`
    }

    // Xây dựng bảng Pareto Nhà Cung Cấp
    const sortedSuppliers = Array.from(supplierMap.values()).sort((a, b) =>
      cmpMoney(b.amount, a.amount),
    )
    const purchTotalNum = moneyToNumber(totalPurchases)
    let suppCumulPct = 0

    const topSuppliers: ParetoItem[] = sortedSuppliers.slice(0, 10).map((s, idx) => {
      const sNum = moneyToNumber(s.amount)
      const pct = purchTotalNum > 0 ? (sNum / purchTotalNum) * 100 : 0
      suppCumulPct += pct
      return {
        rank: idx + 1,
        objectCode: s.objectCode,
        name: s.name,
        amount: s.amount,
        percentage: Number(pct.toFixed(2)),
        cumulativePercentage: Number(Math.min(100, suppCumulPct).toFixed(2)),
      }
    })

    const supplierConcentrationRatio5 = topSuppliers[4]?.cumulativePercentage || (topSuppliers.length > 0 ? topSuppliers[topSuppliers.length - 1]?.cumulativePercentage || 0 : 0)
    let supplierRiskWarning: string | null = null
    if (topSuppliers[0] && (topSuppliers[0].percentage ?? 0) > 35) {
      supplierRiskWarning = `Nhà cung cấp lớn nhất (${topSuppliers[0].name}) chiếm ${topSuppliers[0].percentage ?? 0}% tổng giá trị mua hàng. Rủi ro phụ thuộc nguồn cung ứng.`
    }

    return {
      topCustomers,
      totalRevenue,
      customerConcentrationRatio1,
      customerConcentrationRatio5,
      customerRiskWarning,
      topSuppliers,
      totalPurchases,
      supplierConcentrationRatio5,
      supplierRiskWarning,
    }
  }
}
