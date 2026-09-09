import { describe, expect, it } from 'vitest'
import { standardizeSource } from '../src/domain/pipeline/standardize'
import { runCorePipeline } from '../src/domain/pipeline/runPipeline'
import { moneyFromJSON } from '../src/domain/money'
import type { ColumnMapping } from '../src/domain/types'

const MAPPING: ColumnMapping = { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 }

interface LineSpec {
  day: string
  voucher: string
  description: string
  debit: string
  credit: string
  before: number
  after: number
}

// 15 dòng chênh lệch chính → 13 nhóm LEFT4|LEFT4 (G2 và G10 có 2 dòng)
const MAIN: LineSpec[] = [
  { day: '2025-01-02', voucher: 'PT001', description: 'NOP TIEN MAT', debit: '1121', credit: '3335', before: 1002570, after: 1002120 },
  { day: '2025-01-03', voucher: 'PT002', description: 'TRA NHANH', debit: '1121', credit: '1111', before: 34000, after: 33550 },
  { day: '2025-01-04', voucher: 'PT003', description: 'RUT TIEN GUI', debit: '1121', credit: '1111', before: 34000, after: 33550 },
  { day: '2025-01-05', voucher: 'PC010', description: 'MUA NGUYEN LIEU', debit: '1521', credit: '3311', before: 34000, after: 33550 },
  { day: '2025-01-05', voucher: 'PC011', description: 'NHAP KHO THANH PHAM', debit: '1121', credit: '1551', before: 34000, after: 33550 },
  { day: '2025-01-06', voucher: 'PC012', description: 'XUAT CCDC', debit: '1531', credit: '1111', before: 34000, after: 33550 },
  { day: '2025-01-07', voucher: 'PC013', description: 'HANG HOA GUI BAN', debit: '1121', credit: '1561', before: 34000, after: 33550 },
  { day: '2025-01-08', voucher: 'PC014', description: 'MUA TSCD', debit: '2111', credit: '1411', before: 34000, after: 33550 },
  { day: '2025-01-08', voucher: 'PC020', description: 'CHI PHI QUAN LY', debit: '6421', credit: '3335', before: 34000, after: 33550 },
  { day: '2025-01-09', voucher: 'PC021', description: 'THUE GTGT', debit: '6421', credit: '3335', before: 34000, after: 33550 },
  { day: '2025-01-09', voucher: 'PC022', description: 'TSCD DANG DUNG', debit: '1121', credit: '2111', before: 34000, after: 33550 },
  { day: '2025-01-10', voucher: 'PC030', description: 'LUONG QUAN LY', debit: '6428', credit: '3341', before: 34000, after: 33550 },
  { day: '2025-01-10', voucher: 'PC031', description: 'HANG TON KHO 152', debit: '1522', credit: '1122', before: 34000, after: 33550 },
  { day: '2025-01-11', voucher: 'PC032', description: 'XUAT KHO 155', debit: '1551', credit: '1121', before: 34000, after: 33550 },
  { day: '2025-01-12', voucher: 'PC040', description: 'CHI PHI BAN HANG', debit: '6422', credit: '1112', before: 3000000, after: 2999994 },
]

// 2 dòng chênh lệch có mặt TK 911 — sẽ bị lọc khỏi báo cáo chính nhưng VẪN nằm trong tổng nguồn
const EXTRA_911: LineSpec[] = [
  { day: '2025-01-15', voucher: 'KC001', description: 'KET CHUYEN SAU', debit: '9111', credit: '5111', before: 0, after: 1000 },
  { day: '2025-01-16', voucher: 'KC002', description: 'KET CHUYEN TRUOC', debit: '5112', credit: '9118', before: 500, after: 0 },
]

