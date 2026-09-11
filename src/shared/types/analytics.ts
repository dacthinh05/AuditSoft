import type { Money } from '../../domain/money'

export type SheetType = 'GENERAL_LEDGER' | 'TRIAL_BALANCE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'UNKNOWN'

export interface SheetClassification {
  sheetName: string
  type: SheetType
  confidence: number
  evidence: string[]
  headerRow: number
  /** số dòng dữ liệu ước tính dưới header (dùng làm tie-breaker chọn sheet) */
  dataRows: number
}

export interface SourceRef {
  fileName: string
  sheetName: string
  rowNumber: number
}

export type RowIssueCode =
  | 'MISSING_DATE'
  | 'INVALID_DATE'
  | 'MISSING_DEBIT_ACCOUNT'
  | 'MISSING_CREDIT_ACCOUNT'
  | 'INVALID_AMOUNT'
  | 'ZERO_AMOUNT'
  | 'NEGATIVE_AMOUNT'
  | 'INVALID_ACCOUNT_FORMAT'
  | 'MISSING_DOCUMENT'

export interface JournalEntry {
  id: string
  source: SourceRef
  postingDate: string | null
  documentNumber: string | null
  description: string
  debitAccount: string
  creditAccount: string
  amount: Money
  foreignAmount: Money | null
  exchangeRate: number | null
  objectCode: string | null
  customerName: string | null
  month: number | null
  issues: RowIssueCode[]
}

export interface TrialBalanceRow {
  account: string
  accountName: string
  openingDebit: Money
  openingCredit: Money
  movementDebit: Money
  movementCredit: Money
  closingDebit: Money
  closingCredit: Money
  source: SourceRef
}

export interface IncomeStatementLine {
  maSo: string
  chiTieu: string
  current: Money | null
  prior: Money | null
}

export interface IncomeStatementData {
  lines: IncomeStatementLine[]
  source: SourceRef | null
}

export interface DataQualityReport {
  totalRows: number
  validPostingDate: number
  validDebitAccount: number
  validCreditAccount: number
  validAmount: number
  missingDocumentNumber: number
  duplicateExactRows: number
  negativeAmounts: number
  invalidAccounts: number
  score: number
  reliable: boolean
  warnings: string[]
}

export interface NormalizedJournal {
  entries: JournalEntry[]
  headerRow: number
  mapping: Record<string, number | null>
  quality: DataQualityReport
}

export interface ImportResult {
  fileName: string
  classifications: SheetClassification[]
  selected: Partial<Record<SheetType, string>>
  needsReview: SheetClassification[]
  journal: NormalizedJournal | null
  trialBalance: TrialBalanceRow[]
  trialBalanceSource: SourceRef | null
  incomeStatement: IncomeStatementData | null
}

export interface MaterialityConfig {
  overall: Money
  performance: Money
  clearlyTrivial: Money
}

export interface AccountStats {
  account: string
  debitTurnover: Money
  creditTurnover: Money
  count: number
  firstDate: string | null
  lastDate: string | null
}

export interface PairStats {
  debit: string
  credit: string
  count: number
  total: Money
  firstDate: string | null
  lastDate: string | null
}

export interface MonthlyBucket {
  month: number
  debit: Money
  credit: Money
  count: number
}

export type ReconStatus = 'PASS' | 'WARNING' | 'ERROR'

export interface ReconciliationRow {
  account: string
  accountName: string
  glDebit: Money
  glCredit: Money
  tbDebit: Money
  tbCredit: Money
  diffDebit: Money
  diffCredit: Money
  status: ReconStatus
  note: string
}

export interface ReconciliationResult {
  rows: ReconciliationRow[]
  unmatchedGlAccounts: string[]
  totalGlDebit: Money
  totalGlCredit: Money
  balanced: boolean
  status: ReconStatus
}

export interface DuplicateGroups {
  exact: Array<{ key: string; ids: string[]; totalAmount: Money }>
  nearDuplicate: Array<{ key: string; ids: string[]; totalAmount: Money }>
}

export interface RoundNumberResult {
  ids: string[]
  count: number
  total: Money
}

export interface WeekendResult {
  ids: string[]
  share: number
  total: number
}

export interface YearEndWindowResult {
  ids: string[]
  total: Money
  byPriorityAccounts: boolean
}

export interface RareCounterResult {
  pairs: Array<{ debit: string; credit: string; count: number; total: Money }>
}

