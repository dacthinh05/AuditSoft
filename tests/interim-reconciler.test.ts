import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  computePeriod2InterimBalances,
  extractPeriod1BalancesFromWpDir,
} from '../src/domain/workingpaper/InterimPeriodReconciler'
import type { CdfsAccountRow, NkcTransaction } from '../src/domain/workingpaper/types'

function makeAccount(matk: string, tentk: string, sdndk = 0, sdcdk = 0): CdfsAccountRow {
  return {
    matk,
    tentk,
    sdndk,
    sdcdk,
    psno: 0,
    psco: 0,
    nock: sdndk,
    cock: sdcdk,
  }
}

function makeTx(debit: string, credit: string, amount: number, month: number): NkcTransaction {
  return {
    rowNum: 1,
    dateStr: `2025-${String(month).padStart(2, '0')}-15`,
    dateVal: `2025-${String(month).padStart(2, '0')}-15`,
    docNo: 'PKT001',
    desc: 'Giao dịch mẫu',
    debit,
    credit,
    amount,
    month,
  }
}

describe('InterimPeriodReconciler — Đối chiếu kiểm toán 2 đợt (Interim 30/06 vs Final 31/12)', () => {
  it('tính toán chính xác số dư 30/06 đợt 2 chỉ từ các giao dịch 6 tháng đầu năm (tháng <= 6)', () => {
    const cdfsMap = new Map<string, CdfsAccountRow>([
      ['111', makeAccount('111', 'Tiền mặt', 1_000_000_000)],
      ['1121', makeAccount('1121', 'Tiền gửi NH VND', 5_000_000_000)],
      ['331', makeAccount('331', 'Phải trả người bán', 0, 4_000_000_000)],
      ['632', makeAccount('632', 'Giá vốn hàng bán')],
      ['511', makeAccount('511', 'Doanh thu')],
    ])

    const txns: NkcTransaction[] = [
      // 6 tháng đầu năm (tháng 1 đến 6)
      makeTx('1121', '511', 2_000_000_000, 2), // Thu tiền gửi bán hàng T2: 2 tỷ
      makeTx('632', '156', 1_500_000_000, 3), // Giá vốn T3: 1.5 tỷ
      makeTx('331', '1121', 1_000_000_000, 5), // Trả nợ NCC T5: 1 tỷ

      // 6 tháng cuối năm (tháng 7 đến 12) — PHẢI BỊ LOẠI KHỎI SỐ DƯ 30/06
      makeTx('1121', '511', 8_000_000_000, 9),
      makeTx('632', '156', 6_000_000_000, 10),
      makeTx('331', '1121', 3_000_000_000, 12),
    ]

    const result = computePeriod2InterimBalances(cdfsMap, txns)

    // 1. Tiền gửi ngân hàng tại 30/06 = Đầu năm 5 tỷ + Thu T2 2 tỷ - Chi T5 1 tỷ = 6 tỷ
    expect(result.get('1121')).toBe(6_000_000_000)

    // 2. Giá vốn 632 lũy kế 6 tháng = 1.5 tỷ (không dính 6 tỷ của T10)
    expect(result.get('632')).toBe(1_500_000_000)

    // 3. Doanh thu 511 lũy kế 6 tháng = 2 tỷ (không dính 8 tỷ của T9)
    expect(result.get('511')).toBe(2_000_000_000)

    // 4. Phải trả 331 tại 30/06 = Đầu năm 4 tỷ - Trả nợ T5 1 tỷ = 3 tỷ
    expect(result.get('331')).toBe(3_000_000_000)
  })

  it('trích xuất số dư chốt đợt 1 từ tệp Master A-B-H thành công', async () => {
    const templateDir = path.resolve('GLV MAU')
    const balances = await extractPeriod1BalancesFromWpDir(templateDir)

    // Kiểm tra có đọc được số dư từ file A-B-H mẫu
    expect(balances.size).toBeGreaterThan(0)
  })
})
