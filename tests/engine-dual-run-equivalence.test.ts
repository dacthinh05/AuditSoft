import { describe, expect, it } from 'vitest'
import { InMemoryJsEngine } from '../src/domain/engine/InMemoryJsEngine'
import { fromJournalEntry } from '../src/domain/engine/IAuditDataEngine'
import { EbitdaCalculator } from '../src/domain/analytics/EbitdaCalculator'
import { ConcentrationAnalyzer } from '../src/domain/analytics/ConcentrationAnalyzer'
import { RelatedPartyScanner } from '../src/domain/analytics/RelatedPartyScanner'
import { SqlAnalyticsService } from '../src/domain/analytics/sql/SqlAnalyticsService'
import { makeMoney } from '../src/domain/money'
import type { IncomeStatementData, JournalEntry } from '../src/shared/types/analytics'

describe('Phase 2: Dual-Run Equivalence Verification (SQL Engine vs JS Array Engine)', () => {
  const sampleEntries: JournalEntry[] = [
    {
      id: 'je_1',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
      postingDate: '2024-01-10',
      documentNumber: 'PC01',
      description: 'Chi tiền trả lãi vay ngân hàng',
      debitAccount: '6351',
      creditAccount: '1121',
      amount: makeMoney(120_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'VCB',
      customerName: 'Vietcombank',
      month: 1,
      issues: [],
    },
    {
      id: 'je_2',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 2 },
      postingDate: '2024-02-15',
      documentNumber: 'PT01',
      description: 'Lãi tiền gửi ngân hàng',
      debitAccount: '1121',
      creditAccount: '5151',
      amount: makeMoney(20_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'VCB',
      customerName: 'Vietcombank',
      month: 2,
      issues: [],
    },
    {
      id: 'je_3',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 3 },
      postingDate: '2024-03-20',
      documentNumber: 'PKT01',
      description: 'Khấu hao tài sản cố định nhà xưởng',
      debitAccount: '6424',
      creditAccount: '2141',
      amount: makeMoney(50_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: '',
      customerName: '',
      month: 3,
      issues: [],
    },
    {
      id: 'je_4',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 4 },
      postingDate: '2024-04-05',
      documentNumber: 'HĐ01',
      description: 'Doanh thu bán máy móc cho Công ty Hoàng Hà',
      debitAccount: '131',
      creditAccount: '5111',
      amount: makeMoney(800_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'HOANGHA',
      customerName: 'Công ty Hoàng Hà',
      month: 4,
      issues: [],
    },
    {
      id: 'je_5',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 5 },
      postingDate: '2024-05-12',
      documentNumber: 'HĐ02',
      description: 'Doanh thu dịch vụ cho Công ty Minh Quân',
      debitAccount: '131',
      creditAccount: '5112',
      amount: makeMoney(200_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'MINHQUAN',
      customerName: 'Công ty Minh Quân',
      month: 5,
      issues: [],
    },
    {
      id: 'je_6',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 6 },
      postingDate: '2024-06-18',
      documentNumber: 'PC02',
      description: 'Cho công ty liên kết mượn vốn ngắn hạn không tính lãi',
      debitAccount: '1283',
      creditAccount: '1121',
      amount: makeMoney(250_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'LIENKET_A',
      customerName: 'Công ty CP Liên kết A',
      month: 6,
      issues: [],
    },
  ]

  const sampleKQKD: IncomeStatementData = {
    source: { fileName: 'test.xlsx', sheetName: 'KQKD' },
    lines: [
      {
        chiTieu: 'Lợi nhuận thuần từ hoạt động kinh doanh',
        maSo: '30',
        thuyetMinh: '',
        current: makeMoney(400_000_000n, 0),
        previous: makeMoney(350_000_000n, 0),
      },
    ],
  }

  it('1. So sánh đối chứng EBITDA: SQL Engine vs JS Legacy Engine', async () => {
    const engine = new InMemoryJsEngine()
    await engine.initialize()
    await engine.bulkInsert(sampleEntries.map((e, idx) => fromJournalEntry(e, idx + 1)))

    const legacyResult = EbitdaCalculator.calculate(sampleEntries, sampleKQKD)
    const sqlResult = await SqlAnalyticsService.runEbitdaAnalysis(engine, sampleKQKD)

    expect(sqlResult.interestExpense.raw).toBe(legacyResult.interestExpense.raw)
    expect(sqlResult.interestIncome.raw).toBe(legacyResult.interestIncome.raw)
    expect(sqlResult.netInterest.raw).toBe(legacyResult.netInterest.raw)
    expect(sqlResult.depreciation.raw).toBe(legacyResult.depreciation.raw)
    expect(sqlResult.operatingProfit.raw).toBe(legacyResult.operatingProfit.raw)
    expect(sqlResult.ebitda.raw).toBe(legacyResult.ebitda.raw)
    expect(sqlResult.cap30.raw).toBe(legacyResult.cap30.raw)
    expect(sqlResult.disallowedInterest.raw).toBe(legacyResult.disallowedInterest.raw)
    expect(sqlResult.isOverCap).toBe(legacyResult.isOverCap)

    await engine.destroy()
  })

  it('2. So sánh đối chứng Pareto: SQL Window Functions vs JS Map Accumulator', async () => {
    const engine = new InMemoryJsEngine()
    await engine.initialize()
    await engine.bulkInsert(sampleEntries.map((e, idx) => fromJournalEntry(e, idx + 1)))

    const legacyPareto = ConcentrationAnalyzer.analyze(sampleEntries)
    const sqlPareto = await SqlAnalyticsService.runParetoAnalysis(engine)

    expect(sqlPareto.topCustomers.length).toBe(legacyPareto.topCustomers.length)
    expect(sqlPareto.topCustomers[0].objectCode).toBe('HOANGHA')
    expect(sqlPareto.topCustomers[0].amount.raw).toBe(800_000_000n)
    expect(sqlPareto.topCustomers[0].percentage).toBe(80)
    expect(sqlPareto.topCustomers[0].cumulativePercentage).toBe(80)

    await engine.destroy()
  })

  it('3. So sánh đối chứng Quét bên liên quan VSA 550', async () => {
    const engine = new InMemoryJsEngine()
    await engine.initialize()
    await engine.bulkInsert(sampleEntries.map((e, idx) => fromJournalEntry(e, idx + 1)))

    const legacyFindings = RelatedPartyScanner.scan(sampleEntries)
    const sqlFindings = await SqlAnalyticsService.runRelatedPartyScan(engine, 100_000_000n)
    expect(sqlFindings.length).toBe(legacyFindings.length)
    expect(sqlFindings.length).toBe(1)
    expect(sqlFindings[0].totalAmount.raw).toBe(250_000_000n)
    expect(sqlFindings[0].type).toBe('ZERO_INTEREST_LENDING')

    await engine.destroy()
  })
})
