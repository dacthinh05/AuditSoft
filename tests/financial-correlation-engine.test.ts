import { describe, expect, it } from 'vitest'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import { FinancialCorrelationEngine } from '../src/domain/analytics/FinancialCorrelationEngine'

function createMockEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: `mock-${Math.random()}`,
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: '2025-01-15',
    documentNumber: 'PKT001',
    description: 'Nghiệp vụ mẫu',
    debitAccount: '111',
    creditAccount: '112',
    amount: makeMoney(1000000n, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: 'DT01',
    customerName: 'Đối tác 1',
    month: 1,
    issues: [],
    ...partial,
  }
}

describe('FinancialCorrelationEngine', () => {
  it('tính chính xác Biên lãi gộp 12 tháng và phát hiện tháng có biên âm', () => {
    const entries: JournalEntry[] = [
      // Tháng 1: DT 10 tỷ, Giá vốn 7 tỷ => Lãi gộp 3 tỷ (30%)
      createMockEntry({ month: 1, creditAccount: '511', amount: makeMoney(10000000000n, 0) }),
      createMockEntry({ month: 1, debitAccount: '632', amount: makeMoney(7000000000n, 0) }),

      // Tháng 2: DT 8 tỷ, Giá vốn 10 tỷ => Lãi gộp -2 tỷ (-25% => Biên âm)
      createMockEntry({ month: 2, creditAccount: '511', amount: makeMoney(8000000000n, 0) }),
      createMockEntry({ month: 2, debitAccount: '632', amount: makeMoney(10000000000n, 0) }),
    ]

    const result = FinancialCorrelationEngine.computeGrossMargin(entries)
    expect(result.points.length).toBe(12)

    // Tháng 1
    expect(result.points[0].grossProfit.raw).toBe(3000000000n)
    expect(result.points[0].grossMarginPct).toBe(30)
    expect(result.points[0].isNegative).toBe(false)

    // Tháng 2
    expect(result.points[1].grossProfit.raw).toBe(-2000000000n)
    expect(result.points[1].grossMarginPct).toBe(-25)
    expect(result.points[1].isNegative).toBe(true)
    expect(result.points[1].isAnomaly).toBe(true)

    // Cảnh báo kiểm toán
    expect(result.anomalousMonths).toContain(2)
    expect(result.auditWarning).toContain('biên lợi nhuận gộp âm')
  })

  it('bóc tách đúng cơ cấu chi phí giá vốn (621/622/627/154) và tổng bằng 100%', () => {
    const entries: JournalEntry[] = [
      // Tháng 3: NVL 500tr (50%), NCTT 300tr (30%), SXC 200tr (20%) => Tổng 1 tỷ
      createMockEntry({ month: 3, debitAccount: '621', amount: makeMoney(500000000n, 0) }),
      createMockEntry({ month: 3, debitAccount: '622', amount: makeMoney(300000000n, 0) }),
      createMockEntry({ month: 3, debitAccount: '627', amount: makeMoney(200000000n, 0) }),
    ]

    const result = FinancialCorrelationEngine.computeCogsStructure(entries)
    const m3 = result.months[2]
    expect(m3.totalCosts.raw).toBe(1000000000n)
    expect(m3.materialPct).toBe(50)
    expect(m3.laborPct).toBe(30)
    expect(m3.overheadPct).toBe(20)
    expect(m3.materialPct + m3.laborPct + m3.overheadPct).toBe(100)
  })

  it('tính đúng tỷ lệ OPEX trên doanh thu', () => {
    const entries: JournalEntry[] = [
      // Tháng 5: DT 10 tỷ, CPBH 500tr (5%), CPQL 1 tỷ (10%) => Tổng OPEX 15%
      createMockEntry({ month: 5, creditAccount: '511', amount: makeMoney(10000000000n, 0) }),
      createMockEntry({ month: 5, debitAccount: '641', amount: makeMoney(500000000n, 0) }),
      createMockEntry({ month: 5, debitAccount: '642', amount: makeMoney(1000000000n, 0) }),
    ]

    const result = FinancialCorrelationEngine.computeOpexRatios(entries)
    const m5 = result.points[4]
    expect(m5.sellingRatioPct).toBe(5)
    expect(m5.adminRatioPct).toBe(10)
    expect(m5.totalOpexRatioPct).toBe(15)
  })

  it('xây dựng chính xác chuỗi cầu nối lợi nhuận Waterfall', () => {
    const entries: JournalEntry[] = [
      createMockEntry({ creditAccount: '511', amount: makeMoney(10000000000n, 0) }), // DT 10 tỷ
      createMockEntry({ debitAccount: '632', amount: makeMoney(6000000000n, 0) }),  // Giá vốn 6 tỷ => Lãi gộp 4 tỷ
      createMockEntry({ creditAccount: '515', amount: makeMoney(200000000n, 0) }),  // DTTC 200tr
      createMockEntry({ debitAccount: '635', amount: makeMoney(500000000n, 0) }),   // CPTC 500tr
      createMockEntry({ debitAccount: '641', amount: makeMoney(300000000n, 0) }),   // CPBH 300tr
      createMockEntry({ debitAccount: '642', amount: makeMoney(400000000n, 0) }),   // CPQL 400tr
    ]

    const steps = FinancialCorrelationEngine.computeProfitWaterfall(entries, null)
    expect(steps.length).toBe(9)

    // Bước 1: DT thuần 10 tỷ
    expect(steps[0].key).toBe('REV_511')
    expect(steps[0].cumulative.raw).toBe(10000000000n)

    // Bước 3: Lợi nhuận gộp = 10B - 6B = 4 tỷ
    expect(steps[2].key).toBe('GROSS_PROFIT')
    expect(steps[2].cumulative.raw).toBe(4000000000n)

    // Bước cuối: LNTT = 4B + 200M - 500M - 300M - 400M = 3.000.000.000 đ
    const pbtStep = steps[steps.length - 1]
    expect(pbtStep.key).toBe('PBT')
    expect(pbtStep.cumulative.raw).toBe(3000000000n)
  })
})
