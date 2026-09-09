import { describe, expect, it } from 'vitest'
import { calculateAuditSamplingWp } from './auditSamplingWp'
import { buildSamplingWorkbook } from './exportSamplingWp'
import type { SampleableItem } from './types'

function makeItem(partial: Partial<SampleableItem>): SampleableItem {
  return {
    id: partial.id ?? '1',
    rowIndex: partial.rowIndex ?? 1,
    displayDate: partial.displayDate ?? '15/05/2025',
    voucher: partial.voucher ?? 'HD001',
    description: partial.description ?? 'Doanh thu ban hang',
    debit: partial.debit ?? '131',
    credit: partial.credit ?? '5111',
    amount: partial.amount ?? 10_000_000,
  }
}

describe('Audit Sampling Working Paper Engine (10-Step Model) — Unit Tests', () => {
  it('tính toán chính xác 10 bước chọn mẫu theo mẫu kiểm toán thực tế', () => {
    // 100 giao dịch doanh thu (tổng 10 tỷ)
    const items: SampleableItem[] = []
    // 2 khoản mục lớn > KCM (mỗi khoản 2 tỷ)
    items.push(makeItem({ id: 'k1', amount: 2_000_000_000, voucher: 'HD_LON_1' }))
    items.push(makeItem({ id: 'k2', amount: 2_000_000_000, voucher: 'HD_LON_2' }))

    // 2 khoản mục đặc biệt (cuối kỳ 31/12, điều chỉnh)
    items.push(makeItem({ id: 'r1', amount: 100_000_000, displayDate: '31/12/2025', voucher: 'CUTOFF' }))
    items.push(makeItem({ id: 'r2', amount: 80_000_000, description: 'Bút toán ĐIỀU CHỈNH', voucher: 'ADJ' }))

    // 96 khoản mục thường (mỗi khoản ~60.6tr, tổng ~5.82 tỷ)
    for (let i = 1; i <= 96; i++) {
      items.push(makeItem({ id: `n${i}`, amount: 60_625_000, voucher: `HD_${i}` }))
    }

    const res = calculateAuditSamplingWp({
      sectionName: 'Doanh thu bán hàng',
      accountCode: '511',
      periodStr: '01/01 - 31/12/2025',
      items,
      performanceMateriality: 750_000_000, // PM = 750tr
      itemMaterialityRatio: 0.75, // 2.1: 75% -> PM khoản mục = 562.5tr
      assuranceLevel: 'HIGH', // 3: Hệ số R = 0.75 -> KCM = 562.5tr / 0.75 = 750tr
    })

    expect(res.steps.totalAmount.numericValue).toBe(10_000_000_000)
    expect(res.steps.pmDetailed.numericValue).toBe(750_000_000)
    expect(res.steps.pmItem.numericValue).toBe(562_500_000)
    expect(res.steps.riskFactor.numericValue).toBe(0.75)
    expect(res.steps.kcm.numericValue).toBe(750_000_000)

    // Dòng 5: 2 khoản mục > 750tr (tổng 4 tỷ)
    expect(res.steps.highValueCount.numericValue).toBe(2)
    expect(res.steps.highValueItems.numericValue).toBe(4_000_000_000)

    // Dòng 6: 2 khoản mục rủi ro đặc biệt (tổng 180tr)
    expect(res.steps.riskCount.numericValue).toBe(2)
    expect(res.steps.riskItems.numericValue).toBe(180_000_000)

    // Dòng 7: Cỡ mẫu còn lại = (10 tỷ - 4 tỷ - 180tr) / 750tr = 5.82 tỷ / 750tr = 8 mẫu
    expect(res.steps.remainingSampleSize.numericValue).toBe(8)

    // Dòng 8: Tổng mẫu chọn = 2 + 2 + 8 = 12 mẫu
    expect(res.steps.totalSampleSize.numericValue).toBe(12)

    // Dòng 9: Số nghiệp vụ còn lại = 100 - 2 - 2 = 96 dòng
    expect(res.steps.remainingTxCount.numericValue).toBe(96)

    // Dòng 10: Bước nhảy = 96 / 8 = 12 dòng
    expect(res.steps.stepJump.numericValue).toBe(12)

    // Mẫu chọn thực tế = 12 mẫu
    expect(res.samples.length).toBe(12)
    expect(res.highValueSamples.length).toBe(2)
    expect(res.riskSamples.length).toBe(2)
    expect(res.stepJumpSamples.length).toBe(8)
  })

  it('dựng file Excel Working Paper chọn mẫu 2 sheet chuẩn xác', async () => {
    const items: SampleableItem[] = [
      makeItem({ id: '1', amount: 1_000_000_000 }),
      makeItem({ id: '2', amount: 50_000_000, displayDate: '31/12/2025' }),
      makeItem({ id: '3', amount: 200_000_000 }),
    ]

    const wp = calculateAuditSamplingWp({
      sectionName: 'Doanh thu',
      accountCode: '511',
      periodStr: '01/01 - 31/12/2025',
      items,
      performanceMateriality: 500_000_000,
    })

    const wb = buildSamplingWorkbook(wp)
    expect(wb.worksheets.length).toBe(2)
    expect(wb.worksheets[0]?.name).toBe('Quy trinh chon mau')
    expect(wb.worksheets[1]?.name).toBe('Danh sach mau')

    const ws1 = wb.getWorksheet('Quy trinh chon mau')!
    expect(ws1.getCell('B21').value).toBe('1 - Giá trị tổng thể lấy mẫu:')
    expect(ws1.getCell('B26').value).toBe('4 - Khoảng cách mẫu: (=2.2/3)')
    expect(ws1.getCell('B34').value).toBe('10 - Bước nhảy')
  })
})
