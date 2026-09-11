import type { Money } from '../money'

export interface EbitdaResult {
  interestExpense: Money
  interestIncome: Money
  netInterest: Money
  depreciation: Money
  operatingProfit: Money
  ebitda: Money
  cap30: Money
  disallowedInterest: Money
  interestToEbitdaRatio: number | null // tỷ lệ %
  isOverCap: boolean
  note: string
}

export type RelatedPartyRiskType =
  | 'ZERO_INTEREST_LENDING'
  | 'ZERO_INTEREST_BORROWING'
  | 'UNRESOLVED_ADVANCE'
  | 'SIGNIFICANT_TRANSACTION'

export interface RelatedPartyFinding {
  id?: string
  type?: RelatedPartyRiskType
  partyName?: string
  name?: string
  objectCode: string | null
  relationshipType?: string
  totalAmount?: Money
  totalLending?: Money
  totalBorrowing?: Money
  totalAdvance?: Money
  hasZeroInterestLoans?: boolean
  hasLongOutstandingAdvances?: boolean
  riskLevel?: string
  notes?: string[]
  sampleDocNumbers?: string[]
  transactionCount?: number
  accounts?: string[]
  firstDate?: string | null
  lastDate?: string | null
  description?: string
  auditWarning?: string
  severity?: 'HIGH' | 'MEDIUM' | 'INFO'
}

export interface ParetoItem {
  rank?: number
  objectCode: string | null
  name: string
  amount: Money
  percentage: number // % trên tổng
  cumulativePercentage: number // % tích lũy
  sharePercent?: number
  cumulativePercent?: number
  isKeyItem?: boolean
}

export interface ParetoReport {
  topCustomers: ParetoItem[]
  totalRevenue: Money
  totalRevenueAnalyzed?: Money
  customerConcentrationRatio5: number // % top 5
  customerConcentrationRatio1: number // % top 1
  customerRiskWarning: string | null

  topSuppliers: ParetoItem[]
  totalPurchases: Money
  totalPurchasesAnalyzed?: Money
  supplierConcentrationRatio5: number
  supplierRiskWarning: string | null
}

export interface MonthlyTrendRow {
  key: string
  label: string
  accountPattern: string
  months: Money[]
  monthlyValues?: Money[]
  total: Money
  momGrowth: Array<number | null>
  anomalyMonths: number[]
  /** Ghi chú ngắn gắn từng tháng đột biến (key = tháng 1-12), hiện qua hover tooltip */
  cellNotes?: Record<number, string>
  spikes?: Array<{ month: number; growthRate: number | null }>
}

export interface Trend12MMatrix {
  rows: MonthlyTrendRow[]
  warningNotes: string[]
  months?: number[]
  summaryAlerts?: string[]
}


export interface GrossMarginPoint {
  month: number
  revenue: Money
  cogs: Money
  grossProfit: Money
  grossMarginPct: number
  isNegative: boolean
  isAnomaly: boolean
}

export interface GrossMarginReport {
  points: GrossMarginPoint[]
  annualGrossMarginPct: number
  totalRevenue: Money
  totalCogs: Money
  totalGrossProfit: Money
  anomalousMonths: number[]
  auditWarning: string | null
  isNormalizedByActualCost?: boolean
  rawPoints?: GrossMarginPoint[]
}

export interface CogsStructureMonth {
  month: number
  directMaterials: Money // 621
  directLabor: Money     // 622
  overhead: Money        // 627
  wipOrTrade: Money      // 154 / 156
  totalCosts: Money
  materialPct: number
  laborPct: number
  overheadPct: number
  wipOrTradePct: number
}

export interface CogsStructureReport {
  months: CogsStructureMonth[]
  annualTotals: {
    directMaterials: Money
    directLabor: Money
    overhead: Money
    wipOrTrade: Money
    totalCosts: Money
  }
  annualPcts: {
    materialPct: number
    laborPct: number
    overheadPct: number
    wipOrTradePct: number
  }
}

