import { describe, expect, it } from 'vitest'
import { moneyFromNumber } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import { detectYearEndWindow } from '../src/main/analytics/JournalAnalyticsEngine'
import { Trend12MAnalyzer } from '../src/domain/analytics/Trend12MAnalyzer'

function makeEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? 'E1',
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: partial.postingDate ?? '2025-12-31',
    documentNumber: partial.documentNumber ?? 'CT01',
    description: partial.description ?? 'Test',
    debitAccount: partial.debitAccount ?? '511',
    creditAccount: partial.creditAccount ?? '911',
    amount: partial.amount ?? moneyFromNumber(10_000_000),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: partial.month ?? 12,
    issues: [],
  }
}

describe('Noise Cleansing & Double Materiality Gates', () => {
  describe('Khử dương tính giả do bút toán kết chuyển 911 cuối kỳ', () => {
    it('detectYearEndWindow loại trừ bút toán kết chuyển Nợ/Có 911 ngày 31/12', () => {
      const entries: JournalEntry[] = [
        // Bút toán kết chuyển xác định KQKD ngày 31/12 (10 tỷ)
        makeEntry({ id: 'E_911_REV', debitAccount: '5111', creditAccount: '911', amount: moneyFromNumber(10_000_000_000), postingDate: '2025-12-31' }),
        makeEntry({ id: 'E_911_COGS', debitAccount: '911', creditAccount: '632', amount: moneyFromNumber(7_000_000_000), postingDate: '2025-12-31' }),
        // Bút toán bán hàng thực tế ngày 30/12 (500 triệu)
        makeEntry({ id: 'E_REAL_SALE', debitAccount: '131', creditAccount: '5111', amount: moneyFromNumber(500_000_000), postingDate: '2025-12-30' }),
      ]

      const res = detectYearEndWindow(entries, '12-31', 4, 2025)
      // 911 phải bị loại trừ, chỉ còn bút toán bán hàng thực tế 500tr
      expect(res.ids).toEqual(['E_REAL_SALE'])
      expect(res.total.raw).toBe(500_000_000n)
    })

    it('Trend12MAnalyzer loại trừ bút toán kết chuyển 911 khỏi phát sinh tháng', () => {
      const entries: JournalEntry[] = [
        // Doanh thu bán hàng thực tế Tháng 12: 1 tỷ
        makeEntry({ id: 'E1', debitAccount: '131', creditAccount: '5111', amount: moneyFromNumber(1_000_000_000), month: 12 }),
        // Bút toán kết chuyển cuối năm: 1 tỷ (Nợ 511 / Có 911)
        makeEntry({ id: 'E2', debitAccount: '5111', creditAccount: '911', amount: moneyFromNumber(1_000_000_000), month: 12 }),
      ]

      const res = Trend12MAnalyzer.analyze(entries)
      const revRow = res.rows.find((r) => r.key === 'REV_511')
      // Doanh thu chỉ tính phát sinh Có 511 thực tế (1 tỷ), không bị tính bút toán kết chuyển 911
      expect(revRow?.months[11]?.raw).toBe(1_000_000_000n)
    })
  })

  describe('Cổng Trọng Yếu Kép (Double Materiality Gate)', () => {
    it('không báo động đỏ khi biến động % lớn nhưng số tiền quá nhỏ (dưới 50 triệu)', () => {
      const entries: JournalEntry[] = []
      // 11 tháng đầu: mỗi tháng 1 triệu
      for (let m = 1; m <= 11; m++) {
        entries.push(makeEntry({ debitAccount: '131', creditAccount: '5111', amount: moneyFromNumber(1_000_000), month: m }))
      }
      // Tháng 12: 3 triệu (+200%, nhưng mức nhảy chỉ là 2 triệu < 50tr)
      entries.push(makeEntry({ debitAccount: '131', creditAccount: '5111', amount: moneyFromNumber(3_000_000), month: 12 }))

      const res = Trend12MAnalyzer.analyze(entries)
      const revRow = res.rows.find((r) => r.key === 'REV_511')
      // Nhờ cổng trọng yếu kép, tháng 12 KHÔNG bị coi là đột biến bất thường
      expect(revRow?.anomalyMonths).not.toContain(12)
    })

    it('báo động đỏ khi biến động % lớn VÀ số tiền trọng yếu (trên 50 triệu)', () => {
      const entries: JournalEntry[] = []
      // 11 tháng đầu: mỗi tháng 500 triệu
      for (let m = 1; m <= 11; m++) {
        entries.push(makeEntry({ debitAccount: '131', creditAccount: '5111', amount: moneyFromNumber(500_000_000), month: m }))
      }
      // Tháng 12: 2 tỷ (+300%, mức nhảy 1.5 tỷ >= 50 triệu)
      entries.push(makeEntry({ debitAccount: '131', creditAccount: '5111', amount: moneyFromNumber(2_000_000_000), month: 12 }))

      const res = Trend12MAnalyzer.analyze(entries)
      const revRow = res.rows.find((r) => r.key === 'REV_511')
      // Thỏa mãn cả 2 điều kiện -> Phát hiện đột biến chính xác
      expect(revRow?.anomalyMonths).toContain(12)
    })
  })
})
