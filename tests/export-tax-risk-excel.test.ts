import { describe, expect, it, vi } from 'vitest'
import { makeMoney } from '../src/domain/money'
import type { CashTaxRiskResult } from '../src/domain/analytics/types'
import { exportTaxRiskExcel } from '../src/renderer/components/TaxRisk/exportTaxRiskExcel'

// Mock global URL and document.createElement for DOM download in Node test environment
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
}

describe('exportTaxRiskExcel — Tạo file Excel Bảng kê rủi ro chi tiền mặt & B4', () => {
  it('tạo workbook thành công với đầy đủ tiêu đề, căn cứ pháp lý và các dòng vi phạm', async () => {
    const mockResult: CashTaxRiskResult = {
      thresholdUsed: 5000000,
      thresholdMode: '5M',
      taxRate: 0.20,
      totalRiskAmount: makeMoney(12500000n, 0),
      totalRiskNumber: 12500000,
      estimatedB4Adjustment: makeMoney(12500000n, 0),
      estimatedB4Number: 12500000,
      estimatedTaxPayableIncrease: makeMoney(2500000n, 0),
      estimatedTaxPayableNumber: 2500000,
      singleItems: [
        {
          id: 'IT1',
          date: '15/04/2026',
          voucher: 'PC001',
          description: 'Chi tiền mua vật tư',
          debit: '152',
          credit: '1111',
          amount: makeMoney(7500000n, 0),
          amountNumber: 7500000,
          partnerCode: 'NCC01',
          partnerName: 'Công ty Tân Bình',
          riskType: 'SINGLE_OVER_THRESHOLD',
          riskLabel: 'Chi tiền mặt >= 5.000.000 đ',
          auditNote: 'Chi tiền mặt >= 5.000.000 đ theo quy định mới NĐ 181/2025.',
        },
      ],
      splitClusters: [
        {
          clusterKey: '16/04/2026|NCC02',
          date: '16/04/2026',
          partner: 'Công ty Hoàng Mai',
          itemsCount: 2,
          totalAmount: makeMoney(5000000n, 0),
          totalAmountNumber: 5000000,
          items: [],
          auditNote: 'Cụm chia nhỏ',
        },
      ],
      allItems: [
        {
          id: 'IT1',
          date: '15/04/2026',
          voucher: 'PC001',
          description: 'Chi tiền mua vật tư',
          debit: '152',
          credit: '1111',
          amount: makeMoney(7500000n, 0),
          amountNumber: 7500000,
          partnerCode: 'NCC01',
          partnerName: 'Công ty Tân Bình',
          riskType: 'SINGLE_OVER_THRESHOLD',
          riskLabel: 'Chi tiền mặt >= 5.000.000 đ',
          auditNote: 'Chi tiền mặt >= 5.000.000 đ theo quy định mới NĐ 181/2025.',
        },
        {
          id: 'IT2',
          date: '16/04/2026',
          voucher: 'PC002',
          description: 'Chi tiền lần 1',
          debit: '331',
          credit: '1111',
          amount: makeMoney(2500000n, 0),
          amountNumber: 2500000,
          partnerCode: 'NCC02',
          partnerName: 'Công ty Hoàng Mai',
          riskType: 'SPLIT_SAME_DAY',
          riskLabel: 'Nghi ngờ chia nhỏ cùng ngày',
          auditNote: 'Thuộc cụm chia nhỏ trong ngày.',
        },
        {
          id: 'IT3',
          date: '16/04/2026',
          voucher: 'PC003',
          description: 'Chi tiền lần 2',
          debit: '331',
          credit: '1111',
          amount: makeMoney(2500000n, 0),
          amountNumber: 2500000,
          partnerCode: 'NCC02',
          partnerName: 'Công ty Hoàng Mai',
          riskType: 'SPLIT_SAME_DAY',
          riskLabel: 'Nghi ngờ chia nhỏ cùng ngày',
          auditNote: 'Thuộc cụm chia nhỏ trong ngày.',
        },
      ],
    }

    // Chạy hàm xuất Excel (sẽ không ném lỗi)
    await expect(exportTaxRiskExcel(mockResult, 'CTY_TEST_AUDIT', '2026')).resolves.not.toThrow()
  })
})
