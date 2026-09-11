import { describe, it, expect } from 'vitest'
import { CashTaxRiskScanner } from '../src/domain/analytics/CashTaxRiskScanner'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'

describe('ComprehensiveTaxRiskScanner (Lõi Quét Rủi Ro Thuế & B4 Toàn Diện)', () => {
  const dummyEntries: JournalEntry[] = [
    // 1. Chi tiền mặt >= 5tr (NĐ 181)
    {
      id: 'e1',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
      documentNumber: 'PC001',
      postingDate: '2025-03-15',
      description: 'Chi tiền mặt thanh toán tiền vải cho Công ty May Mặc A',
      debitAccount: '152',
      creditAccount: '1111',
      amount: makeMoney(8_500_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'NCC_A',
      customerName: 'Công ty May Mặc A',
    },
    // 2. Tiền phạt vi phạm hành chính (TK 811)
    {
      id: 'e2',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 2 },
      documentNumber: 'UNC002',
      postingDate: '2025-04-20',
      description: 'Nộp tiền phạt vi phạm hành chính chậm nộp thuế GTGT Q1',
      debitAccount: '811',
      creditAccount: '1121',
      amount: makeMoney(3_200_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'CCT',
      customerName: 'Chi cục Thuế',
    },
    // 3. Chi phí không có hóa đơn hợp pháp (TK 642)
    {
      id: 'e3',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 3 },
      documentNumber: 'PC003',
      postingDate: '2025-05-10',
      description: 'Tiền tiếp khách mua hàng không hóa đơn lẻ chợ',
      debitAccount: '6428',
      creditAccount: '1111',
      amount: makeMoney(1_500_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: null,
      customerName: null,
    },
    // 4. Nghiệp vụ bình thường, không vi phạm
    {
      id: 'e4',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 4 },
      documentNumber: 'UNC004',
      postingDate: '2025-06-01',
      description: 'Chuyển khoản thanh toán tiền điện theo hóa đơn GTGT',
      debitAccount: '6427',
      creditAccount: '1121',
      amount: makeMoney(12_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'EVN',
      customerName: 'Công ty Điện lực',
    },
  ]

  it('quét đúng 3 chuyên đề rủi ro thuế: tiền mặt NĐ 181, phạt VPHC 811 và không hóa đơn', () => {
    const res = CashTaxRiskScanner.scan(dummyEntries, { mode: '5M' })

    // Tổng vi phạm: 8.5tr + 3.2tr + 1.5tr = 13.2tr
    expect(res.totalRiskNumber).toBe(13_200_000)
    expect(res.estimatedB4Number).toBe(13_200_000)
    // Thuế TNDN tăng thêm (20%): 13.2tr * 20% = 2.64tr
    expect(res.estimatedTaxPayableNumber).toBe(2_640_000)

    // Bóc tách chuyên đề
    expect(res.singleItems.length).toBe(1)
    expect(res.singleItems[0]!.voucher).toBe('PC001')

    expect(res.penaltyItems.length).toBe(1)
    expect(res.penaltyItems[0]!.voucher).toBe('UNC002')
    expect(res.penaltyItems[0]!.riskType).toBe('PENALTY_811')

    expect(res.noInvoiceItems.length).toBe(1)
    expect(res.noInvoiceItems[0]!.voucher).toBe('PC003')
    expect(res.noInvoiceItems[0]!.riskType).toBe('NO_INVOICE')

    expect(res.allItems.length).toBe(3)
  })
})
