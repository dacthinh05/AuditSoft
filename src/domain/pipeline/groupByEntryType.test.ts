import { describe, expect, it } from 'vitest'
import type { DiffRow } from '../types'
import { buildEntryTypeGroups, classifyPhanHanh, phanHanhLabel } from './groupByEntryType'

function row(partial: Partial<DiffRow>): DiffRow {
  return {
    stt: 1,
    kind: 'AMOUNT_CHANGED',
    key: 'k',
    dateISO: '2025-01-07',
    dateDisplay: '07/01/2025',
    loiNgay: false,
    loiNgayText: '',
    voucher: 'V1',
    description: 'D1',
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

describe('classifyPhanHanh — TT200 theo 3 số đầu, thứ tự ưu tiên', () => {
  it('các nhóm chính', () => {
    expect(classifyPhanHanh('1112', '5111')).toMatchObject({ id: 1 })
    expect(classifyPhanHanh('1218', '9999')).toMatchObject({ id: 2 }) // rule 01 không chạm 9999
    expect(classifyPhanHanh('1313', '5111')).toMatchObject({ id: 3 })
    expect(classifyPhanHanh('1531', '3311')).toMatchObject({ id: 4 })
    expect(classifyPhanHanh('2111', '1411')).toMatchObject({ id: 5 }) // rule 05 khớp TK Nợ 211
    expect(classifyPhanHanh('3341', '9999')).toMatchObject({ id: 6 })
    expect(classifyPhanHanh('6421', '3333')).toMatchObject({ id: 7 }) // rule 07 khớp trước rule 11
    expect(classifyPhanHanh('3311', '9999')).toMatchObject({ id: 8 })
    expect(classifyPhanHanh('4211', '4111')).toMatchObject({ id: 9 })
    expect(classifyPhanHanh('5111', '9999')).toMatchObject({ id: 10 })
    expect(classifyPhanHanh('7111', '9999')).toMatchObject({ id: 10 })
    expect(classifyPhanHanh('6428', '9999')).toMatchObject({ id: 11 })
    expect(classifyPhanHanh('9999', '8888')).toMatchObject({ id: 12 })
  })

  it('tài khoản có hậu tố (6111NK / 1521NK) so khớp theo đầu chuỗi', () => {
    // rule 04 (HTK, có mã 152) được xét trước rule 11 (chi phí) → TK Có 1521NK thắng
    expect(classifyPhanHanh('6111NK', '1521NK').id).toBe(4)
    expect(classifyPhanHanh('6111NK', '99999').id).toBe(11)
  })

  it('nhãn hiển thị "01 - Tiền"', () => {
    expect(phanHanhLabel(1, 'Tiền')).toBe('01 - Tiền')
  })
})

describe('buildEntryTypeGroups — Tổng hợp loại bút toán', () => {
  it('gom LEFT4|LEFT4, gộp nguồn, chỉ giữ |chênh lệch| > 0.5, trả summary', () => {
    const rows = [
      row({ voucher: 'VA', description: 'DA', debit: '64213', credit: '33351', amountAfter: '0|100', amountBefore: '0|140', difference: '0|-40' }),
      row({ voucher: 'VB', description: 'DB', debit: '64214', credit: '11112', kind: 'ADDED_AFTER', amountAfter: '0|60', difference: '0|60' }),
      row({ voucher: 'VC', description: 'DC', debit: '15210', credit: '33110', kind: 'REMOVED_AFTER', amountBefore: '0|1', difference: '0|-1' }),
      row({ voucher: 'VD', description: 'DD', debit: '99991', credit: '88881', amountAfter: '1|4', difference: '1|4' }), // 0.4 ≤ 0.5
    ]
    const { groups, summary } = buildEntryTypeGroups(rows)
    expect(groups.find((g) => g.key === '9999|8888')).toBeUndefined()
    const g = groups.find((x) => x.key === '6421|3335')
    expect(g).toBeDefined()
    expect(g?.sources).toEqual(['Đổi số tiền'])
    expect(g?.note).toBe('Đổi số tiền')
    expect(g?.phanHanhId).toBe(7)
    expect(summary.filteredLineCount).toBe(4)
    expect(summary.groupCount).toBe(3)
    expect(summary.collapsedLines).toBe(1) // 4 dòng chi tiết gom còn 3 nhóm
  })

  it('Bù trừ/đảo bút toán khi một nhóm chứa cả Thêm và Xóa', () => {
    const rows = [
      row({ voucher: 'A', description: 'X', debit: '15211', credit: '33111', kind: 'ADDED_AFTER', amountAfter: '0|50', difference: '0|50' }),
      row({ voucher: 'B', description: 'Y', debit: '15212', credit: '33112', kind: 'REMOVED_AFTER', amountBefore: '0|30', difference: '0|-30' }),
    ]
    const { groups } = buildEntryTypeGroups(rows)
    expect(groups.length).toBe(1)
    expect(groups[0]?.note).toBe('Bù trừ/đảo bút toán')
  })

  it('Chuyển TK hạch toán: hai NHÓM khác nhau, cùng PairKey đại diện, đối dấu', () => {
    const rows = [
      row({ stt: 1, voucher: 'CT9', description: 'PHÂN BỔ', debit: '64211', credit: '11111', amountAfter: '0|100', difference: '0|100' }),
      row({ stt: 2, voucher: 'CT9', description: 'Phân bổ', debit: '24211', credit: '64212', amountBefore: '0|100', difference: '0|-100' }),
    ]
    const { groups } = buildEntryTypeGroups(rows)
    for (const g of groups) {
      expect(g.note).toBe('Chuyển TK hạch toán')
    }
  })

  it('Ghi bổ sung / Hủy khi chỉ có một nguồn; fallback theo phần hành', () => {
    const onlyAdded = buildEntryTypeGroups([
      row({ debit: '15213', credit: '33113', kind: 'ADDED_AFTER', amountAfter: '0|80', difference: '0|80' }),
    ]).groups
    expect(onlyAdded[0]?.note).toBe('Ghi bổ sung')

    const onlyRemoved = buildEntryTypeGroups([
      row({ debit: '21111', credit: '33114', kind: 'REMOVED_AFTER', amountBefore: '0|70', difference: '0|-70' }),
    ]).groups
    expect(onlyRemoved[0]?.note).toBe('Hủy/xóa bút toán')

    const other = buildEntryTypeGroups([
      // Mọi dòng đều có Nguồn → nhánh theo phần hành (#6) chỉ tồn tại trên giấy;
      // nhóm Đổi số tiền đơn lẻ luôn nhận "Đổi số tiền"
      row({ debit: '99991', credit: '88882', amountBefore: '0|5', difference: '0|-5' }),
    ]).groups
    expect(other[0]?.note).toBe('Đổi số tiền')
  })

  it('sort phần hành ↑ rồi |chênh lệch| ↓ trong cùng nhóm; STT đánh lại', () => {
    const rows = [
      row({ debit: '99991', credit: '88883', amountBefore: '0|500', difference: '0|-500' }),
      row({ debit: '11114', credit: '88884', amountBefore: '0|50', difference: '0|-50' }),
      row({ debit: '15215', credit: '88885', amountBefore: '0|5', difference: '0|-5' }),
    ]
    const { groups } = buildEntryTypeGroups(rows)
    expect(groups.map((g) => g.phanHanhId)).toEqual([1, 4, 12])
    expect(groups.map((g) => g.stt)).toEqual([1, 2, 3])
  })
})
