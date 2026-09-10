import type { IAuditDataEngine } from '../../engine/IAuditDataEngine'
import type { IncomeStatementData } from '../../../shared/types/analytics'
import type {
  EbitdaResult,
  ParetoReport,
  Trend12MMatrix,
  RelatedPartyFinding,
  ParetoItem,
  MonthlyTrendRow,
  RelatedPartyRiskType,
} from '../types'
import { SQL_EBITDA_COMPONENTS, parseEbitdaQueryResult } from './EbitdaQuery'
import { buildSalesParetoSql, buildVendorParetoSql, type ParetoSqlRow } from './ParetoQuery'
import { SQL_12M_TREND, type Trend12MSqlRow } from './Trend12MQuery'
import { buildRelatedPartySql, type RelatedPartySqlRow } from './RelatedPartyQuery'
import { makeMoney } from '../../money'
import { EbitdaCalculator } from '../EbitdaCalculator'

export class SqlAnalyticsService {
  /**
   * Tính toán EBITDA khống chế lãi vay 30% bằng truy vấn SQL siêu tốc
   */
  public static async runEbitdaAnalysis(
    engine: IAuditDataEngine,
    incomeStatement: IncomeStatementData | null
  ): Promise<EbitdaResult> {
    const rawRows = await engine.query<Record<string, unknown>>(SQL_EBITDA_COMPONENTS)
    const sqlRes = parseEbitdaQueryResult(rawRows)

    const interestExpense = makeMoney(sqlRes.totalInterestExpense, 0)
    const interestIncome = makeMoney(sqlRes.totalInterestIncome, 0)
    const depreciation = makeMoney(sqlRes.totalDepreciation, 0)

    return EbitdaCalculator.computeFromTotals(
      interestExpense,
      interestIncome,
      depreciation,
      incomeStatement
    )
  }

  /**
   * Phân tích tỷ trọng Pareto 80/20 bằng SQL Window Functions
   */
  public static async runParetoAnalysis(engine: IAuditDataEngine): Promise<ParetoReport> {
    const salesRows = await engine.query<ParetoSqlRow>(buildSalesParetoSql(20))
    const vendorRows = await engine.query<ParetoSqlRow>(buildVendorParetoSql(20))

    const mapItem = (r: ParetoSqlRow, index: number): ParetoItem => {
      const amt = BigInt(r.total_amount || '0')
      return {
        rank: index + 1,
        objectCode: r.partner_code || null,
        name: r.partner_name || r.partner_code || 'Khách hàng / NCC',
        amount: makeMoney(amt, 0),
        percentage: Number(r.share_pct || 0),
        cumulativePercentage: Number(r.cumulative_pct || 0),
        sharePercent: Number(r.share_pct || 0),
        cumulativePercent: Number(r.cumulative_pct || 0),
        isKeyItem: Boolean(r.is_top_80),
      }
    }

    const topCustomers = salesRows.map((r, i) => mapItem(r, i))
    const topSuppliers = vendorRows.map((r, i) => mapItem(r, i))

    let totalRev = 0n
    for (const c of topCustomers) {
      totalRev += c.amount.raw
    }

    let totalPur = 0n
    for (const s of topSuppliers) {
      totalPur += s.amount.raw
    }

    const customerRatio1 = topCustomers[0]?.percentage || 0
    const customerRatio5 = topCustomers.slice(0, 5).reduce((sum, c) => sum + (c.percentage || 0), 0)
    const supplierRatio5 = topSuppliers.slice(0, 5).reduce((sum, s) => sum + (s.percentage || 0), 0)

    return {
      topCustomers,
      totalRevenue: makeMoney(totalRev, 0),
      customerConcentrationRatio1: customerRatio1,
      customerConcentrationRatio5: customerRatio5,
      customerRiskWarning:
        customerRatio5 >= 50
          ? `Top 5 khách hàng chiếm ${customerRatio5.toFixed(1)}% doanh thu. Rủi ro tập trung khách hàng trọng yếu.`
          : null,

      topSuppliers,
      totalPurchases: makeMoney(totalPur, 0),
      supplierConcentrationRatio5: supplierRatio5,
      supplierRiskWarning:
        supplierRatio5 >= 50
          ? `Top 5 nhà cung cấp chiếm ${supplierRatio5.toFixed(1)}% chi phí mua hàng. Rủi ro phụ thuộc nguồn cung.`
          : null,
    }
  }

