import { describe, expect, it } from 'vitest'
import { moneyFromJSON } from '../money'
import type { NormalizedEntry } from '../types'
import { groupEntries, reconcileSources } from './reconcile'

function entry(partial: Partial<NormalizedEntry>): NormalizedEntry {
  return {
    rowIndex: 1,
    displayDate: '',
    dateISO: null,
    rawDateText: '',
    voucher: '',
    description: '',
    debit: '',
    credit: '',
    amount: null,
    partnerCode: null,
    partnerName: null,
    exchangeRate: null,
    foreignAmount: null,
    errors: [],
    ...partial,
  }
}

const M = (raw: bigint) => ({ raw, scale: 0 })

describe('groupEntries — Table.Group theo Khóa dò', () => {
  it('cộng dồn tiền các dòng trùng khóa; khóa chứa đủ 5 trường', () => {
    const base = { dateISO: '2025-01-07', voucher: 'PHT', description: 'A B', debit: '3383', credit: '111' }
    const map = groupEntries([
      entry({ ...base, amount: M(100000n) }),
      entry({ ...base, amount: M(50000n) }),
    ])
    expect(map.size).toBe(1)
    const g = [...map.values()][0]
    expect(g?.total.raw).toBe(150000n)
    expect(g?.dateISO).toBe('2025-01-07')
  })

  it('khác Diễn giải → khác khóa (như PQ)', () => {
    const map = groupEntries([
      entry({ dateISO: '2025-01-01', voucher: 'CT1', description: 'AAA', debit: '111', credit: '112', amount: M(100n) }),
      entry({ dateISO: '2025-01-01', voucher: 'CT1', description: 'ZZZ', debit: '111', credit: '112', amount: M(50n) }),
    ])
    expect(map.size).toBe(2)
  })
})

describe('reconcileSources — tái hiện pqDoiChieu_NKC', () => {
  it('khóa chỉ có ở Trước → Xóa sau ĐC (Sau=0)', () => {
    const before = [entry({ dateISO: '2025-01-07', voucher: 'CT1', description: 'A', debit: '111', credit: '112', amount: M(300n) })]
    const { rows } = reconcileSources(before, [])
    expect(rows.length).toBe(1)
    expect(rows[0]?.kind).toBe('REMOVED_AFTER')
    expect(moneyFromJSON(rows[0]?.difference ?? '0|0').raw).toBe(-300n)
  })

  it('khóa chỉ có ở Sau → Thêm sau ĐC (Trước=0)', () => {
    const after = [entry({ dateISO: '2025-01-07', voucher: 'CT2', description: 'B', debit: '111', credit: '511', amount: M(700n) })]
    const { rows } = reconcileSources([], after)
    expect(rows[0]?.kind).toBe('ADDED_AFTER')
    expect(moneyFromJSON(rows[0]?.difference ?? '0|0').raw).toBe(700n)
  })

  it('Nguồn xác định THEO GIÁ TRỊ = 0 như M (không phải theo tồn tại khóa)', () => {
    // Cùng khóa nhưng tổng Trước về đúng 0 → PQ vẫn gán "Thêm sau ĐC"
    const before = [entry({ dateISO: '2025-01-07', voucher: 'K', description: 'D', debit: '111', credit: '112', amount: M(200n) })]
    const after = [
      entry({ dateISO: '2025-01-07', voucher: 'K', description: 'D', debit: '111', credit: '112', amount: M(500n) }),
      entry({ dateISO: '2025-01-07', voucher: 'K', description: 'D', debit: '111', credit: '112', amount: M(-500n) }),
    ]
    const { rows } = reconcileSources(before, after)
    expect(rows.length).toBe(1)
    expect(rows[0]?.kind).toBe('REMOVED_AFTER') // Sau ĐC tổng = 0 → PQ gán "Xóa sau ĐC"
  })

  it('Đổi số tiền khi cả hai ≠ 0; chênh lệch = Sau − Trước', () => {
    const before = [entry({ dateISO: '2025-01-07', voucher: 'CT3', description: 'C', debit: '642', credit: '111', amount: M(100400n) })]
    const after = [entry({ dateISO: '2025-01-07', voucher: 'CT3', description: 'C', debit: '642', credit: '111', amount: M(100000n) })]
    const { rows } = reconcileSources(before, after)
    expect(rows.length).toBe(1)
    expect(rows[0]?.kind).toBe('AMOUNT_CHANGED')
    expect(moneyFromJSON(rows[0]?.difference ?? '0|0').raw).toBe(-400n)
    expect(rows[0]?.priority).toBe('Kiểm tra chứng từ gốc')
  })

  it('|Chênh lệch| ≤ 0.001 bị loại (ChiLech)', () => {
    const before = [entry({ dateISO: '2025-01-07', voucher: 'T', description: 'D', debit: '111', credit: '112', amount: { raw: 100001n, scale: 3 } })]
    const after = [entry({ dateISO: '2025-01-07', voucher: 'T', description: 'D', debit: '111', credit: '112', amount: { raw: 100000n, scale: 3 } })]
    const { rows, matchedEqualCount } = reconcileSources(before, after)
    expect(rows.length).toBe(0)
    expect(matchedEqualCount).toBe(1)
  })

  it('tổng bằng nhau nhưng chi tiết khác → phát hiện qua cộng nhóm', () => {
    const before = [
      entry({ dateISO: '2025-01-07', voucher: 'V', description: '152 A', debit: '152', credit: '331', amount: M(200n) }),
      entry({ dateISO: '2025-01-07', voucher: 'V', description: '153 B', debit: '153', credit: '331', amount: M(300n) }),
    ]
    const after = [
      entry({ dateISO: '2025-01-07', voucher: 'V', description: '152 A', debit: '152', credit: '331', amount: M(350n) }),
      entry({ dateISO: '2025-01-07', voucher: 'V', description: '153 B', debit: '153', credit: '331', amount: M(150n) }),
    ]
    const { rows } = reconcileSources(before, after)
    expect(rows.length).toBe(2)
    const sum = rows.reduce((acc, r) => acc + moneyFromJSON(r.difference).raw, 0n)
    expect(sum).toBe(0n)
  })

  it('sort theo Ngày chứng từ rồi Số chứng từ; ngày lỗi xuống cuối; STT đánh lại', () => {
    const before = [
      entry({ dateISO: '2025-01-01', voucher: 'B2', description: 'x', debit: '111', credit: '997', amount: M(30n) }),
      entry({ rawDateText: 'NGÀY SAI', voucher: 'Z9', description: 'bad date', debit: '111', credit: '996', amount: M(40n) }),
      entry({ dateISO: '2025-01-02', voucher: 'B1', description: 'y', debit: '111', credit: '998', amount: M(20n) }),
      entry({ dateISO: '2025-01-02', voucher: 'A1', description: 'z', debit: '111', credit: '995', amount: M(10n) }),
    ]
    const { rows } = reconcileSources(before, [])
    // B2 ngày 01-01 đứng đầu; cùng ngày 01-02 sắp theo SốCT: A1 < B1; ngày lỗi cuối
    expect(rows.map((r) => r.voucher)).toEqual(['B2', 'A1', 'B1', 'Z9'])
    expect(rows.map((r) => r.stt)).toEqual([1, 2, 3, 4])
  })
})