export interface CogsBreakdownMonthRow {
  month: number // 1..12
  monthLabel: string // "Tháng 01"...
  // 1. Chi phí đầu vào phát sinh thực tế trong tháng (Trước khi kết chuyển sang 911)
  directMaterials621: Money // Nợ 621
  directLabor622: Money     // Nợ 622
  overhead627: Money        // Nợ 627
  wipIncurred154: Money     // Nợ 154
  inventoryPurchased156: Money // Nợ 156 mua hàng nhập kho
  totalProductionCost: Money // 621 + 622 + 627 (hoặc 154)

  // 2. Giá vốn xuất bán hạch toán vào 632 theo tài khoản đối ứng gốc
  cogsTradeGoods156: Money   // Nợ 632 / Có 156
  cogsFinishedGoods155: Money // Nợ 632 / Có 155
  cogsServiceWip154: Money   // Nợ 632 / Có 154
  cogsDirectOther: Money     // Nợ 632 đối ứng TK khác (111, 112, 331...)
  totalCogs632: Money        // Tổng phát sinh NỢ 632 trong tháng (không tính 911)

  // 3. Doanh thu & Tỷ lệ so sánh
  revenue511: Money          // Doanh thu Có 511
  cogsToRevenuePct: number   // % Giá vốn 632 / Doanh thu
  prodCostToRevenuePct: number // % Chi phí SX / Doanh thu

  // 4. Cảnh báo kiểm toán (Audit Flags)
  auditFlag: string | null
  isLumpSumYearEnd: boolean  // Cờ báo dồn giá vốn cuối năm (T12)
  isSuspiciousDeferred: boolean // Cờ báo treo chi phí 154 không kết chuyển
}

export interface Cogs12MMatrixReport {
  rows: CogsBreakdownMonthRow[]
  annualTotals: {
    directMaterials621: Money
    directLabor622: Money
    overhead627: Money
    wipIncurred154: Money
    inventoryPurchased156: Money
    totalProductionCost: Money
    cogsTradeGoods156: Money
    cogsFinishedGoods155: Money
    cogsServiceWip154: Money
    cogsDirectOther: Money
    totalCogs632: Money
    revenue511: Money
  }
  annualPcts: {
    materialPct: number
    laborPct: number
    overheadPct: number
    tradeGoodsPct: number
    finishedGoodsPct: number
    annualCogsToRevenuePct: number
    annualProdCostToRevenuePct?: number
  }
  businessType: 'MANUFACTURING' | 'TRADING' | 'HYBRID'
  summaryWarnings: string[]
}

export interface OpexRatioPoint {
  month: number
  revenue: Money
  sellingExpense: Money // 641
  adminExpense: Money   // 642
  totalOpex: Money
  sellingRatioPct: number
  adminRatioPct: number
  totalOpexRatioPct: number
}

export interface OpexRatioReport {
  points: OpexRatioPoint[]
  annualTotals: {
    sellingExpense: Money
    adminExpense: Money
    totalOpex: Money
  }
  annualPcts: {
    sellingRatioPct: number
    adminRatioPct: number
    totalOpexRatioPct: number
  }
}

export interface WaterfallStep {
  key: string
  label: string
  amount: Money
  type: 'start' | 'increase' | 'decrease' | 'subtotal' | 'total'
  cumulative: Money
}

export interface CorrelationAnalysisResult {
  grossMargin: GrossMarginReport
  cogsStructure: CogsStructureReport
  opexRatios: OpexRatioReport
  waterfall: WaterfallStep[]
  cogs12mMatrix?: Cogs12MMatrixReport
  expenseByNature?: ExpenseByNatureReport
}

export interface ExpenseDetailReport {
  prefix: '641' | '642'
  /** Các TK 4 số có phát sinh, sắp xếp tăng dần */
  accounts: string[]
  /** months[i][m] = phát sinh TK accounts[i] trong tháng m+1 */
  months: number[][]
  /** Tổng từng TK cả năm */
  totals: number[]
  /** Doanh thu 511 từng tháng */
  revenue: number[]
  /** Tỷ lệ % Tổng/DT từng tháng, null khi DT = 0 */
  ratios: Array<number | null>
}

export interface KqkdYoYRow {
  maSo: string
  chiTieu: string
  current: number
  prior: number | null
  diff: number | null
  pct: number | null
}

export type CashThresholdMode = '5M' | '20M' | 'CUSTOM'

