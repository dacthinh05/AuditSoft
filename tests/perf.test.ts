import { describe, expect, it } from 'vitest'
import { moneyFromNumber } from '../src/domain/money'
import { buildRiskContext, runRiskEngine, DEFAULT_RISK_CONFIG } from '../src/main/risks/AuditRuleEngine'
import { computeAccountStats, computePairStats, detectDuplicates } from '../src/main/analytics/JournalAnalyticsEngine'
import { defaultRiskRules } from '../src/main/risks/rules'
import type { JournalEntry } from '../src/shared/types/analytics'

/** Sinh 500k JournalEntry hợp lệ nhanh (deterministic). */
function generateEntries(n: number): JournalEntry[] {
  const entries: JournalEntry[] = new Array(n)
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  for (let i = 0; i < n; i++) {
    const m = months[i % 12]!
    const day = String((i % 27) + 1).padStart(2, '0')
    const debit = ['13111', '1521', '64276', '1111', '11213'][i % 5]!
    const credit = ['51111', '3311', '1111', '51121', '6321'][i % 5]!
    const amount = ((i % 900) + 10) * 1_000_000
    entries[i] = {
      id: `gen::${i}`,
      source: { fileName: 'big.xlsx', sheetName: 'NKC', rowNumber: i + 2 },
      postingDate: `2025-${m}-${day}`,
      documentNumber: `CT${i % 10000}`,
      description: `Nghiệp vụ ${i % 50}`,
      debitAccount: debit,
      creditAccount: credit,
      amount: moneyFromNumber(amount),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: null,
      customerName: null,
      month: Number(m),
      issues: [],
    }
  }
  return entries
}

describe('Performance (§42) — 500k entries', () => {
  it('analytics + risk pipeline chạy trong thời gian chấp nhận được', () => {
    const n = 500_000
    const t0 = Date.now()
    const entries = generateEntries(n)
    const tGen = Date.now()

    const stats = computeAccountStats(entries)
    const pairs = computePairStats(entries)
    const dups = detectDuplicates(entries)
    void dups
    const tAgg = Date.now()

    // risk context dùng lại stats/pairs? — buildRiskContext tự tính; đo end-to-end
    const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG, { isAnalysis: null })
    const findings = runRiskEngine(ctx, defaultRiskRules())
    const tEnd = Date.now()

    expect(stats.size).toBeGreaterThan(0)
    expect(pairs.size).toBeGreaterThan(0)
    expect(Array.isArray(findings)).toBe(true)

    const genMs = tGen - t0
    const aggMs = tAgg - tGen
    const engineMs = tEnd - tAgg
    // ngưỡng rộng nhưng có ý nghĩa: tổng < 60s trên máy dev
    expect(genMs + aggMs + engineMs).toBeLessThan(60_000)
  }, 120_000)
})
