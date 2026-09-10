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
}

export interface GlAnalyticsResult {
  ebitda: EbitdaResult
  relatedParties: RelatedPartyFinding[]
  pareto: ParetoReport
  trend12m: Trend12MMatrix
  correlations?: CorrelationAnalysisResult
}
