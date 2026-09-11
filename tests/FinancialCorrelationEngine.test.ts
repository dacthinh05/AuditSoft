import { describe, expect, it } from 'vitest'
import { FinancialCorrelationEngine } from '../src/domain/analytics/FinancialCorrelationEngine'
import { makeMoney, moneyToNumber } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'

function createEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: partial.postingDate ?? null,
    documentNumber: partial.documentNumber ?? 'PKT01',
    description: partial.description ?? '',
    debitAccount: partial.debitAccount ?? '',
    creditAccount: partial.creditAccount ?? '',
    amount: partial.amount ?? makeMoney(0n, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: partial.month ?? (partial.postingDate ? Number(partial.postingDate.slice(5, 7)) : 1),
    issues: [],
  }
}

describe('FinancialCorrelationEngine', () => {
  describe('computeCogsStructure (Loại trừ tính trùng bút toán kết chuyển nội bộ)', () => {
    it('không tính trùng 3 lần giữa CP 62x, kết chuyển 154 và giá vốn 632/155', () => {
      const entries: JournalEntry[] = [
        // Chi phí thực tế đầu vào T1
        createEntry({ month: 1, debitAccount: '622', creditAccount: '334', amount: makeMoney(3_000_000_000n, 0), description: 'Lương công nhân' }),
        createEntry({ month: 1, debitAccount: '627', creditAccount: '112', amount: makeMoney(4_000_000_000n, 0), description: 'Chi phí sản xuất chung' }),
        // Kết chuyển nội bộ giá thành (PHẢI BỊ BỎ QUA ĐỂ TRÁNH TÍNH TRÙNG)
        createEntry({ month: 1, debitAccount: '154', creditAccount: '622', amount: makeMoney(3_000_000_000n, 0), description: 'Kết chuyển chi phí 622 sang 154' }),
        createEntry({ month: 1, debitAccount: '154', creditAccount: '627', amount: makeMoney(4_000_000_000n, 0), description: 'Kết chuyển chi phí 627 sang 154' }),
        createEntry({ month: 1, debitAccount: '155', creditAccount: '154', amount: makeMoney(7_000_000_000n, 0), description: 'Nhập kho thành phẩm từ 154' }),
        createEntry({ month: 1, debitAccount: '632', creditAccount: '155', amount: makeMoney(7_000_000_000n, 0), documentNumber: 'KC-GV', description: 'Kết chuyển giá vốn hàng bán thành phẩm' }),
      ]

      const cogsReport = FinancialCorrelationEngine.computeCogsStructure(entries)
      const t1 = cogsReport.months[0]!

      // Chỉ ghi nhận chi phí thực tế phát sinh: Lương 3 tỷ, SXC 4 tỷ -> Tổng 7 tỷ (Không phải 21 tỷ!)
      expect(moneyToNumber(t1.directLabor)).toBe(3_000_000_000)
      expect(moneyToNumber(t1.overhead)).toBe(4_000_000_000)
      expect(moneyToNumber(t1.wipOrTrade)).toBe(0)
      expect(moneyToNumber(t1.totalCosts)).toBe(7_000_000_000)
    })
  })

  describe('computeGrossMargin (Chuẩn kỳ VSA 520 khi dồn kết chuyển cuối năm)', () => {
    it('tự động phát hiện dồn giá vốn vào 31/12 và chuẩn hóa theo chi phí thực tế từng tháng', () => {
      const entries: JournalEntry[] = []

      // Doanh thu và Chi phí sản xuất phát sinh đều đặn 12 tháng (~70 tỷ/tháng DT, ~60 tỷ/tháng CP)
      for (let m = 1; m <= 12; m++) {
        entries.push(
          createEntry({ month: m, debitAccount: '131', creditAccount: '511', amount: makeMoney(70_000_000_000n, 0), description: `Doanh thu bán hàng T${m}` }),
          createEntry({ month: m, debitAccount: '621', creditAccount: '152', amount: makeMoney(40_000_000_000n, 0), description: `Xuất kho NVL T${m}` }),
          createEntry({ month: m, debitAccount: '622', creditAccount: '334', amount: makeMoney(20_000_000_000n, 0), description: `Chi phí nhân công T${m}` }),
        )
      }

      // Kế toán dồn toàn bộ 720 tỷ giá vốn kết chuyển vào ngày 31/12 (T12)
      entries.push(
        createEntry({
          month: 12,
          debitAccount: '632',
          creditAccount: '155',
          amount: makeMoney(720_000_000_000n, 0),
          documentNumber: 'KC-GVHB',
          description: 'Kết chuyển tổng giá vốn hàng bán cả năm 2026',
        }),
      )

      const gmReport = FinancialCorrelationEngine.computeGrossMargin(entries)

      // Kiểm tra xem đã bật cờ chuẩn kỳ chưa
      expect(gmReport.isNormalizedByActualCost).toBe(true)
      expect(gmReport.rawPoints).toBeDefined()
      expect(gmReport.rawPoints?.length).toBe(12)

      // Kiểm tra dữ liệu chuẩn kỳ: T1 đến T11 không bị 0 đồng, biên lãi gộp hài hòa (~14.29%)
      const t1 = gmReport.points[0]!
      expect(moneyToNumber(t1.revenue)).toBe(70_000_000_000)
      expect(moneyToNumber(t1.cogs)).toBe(60_000_000_000)
      expect(t1.grossMarginPct).toBeCloseTo(14.29, 1)

      const t12 = gmReport.points[11]!
      expect(moneyToNumber(t12.cogs)).toBe(60_000_000_000)
      expect(t12.grossMarginPct).toBeCloseTo(14.29, 1)

      // Tổng giá vốn chuẩn kỳ phải bằng 100% tổng giá vốn trên sổ sách (720 tỷ)
      const sumNormalizedCogs = gmReport.points.reduce((s, p) => s + moneyToNumber(p.cogs), 0)
      expect(sumNormalizedCogs).toBe(720_000_000_000)

      // Kiểm tra dữ liệu sổ sách gốc (rawPoints) vẫn lưu lại để đối chiếu
      const rawT1 = gmReport.rawPoints![0]!
      expect(moneyToNumber(rawT1.cogs)).toBe(0)
      expect(rawT1.grossMarginPct).toBe(100)

      const rawT12 = gmReport.rawPoints![11]!
      expect(moneyToNumber(rawT12.cogs)).toBe(720_000_000_000)
      expect(rawT12.grossMarginPct).toBeLessThan(-500)
    })
  })
})
