import { describe, expect, it } from 'vitest'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import type { PitDeclarationSnapshot, VatDeclarationSnapshot } from '../src/shared/types/taxAnalytics'
import { TaxCrossReconciler } from '../src/domain/analytics/TaxCrossReconciler'

function createMockEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: `mock-${Math.random()}`,
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: '2025-01-15',
    documentNumber: 'HD001',
    description: 'Bán hàng',
    debitAccount: '131',
    creditAccount: '511',
    amount: makeMoney(1000000000n, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: 'KH01',
    customerName: 'Khách hàng 1',
    month: 1,
    issues: [],
    ...partial,
  }
}

function createMockVatSnapshot(quarter: number, revenue: bigint, outputVat: bigint): VatDeclarationSnapshot {
  return {
    taxpayerId: '0314892001',
    taxpayerName: 'Công ty Test',
    formCode: '01/GTGT',
    period: {
      type: 'QUARTER',
      value: `Quý ${quarter}/2025`,
      normalizedKey: `2025-Q${quarter}`,
      year: 2025,
      quarter,
    },
    declarationType: 'ORIGINAL',
    indicators: {
      '34': { code: '34', name: 'Tổng DT bán ra', rawValue: String(revenue), numericValue: revenue },
      '35': { code: '35', name: 'Tổng thuế bán ra', rawValue: String(outputVat), numericValue: outputVat },
      '25': { code: '25', name: 'Thuế khấu trừ', rawValue: '0', numericValue: 0n },
    },
  }
}

describe('TaxCrossReconciler', () => {
  it('đối chiếu chính xác khi số liệu Thuế và Sổ NKC khớp 100%', () => {
    // 4 Quý, mỗi quý 1 tỷ doanh thu Có 511, 100 triệu thuế Có 33311
    const entries: JournalEntry[] = [
      createMockEntry({ month: 2, creditAccount: '511', amount: makeMoney(1000000000n, 0) }),
      createMockEntry({ month: 2, creditAccount: '33311', amount: makeMoney(100000000n, 0) }),
      createMockEntry({ month: 5, creditAccount: '511', amount: makeMoney(1000000000n, 0) }),
      createMockEntry({ month: 5, creditAccount: '33311', amount: makeMoney(100000000n, 0) }),
      createMockEntry({ month: 8, creditAccount: '511', amount: makeMoney(1000000000n, 0) }),
      createMockEntry({ month: 8, creditAccount: '33311', amount: makeMoney(100000000n, 0) }),
      createMockEntry({ month: 11, creditAccount: '511', amount: makeMoney(1000000000n, 0) }),
      createMockEntry({ month: 11, creditAccount: '33311', amount: makeMoney(100000000n, 0) }),
    ]

    const vatList = [
      createMockVatSnapshot(1, 1000000000n, 100000000n),
      createMockVatSnapshot(2, 1000000000n, 100000000n),
      createMockVatSnapshot(3, 1000000000n, 100000000n),
      createMockVatSnapshot(4, 1000000000n, 100000000n),
    ]

    const result = TaxCrossReconciler.reconcile(entries, vatList, [])
    expect(result.vatRows.length).toBe(4)
    expect(result.vatSummary.hasDiscrepancy).toBe(false)
    expect(result.vatSummary.totalRevenueDiff).toBe(0n)
    expect(result.vatRows[0].status).toBe('MATCHED')
  })

  it('phát hiện đúng chênh lệch khi NKC lớn hơn tờ khai thuế ở Quý 4', () => {
    const entries: JournalEntry[] = [
      createMockEntry({ month: 11, creditAccount: '511', amount: makeMoney(1500000000n, 0) }),
    ]
    // Tờ khai chỉ có 1 tỷ
    const vatList = [createMockVatSnapshot(4, 1000000000n, 100000000n)]

    const result = TaxCrossReconciler.reconcile(entries, vatList, [])
    expect(result.vatRows[0].status).toBe('DISCREPANCY')
    expect(result.vatRows[0].revenueDiff).toBe(-500000000n) // tax - gl = 1B - 1.5B = -500M
    expect(result.vatRows[0].auditNote).toContain('Doanh thu sổ NKC lớn hơn Tờ khai thuế')
  })

  it('đối chiếu chính xác chi phí lương tờ khai TNCN với phát sinh Nợ TK 334', () => {
    const entries: JournalEntry[] = [
      createMockEntry({ month: 1, debitAccount: '334', amount: makeMoney(400000000n, 0) }),
      createMockEntry({ month: 2, debitAccount: '334', amount: makeMoney(400000000n, 0) }),
      createMockEntry({ month: 3, debitAccount: '334', amount: makeMoney(400000000n, 0) }),
    ]

    const pitList: PitDeclarationSnapshot[] = [
      {
        taxpayerId: '0314892001',
        taxpayerName: 'Công ty Test',
        formCode: '05/KK-TNCN',
        period: { type: 'QUARTER', value: 'Quý 1/2025', normalizedKey: '2025-Q1', year: 2025, quarter: 1 },
        declarationType: 'ORIGINAL',
        isFinalization: false,
        ct16_tongSoNguoiLaoDong: 30n,
        ct21_tongThuNhapChiuThue: 1200000000n,
        ct26_tongThuNhapChiuThueKhauTru: 400000000n,
        ct29_tongThueTncnDaKhauTru: 35000000n,
      },
    ]

    const result = TaxCrossReconciler.reconcile(entries, [], pitList)
    expect(result.pitRows.length).toBe(1)
    expect(result.pitRows[0].status).toBe('MATCHED')
    expect(result.pitRows[0].payrollDiff).toBe(0n)
  })
})
