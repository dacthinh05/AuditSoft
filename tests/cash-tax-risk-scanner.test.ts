import { describe, expect, it } from 'vitest'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import { CashTaxRiskScanner } from '../src/domain/analytics/CashTaxRiskScanner'

function makeMockEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? 'E1',
    source: { fileName: 'NKC.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: partial.postingDate ?? '15/04/2026',
    documentNumber: partial.documentNumber ?? 'PC001',
    description: partial.description ?? 'Chi tiền mua vật tư',
    debitAccount: partial.debitAccount ?? '152',
    creditAccount: partial.creditAccount ?? '1111',
    amount: partial.amount ?? makeMoney(1000000n, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: partial.objectCode ?? null,
    customerName: partial.customerName ?? null,
    month: partial.month ?? 4,
    issues: [],
  }
}

describe('CashTaxRiskScanner — Quét rủi ro chi tiền mặt & B4 theo NĐ 181/2025 & NĐ 209', () => {
  it('phát hiện chứng từ đơn lẻ chi tiền mặt >= 5 triệu theo quy định mới NĐ 181/2025', () => {
    const entries: JournalEntry[] = [
      makeMockEntry({
        id: 'E_5M',
        documentNumber: 'PC_7M5',
        debitAccount: '6422',
        creditAccount: '1111',
        amount: makeMoney(7500000n, 0),
        description: 'Chi tiền mặt mua vật phẩm văn phòng Cty Minh Phát',
        customerName: 'Công ty Minh Phát',
      }),
      makeMockEntry({
        id: 'E_SAFE',
        documentNumber: 'PC_2M',
        debitAccount: '6422',
        creditAccount: '1111',
        amount: makeMoney(2000000n, 0),
        description: 'Chi tiền nước uống',
        customerName: 'Cửa hàng tiện lợi',
      }),
    ]

    const res = CashTaxRiskScanner.scan(entries, { mode: '5M' })

    expect(res.thresholdUsed).toBe(5000000)
    expect(res.thresholdMode).toBe('5M')
    expect(res.singleItems.length).toBe(1)
    expect(res.singleItems[0]?.id).toBe('E_5M')
    expect(res.singleItems[0]?.amountNumber).toBe(7500000)
    expect(res.singleItems[0]?.auditNote).toContain('5.000.000 đ theo quy định mới (NĐ 181/2025/NĐ-CP')
    expect(res.totalRiskNumber).toBe(7500000)
    expect(res.estimatedB4Number).toBe(7500000)
    expect(res.estimatedTaxPayableNumber).toBe(1500000) // 20% của 7.5tr
  })

  it('hỗ trợ chuyển đổi sang mốc 20 triệu (quy định cũ) cho các niên độ tài chính trước đây', () => {
    const entries: JournalEntry[] = [
      makeMockEntry({
        id: 'E_7M5',
        amount: makeMoney(7500000n, 0),
        debitAccount: '156',
        creditAccount: '111',
      }),
      makeMockEntry({
        id: 'E_25M',
        amount: makeMoney(25000000n, 0),
        debitAccount: '156',
        creditAccount: '111',
      }),
    ]

    // Chế độ 5M: cả 2 bút toán đều vi phạm
    const res5M = CashTaxRiskScanner.scan(entries, { mode: '5M' })
    expect(res5M.singleItems.length).toBe(2)
    expect(res5M.totalRiskNumber).toBe(32500000)

    // Chế độ 20M: chỉ bút toán 25 triệu vi phạm
    const res20M = CashTaxRiskScanner.scan(entries, { mode: '20M' })
    expect(res20M.singleItems.length).toBe(1)
    expect(res20M.singleItems[0]?.id).toBe('E_25M')
    expect(res20M.singleItems[0]?.auditNote).toContain('20.000.000 đ theo quy định cũ (NĐ 209/2013/NĐ-CP')
    expect(res20M.totalRiskNumber).toBe(25000000)
    expect(res20M.estimatedTaxPayableNumber).toBe(5000000) // 20% của 25tr
  })

  it('phát hiện hành vi xé nhỏ / chia nhiều phiếu chi trong cùng ngày cho 1 nhà cung cấp', () => {
    const entries: JournalEntry[] = [
      // 3 phiếu chi trong ngày 15/04/2026 cho cùng Cty Hoàng Phát, mỗi phiếu < 5M nhưng tổng = 5.5M
      makeMockEntry({
        id: 'SPLIT_1',
        postingDate: '15/04/2026',
        documentNumber: 'PC01',
        amount: makeMoney(2000000n, 0),
        debitAccount: '331',
        creditAccount: '1111',
        objectCode: 'NCC_HOANGPHAT',
        customerName: 'Công ty Hoàng Phát',
      }),
      makeMockEntry({
        id: 'SPLIT_2',
        postingDate: '15/04/2026',
        documentNumber: 'PC02',
        amount: makeMoney(2000000n, 0),
        debitAccount: '331',
        creditAccount: '1111',
        objectCode: 'NCC_HOANGPHAT',
        customerName: 'Công ty Hoàng Phát',
      }),
      makeMockEntry({
        id: 'SPLIT_3',
        postingDate: '15/04/2026',
        documentNumber: 'PC03',
        amount: makeMoney(1500000n, 0),
        debitAccount: '331',
        creditAccount: '1111',
        objectCode: 'NCC_HOANGPHAT',
        customerName: 'Công ty Hoàng Phát',
      }),
    ]

    const res = CashTaxRiskScanner.scan(entries, { mode: '5M' })

    expect(res.singleItems.length).toBe(0) // Không có phiếu nào đơn lẻ >= 5M
    expect(res.splitClusters.length).toBe(1)
    expect(res.splitClusters[0]?.itemsCount).toBe(3)
    expect(res.splitClusters[0]?.totalAmountNumber).toBe(5500000)
    expect(res.splitClusters[0]?.auditNote).toContain('3 phiếu chi cho')
    expect(res.splitClusters[0]?.auditNote).toContain('5.500.000 đ')

    expect(res.allItems.length).toBe(3)
    expect(res.totalRiskNumber).toBe(5500000)
    expect(res.estimatedTaxPayableNumber).toBe(1100000) // 20% của 5.5M
  })

  it('không gom nhóm các phiếu chi phát sinh ở các ngày khác nhau', () => {
    const entries: JournalEntry[] = [
      // Ngày 15/04 chi 2tr, Ngày 16/04 chi 2tr cho cùng 1 NCC -> Hợp lệ, không phải xé nhỏ trong ngày
      makeMockEntry({
        id: 'DIFF_1',
        postingDate: '15/04/2026',
        amount: makeMoney(2000000n, 0),
        debitAccount: '156',
        creditAccount: '111',
        customerName: 'NCC Thép Hòa Phát',
      }),
      makeMockEntry({
        id: 'DIFF_2',
        postingDate: '16/04/2026',
        amount: makeMoney(2000000n, 0),
        debitAccount: '156',
        creditAccount: '111',
        customerName: 'NCC Thép Hòa Phát',
      }),
    ]

    const res = CashTaxRiskScanner.scan(entries, { mode: '5M' })
    expect(res.splitClusters.length).toBe(0)
    expect(res.allItems.length).toBe(0)
    expect(res.totalRiskNumber).toBe(0)
  })

  it('loại trừ nghiệp vụ luân chuyển tiền nội bộ Nợ 112 / Có 111 (nộp tiền ngân hàng)', () => {
    const entries: JournalEntry[] = [
      makeMockEntry({
        id: 'INTERNAL_BANK_DEPOSIT',
        debitAccount: '1121', // Nộp tiền vào ngân hàng
        creditAccount: '1111',
        amount: makeMoney(50000000n, 0), // 50 triệu
        description: 'Nộp tiền mặt vào tài khoản Vietcombank',
      }),
      makeMockEntry({
        id: 'INTERNAL_CASH_TRANSFER',
        debitAccount: '1112', // Chuyển quỹ nội bộ
        creditAccount: '1111',
        amount: makeMoney(20000000n, 0),
        description: 'Chuyển tiền sang quỹ USD',
      }),
    ]

    const res = CashTaxRiskScanner.scan(entries, { mode: '5M' })
    expect(res.allItems.length).toBe(0)
    expect(res.totalRiskNumber).toBe(0)
  })
})
