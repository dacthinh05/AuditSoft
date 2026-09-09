import { describe, expect, it } from 'vitest'
import { moneyFromNumber } from '../src/domain/money'
import { computeMonthlyByGroup, detectMonthSpikes } from '../src/main/analytics/MonthlyAnalyticsEngine'
import { analyzeIncomeStatement, rebuildIncomeStatementFromJournal } from '../src/main/analytics/TrendAnalysisEngine'
import { detectDuplicates } from '../src/main/analytics/JournalAnalyticsEngine'
import { isAccount, accountChain, accountLevel } from '../src/main/accounting/AccountClassifier'
import type { IncomeStatementData, JournalEntry } from '../src/shared/types/analytics'

function entry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    source: { fileName: 't.xlsx', sheetName: 'S', rowNumber: 1 },
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

describe('Account hierarchy (§7/§35)', () => {
  it('prefix matching đúng mọi tầng', () => {
    expect(isAccount('64276', '642')).toBe(true)
    expect(isAccount('642', '642')).toBe(true)
    expect(isAccount('6411', '642')).toBe(false)
    expect(accountChain('64276')).toEqual(['642', '6427', '64276'])
    expect(accountLevel('13111')).toBe(3) // cấp 1=131, cấp 2=1311, cấp 3=13111
  })
})

describe('KQKD analysis (§10/§11)', () => {
  const data: IncomeStatementData = {
    lines: [
      { maSo: '01', chiTieu: 'Doanh thu BH & CCDV', current: moneyFromNumber(1200), prior: moneyFromNumber(1000) },
      { maSo: '10', chiTieu: 'Doanh thu thuần', current: moneyFromNumber(1180), prior: moneyFromNumber(990) },
      { maSo: '11', chiTieu: 'Giá vốn hàng bán', current: moneyFromNumber(920), prior: moneyFromNumber(770) },
      { maSo: '20', chiTieu: 'Lợi nhuận gộp', current: moneyFromNumber(260), prior: moneyFromNumber(220) },
      { maSo: '25', chiTieu: 'CP QLDN', current: moneyFromNumber(150), prior: moneyFromNumber(100) },
    ],
    source: null,
  }

  it('growth %, margin %, pp change tính đúng', () => {
    const out = analyzeIncomeStatement(data)
    expect(out.metrics.revenueGrowthPct!.toFixed(4)).toBe((190 / 990).toFixed(4)) // 1180 vs 990
    const gmCur = 260 / 1180
    const gmPri = 220 / 990
    expect(out.metrics.grossMarginCurrent!).toBeCloseTo(gmCur, 10)
    expect(out.metrics.grossMarginChangePP!).toBeCloseTo((gmCur - gmPri) * 100, 10)
    expect(out.metrics.adminExpenseGrowthPct!).toBeCloseTo(0.5, 10)
    // % của doanh thu
    const l25 = out.lines.find((l) => l.maSo === '25')!
    expect(l25.pctOfRevenueCurrent!).toBeCloseTo(150 / 1180, 10)
  })

  it('rebuild KQKD từ NKC (thay link #REF!) — loại trừ nội bộ 511→911', () => {
    const entries = [
      entry({ debitAccount: '13111', creditAccount: '51111', amount: moneyFromNumber(1000) }),
      entry({ debitAccount: '9111', creditAccount: '51112', amount: moneyFromNumber(100) }), // kết chuyển nội bộ
      entry({ debitAccount: '6321', creditAccount: '15511', amount: moneyFromNumber(600) }),
      entry({ debitAccount: '64281', creditAccount: '11111', amount: moneyFromNumber(80) }),
      entry({ debitAccount: '6411', creditAccount: '11111', amount: moneyFromNumber(30) }),
    ]
    const isData = rebuildIncomeStatementFromJournal(entries)
    const get = (maSo: string) => isData.lines.find((l) => l.maSo === maSo)?.current?.raw ?? 0n
    expect(get('01')).toBe(1100n)
    expect(get('11')).toBe(600n)
    expect(get('20')).toBe(500n)
    expect(get('25')).toBe(80n)
    expect(get('50')).toBe(390n)
  })
})

describe('Monthly analytics (§12)', () => {
  it('bucket theo tháng + phát hiện spike tháng 12 có xét materiality', () => {
    const entries: JournalEntry[] = []
    for (let m = 1; m <= 11; m++) {
      for (let d = 0; d < 2; d++) {
        entries.push(
          entry({ postingDate: `2025-${String(m).padStart(2, '0')}-15`, debitAccount: '13111', creditAccount: '51111', amount: moneyFromNumber(100) }),
        )
      }
    }
    // T12 đột biến
    entries.push(entry({ postingDate: '2025-12-30', debitAccount: '13111', creditAccount: '51111', amount: moneyFromNumber(2000) }))

    const stats = computeMonthlyByGroup(entries)
    const rev = stats.get('REVENUE')!
    expect(rev.buckets[11]!.credit.raw).toBe(2000n)
    expect(rev.maxMonth).toBe(12)

    // ngưỡng thấp → spike; ngưỡng cực cao → không spike (materiality gating)
    expect(detectMonthSpikes(rev, moneyFromNumber(1))).toContain(12)
    expect(detectMonthSpikes(rev, moneyFromNumber(10 ** 12))).not.toContain(12)
  })
})

describe('Journal analytics (§15/§25/§26)', () => {
  it('duplicate exact vs near-dup', () => {
    const base = { postingDate: '2025-01-05', debitAccount: '152', creditAccount: '331' }
    const entries = [
      entry({ ...base, documentNumber: 'PT001', amount: moneyFromNumber(500), id: 'a' }),
      entry({ ...base, documentNumber: 'PT001', amount: moneyFromNumber(500), id: 'b' }), // exact dup
      entry({ ...base, documentNumber: 'PT002', amount: moneyFromNumber(500), id: 'c' }), // near-dup
      entry({ ...base, documentNumber: 'PT003', amount: moneyFromNumber(700), id: 'd' }), // khác tiền → không dup
    ]
    const dup = detectDuplicates(entries)
    expect(dup.exact).toHaveLength(1)
    expect(dup.exact[0]!.ids.sort()).toEqual(['a', 'b'])
    expect(dup.nearDuplicate.length).toBeGreaterThanOrEqual(1)
  })
})
