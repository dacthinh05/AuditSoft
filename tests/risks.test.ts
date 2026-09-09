import { describe, expect, it } from 'vitest'
import { moneyFromNumber } from '../src/domain/money'
import { buildRiskContext, runRiskEngine, DEFAULT_RISK_CONFIG } from '../src/main/risks/AuditRuleEngine'
import { defaultRiskRules } from '../src/main/risks/rules'
import type { IncomeStatementData, JournalEntry } from '../src/shared/types/analytics'

const OM = moneyFromNumber(1_000_000_000)
const PM = moneyFromNumber(750_000_000)
const CTT = moneyFromNumber(50_000_000)
void OM
void PM
void CTT

const rules = defaultRiskRules()

function entry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    source: { fileName: 't.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: partial.postingDate ?? null,
    documentNumber: partial.documentNumber ?? 'PT1',
    description: partial.description ?? '',
    debitAccount: partial.debitAccount ?? '',
    creditAccount: partial.creditAccount ?? '',
    amount: partial.amount ?? moneyFromNumber(0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: partial.postingDate ? Number(partial.postingDate.slice(5, 7)) : null,
    issues: [],
  }
}

function isData(prior: Record<string, number>, current: Record<string, number>): IncomeStatementData {
  return {
    lines: Object.keys(current).map((maSo) => ({
      maSo,
      chiTieu: maSo,
      current: moneyFromNumber(current[maSo]!),
      prior: prior[maSo] != null ? moneyFromNumber(prior[maSo]!) : null,
    })),
    source: null,
  }
}

describe('Risk engine — materiality gating (§13/§46)', () => {
  it('+200% nhưng số nhỏ → KHÔNG phát finding HIGH', () => {
    const ctx = buildRiskContext([], DEFAULT_RISK_CONFIG, {
      isAnalysis: isData({ '10': 1000 }, { '10': 3000 }),
    })
    const findings = runRiskEngine(ctx, rules)
    const rev = findings.find((f) => f.ruleId === 'REVENUE_FLUCTUATION')
    expect(rev ?? null).toBeNull() // Δ=2000 << PM
  })

  it('+25% với chênh ~16 tỷ → material', () => {
    const ctx = buildRiskContext([], DEFAULT_RISK_CONFIG, {
      isAnalysis: isData({ '10': 64_000_000_000 }, { '10': 80_000_000_000 }),
    })
    const findings = runRiskEngine(ctx, rules)
    const rev = findings.find((f) => f.ruleId === 'REVENUE_FLUCTUATION')
    expect(rev).toBeDefined()
    expect(['HIGH', 'MEDIUM']).toContain(rev!.riskLevel)
    // explainability §29
    expect(rev!.explanation.some((e) => e.label === 'Rule')).toBe(true)
    expect(rev!.reasons.length).toBeGreaterThan(0)
  })

  it('GM giảm >3pp + COGS tăng material → HIGH với evidence 511/632', () => {
    // prior GM = 23%; current GM ≈ 18.0% → −5.0 pp; ΔCOGS ≈ 22.3 tỷ ≥ PM
    const ctx = buildRiskContext([], DEFAULT_RISK_CONFIG, {
      isAnalysis: isData(
        { '10': 186_400_000_000, '11': 143_528_000_000 },
        { '10': 202_240_000_000, '11': 165_837_000_000 },
      ),
    })
    const findings = runRiskEngine(ctx, rules)
    const gm = findings.find((f) => f.ruleId === 'GROSS_MARGIN_SHIFT')
    expect(gm).toBeDefined()
    expect(gm!.riskLevel).not.toBe('LOW')
    expect(gm!.evidence.accounts).toEqual(['511', '632'])
  })
})

