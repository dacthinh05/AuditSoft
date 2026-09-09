import { moneyToNumber } from '../domain/money'
import type {
  AccountStatsDTO,
  AnalysisResult,
  AuditFinding,
  JournalRowDTO,
  KqkdLineDTO,
  MonthlyGroupDTO,
  PairStatsDTO,
  ReconRowDTO,
} from '../shared/types/analytics'
import { displayName } from './accounting/AccountClassifier'
import { checkTrialBalanceEquation, reconcileGlWithTrialBalance } from './accounting/AccountingReconciliationEngine'
import { ExcelImportService } from './excel/ExcelImportService'
import { analyzeIncomeStatement } from './analytics/TrendAnalysisEngine'
import { buildRiskContext, runRiskEngine, DEFAULT_RISK_CONFIG, type RiskConfig } from './risks/AuditRuleEngine'
import { defaultRiskRules } from './risks/rules'

export interface RunAnalysisOptions {
  filePath: string
  overall?: number
  performance?: number
  clearlyTrivial?: number
  fiscalYear?: number
  /** giới hạn số journal gửi sang renderer (mặc định 50.000) */
  journalsCap?: number
}

function makeConfig(opts: RunAnalysisOptions): RiskConfig {
  const m = DEFAULT_RISK_CONFIG.materiality
  return {
    ...DEFAULT_RISK_CONFIG,
    year: opts.fiscalYear ?? DEFAULT_RISK_CONFIG.year,
    materiality: {
      overall: opts.overall != null ? { raw: BigInt(Math.max(0, Math.round(opts.overall))), scale: 0 } : m.overall,
      performance: opts.performance != null ? { raw: BigInt(Math.max(0, Math.round(opts.performance))), scale: 0 } : m.performance,
      clearlyTrivial: opts.clearlyTrivial != null ? { raw: BigInt(Math.max(0, Math.round(opts.clearlyTrivial))), scale: 0 } : m.clearlyTrivial,
    },
  }
}

const pctLabel = (v: number | null | undefined): string =>
  v == null || !Number.isFinite(v) ? 'n/a' : `${(v * 100).toFixed(1).replace('.', ',')}%`