function buildRows(kind: 'before' | 'after'): unknown[][] {
  const header = ['Ngày', 'Số chứng từ', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền']
  const body = [...MAIN, ...EXTRA_911]
    .map((l) => [l.day, l.voucher, l.description, l.debit, l.credit, kind === 'before' ? l.before : l.after])
    .filter((r) => r[5] !== 0)
  return [header, ...body]
}

function cfg(kind: 'BEFORE' | 'AFTER'): Parameters<typeof runCorePipeline>[0]['before'] {
  return { kind, filePath: `fixture-${kind}.xlsx`, sheetName: 'NKC', headerRow: 1, mapping: MAPPING }
}

describe('ACCEPTANCE — đối chiếu số liệu workbook gốc', () => {
  const beforeStd = standardizeSource({ rows: buildRows('before'), firstDataRowIndex: 1, mapping: MAPPING })
  const afterStd = standardizeSource({ rows: buildRows('after'), firstDataRowIndex: 1, mapping: MAPPING })

  const out = runCorePipeline({
    before: cfg('BEFORE'),
    after: cfg('AFTER'),
    beforeStandardized: beforeStd,
    afterStandardized: afterStd,
    options: { excludeKetChuyen: false },
  })

  it('Tổng tiền NKC Sau = 4.439.264 (toàn bộ nguồn, gồm cả dòng 911)', () => {
    expect(moneyFromJSON(out.afterStats.totalAmount).raw).toBe(4439264n)
  })

  it('Tổng tiền NKC Trước = 4.445.070', () => {
    expect(moneyFromJSON(out.beforeStats.totalAmount).raw).toBe(4445070n)
  })

  it('Chênh lệch tổng hai nguồn = −5.806', () => {
    expect(moneyFromJSON(out.summary.totalDifference).raw).toBe(-5806n)
  })

  it('Chi tiết chênh lệch: 17 dòng (gồm 2 dòng 911); sau lọc còn đúng 15', () => {
    expect(out.diffRows.length).toBe(17)
    expect(out.summary.filteredLineCount).toBe(15)
  })

  it('Số loại bút toán sau gom = 13', () => {
    expect(out.entryTypeSummary.groupCount).toBe(13)
  })

  it('Tồn kho: Net/Gross tính đúng theo công thức trên dữ liệu fixture', () => {
    const total = out.inventory.find((r) => r.isTotal)
    // ghiNo(inv): 1521,1531,1522 → −450×3 = −1350 ; ghiCo(inv): 1551×2,1561 → −1350
    // Debit inv: 1521,1531,1522,1551 → −450×4 = −1800 ; Credit inv: 1551,1561 → −900
    // Net = −1800 − (−900) = −900 ; Gross = Σ|CL| = 450×6 = 2700
    expect(moneyFromJSON(total?.net ?? '0|0').raw).toBe(-900n)
    expect(moneyFromJSON(total?.gross ?? '0|0').raw).toBe(2700n)
  })

  it('checkbox KẾT CHUYỂN loại thêm dòng có diễn giải chứa từ khóa', () => {
    const stdBefore = standardizeSource({ rows: [], firstDataRowIndex: 0, mapping: MAPPING })
    const stdAfter = standardizeSource({
      rows: [
        ['Ngày', 'Số chứng từ', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền'],
        ['2025-02-01', 'ZZ1', 'KẾT CHUYỂN LÃI', '6421', '5111', 123],
        ['2025-02-02', 'ZZ2', 'NGHIỆP VỤ BÌNH THƯỜNG', '1111', '5111', 200],
      ],
      firstDataRowIndex: 1,
      mapping: MAPPING,
    })
    const out2 = runCorePipeline({
      before: cfg('BEFORE'),
      after: cfg('AFTER'),
      beforeStandardized: stdBefore,
      afterStandardized: stdAfter,
      options: { excludeKetChuyen: true },
    })
    expect(out2.summary.diffLineCount).toBe(2)
    expect(out2.summary.filteredLineCount).toBe(1)

    const out3 = runCorePipeline({
      before: cfg('BEFORE'),
      after: cfg('AFTER'),
      beforeStandardized: stdBefore,
      afterStandardized: stdAfter,
      options: { excludeKetChuyen: false },
    })
    expect(out3.summary.filteredLineCount).toBe(2)
  })
})
