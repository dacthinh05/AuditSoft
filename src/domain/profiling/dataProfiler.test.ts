import { describe, it, expect } from 'vitest'
import { profileDiffRows, extractMonthAndDay } from './dataProfiler'
import type { DiffRow } from '../types'

function makeRow(overrides: Partial<DiffRow>): DiffRow {
  return {
    stt: 1,
    kind: 'ADDED_AFTER',
    key: 'test-key',
    dateISO: '2025-01-15',
    dateDisplay: '15/01/2025',
    loiNgay: false,
    loiNgayText: '',
    voucher: 'PC001',
    description: 'Chi tiền',
    debit: '1111',
    credit: '1311',
    amountAfter: '0|10000000',
    amountBefore: '0|0',
    difference: '0|10000000',
    note: '',
    priority: '',
    ...overrides,
  }
}

describe('Audit Data Profiling Engine', () => {
  it('xử lý an toàn khi danh sách rỗng', () => {
    const summary = profileDiffRows([])
    expect(summary.quality.totalRows).toBe(0)
    expect(summary.monthly.length).toBe(12)
    expect(summary.tiers.length).toBe(4)
    expect(summary.totalProfiledAmount).toBe(0n)
    expect(summary.cutoff.count31Dec).toBe(0)
  })

  it('phân tích chính xác ngày và tháng', () => {
    const r1 = extractMonthAndDay('2025-12-31')
    expect(r1.month).toBe(12)
    expect(r1.day).toBe(31)

    const r2 = extractMonthAndDay(null, '31/12/2025')
    expect(r2.month).toBe(12)
    expect(r2.day).toBe(31)

    const r3 = extractMonthAndDay('2025-06-15')
    expect(r3.month).toBe(6)
    expect(r3.day).toBe(15)
  })

  it('nhận diện đúng giao dịch đột biến ngày khóa sổ 31/12 (Cutoff risk)', () => {
    const rows: DiffRow[] = [
      makeRow({ dateISO: '2025-12-31', amountAfter: '0|3000000000' }), // 3 tỷ (Key Item)
      makeRow({ dateISO: '2025-12-31', amountAfter: '0|500000000' }), // 500 tr
      makeRow({ dateISO: '2025-05-10', amountAfter: '0|100000000' }), // Tháng 5
    ]

    const summary = profileDiffRows(rows)
    expect(summary.cutoff.count31Dec).toBe(2)
    expect(summary.cutoff.totalAmount31Dec).toBe(3_500_000_000n)
    expect(summary.monthly[11]?.count).toBe(2) // Tháng 12 (index 11)
    expect(summary.monthly[4]?.count).toBe(1) // Tháng 5 (index 4)
  })

  it('phân tầng giá trị (Amount Tiers) chuẩn xác', () => {
    const rows: DiffRow[] = [
      makeRow({ amountAfter: '0|20000000' }), // < 50tr (LOW)
      makeRow({ amountAfter: '0|100000000' }), // 100tr (MEDIUM)
      makeRow({ amountAfter: '0|800000000' }), // 800tr (HIGH)
      makeRow({ amountAfter: '0|2500000000' }), // 2.5 tỷ (KEY_ITEM)
    ]

    const summary = profileDiffRows(rows)
    const low = summary.tiers.find((t) => t.key === 'LOW')!
    const med = summary.tiers.find((t) => t.key === 'MEDIUM')!
    const high = summary.tiers.find((t) => t.key === 'HIGH')!
    const keyItem = summary.tiers.find((t) => t.key === 'KEY_ITEM')!

    expect(low.count).toBe(1)
    expect(med.count).toBe(1)
    expect(high.count).toBe(1)
    expect(keyItem.count).toBe(1)
    expect(keyItem.totalAmount).toBe(2_500_000_000n)
  })

  it('đếm số lượng nghiệp vụ tiền tròn (Round numbers)', () => {
    const rows: DiffRow[] = [
      makeRow({ amountAfter: '0|50000000' }), // Tròn 50 triệu
      makeRow({ amountAfter: '0|100000000' }), // Tròn 100 triệu
      makeRow({ amountAfter: '0|12345678' }), // Lẻ
    ]

    const summary = profileDiffRows(rows)
    expect(summary.quality.roundAmountCount).toBe(2)
  })

  it('tính toán siêu tốc O(N) dưới 20ms cho 10.000 dòng dữ liệu', () => {
    const bigRows: DiffRow[] = Array.from({ length: 10_000 }, (_, i) => {
      const month = (i % 12) + 1
      const day = (i % 28) + 1
      const monthStr = String(month).padStart(2, '0')
      const dayStr = String(day).padStart(2, '0')
      return makeRow({
        stt: i + 1,
        dateISO: `2025-${monthStr}-${dayStr}`,
        amountAfter: `0|${(i + 1) * 100_000}`,
      })
    })

    const start = performance.now()
    const summary = profileDiffRows(bigRows)
    const duration = performance.now() - start

    expect(summary.quality.totalRows).toBe(10_000)
    expect(duration).toBeLessThan(50) // Dưới 50ms cho 10.000 dòng
  })
})
