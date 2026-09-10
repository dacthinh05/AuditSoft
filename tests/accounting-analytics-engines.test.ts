import { describe, expect, it } from 'vitest'
import { makeMoney } from '../src/domain/money'
import type { IncomeStatementData, JournalEntry } from '../src/shared/types/analytics'
import { EbitdaCalculator } from '../src/domain/analytics/EbitdaCalculator'
import { RelatedPartyScanner } from '../src/domain/analytics/RelatedPartyScanner'
import { ConcentrationAnalyzer } from '../src/domain/analytics/ConcentrationAnalyzer'
import { Trend12MAnalyzer } from '../src/domain/analytics/Trend12MAnalyzer'

function createMockEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: `mock-${Math.random()}`,
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: '2025-06-15',
    documentNumber: 'PC001',
    description: 'Nghiệp vụ mẫu',
    debitAccount: '111',
    creditAccount: '112',
    amount: makeMoney(1000000n, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: 'KH01',
    customerName: 'Công ty A',
    month: 6,
    issues: [],
    ...partial,
  }
}

describe('EbitdaCalculator', () => {
  it('tính chính xác khi chi phí lãi vay thuần vượt trần 30% EBITDA', () => {
    // Lãi vay = 2.500.000.000 đ
    // Lãi tiền gửi = 100.000.000 đ => Lãi vay thuần = 2.400.000.000 đ
    // Khấu hao = 1.000.000.000 đ
    // LNTT HĐKD (Mã 30) = 3.000.000.000 đ
    // EBITDA = 3.000M + 2.400M + 1.000M = 6.400.000.000 đ
    // Trần 30% = 1.920.000.000 đ => Vượt trần = 480.000.000 đ
    const entries: JournalEntry[] = [
      createMockEntry({
        debitAccount: '635',
        creditAccount: '112',
        description: 'Chi trả lãi vay ngân hàng Vietinbank',
        amount: makeMoney(2500000000n, 0),
      }),
      createMockEntry({
        debitAccount: '112',
        creditAccount: '515',
        description: 'Thu lãi tiền gửi có kỳ hạn',
        amount: makeMoney(100000000n, 0),
      }),
      createMockEntry({
        debitAccount: '642',
        creditAccount: '214',
        description: 'Trích khấu hao tài sản cố định',
        amount: makeMoney(1000000000n, 0),
      }),
    ]

    const incomeStatement: IncomeStatementData = {
      lines: [
        { maSo: '30', chiTieu: 'Lợi nhuận thuần từ hoạt động kinh doanh', current: makeMoney(3000000000n, 0), prior: null },
      ],
      source: null,
    }

    const result = EbitdaCalculator.calculate(entries, incomeStatement)
    expect(result.netInterest.raw).toBe(2400000000n)
    expect(result.depreciation.raw).toBe(1000000000n)
    expect(result.ebitda.raw).toBe(6400000000n)
    expect(result.cap30.raw).toBe(1920000000n)
    expect(result.disallowedInterest.raw).toBe(480000000n)
    expect(result.isOverCap).toBe(true)
    expect(result.interestToEbitdaRatio).toBeCloseTo(37.5, 1)
  })

  it('xử lý chính xác trường hợp EBITDA âm: toàn bộ lãi vay không được trừ', () => {
    const entries: JournalEntry[] = [
      createMockEntry({
        debitAccount: '635',
        creditAccount: '112',
        description: 'Lãi vay ngân hàng',
        amount: makeMoney(500000000n, 0),
      }),
    ]

    const incomeStatement: IncomeStatementData = {
      lines: [
        { maSo: '30', chiTieu: 'Lỗ thuần từ HĐKD', current: makeMoney(-1000000000n, 0), prior: null },
      ],
      source: null,
    }

    const result = EbitdaCalculator.calculate(entries, incomeStatement)
    expect(result.ebitda.raw).toBe(-500000000n)
    expect(result.cap30.raw).toBe(0n)
    expect(result.disallowedInterest.raw).toBe(500000000n)
    expect(result.isOverCap).toBe(true)
  })
})