export type TaxRiskCategory =
  | 'SINGLE_OVER_THRESHOLD'  // Chi tiền mặt >= 5tr (NĐ 181) hoặc >= 20tr
  | 'SPLIT_SAME_DAY'         // Chia nhỏ phiếu chi tiền mặt cùng ngày
  | 'PENALTY_811'            // Tiền phạt VPHC, phạt thuế, chậm nộp (TK 811)
  | 'NO_INVOICE'             // Chi phí không có hóa đơn hợp pháp / mua lẻ
  | 'WELFARE_OTHER'          // Phúc lợi / chi phí không hợp lệ khác

export interface CashRiskItem {
  id: string
  date: string | null
  voucher: string | null
  description: string | null
  debit: string
  credit: string
  amount: Money
  amountNumber: number
  partnerCode: string | null
  partnerName: string | null
  riskType: TaxRiskCategory
  riskLabel: string
  auditNote: string
  clusterKey?: string
}

export interface CashRiskCluster {
  clusterKey: string
  date: string
  partner: string
  itemsCount: number
  totalAmount: Money
  totalAmountNumber: number
  items: CashRiskItem[]
  auditNote: string
}

export interface CashTaxRiskResult {
  thresholdUsed: number
  thresholdMode: CashThresholdMode
  taxRate: number
  totalRiskAmount: Money
  totalRiskNumber: number
  estimatedB4Adjustment: Money
  estimatedB4Number: number
  estimatedTaxPayableIncrease: Money
  estimatedTaxPayableNumber: number
  // Thống kê bóc tách theo chuyên đề
  cashRiskNumber: number
  penaltyRiskNumber: number
  noInvoiceRiskNumber: number
  otherRiskNumber: number
  // Danh sách chi tiết
  singleItems: CashRiskItem[]
  splitClusters: CashRiskCluster[]
  penaltyItems: CashRiskItem[]
  noInvoiceItems: CashRiskItem[]
  allItems: CashRiskItem[]
}

export interface GlAnalyticsResult {
  ebitda: EbitdaResult
  relatedParties: RelatedPartyFinding[]
  pareto: ParetoReport
  trend12m: Trend12MMatrix
  correlations?: CorrelationAnalysisResult
  expenseDetail?: { sell: ExpenseDetailReport; admin: ExpenseDetailReport }
  kqkdYoY?: { rows: KqkdYoYRow[]; fromB02: boolean }
  cashTaxRisk?: CashTaxRiskResult
  cogs12mMatrix?: Cogs12MMatrixReport
  expenseByNature?: ExpenseByNatureReport
}

export interface ExpenseByNatureMonthRow {
  month: number
  monthLabel: string
  rawMaterials: number
  labor: number
  depreciation: number
  outsideServices: number
  otherCash: number
  totalNature: number
}

export interface ExpenseByNatureBctcRecon {
  rawMaterials: number
  labor: number
  depreciation: number
  outsideServices: number
  otherCash: number
  commercialCogs: number
  realEstateCogs: number
  totalNatureCost: number

  wipOpening154: number
  finishedOpening155: number
  wipClosing154: number
  finishedClosing155: number
  deltaWip154: number
  deltaFinished155: number

  calculatedTotalOperatingCost: number

  transferredCogs632: number
  transferredSelling641: number
  transferredAdmin642: number
  totalTransferred911Cost: number

  difference: number
  isBalanced: boolean
}

export type ExpenseNatureCategory =
  | 'RAW_MATERIALS'
  | 'LABOR'
  | 'DEPRECIATION'
  | 'OUTSIDE_SERVICES'
  | 'OTHER_CASH'

export interface ExpenseNatureAccountBreakdown {
  accountCode: string
  accountName: string
  category: ExpenseNatureCategory
  categoryLabel: string
  monthlyAmounts: number[]
  annualTotal: number
}

export interface ExpenseByNatureReport {
  rows: ExpenseByNatureMonthRow[]
  annualTotals: {
    rawMaterials: number
    labor: number
    depreciation: number
    outsideServices: number
    otherCash: number
    totalNature: number
  }
  bctcReconciliation: ExpenseByNatureBctcRecon
  accountBreakdowns: ExpenseNatureAccountBreakdown[]
}