describe('reconcileSources với tùy chọn nâng cao', () => {
  it('ignoreDescription=true: khử chênh lệch ảo khi kế toán chỉ sửa diễn giải', () => {
    const before = [entry({ dateISO: '2025-01-05', voucher: 'PT01', description: 'TIỀN ĐIỆN T12', debit: '642', credit: '112', amount: M(500n) })]
    const after = [entry({ dateISO: '2025-01-05', voucher: 'PT01', description: 'TIỀN ĐIỆN T12/2024 (ĐÃ SỬA)', debit: '642', credit: '112', amount: M(500n) })]

    // Chế độ mặc định: báo 2 dòng lệch (1 Xóa, 1 Thêm)
    const strict = reconcileSources(before, after)
    expect(strict.rows.length).toBe(2)

    // Chế độ ignoreDescription: khớp 100%, 0 dòng lệch!
    const relaxed = reconcileSources(before, after, { ignoreDescription: true })
    expect(relaxed.rows.length).toBe(0)
    expect(relaxed.matchedEqualCount).toBe(1)
  })

  it('accountLevel=level1: khớp khi 1 bên dùng TK tổng hợp 3 số, 1 bên dùng TK chi tiết', () => {
    const before = [entry({ dateISO: '2025-01-05', voucher: 'PT01', description: 'CHI PHÍ', debit: '642', credit: '112', amount: M(500n) })]
    const after = [entry({ dateISO: '2025-01-05', voucher: 'PT01', description: 'CHI PHÍ', debit: '6428', credit: '1121', amount: M(500n) })]

    const strict = reconcileSources(before, after)
    expect(strict.rows.length).toBe(2)

    const lvl1 = reconcileSources(before, after, { accountLevel: 'level1' })
    expect(lvl1.rows.length).toBe(0)
    expect(lvl1.matchedEqualCount).toBe(1)
  })
})