export interface KqkdComparison {
  lines: Array<{
    maSo: string
    chiTieu: string
    current: Money | null
    prior: Money | null
    absoluteChange: Money | null
    pctChange: number | null
    pctOfRevenueCurrent: number | null
    pctOfRevenuePrior: number | null
  }>
  metrics: {
    revenueGrowthPct: number | null
    grossMarginCurrent: number | null
    grossMarginPrior: number | null
    grossMarginChangePP: number | null
    operatingMarginCurrent: number | null
    operatingMarginPrior: number | null
    netMarginCurrent: number | null
    netMarginPrior: number | null
    cogsGrowthPct: number | null
    adminExpenseGrowthPct: number | null
    sellingExpenseGrowthPct: number | null
    financeCostGrowthPct: number | null
  }
  hasPriorYear: boolean
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export type FindingCategory =
  | 'REVENUE'
  | 'COGS'
  | 'EXPENSE'
  | 'CASH'
  | 'RECEIVABLE'
  | 'PAYABLE'
  | 'INVENTORY'
  | 'FIXED_ASSET'
  | 'TAX'
  | 'JOURNAL_ENTRY'
  | 'RECONCILIATION'

export interface FindingExplanation {
  label: string
  value: string
}

export interface FindingEvidence {
  journalEntryIds?: string[]
  accounts?: string[]
  months?: number[]
}

export interface AuditFinding {
  id: string
  ruleId: string
  title: string
  riskLevel: RiskLevel
  category: FindingCategory
  observation: string
  currentValue?: string
  priorValue?: string
  difference?: string
  percentageChange?: number
  materialityImpact?: string
  score: number
  reasons: string[]
  auditImplication: string
  recommendedProcedures: string[]
  explanation: FindingExplanation[]
  evidence: FindingEvidence
}

export interface RawFinding {
  ruleId: string
  clusterKey: string
  title: string
  category: FindingCategory
  observation: string
  currentValue?: string
  priorValue?: string
  difference?: string
  percentageChange?: number
  materialityImpact?: string
  scores: { materiality: number; anomaly: number; timing: number; pattern: number }
  reasons: string[]
  auditImplication: string
  recommendedProcedures: string[]
  evidence: FindingEvidence
}

/* ───────── DTO serializable qua IPC (Money → number hiển thị VND) ───────── */

export interface JournalRowDTO {
  id: string
  date: string | null
  doc: string | null
  desc: string
  debit: string
  credit: string
  amount: number
  month: number | null
  issues: string[]
}

export interface AccountStatsDTO {
  account: string
  name: string
  debit: number
  credit: number
  count: number
}

export interface PairStatsDTO {
  debit: string
  credit: string
  count: number
  total: number
}

export interface MonthlyBucketDTO {
  month: number
  debit: number
  credit: number
  count: number
}

export interface MonthlyGroupDTO {
  group: string
  buckets: MonthlyBucketDTO[]
  totalAmount: number
  maxMonth: number | null
  maxMonthShare: number | null
}

export interface ReconRowDTO {
  account: string
  name: string
  glDebit: number
  glCredit: number
  tbDebit: number
  tbCredit: number
  diffDebit: number
  diffCredit: number
  status: ReconStatus
  note: string
}

export interface KqkdLineDTO {
  maSo: string
  chiTieu: string
  current: number | null
  prior: number | null
  change: number | null
  pctChange: number | null
}

export interface TrialBalanceRowDTO {
  account: string
  accountName: string
  openingDebit: number
  openingCredit: number
  movementDebit: number
  movementCredit: number
  closingDebit: number
  closingCredit: number
}

export interface AnalysisResult {
  fileName: string
  classifications: SheetClassification[]
  selected: Partial<Record<SheetType, string>>
  needsReview: SheetClassification[]
  quality: DataQualityReport | null
  balanced: boolean
  reconStatus: ReconStatus
  reconciliation: ReconRowDTO[]
  unmatchedGlAccounts: string[]
  trialBalance?: TrialBalanceRowDTO[]
  kqkd: {
    hasPriorYear: boolean
    lines: KqkdLineDTO[]
    metrics: Array<{ label: string; current: string; prior: string }>
  } | null
  monthly: MonthlyGroupDTO[]
  accounts: AccountStatsDTO[]
  pairs: PairStatsDTO[]
  findings: AuditFinding[]
  journals: JournalRowDTO[]
  journalsTotal: number
  journalsCapped: boolean
}
export interface AuditAnalyzeRequest {
  filePath: string
  sheetName?: string
  overall?: number
  performance?: number
  clearlyTrivial?: number
  fiscalYear?: number
}

export interface ChartImageItem {
  id: string
  title: string
  pngBase64: string
  width?: number
  height?: number
}

export interface AuditExportRequest {
  filePath: string
  sheetName?: string
  suggestedName?: string
  overall?: number
  performance?: number
  clearlyTrivial?: number
  fiscalYear?: number
  chartImages?: ChartImageItem[]
  glAnalyticsData?: unknown // GlAnalyticsResult
}
