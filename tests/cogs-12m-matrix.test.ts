import { describe, it, expect } from 'vitest'
import { FinancialCorrelationEngine } from '../src/domain/analytics/FinancialCorrelationEngine'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'

function makeEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: `mock-${Math.random()}`,
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: '2025-01-15',
    documentNumber: 'PKT001',
    description: 'Nghiệp vụ mẫu',
    debitAccount: '111',
    creditAccount: '111',
    amount: makeMoney(1_000_000n, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: 1,
    issues: [],
    ...partial,
  }
}

describe('Cogs12MMatrix - Bóc tách Giá vốn 12 Tháng trước kết chuyển 911', () => {
  it('loại bỏ triệt để các bút toán kết chuyển 911 (Nợ 911 / Có 632 hoặc Nợ 632 / Có 911)', () => {
    const entries: JournalEntry[] = [
      // Nghiệp vụ giá vốn thật trong tháng 1
      makeEntry({ month: 1, debitAccount: '632', creditAccount: '156', amount: makeMoney(100_000_000n, 0) }),
      // Bút toán kết chuyển kỹ thuật cuối năm 911 (PHẢI BỊ LOẠI)
      makeEntry({ month: 12, debitAccount: '911', creditAccount: '632', amount: makeMoney(500_000_000n, 0) }),
      makeEntry({ month: 12, debitAccount: '632', creditAccount: '911', amount: makeMoney(50_000_000n, 0) }),
    ]

    const report = FinancialCorrelationEngine.computeCogs12MMatrix(entries)

    // Tháng 1 ghi nhận đúng 100tr
    expect(Number(report.rows[0]!.totalCogs632.raw)).toBe(100_000_000)
    // Tháng 12 không bị dính 500tr hay 50tr từ 911
    expect(Number(report.rows[11]!.totalCogs632.raw)).toBe(0)
    // Tổng giá vốn cả năm chỉ là 100tr
    expect(Number(report.annualTotals.totalCogs632.raw)).toBe(100_000_000)
  })

  it('bóc tách chuẩn xác các khoản mục chi phí đầu vào và giá vốn xuất kho theo 12 tháng', () => {
    const entries: JournalEntry[] = [
      // Tháng 3: Sản xuất (621, 622, 627, 154)
      makeEntry({ month: 3, debitAccount: '621', creditAccount: '152', amount: makeMoney(300_000_000n, 0) }),
      makeEntry({ month: 3, debitAccount: '622', creditAccount: '334', amount: makeMoney(120_000_000n, 0) }),
      makeEntry({ month: 3, debitAccount: '627', creditAccount: '111', amount: makeMoney(80_000_000n, 0) }),
      makeEntry({ month: 3, debitAccount: '154', creditAccount: '621', amount: makeMoney(300_000_000n, 0) }),
      // Tháng 3: Xuất kho thành phẩm bán
      makeEntry({ month: 3, debitAccount: '632', creditAccount: '155', amount: makeMoney(400_000_000n, 0) }),
      // Tháng 3: Doanh thu
      makeEntry({ month: 3, debitAccount: '131', creditAccount: '511', amount: makeMoney(600_000_000n, 0) }),

      // Tháng 7: Thương mại mua hàng 156 và xuất bán 156
      makeEntry({ month: 7, debitAccount: '156', creditAccount: '331', amount: makeMoney(500_000_000n, 0) }),
      makeEntry({ month: 7, debitAccount: '632', creditAccount: '156', amount: makeMoney(350_000_000n, 0) }),
      makeEntry({ month: 7, debitAccount: '112', creditAccount: '511', amount: makeMoney(500_000_000n, 0) }),
    ]

    const report = FinancialCorrelationEngine.computeCogs12MMatrix(entries)

    // Tháng 3
    const m3 = report.rows[2]!
    expect(Number(m3.directMaterials621.raw)).toBe(300_000_000)
    expect(Number(m3.directLabor622.raw)).toBe(120_000_000)
    expect(Number(m3.overhead627.raw)).toBe(80_000_000)
    expect(Number(m3.totalProductionCost.raw)).toBe(500_000_000) // 300 + 120 + 80
    expect(Number(m3.cogsFinishedGoods155.raw)).toBe(400_000_000)
    expect(Number(m3.totalCogs632.raw)).toBe(400_000_000)
    expect(Number(m3.revenue511.raw)).toBe(600_000_000)
    expect(m3.cogsToRevenuePct).toBe(66.7)

    // Tháng 7
    const m7 = report.rows[6]!
    expect(Number(m7.inventoryPurchased156.raw)).toBe(500_000_000)
    expect(Number(m7.cogsTradeGoods156.raw)).toBe(350_000_000)
    expect(Number(m7.totalCogs632.raw)).toBe(350_000_000)
    expect(Number(m7.revenue511.raw)).toBe(500_000_000)
    expect(m7.cogsToRevenuePct).toBe(70)

    // Doanh nghiệp hỗn hợp vừa sản xuất vừa thương mại
    expect(report.businessType).toBe('HYBRID')
  })

  it('phát hiện đúng kịch bản dồn giá vốn vào Tháng 12 và treo chi phí 11 tháng đầu', () => {
    const entries: JournalEntry[] = []

    // Tháng 1 đến 11: Có doanh thu và phát sinh chi phí SX nhưng KHÔNG trích giá vốn (cogs = 0)
    for (let m = 1; m <= 11; m++) {
      entries.push(
        makeEntry({ month: m, debitAccount: '131', creditAccount: '511', amount: makeMoney(5_000_000_000n, 0) }),
        makeEntry({ month: m, debitAccount: '154', creditAccount: '111', amount: makeMoney(3_000_000_000n, 0) }),
      )
    }

    // Tháng 12: Đột biến dồn 60 tỷ giá vốn sang 632
    entries.push(
      makeEntry({ month: 12, debitAccount: '131', creditAccount: '511', amount: makeMoney(6_000_000_000n, 0) }),
      makeEntry({ month: 12, debitAccount: '632', creditAccount: '154', amount: makeMoney(60_000_000_000n, 0) }),
    )

    const report = FinancialCorrelationEngine.computeCogs12MMatrix(entries)

    // Tháng 1: Bị cờ treo dở dang nhưng tỷ lệ CPSX thực tế vẫn tính đúng 60%
    expect(report.rows[0]!.isSuspiciousDeferred).toBe(true)
    expect(report.rows[0]!.auditFlag).toContain('Treo chi phí dở dang')
    expect(report.rows[0]!.cogsToRevenuePct).toBe(0)
    expect(report.rows[0]!.prodCostToRevenuePct).toBe(60) // 3 tỷ / 5 tỷ = 60%

    // Cả năm tính đúng tỷ lệ CPSX trên Doanh thu
    expect(report.annualPcts.annualProdCostToRevenuePct).toBeGreaterThan(0)
    // Tháng 12: Bị cờ dồn giá vốn cuối năm (chiếm 100% cả năm)
    const m12 = report.rows[11]!
    expect(m12.isLumpSumYearEnd).toBe(true)
    expect(m12.auditFlag).toContain('Dồn giá vốn cuối năm')

    // Bảng cảnh báo tổng thể
    expect(report.summaryWarnings.length).toBeGreaterThan(0)
    expect(report.summaryWarnings[0]).toContain('Tháng 12 ghi nhận đột biến')
  })
})
