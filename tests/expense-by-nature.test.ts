import { describe, expect, it } from 'vitest'
import { ExpenseByNatureEngine } from '../src/domain/analytics/ExpenseByNatureEngine'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import type { CdfsAccountRow } from '../src/domain/workingpaper/types'

function makeEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: `mock-${Math.random()}`,
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: '2025-01-15',
    documentNumber: 'PKT001',
    description: 'Nghiệp vụ chi phí',
    debitAccount: '621',
    creditAccount: '152',
    amount: makeMoney(1_000_000n, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: 1,
    issues: [],
    ...partial,
  }
}

function makeCdfs(matk: string, tentk: string, sdndk: number, nock: number): CdfsAccountRow {
  return {
    matk,
    tentk,
    sdndk,
    sdcdk: 0,
    psno: 0,
    psco: 0,
    nock,
    cock: 0,
  }
}

describe('ExpenseByNatureEngine — Bóc tách Chi phí Yếu tố & Cân đối Thuyết minh BCTC', () => {
  it('bóc tách chính xác 5 yếu tố chi phí qua các tháng và loại bỏ kết chuyển 911', () => {
    const entries: JournalEntry[] = [
      // 1. NVL: 621 đối ứng 152
      makeEntry({ month: 1, debitAccount: '621', creditAccount: '152', amount: makeMoney(50_000_000n, 0) }),
      // 2. Nhân công: 622 đối ứng 334
      makeEntry({ month: 1, debitAccount: '622', creditAccount: '334', amount: makeMoney(20_000_000n, 0) }),
      // 3. Khấu hao: 6274 đối ứng 214
      makeEntry({ month: 1, debitAccount: '6274', creditAccount: '214', amount: makeMoney(10_000_000n, 0) }),
      // 4. Dịch vụ mua ngoài: 6427 đối ứng 112
      makeEntry({ month: 1, debitAccount: '6427', creditAccount: '112', amount: makeMoney(5_000_000n, 0) }),
      // 5. Khác bằng tiền: 6428 đối ứng 111
      makeEntry({ month: 1, debitAccount: '6428', creditAccount: '111', amount: makeMoney(2_000_000n, 0) }),

      // Bút toán kết chuyển nội bộ giá thành (KHÔNG ĐƯỢC TÍNH VÀO YẾU TỐ ĐẦU VÀO ĐỂ TRÁNH ĐÚP)
      makeEntry({ month: 1, debitAccount: '154', creditAccount: '621', amount: makeMoney(50_000_000n, 0) }),
      makeEntry({ month: 1, debitAccount: '155', creditAccount: '154', amount: makeMoney(80_000_000n, 0) }),
      makeEntry({ month: 1, debitAccount: '632', creditAccount: '155', amount: makeMoney(80_000_000n, 0) }),

      // Bút toán kết chuyển P&L cuối kỳ 911
      makeEntry({ month: 12, debitAccount: '911', creditAccount: '632', amount: makeMoney(80_000_000n, 0) }),
      makeEntry({ month: 12, debitAccount: '911', creditAccount: '642', amount: makeMoney(7_000_000n, 0) }),
    ]

    const report = ExpenseByNatureEngine.analyze(entries)
    const m1 = report.rows[0]!

    // Kiểm tra từng yếu tố trong tháng 1
    expect(m1.rawMaterials).toBe(50_000_000)
    expect(m1.labor).toBe(20_000_000)
    expect(m1.depreciation).toBe(10_000_000)
    expect(m1.outsideServices).toBe(5_000_000)
    expect(m1.otherCash).toBe(2_000_000)
    expect(m1.totalNature).toBe(87_000_000) // 50 + 20 + 10 + 5 + 2

    // Tổng cả năm
    expect(report.annualTotals.totalNature).toBe(87_000_000)
    // Ma trận tài khoản chi tiết
    expect(report.accountBreakdowns).toBeDefined()
    expect(report.accountBreakdowns.length).toBeGreaterThanOrEqual(5)
    const tk621 = report.accountBreakdowns.find((a) => a.accountCode === '621')
    expect(tk621).toBeDefined()
    expect(tk621?.annualTotal).toBe(50_000_000)
    expect(tk621?.category).toBe('RAW_MATERIALS')
  })

  it('kiểm tra phương trình cân đối Thuyết minh BCTC khớp chuẩn 100% (Độ lệch = 0)', () => {
    // Giả lập số liệu:
    // Tổng chi phí 5 yếu tố phát sinh trong kỳ = 100tr (NVL 60tr, Nhân công 30tr, Khấu hao 10tr)
    // Dở dang 154: Đầu năm 20tr, Cuối năm 10tr -> Delta 154 = +10tr
    // Thành phẩm 155: Đầu năm 15tr, Cuối năm 5tr -> Delta 155 = +10tr
    // Tổng chi phí SXKD tính theo yếu tố = 100tr + 10tr + 10tr = 120tr
    // Kết chuyển 911 (Giá vốn 632 + CPQL 642) = 120tr
    // -> Độ lệch YẾU TỐ CHI PHÍ = 120tr - 120tr = 0!

    const entries: JournalEntry[] = [
      makeEntry({ month: 1, debitAccount: '621', creditAccount: '152', amount: makeMoney(60_000_000n, 0) }),
      makeEntry({ month: 1, debitAccount: '622', creditAccount: '334', amount: makeMoney(30_000_000n, 0) }),
      makeEntry({ month: 1, debitAccount: '6274', creditAccount: '214', amount: makeMoney(10_000_000n, 0) }),
      // Giá vốn xuất kho 632 = 120tr (nhập kho 110tr + giảm tồn kho 155 10tr)
      makeEntry({ month: 12, debitAccount: '632', creditAccount: '155', amount: makeMoney(120_000_000n, 0) }),
      // Chi phí quản lý 642 = 10tr
      makeEntry({ month: 12, debitAccount: '642', creditAccount: '112', amount: makeMoney(10_000_000n, 0) }),
    ]

    const cdfsAccounts = new Map<string, CdfsAccountRow>([
      ['154', makeCdfs('154', 'Chi phí SXKD dở dang', 20_000_000, 10_000_000)], // Delta = +10tr
      ['155', makeCdfs('155', 'Thành phẩm', 15_000_000, 5_000_000)], // Delta = +10tr
    ])

    const report = ExpenseByNatureEngine.analyze(entries, cdfsAccounts)
    const recon = report.bctcReconciliation

    expect(recon.totalNatureCost).toBe(110_000_000) // 60 (NVL) + 30 (NC) + 10 (KH) + 10 (QL)
    expect(recon.deltaWip154).toBe(10_000_000)
    expect(recon.deltaFinished155).toBe(10_000_000)
    expect(recon.calculatedTotalOperatingCost).toBe(130_000_000) // 110 + 10 + 10
    expect(recon.totalTransferred911Cost).toBe(130_000_000) // 120 (632) + 10 (642)
    expect(recon.difference).toBe(0)
    expect(recon.isBalanced).toBe(true)
  })
})
