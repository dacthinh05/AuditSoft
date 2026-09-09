import { describe, expect, it } from 'vitest'
import { standardizeSource } from '../src/domain/pipeline/standardize'
import { runCorePipeline } from '../src/domain/pipeline/runPipeline'
import { moneyFromJSON } from '../src/domain/money'
import type { ColumnMapping } from '../src/domain/types'

const MAPPING: ColumnMapping = { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 }

function generateRows(count: number, seedShift: number): unknown[][] {
  const rows: unknown[][] = [['Ngày', 'Số chứng từ', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền']]
  for (let i = 0; i < count; i++) {
    const day = String((i % 28) + 1).padStart(2, '0')
    const month = String((i % 12) + 1).padStart(2, '0')
    rows.push([
      `2025-${month}-${day}`,
      `CT${(i + seedShift) % 90000}`,
      `NGHIỆP VỤ MUA HÀNG SỐ ${i}`,
      i % 3 === 0 ? '1561' : '1121',
      i % 3 === 0 ? '5111' : '3311',
      ((i % 500) + 1) * 1000,
    ])
  }
  return rows
}

describe('VOLUME — 60.000 dòng mỗi nguồn', () => {
  it('chuẩn hóa + đối chiếu + báo cáo đầy đủ trong thời gian chấp nhận được', () => {
    const t0 = Date.now()
    const N = 60000
    const beforeStd = standardizeSource({ rows: generateRows(N, 0), firstDataRowIndex: 1, mapping: MAPPING })
    // nguồn sau: lệch 1.200 dòng đầu → tạo chênh lệch thật
    const afterRowsAll = generateRows(N, 1200)
    const afterStd = standardizeSource({ rows: afterRowsAll, firstDataRowIndex: 1, mapping: MAPPING })
    const tRead = Date.now()

    const out = runCorePipeline({
      before: { kind: 'BEFORE', filePath: 'vol-before.xlsx', sheetName: 'S', headerRow: 1, mapping: MAPPING },
      after: { kind: 'AFTER', filePath: 'vol-after.xlsx', sheetName: 'S', headerRow: 1, mapping: MAPPING },
      beforeStandardized: beforeStd,
      afterStandardized: afterStd,
      options: { excludeKetChuyen: false },
    })
    const tDone = Date.now()

    expect(beforeStd.stats.dataRows).toBe(N)
    expect(afterStd.stats.dataRows).toBe(N)
    expect(out.diffRows.length).toBeGreaterThan(1000)
    expect(out.summary.lineCountBefore).toBe(N)

    // Bất biến kế toán: Σ Chênh lệch toàn bộ = Tổng Sau − Tổng Trước
    const sumDiff = out.diffRows.reduce((acc, r) => acc + moneyFromJSON(r.difference).raw, 0n)
    const totalDiff = moneyFromJSON(out.summary.totalDifference).raw
    expect(sumDiff).toBe(totalDiff)

    // Σ sau lọc ≤ |Σ toàn bộ| theo trị tuyệt đối từng dòng
    const absSum = out.diffRows.reduce((acc, r) => acc + (moneyFromJSON(r.difference).raw < 0n ? -moneyFromJSON(r.difference).raw : moneyFromJSON(r.difference).raw), 0n)
    expect(absSum >= (totalDiff < 0n ? -totalDiff : totalDiff)).toBe(true)

    const elapsedMs = tDone - t0
    const readMs = tRead - t0
    // Ngưỡng rộng cho CI — máy cá nhân thường < 10s
    expect(elapsedMs).toBeLessThan(60000)
    expect(readMs).toBeLessThan(30000)
    console.log(`volume: read+standardize ${readMs}ms, pipeline tổng ${elapsedMs}ms, diffLines=${out.diffRows.length}`)
  }, 120000)
})
