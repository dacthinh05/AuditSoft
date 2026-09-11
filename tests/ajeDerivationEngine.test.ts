import { describe, it, expect } from 'vitest'
import { AjeDerivationEngine, resolveGlvRefForAccounts } from '../src/domain/workingpaper/AjeDerivationEngine'
import type { DiffRow } from '../src/domain/types'
import { computeAccountAdjustment } from '../src/domain/workingpaper/helpers'

describe('AjeDerivationEngine — Tự Động Lập Bút Toán Điều Chỉnh AJE', () => {
  it('ánh xạ đúng mã GLV Ref cho từng nhóm tài khoản kiểm toán', () => {
    expect(resolveGlvRefForAccounts('111', '112')).toBe('D141')
    expect(resolveGlvRefForAccounts('1121', '111')).toBe('D141')
    expect(resolveGlvRefForAccounts('131', '511')).toBe('D341')
    expect(resolveGlvRefForAccounts('156', '331')).toBe('D541')
    expect(resolveGlvRefForAccounts('632', '156')).toBe('D541')
    expect(resolveGlvRefForAccounts('211', '331')).toBe('D741')
    expect(resolveGlvRefForAccounts('214', '642')).toBe('D741')
    expect(resolveGlvRefForAccounts('242', '112')).toBe('D641')
    expect(resolveGlvRefForAccounts('341', '112')).toBe('E141')
    expect(resolveGlvRefForAccounts('331', '112')).toBe('E241')
    expect(resolveGlvRefForAccounts('33311', '112')).toBe('E341')
    expect(resolveGlvRefForAccounts('334', '112')).toBe('E441')
    expect(resolveGlvRefForAccounts('411', '112')).toBe('F141')
    expect(resolveGlvRefForAccounts('641', '331')).toBe('E241')
    expect(resolveGlvRefForAccounts('642', '338')).toBe('E241')
    expect(resolveGlvRefForAccounts('999', '888')).toBe('B140')
  })

  it('xử lý chính xác ADDED_AFTER thành bút toán điều chỉnh tăng', () => {
    const diffRows: DiffRow[] = [
      {
        stt: 1,
        kind: 'ADDED_AFTER',
        key: 'KEY_1',
        dateISO: '2025-12-31',
        dateDisplay: '31/12/2025',
        loiNgay: false,
        loiNgayText: '',
        voucher: 'PKT-001',
        description: 'Trích thêm giá vốn hàng bán',
        debit: '632',
        credit: '156',
        amountBefore: '0|0',
        amountAfter: '0|500000000',
        difference: '0|500000000',
        note: '',
        priority: 'CAO',
      },
    ]

    const ajes = AjeDerivationEngine.deriveAjesFromDiffRows(diffRows)
    expect(ajes.length).toBe(1)
    expect(ajes[0]?.tkNo).toBe('632')
    expect(ajes[0]?.tkCo).toBe('156')
    expect(ajes[0]?.soTien).toBe(500000000)
    expect(ajes[0]?.glvRef).toBe('D541')
    expect(ajes[0]?.noiDung).toContain('Ghi nhận bổ sung sau ĐC')

    // Kiểm tra tính toán bù trừ trên Leadsheet:
    // TK 156 (Tài sản dư Nợ): Có 156 -> Điều chỉnh thuần = -500.000.000
    const adj156 = computeAccountAdjustment(ajes, '156', 'DEBIT')
    expect(adj156).toBe(-500000000)

    // TK 632 (Chi phí dư Nợ): Nợ 632 -> Điều chỉnh thuần = +500.000.000
    const adj632 = computeAccountAdjustment(ajes, '632', 'DEBIT')
    expect(adj632).toBe(500000000)
  })

  it('xử lý chính xác REMOVED_AFTER thành bút toán điều chỉnh hủy/đảo ngược chiều', () => {
    const diffRows: DiffRow[] = [
      {
        stt: 1,
        kind: 'REMOVED_AFTER',
        key: 'KEY_2',
        dateISO: '2025-12-31',
        dateDisplay: '31/12/2025',
        loiNgay: false,
        loiNgayText: '',
        voucher: 'UNC-089',
        description: 'Bút toán chi tiền sai tài khoản',
        debit: '1121',
        credit: '131',
        amountBefore: '0|200000000',
        amountAfter: '0|0',
        difference: '0|-200000000',
        note: '',
        priority: 'CAO',
      },
    ]

    const ajes = AjeDerivationEngine.deriveAjesFromDiffRows(diffRows)
    expect(ajes.length).toBe(1)
    // Đảo ngược chiều: Nợ 131 / Có 1121
    expect(ajes[0]?.tkNo).toBe('131')
    expect(ajes[0]?.tkCo).toBe('1121')
    expect(ajes[0]?.soTien).toBe(200000000)
    expect(ajes[0]?.noiDung).toContain('Đảo/hủy bỏ bút toán sau ĐC')
  })

  it('xử lý AMOUNT_CHANGED khi số tiền tăng hoặc giảm', () => {
    const diffRows: DiffRow[] = [
      {
        stt: 1,
        kind: 'AMOUNT_CHANGED',
        key: 'KEY_3',
        dateISO: '2025-12-31',
        dateDisplay: '31/12/2025',
        loiNgay: false,
        loiNgayText: '',
        voucher: 'CT-01',
        description: 'Tăng chi phí QLDN',
        debit: '642',
        credit: '331',
        amountBefore: '0|100000000',
        amountAfter: '0|150000000',
        difference: '0|50000000', // Tăng 50tr
        note: '',
        priority: 'CAO',
      },
    ]

    const ajes = AjeDerivationEngine.deriveAjesFromDiffRows(diffRows)
    expect(ajes.length).toBe(1)
    expect(ajes[0]?.tkNo).toBe('642')
    expect(ajes[0]?.tkCo).toBe('331')
    expect(ajes[0]?.soTien).toBe(50000000)
  })
})
