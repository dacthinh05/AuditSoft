import type { Money } from '../../domain/money'
import { moneyFromNumber } from '../../domain/money'
import type {
  AccountStats,
  DataQualityReport,
  DuplicateGroups,
  JournalEntry,
  KqkdComparison,
  MaterialityConfig,
  PairStats,
  RawFinding,
  ReconciliationResult,
} from '../../shared/types/analytics'
import { computeAccountStats, computePairStats, detectDuplicates, detectManualKeywordEntries, detectRareCounterAccounts, detectRoundNumbers, detectWeekendEntries, detectYearEndWindow } from '../analytics/JournalAnalyticsEngine'
import { analyzeIncomeStatement } from '../analytics/TrendAnalysisEngine'
import { computeMonthlyByGroup, type MonthlyGroupStats } from '../analytics/MonthlyAnalyticsEngine'
import type { IncomeStatementData } from '../../shared/types/analytics'

export interface RiskThresholds {
  revenueGrowthPct: number
  grossMarginDropPP: number
  expenseGrowthPct: number
  decemberShareMultiple: number
  weekendShareThreshold: number
  rarePairMaxCount: number
  rarePairMaxShare: number
  roundDivisor: bigint
}

export interface RiskConfig {
  materiality: MaterialityConfig
  fiscalYearEnd: string
  yearEndWindowDays: number
  year: number
  thresholds: RiskThresholds
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  materiality: {
    overall: moneyFromNumber(1_000_000_000),
    performance: moneyFromNumber(750_000_000),
    clearlyTrivial: moneyFromNumber(50_000_000),
  },
  fiscalYearEnd: '12-31',
  yearEndWindowDays: 4,
  year: new Date().getUTCFullYear(),
  thresholds: {
    revenueGrowthPct: 0.2,
    grossMarginDropPP: 3,
    expenseGrowthPct: 0.25,
    decemberShareMultiple: 2,
    weekendShareThreshold: 0.05,
    rarePairMaxCount: 3,
    rarePairMaxShare: 0.2,
    roundDivisor: 100_000_000n,
  },
}

/** Ngữ cảnh dùng chung cho mọi rule — tính sẵn bằng Map để O(n) một lần. */
export interface RiskContext {
  entries: readonly JournalEntry[]
  reconciliation: ReconciliationResult | null
  tbEquationIssues: Array<{ account: string; issue: string }>
  isAnalysis: KqkdComparison | null
  monthly: Map<string, MonthlyGroupStats>
  accountStats: Map<string, AccountStats>
  pairStats: Map<string, PairStats>
  duplicates: DuplicateGroups
  roundNumbers: ReturnType<typeof detectRoundNumbers>
  weekend: { ids: string[]; share: number; total: number }
  manualIds: string[]
  yearEnd: { ids: string[]; total: Money; byPriorityAccounts: boolean }
  rarePairs: Array<{ debit: string; credit: string; count: number; total: Money }>
  priorAccountSet: Set<string> | null
  dataQuality: DataQualityReport | null
  config: RiskConfig
}

export function buildRiskContext(
  entries: readonly JournalEntry[],
  config: RiskConfig,
  opts: {
    reconciliation?: ReconciliationResult | null
    tbEquationIssues?: Array<{ account: string; issue: string }>
    /** Nhận cả KqkdComparison lẫn IncomeStatementData thô — tự phân tích nếu cần */
    isAnalysis?: KqkdComparison | IncomeStatementData | null
    priorAccountSet?: Set<string> | null
    dataQuality?: DataQualityReport | null
  } = {},
): RiskContext {
  const accountStats = computeAccountStats(entries)
  const pairStats = computePairStats(entries)
  const t = config.thresholds
  const rawIs = opts.isAnalysis ?? null
  const isAnalysis =
    rawIs == null ? null : 'metrics' in rawIs && 'hasPriorYear' in rawIs ? (rawIs as KqkdComparison) : analyzeIncomeStatement(rawIs as IncomeStatementData)
  return {
    entries,
    reconciliation: opts.reconciliation ?? null,
    tbEquationIssues: opts.tbEquationIssues ?? [],
    isAnalysis,
    monthly: computeMonthlyByGroup(entries),
    accountStats,
    pairStats,
    duplicates: detectDuplicates(entries),
    roundNumbers: detectRoundNumbers(entries, t.roundDivisor, scaleMoney(config.materiality.overall, 0.1)),
    weekend: detectWeekendEntries(entries, isoToUtcDate),
    manualIds: detectManualKeywordEntries(entries),
    yearEnd: detectYearEndWindow(entries, config.fiscalYearEnd, config.yearEndWindowDays, config.year),
    rarePairs: detectRareCounterAccounts(pairStats, accountStats, {
      maxCount: t.rarePairMaxCount,
      maxShare: t.rarePairMaxShare,
      minTotal: config.materiality.clearlyTrivial,
    }).pairs,
    priorAccountSet: opts.priorAccountSet ?? null,
    dataQuality: opts.dataQuality ?? null,
    config,
  }
}

