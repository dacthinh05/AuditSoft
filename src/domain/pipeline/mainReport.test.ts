import { describe, expect, it } from 'vitest'
import { moneyFromJSON } from '../money'
import type { DiffRow } from '../types'
import { applyMainFilter, computeMainSummary } from './mainReport'

function row(partial: Partial<DiffRow>): DiffRow {
  return {
    stt: 1,
    kind: 'AMOUNT_CHANGED',
    key: '20250107\u00A6CT\u00A6D\u00A6111\u00A6112',
    dateISO: '2025-01-07',
    dateDisplay: '07/01/2025',
    loiNgay: false,
    loiNgayText: '',
    voucher: 'CT1',
    description: 'D',
    debit: '',
    credit: '',
    amountAfter: '0|0',
    amountBefore: '0|0',
    difference: '0|0',
    note: '',
    priority: '',
    ...partial,
  }
}

describe('applyMainFilter — lọc TK 911', () => {
  const rows = [
    row({ stt: 1, debit: '9111', credit: '5111', difference: '0|-1000' }),
    row({ stt: 2, debit: '1121', credit: '9118', difference: '0|500' }),
    row({ stt: 3, debit: '6421', credit: '1111', difference: '0|-400' }),
  ]

  it('loại mọi dòng TK Nợ hoặc TK Có bắt đầu bằng 911 (logic thực tế của workbook)', () => {
    const filtered = applyMainFilter(rows, { excludeKetChuyen: false })
    expect(filtered.length).toBe(1)
    expect(filtered[0]?.stt).toBe(3)
  })

  it('checkbox loại thêm diễn giải chứa KẾT CHUYỂN (có/không dấu)', () => {
    const rows2 = [
      ...rows,
      row({ stt: 4, debit: '6422', credit: '1112', description: 'KẾT CHUYỂN LÃI', difference: '0|-999' }),
      row({ stt: 5, debit: '6422', credit: '1112', description: 'KET CHUYEN CHI PHI', difference: '0|-50' }),
      row({ stt: 6, debit: '6422', credit: '1112', description: 'BÌNH THƯỜNG', difference: '0|-10' }),
    ]
    const filtered = applyMainFilter(rows2, { excludeKetChuyen: true })
    expect(filtered.map((r) => r.stt)).toEqual([3, 6])
  })
})

describe('computeMainSummary — panel tóm tắt', () => {
  it('đếm theo loại trên CHI TIẾT SAU LỌC; tổng theo nguồn gốc', () => {
    const all = [
      row({ kind: 'ADDED_AFTER', debit: '9111', credit: '5111', difference: '0|100', amountAfter: '0|100' }),
      row({ kind: 'ADDED_AFTER', debit: '1121', credit: '5112', difference: '0|100', amountAfter: '0|100', amountBefore: '0|0' }),
      row({ kind: 'REMOVED_AFTER', debit: '1113', credit: '3341', difference: '0|-300', amountBefore: '0|300' }),
      row({ kind: 'AMOUNT_CHANGED', debit: '6421', credit: '1111', difference: '0|-400', amountAfter: '0|100000', amountBefore: '0|100400' }),
    ]
    const filtered = [all[1]!, all[2]!, all[3]!]
    const summary = computeMainSummary({
      beforeStats: { dataRows: 59458, blankRows: 12, totalAmount: '0|4445070', zeroOrBadAmountRows: 3 },
      afterStats: { dataRows: 59497, blankRows: 7, totalAmount: '0|4439264', zeroOrBadAmountRows: 5 },
      allDiffRows: all,
      filteredRows: filtered,
    })
    expect(summary.diffLineCount).toBe(4)
    // đếm loại chỉ tính trên chi tiết sau lọc (dòng 911 đã bị loại)
    expect(summary.addedCount).toBe(1)
    expect(summary.removedCount).toBe(1)
    expect(summary.changedCount).toBe(1)
    expect(moneyFromJSON(summary.totalDifference).raw).toBe(-5806n)
    expect(moneyFromJSON(summary.filteredTotalDifference).raw).toBe(-600n)
    expect(summary.filteredLineCount).toBe(3)
    expect(summary.zeroOrBadAmountRowsBefore).toBe(3)
  })
})