/** Chạy toàn bộ pipeline: import → normalize → reconcile → analytics → risk engine. */
export async function runFullAnalysis(opts: RunAnalysisOptions): Promise<AnalysisResult> {
  const config = makeConfig(opts)
  const imp = await new ExcelImportService().importWorkbook(opts.filePath)
  const entries = imp.journal?.entries ?? []

  const reconciliation = imp.trialBalance.length > 0 ? reconcileGlWithTrialBalance(entries, imp.trialBalance) : null
  const tbIssues = imp.trialBalance.length > 0 ? checkTrialBalanceEquation(imp.trialBalance) : []
  const kqkdCmp = imp.incomeStatement && imp.incomeStatement.lines.length > 0 ? analyzeIncomeStatement(imp.incomeStatement) : null

  const ctx = buildRiskContext(entries, config, {
    reconciliation: reconciliation ?? undefined,
    tbEquationIssues: tbIssues,
    isAnalysis: kqkdCmp,
    dataQuality: imp.journal?.quality ?? null,
  })
  const findings: AuditFinding[] = runRiskEngine(ctx, defaultRiskRules())

  // ── DTO hóa ──
  const cap = opts.journalsCap ?? 50_000
  const journals: JournalRowDTO[] = entries.slice(0, cap).map((e) => ({
    id: e.id,
    date: e.postingDate,
    doc: e.documentNumber,
    desc: e.description,
    debit: e.debitAccount,
    credit: e.creditAccount,
    amount: moneyToNumber(e.amount),
    month: e.month,
    issues: e.issues,
  }))

  const accountsDTO: AccountStatsDTO[] = [...ctx.accountStats.values()]
    .map((s) => ({
      account: s.account,
      name: displayName(s.account),
      debit: moneyToNumber(s.debitTurnover),
      credit: moneyToNumber(s.creditTurnover),
      count: s.count,
    }))
    .sort((a, b) => b.debit + b.credit - (a.debit + a.credit))

  const pairsDTO: PairStatsDTO[] = [...ctx.pairStats.values()]
    .map((p) => ({ debit: p.debit, credit: p.credit, count: p.count, total: moneyToNumber(p.total) }))
    .sort((a, b) => b.total - a.total)

  const monthlyDTO: MonthlyGroupDTO[] = [...ctx.monthly.values()].map((g) => ({
    group: g.group,
    buckets: g.buckets.map((b) => ({ month: b.month, debit: moneyToNumber(b.debit), credit: moneyToNumber(b.credit), count: b.count })),
    totalAmount: moneyToNumber(g.totalAmount),
    maxMonth: g.maxMonth,
    maxMonthShare: g.maxMonthShare,
  }))

  const reconRows: ReconRowDTO[] = (reconciliation?.rows ?? []).map((r) => ({
    account: r.account,
    name: r.accountName,
    glDebit: moneyToNumber(r.glDebit),
    glCredit: moneyToNumber(r.glCredit),
    tbDebit: moneyToNumber(r.tbDebit),
    tbCredit: moneyToNumber(r.tbCredit),
    diffDebit: moneyToNumber(r.diffDebit),
    diffCredit: moneyToNumber(r.diffCredit),
    status: r.status,
    note: r.note,
  }))

  let kqkdDto: AnalysisResult['kqkd'] = null
  if (kqkdCmp) {
    const lines: KqkdLineDTO[] = kqkdCmp.lines.map((l) => ({
      maSo: l.maSo,
      chiTieu: l.chiTieu,
      current: l.current == null ? null : moneyToNumber(l.current),
      prior: l.prior == null ? null : moneyToNumber(l.prior),
      change: l.absoluteChange == null ? null : moneyToNumber(l.absoluteChange),
      pctChange: l.pctChange,
    }))
    const m = kqkdCmp.metrics
    kqkdDto = {
      hasPriorYear: kqkdCmp.hasPriorYear,
      lines,
      metrics: [
        { label: 'Tăng trưởng doanh thu', current: pctLabel(m.revenueGrowthPct), prior: '' },
        { label: 'Biên lợi nhuận gộp', current: pctLabel(m.grossMarginCurrent), prior: pctLabel(m.grossMarginPrior) },
        { label: 'Biên HĐKD', current: pctLabel(m.operatingMarginCurrent), prior: pctLabel(m.operatingMarginPrior) },
        { label: 'Biên LNST', current: pctLabel(m.netMarginCurrent), prior: pctLabel(m.netMarginPrior) },
        { label: 'Tăng trưởng giá vốn', current: pctLabel(m.cogsGrowthPct), prior: '' },
        { label: 'Tăng trưởng CP QLDN', current: pctLabel(m.adminExpenseGrowthPct), prior: '' },
        { label: 'Tăng trưởng CP bán hàng', current: pctLabel(m.sellingExpenseGrowthPct), prior: '' },
        { label: 'Tăng trưởng CP tài chính', current: pctLabel(m.financeCostGrowthPct), prior: '' },
      ],
    }
  }

  return {
    fileName: imp.fileName,
    classifications: imp.classifications,
    selected: imp.selected,
    needsReview: imp.needsReview,
    quality: imp.journal?.quality ?? null,
    balanced: reconciliation?.balanced ?? true,
    reconStatus: reconciliation?.status ?? 'PASS',
    reconciliation: reconRows,
    unmatchedGlAccounts: reconciliation?.unmatchedGlAccounts ?? [],
    kqkd: kqkdDto,
    monthly: monthlyDTO,
    accounts: accountsDTO,
    pairs: pairsDTO,
    findings,
    journals,
    journalsTotal: entries.length,
    journalsCapped: entries.length > cap,
  }
}
