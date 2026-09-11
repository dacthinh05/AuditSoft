import { describe, expect, it } from 'vitest'
import { resolveSubAccountAllocation } from '../src/domain/workingpaper/subAccountResolver'
import type { CdfsAccountRow } from '../src/domain/workingpaper/types'

function makeAccount(matk: string, tentk: string, nock: number, cock = 0): CdfsAccountRow {
  return {
    matk,
    tentk,
    sdndk: nock,
    sdcdk: cock,
    psno: nock,
    psco: cock,
    nock,
    cock,
  }
}

describe('resolveSubAccountAllocation — Thuật toán phân bổ tài khoản con phổ quát', () => {
  it('Kịch bản 1: Doanh nghiệp chỉ có 1 ngân hàng (ít hơn maxRows=3)', () => {
    const cdfs: CdfsAccountRow[] = [
      makeAccount('1121TCB', 'Ngân hàng Techcombank', 5_000_000_000),
    ]

    const result = resolveSubAccountAllocation(cdfs, {
      prefix: '112',
      excludeExact: ['112', '1121', '1122'],
      maxRows: 3,
      otherGroupName: 'Các ngân hàng khác',
    })

    expect(result).toHaveLength(3)
    // Dòng 1: Ngân hàng Techcombank
    expect(result[0]!.tk).toBe('1121TCB')
    expect(result[0]!.ten).toBe('Ngân hàng Techcombank')
    expect(result[0]!.ck).toBe(5_000_000_000)
    expect(result[0]!.isEmpty).toBe(false)

    // Dòng 2 & 3: Xóa trắng hoàn toàn để không dính tên ngân hàng cũ của template
    expect(result[1]!.isEmpty).toBe(true)
    expect(result[1]!.tk).toBe('')
    expect(result[1]!.ck).toBe(0)

    expect(result[2]!.isEmpty).toBe(true)
    expect(result[2]!.tk).toBe('')
    expect(result[2]!.ck).toBe(0)
  })

  it('Kịch bản 2: Doanh nghiệp có đúng 3 ngân hàng (khớp chuẩn 3 dòng)', () => {
    const cdfs: CdfsAccountRow[] = [
      makeAccount('1121VCB', 'Vietcombank', 3_000_000_000),
      makeAccount('1121ACB', 'ACB Bank', 7_000_000_000),
      makeAccount('1121TCB', 'Techcombank', 1_000_000_000),
    ]

    const result = resolveSubAccountAllocation(cdfs, {
      prefix: '112',
      excludeExact: ['112', '1121'],
      maxRows: 3,
    })

    expect(result).toHaveLength(3)
    // Tự động sắp xếp giảm dần theo quy mô
    expect(result[0]!.tk).toBe('1121ACB') // 7 tỷ
    expect(result[1]!.tk).toBe('1121VCB') // 3 tỷ
    expect(result[2]!.tk).toBe('1121TCB') // 1 tỷ
    expect(result.every((r) => !r.isEmpty && !r.isOtherGroup)).toBe(true)
  })

  it('Kịch bản 3: Doanh nghiệp có 5 ngân hàng (> maxRows=3) -> Tự động gom nhóm Pareto "Các ngân hàng khác"', () => {
    const cdfs: CdfsAccountRow[] = [
      makeAccount('1121ACB', 'ACB', 10_000_000_000),
      makeAccount('1121VCB', 'VCB', 8_000_000_000),
      makeAccount('1121BIDV', 'BIDV', 1_000_000_000),
      makeAccount('1121MB', 'MB Bank', 500_000_000),
      makeAccount('1121TCB', 'TCB', 300_000_000),
    ]

    const result = resolveSubAccountAllocation(cdfs, {
      prefix: '112',
      maxRows: 3,
      otherGroupName: 'Các ngân hàng khác',
    })

    expect(result).toHaveLength(3)
    // Dòng 1: Top 1 (ACB - 10 tỷ)
    expect(result[0]!.tk).toBe('1121ACB')
    expect(result[0]!.ck).toBe(10_000_000_000)

    // Dòng 2: Top 2 (VCB - 8 tỷ)
    expect(result[1]!.tk).toBe('1121VCB')
    expect(result[1]!.ck).toBe(8_000_000_000)

    // Dòng 3: Tự động gom toàn bộ 3 ngân hàng còn lại (1 tỷ + 500tr + 300tr = 1.8 tỷ)
    expect(result[2]!.isOtherGroup).toBe(true)
    expect(result[2]!.tk).toBe('Khác')
    expect(result[2]!.ten).toBe('Các ngân hàng khác')
    expect(result[2]!.ck).toBe(1_800_000_000) // 1.000 + 500 + 300
  })

  it('Kịch bản 4: Hỗ trợ mã ngân hàng dạng số (TT 133 / MISA: 11211, 11212) hoặc ký tự đặc biệt (112.VCB)', () => {
    const cdfs: CdfsAccountRow[] = [
      makeAccount('11211', 'Tiền gửi VCB VND', 4_000_000_000),
      makeAccount('11212', 'Tiền gửi ACB VND', 6_000_000_000),
      makeAccount('112.CTG', 'Tiền gửi VietinBank', 2_000_000_000),
    ]

    const result = resolveSubAccountAllocation(cdfs, {
      prefix: '112',
      maxRows: 3,
    })

    expect(result).toHaveLength(3)
    expect(result[0]!.tk).toBe('11212') // 6 tỷ
    expect(result[1]!.tk).toBe('11211') // 4 tỷ
    expect(result[2]!.tk).toBe('112.CTG') // 2 tỷ
  })

  it('Kịch bản 5: Vay ngân hàng (balanceType: CREDIT) tính số dư theo bên Có', () => {
    const cdfs: CdfsAccountRow[] = [
      makeAccount('3411_VCB', 'Vay dài hạn Vietcombank', 0, 15_000_000_000),
      makeAccount('3411_BIDV', 'Vay dài hạn BIDV', 0, 5_000_000_000),
    ]

    const result = resolveSubAccountAllocation(cdfs, {
      prefix: '3411',
      maxRows: 2,
      balanceType: 'CREDIT',
    })

    expect(result).toHaveLength(2)
    expect(result[0]!.tk).toBe('3411_VCB')
    expect(result[0]!.ck).toBe(15_000_000_000)
    expect(result[1]!.tk).toBe('3411_BIDV')
    expect(result[1]!.ck).toBe(5_000_000_000)
  })
})