export interface AuditRule {
  id: string
  description: string
  evaluate(ctx: RiskContext): RawFinding[]
}

export function isoToUtcDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return new Date(NaN)
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

export function scaleMoney(base: Money, ratio: number): Money {
  return moneyFromNumber(Math.max(0, Number(base.raw) / Math.pow(10, base.scale) * ratio))
}

const SEVERITY_CUTS = { critical: 80, high: 60, medium: 35 }

export function severityFromScore(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' {
  if (score >= SEVERITY_CUTS.critical) return 'CRITICAL'
  if (score >= SEVERITY_CUTS.high) return 'HIGH'
  if (score >= SEVERITY_CUTS.medium) return 'MEDIUM'
  if (score > 0) return 'LOW'
  return 'INFO'
}

export const MAX_EVIDENCE_IDS = 300

/** Chạy toàn bộ rule → AuditFinding[] sort theo severity/score (deterministic). */
export function runRiskEngine(ctx: RiskContext, rules: readonly AuditRule[]): import('../../shared/types/analytics').AuditFinding[] {
  const raws: RawFinding[] = []
  for (const rule of rules) raws.push(...rule.evaluate(ctx))
  let findings = toFindings(raws)
  // §43: chất lượng dữ liệu thấp → gắn cảnh báo vào mọi finding, không drop
  if (ctx.dataQuality && !ctx.dataQuality.reliable && findings.length > 0) {
    const warn = `Chất lượng dữ liệu ${ctx.dataQuality.score}/100 — độ tin cậy phân tích giảm (${ctx.dataQuality.warnings.join('; ')}).`
    findings = findings.map((f) => ({ ...f, explanation: [{ label: 'Cảnh báo dữ liệu', value: warn }, ...f.explanation] }))
  }
  return findings.sort((a, b) => {
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
    const d = order.indexOf(a.riskLevel) - order.indexOf(b.riskLevel)
    if (d !== 0) return d
    if (b.score !== a.score) return b.score - a.score
    return a.id.localeCompare(b.id)
  })
}

function toFindings(raws: readonly RawFinding[]) {
  return raws.map((r) => {
    const score = r.scores.materiality + r.scores.anomaly + r.scores.timing + r.scores.pattern
    return {
      id: `${r.ruleId}:${r.clusterKey}`,
      ruleId: r.ruleId,
      title: r.title,
      riskLevel: severityFromScore(score),
      category: r.category,
      observation: r.observation,
      currentValue: r.currentValue,
      priorValue: r.priorValue,
      difference: r.difference,
      percentageChange: r.percentageChange,
      materialityImpact: r.materialityImpact,
      score,
      reasons: r.reasons,
      auditImplication: r.auditImplication,
      recommendedProcedures: r.recommendedProcedures,
      explanation: [
        { label: 'Rule', value: r.ruleId },
        { label: 'Điểm materiality/anomaly/timing/pattern', value: `${r.scores.materiality}/${r.scores.anomaly}/${r.scores.timing}/${r.scores.pattern}` },
        ...r.reasons.map((x, i) => ({ label: `Ngưỡng/Lý do ${i + 1}`, value: x })),
      ],
      evidence: {
        ...r.evidence,
        journalEntryIds: r.evidence.journalEntryIds?.slice(0, MAX_EVIDENCE_IDS),
      },
    }
  })
}