  /**
   * Phân tích ma trận 12 tháng bằng SQL
   */
  public static async run12MTrendAnalysis(engine: IAuditDataEngine): Promise<Trend12MMatrix> {
    const rows = await engine.query<Trend12MSqlRow>(SQL_12M_TREND)
    const matrixMap = new Map<string, bigint>()

    for (const r of rows) {
      const key = `${r.month}_${r.account_group}`
      matrixMap.set(key, BigInt(r.total_amount || '0'))
    }

    const rowDefs = [
      { key: 'COGS_632', label: 'Giá vốn hàng bán', code: '632' },
      { key: 'SELL_641', label: 'Chi phí bán hàng', code: '641' },
      { key: 'ADM_642', label: 'Chi phí quản lý doanh nghiệp', code: '642' },
      { key: 'FIN_635', label: 'Chi phí tài chính (Lãi vay)', code: '635' },
      { key: 'OTH_811', label: 'Chi phí khác', code: '811' },
    ]

    const trendRows: MonthlyTrendRow[] = rowDefs.map((def) => {
      const months = []
      let total = 0n

      for (let m = 1; m <= 12; m++) {
        const val = matrixMap.get(`${m}_${def.code}`) || 0n
        months.push(makeMoney(val, 0))
        total += val
      }

      const momGrowth: Array<number | null> = []
      const anomalyMonths: number[] = []

      for (let m = 1; m < 12; m++) {
        const prev = months[m - 1]?.raw ?? 0n
        const curr = months[m]?.raw ?? 0n
        if (prev === 0n) {
          momGrowth.push(null)
        } else {
          const rate = Number(((curr - prev) * 10000n) / prev) / 100
          momGrowth.push(rate)
          if (rate >= 50 || rate <= -50) {
            anomalyMonths.push(m + 1)
          }
        }
      }

      return {
        key: def.key,
        label: def.label,
        accountPattern: `Nợ ${def.code}`,
        months,
        total: makeMoney(total, 0),
        momGrowth,
        anomalyMonths,
      }
    })

    return {
      rows: trendRows,
      warningNotes: [],
    }
  }

  /**
   * Quét bên liên quan VSA 550 bằng SQL
   */
  public static async runRelatedPartyScan(
    engine: IAuditDataEngine,
    threshold = 100_000_000n
  ): Promise<RelatedPartyFinding[]> {
    const rows = await engine.query<RelatedPartySqlRow>(buildRelatedPartySql(threshold))

    return rows.map((r, idx) => {
      const amt = BigInt(r.amount || '0')
      let riskType: RelatedPartyRiskType = 'SIGNIFICANT_TRANSACTION'
      if (r.debit_account.startsWith('128')) riskType = 'ZERO_INTEREST_LENDING'
      else if (r.credit_account.startsWith('341') || r.credit_account.startsWith('3388'))
        riskType = 'ZERO_INTEREST_BORROWING'
      else if (r.debit_account.startsWith('141')) riskType = 'UNRESOLVED_ADVANCE'

      return {
        id: r.id || `rpf_${idx + 1}`,
        type: riskType,
        objectCode: r.partner_code || null,
        name: r.partner_name || r.partner_code || 'Bên liên quan chưa định danh',
        totalAmount: makeMoney(amt, 0),
        transactionCount: 1,
        accounts: [r.debit_account, r.credit_account].filter(Boolean),
        firstDate: r.entry_date,
        lastDate: r.entry_date,
        description: r.description || `Chứng từ ${r.doc_no}`,
        auditWarning: `Nghi ngờ giao dịch bên liên quan: Phát sinh ${r.debit_account}/${r.credit_account} số tiền ${amt.toLocaleString('vi-VN')} đ`,
        severity: amt >= 500_000_000n ? 'HIGH' : 'MEDIUM',
      }
    })
  }
}
