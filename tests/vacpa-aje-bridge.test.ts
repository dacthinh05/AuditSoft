import { describe, it, expect } from 'vitest'
import { computeAccountAdjustment, VACPA_TICKMARKS_LEGEND } from '../src/domain/workingpaper/helpers'

describe('VACPA GLV Standard & AJE Bridge', () => {
  it('tính toán chính xác điều chỉnh thuần AJE cho tài khoản dư Nợ (Tài sản)', () => {
    const entries = [
      { tkNo: '1111', tkCo: '1311', soTien: 50_000_000 },
      { tkNo: '3311', tkCo: '1111', soTien: 20_000_000 },
      { tkNo: '1121', tkCo: '5111', soTien: 100_000_000 },
    ]

    // TK 1111: Phát sinh Nợ = 50tr, Phát sinh Có = 20tr => Điều chỉnh thuần = +30tr
    const adj1111 = computeAccountAdjustment(entries, '1111', 'DEBIT')
    expect(adj1111).toBe(30_000_000)

    // TK 1121: Phát sinh Nợ = 100tr => Điều chỉnh thuần = +100tr
    const adj1121 = computeAccountAdjustment(entries, '1121', 'DEBIT')
    expect(adj1121).toBe(100_000_000)
  })

  it('tính toán chính xác điều chỉnh thuần AJE cho tài khoản dư Có (Nợ phải trả, Doanh thu)', () => {
    const entries = [
      { tkNo: '1111', tkCo: '1311', soTien: 50_000_000 },
      { tkNo: '3311', tkCo: '1111', soTien: 20_000_000 }, // Giảm 3311: Nợ 3311 = 20tr
      { tkNo: '642', tkCo: '3311', soTien: 80_000_000 },  // Tăng 3311: Có 3311 = 80tr
      { tkNo: '5111', tkCo: '911', soTien: 10_000_000 },   // Giảm 5111: Nợ 5111 = 10tr
    ]

    // TK 3311: Có = 80tr, Nợ = 20tr => Điều chỉnh thuần = +60tr
    const adj3311 = computeAccountAdjustment(entries, '3311', 'CREDIT')
    expect(adj3311).toBe(60_000_000)

    // TK 5111: Có = 0, Nợ = 10tr => Điều chỉnh thuần = -10tr
    const adj5111 = computeAccountAdjustment(entries, '5111', 'CREDIT')
    expect(adj5111).toBe(-10_000_000)
  })

  it('xử lý an toàn khi danh sách bút toán điều chỉnh undefined hoặc rỗng', () => {
    expect(computeAccountAdjustment(undefined, '111', 'DEBIT')).toBe(0)
    expect(computeAccountAdjustment([], '111', 'DEBIT')).toBe(0)
  })

  it('chứa đầy đủ 4 ký hiệu kiểm toán chuẩn mực VACPA', () => {
    expect(VACPA_TICKMARKS_LEGEND).toHaveLength(4)
    const symbols = VACPA_TICKMARKS_LEGEND.map((t) => t.symbol)
    expect(symbols).toContain('^')
    expect(symbols).toContain('✓')
    expect(symbols).toContain('GL')
    expect(symbols).toContain('TB')
  })
})