describe('RelatedPartyScanner', () => {
  it('phát hiện đúng nghiệp vụ cho vay không lãi suất (0%)', () => {
    const entries: JournalEntry[] = [
      createMockEntry({
        objectCode: 'CTY_CON',
        customerName: 'Công ty TNHH Con An Phát',
        debitAccount: '1281',
        creditAccount: '1121',
        description: 'Chuyển tiền cho vay ngắn hạn',
        amount: makeMoney(800000000n, 0),
      }),
    ]

    const findings = RelatedPartyScanner.scan(entries)
    expect(findings.length).toBe(1)
    expect(findings[0].type).toBe('ZERO_INTEREST_LENDING')
    expect(findings[0].totalAmount.raw).toBe(800000000n)
    expect(findings[0].severity).toBe('HIGH')
  })

  it('không báo lỗi nếu khoản vay có phát sinh thu lãi TK 515', () => {
    const entries: JournalEntry[] = [
      createMockEntry({
        objectCode: 'CTY_CON',
        customerName: 'Công ty TNHH Con An Phát',
        debitAccount: '1281',
        creditAccount: '1121',
        amount: makeMoney(800000000n, 0),
      }),
      createMockEntry({
        objectCode: 'CTY_CON',
        customerName: 'Công ty TNHH Con An Phát',
        debitAccount: '1121',
        creditAccount: '515',
        description: 'Thu lãi tiền cho vay',
        amount: makeMoney(40000000n, 0),
      }),
    ]

    const findings = RelatedPartyScanner.scan(entries)
    const lendFinding = findings.find((f) => f.type === 'ZERO_INTEREST_LENDING')
    expect(lendFinding).toBeUndefined()
  })
})

describe('ConcentrationAnalyzer', () => {
  it('xếp hạng đúng Top Khách hàng và tính tỷ trọng Pareto %', () => {
    const entries: JournalEntry[] = [
      createMockEntry({ objectCode: 'KH_A', customerName: 'Khách Hàng A', creditAccount: '511', amount: makeMoney(4000000000n, 0) }),
      createMockEntry({ objectCode: 'KH_B', customerName: 'Khách Hàng B', creditAccount: '511', amount: makeMoney(3000000000n, 0) }),
      createMockEntry({ objectCode: 'KH_C', customerName: 'Khách Hàng C', creditAccount: '511', amount: makeMoney(3000000000n, 0) }),
    ]

    const report = ConcentrationAnalyzer.analyze(entries)
    expect(report.totalRevenue.raw).toBe(10000000000n)
    expect(report.topCustomers.length).toBe(3)
    expect(report.topCustomers[0].name).toBe('Khách Hàng A')
    expect(report.topCustomers[0].percentage).toBe(40)
    expect(report.topCustomers[0].cumulativePercentage).toBe(40)
    expect(report.topCustomers[1].percentage).toBe(30)
    expect(report.topCustomers[1].cumulativePercentage).toBe(70)
    expect(report.customerRiskWarning).toContain('chiếm 40% tổng doanh thu')
  })
})

describe('Trend12MAnalyzer', () => {
  it('tính đúng ma trận 12 tháng và phát hiện doanh thu đột biến tháng 12', () => {
    const entries: JournalEntry[] = []
    // Tháng 1..11: Doanh thu 1 tỷ/tháng
    for (let m = 1; m <= 11; m++) {
      entries.push(createMockEntry({ creditAccount: '511', month: m, amount: makeMoney(1000000000n, 0) }))
    }
    // Tháng 12: Doanh thu tăng vọt lên 3 tỷ
    entries.push(createMockEntry({ creditAccount: '511', month: 12, amount: makeMoney(3000000000n, 0) }))

    const result = Trend12MAnalyzer.analyze(entries)
    const revRow = result.rows.find((r) => r.key === 'REV_511')
    expect(revRow).toBeDefined()
    expect(revRow?.total.raw).toBe(14000000000n)
    expect(revRow?.anomalyMonths).toContain(12)
    expect(result.warningNotes.some((n) => n.includes('Tháng 12'))).toBe(true)
  })
})