describe('Risk engine — clustering JE (§47)', () => {
  it('47 bút toán T12 của 511 → 1 finding cụm kèm evidence count', () => {
    const entries: JournalEntry[] = []
    for (let i = 0; i < 47; i++) {
      entries.push(
        entry({
          id: `je-${i}`,
          postingDate: `2025-12-28`,
          documentNumber: `CT${i}`,
          debitAccount: '13111',
          creditAccount: '51111',
          amount: moneyFromNumber(400_000_000),
        }),
      )
    }
    // thêm nền các tháng khác để T12 là đột biến
    for (let m = 1; m <= 11; m++) {
      entries.push(entry({ postingDate: `2025-${String(m).padStart(2, '0')}-15`, debitAccount: '13111', creditAccount: '51111', amount: moneyFromNumber(300_000_000) }))
    }
    const ctx = buildRiskContext(entries, { ...DEFAULT_RISK_CONFIG, year: 2025 })
    const findings = runRiskEngine(ctx, rules)
    const dec = findings.find((f) => f.ruleId === 'DECEMBER_REVENUE_CONCENTRATION')
    expect(dec).toBeDefined()
    const yearend = findings.find((f) => f.ruleId === 'YEAR_END_JOURNAL_CLUSTER')
    expect(yearend).toBeDefined()
    expect(dec!.evidence.journalEntryIds?.length).toBe(47)
    expect(dec!.observation).toContain('47 bút toán')
  })

  it('duplicate cluster: nhiều dòng trùng → 1 finding EXACTDUP', () => {
    const entries = [
      entry({ postingDate: '2025-01-05', documentNumber: 'PT1', debitAccount: '152', creditAccount: '331', amount: moneyFromNumber(500), id: 'a' }),
      entry({ postingDate: '2025-01-05', documentNumber: 'PT1', debitAccount: '152', creditAccount: '331', amount: moneyFromNumber(500), id: 'b' }),
      entry({ postingDate: '2025-02-05', documentNumber: 'PT2', debitAccount: '152', creditAccount: '331', amount: moneyFromNumber(600), id: 'c' }),
      entry({ postingDate: '2025-02-05', documentNumber: 'PT2', debitAccount: '152', creditAccount: '331', amount: moneyFromNumber(600), id: 'd' }),
    ]
    const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
    const findings = runRiskEngine(ctx, rules)
    const dupFindings = findings.filter((f) => f.ruleId === 'DUPLICATE_JOURNAL_GROUPS')
    expect(dupFindings).toHaveLength(1)
    expect(dupFindings[0]!.id).toBe('DUPLICATE_JOURNAL_GROUPS:EXACTDUP')
  })

  it('round-number + weekend + rare pair hoạt động đúng gate', () => {
    const entries = [
      // round number ≥ OM*10%
      entry({ postingDate: '2025-03-03', debitAccount: '151', creditAccount: '331', amount: moneyFromNumber(500_000_000), id: 'r1' }),
      // rare pair (xuất hiện 1 lần, share thấp, ≥ CTT): Nợ 811 / Có 131
      entry({ postingDate: '2025-06-06', documentNumber: 'PC9', debitAccount: '8118', creditAccount: '13199', amount: moneyFromNumber(120_000_000), id: 'rp1' }),
      // nền cho 131/331 đông đảo
      ...Array.from({ length: 40 }, (_, i) =>
        entry({ postingDate: '2025-07-07', documentNumber: `BG${i}`, debitAccount: '1311', creditAccount: '3311', amount: moneyFromNumber(20_000_000), id: `bg${i}` }),
      ),
    ]
    const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
    const findings = runRiskEngine(ctx, rules)
    expect(findings.find((f) => f.ruleId === 'ROUND_NUMBER_JOURNALS')).toBeDefined()
    expect(findings.find((f) => f.ruleId === 'RARE_COUNTER_ACCOUNT')).toBeDefined()
  })

  it('GL lệch Nợ/Có → CRITICAL đứng đầu', () => {
    const rec = {
      rows: [],
      unmatchedGlAccounts: [],
      totalGlDebit: moneyFromNumber(100),
      totalGlCredit: moneyFromNumber(97),
      balanced: false,
      status: 'ERROR' as const,
    }
    const ctx = buildRiskContext([], DEFAULT_RISK_CONFIG, { reconciliation: rec })
    const findings = runRiskEngine(ctx, rules)
    expect(findings[0]!.ruleId).toBe('GL_DEBIT_CREDIT_MISMATCH')
    expect(findings[0]!.riskLevel).toBe('CRITICAL')
  })

  it('data quality thấp → mọi finding gắn cảnh báo (§43), không drop', () => {
    const ctx = buildRiskContext([], DEFAULT_RISK_CONFIG, {
      dataQuality: {
        totalRows: 10, validPostingDate: 3, validDebitAccount: 4, validCreditAccount: 4, validAmount: 3,
        missingDocumentNumber: 5, duplicateExactRows: 2, negativeAmounts: 1, invalidAccounts: 3,
        score: 42, reliable: false, warnings: ['ngày lỗi'],
      },
      reconciliation: {
        rows: [], unmatchedGlAccounts: [], totalGlDebit: moneyFromNumber(10), totalGlCredit: moneyFromNumber(7),
        balanced: false, status: 'ERROR',
      },
    })
    const findings = runRiskEngine(ctx, rules)
    expect(findings.length).toBeGreaterThan(0)
    for (const f of findings) {
      expect(f.explanation.some((e) => e.label === 'Cảnh báo dữ liệu')).toBe(true)
    }
  })

  it('không dùng từ ngữ overclaim (§48)', () => {
    const entries = [entry({ postingDate: '2025-12-30', debitAccount: '131', creditAccount: '511', amount: moneyFromNumber(900_000_000), id: 'x1' })]
    const ctx = buildRiskContext(entries, { ...DEFAULT_RISK_CONFIG, year: 2025 })
    const findings = runRiskEngine(ctx, rules)
    const banned = ['fraud', 'gian lận', 'trốn thuế', 'ghi nhận sai', 'sai sót kế toán']
    for (const f of [...findings, ...(ctx.reconciliation ? [] : [])]) {
      const text = `${f.title} ${f.observation} ${f.auditImplication}`.toLowerCase()
      for (const b of banned) expect(text.includes(b)).toBe(false)
    }
  })
})
