import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { inspectWorkbookFile } from '../src/infrastructure/excel/inspectWorkbook'
import { readSheetRows } from '../src/infrastructure/excel/readWorkbook'
import { standardizeSource } from '../src/domain/pipeline/standardize'
import { buildReportWorkbook } from '../src/infrastructure/excel/exportWorkbook'
import { runCorePipeline } from '../src/domain/pipeline/runPipeline'
import { parseDelimited } from '../src/infrastructure/excel/csvTable'
import type { ColumnMapping, ReconcileResult } from '../src/domain/types'

const MAPPING: ColumnMapping = { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 }

function tmpFile(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditsoft-'))
  return path.join(dir, name)
}

describe('CSV parser', () => {
  it('xử lý dấu chấm phẩy + ngoặc kép + unicode', () => {
    const text = '"Ngày";"Số CT";"Diễn giải";"TK Nợ";"TK Có";"Số tiền"\r\n07/01/2025;PT001;"Thanh toán ""Việt Phát""";3311;1121;1.234.567\r\n'
    const rows = parseDelimited(text)
    expect(rows.length).toBe(2)
    expect(rows[1]?.[2]).toBe('Thanh toán "Việt Phát"')
    expect(rows[1]?.[5]).toBe('1.234.567')
  })
})

describe('Excel import/export — Unicode + số tiền chính xác', () => {
  it('inspect xlsx: dò header tự động đủ 6 cột', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('NKC')
    ws.addRow(['Ngày ghi sổ', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền'])
    ws.addRow([new Date(Date.UTC(2025, 0, 7)), 'PT001', 'Thanh toán cho nhà cung cấp Việt Phát', '3311', '1121', 1234567.89])
    ws.addRow(['07/01/2025', 'PT002', 'Nộp thuế GTGT kỳ T12/2024', '3336', '1121', '2500000'])
    const file = tmpFile('in.xlsx')
    await wb.xlsx.writeFile(file)

    const meta = await inspectWorkbookFile(file)
    const sheet = meta.sheets[0]!
    expect(sheet.suggestedHeaderRow).toBe(1)
    for (const key of ['date', 'voucher', 'description', 'debit', 'credit', 'amount'] as const) {
      expect(sheet.suggestedMapping[key]).not.toBeNull()
    }

    const read = await readSheetRows(file, 'NKC')
    const std = standardizeSource({ rows: read.rows, firstDataRowIndex: 1, mapping: MAPPING })
    expect(std.stats.dataRows).toBe(2)
    expect(std.entries[0]?.description).toContain('VIỆT PHÁT')
    expect(std.entries[0]?.dateISO).toBe('2025-01-07')
    // 1234567.89 → Number.Round nguyên như PQ
    expect(std.entries[0]?.amount?.raw).toBe(1234568n)
  })

  it('export workbook: đọc lại đúng Unicode, số liệu và màu phân loại', async () => {
    function std(rows: unknown[][]): ReturnType<typeof standardizeSource> {
      return standardizeSource({ rows, firstDataRowIndex: 1, mapping: MAPPING })
    }
    const beforeStd = std([
      ['Ngày', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền'],
      ['2025-01-07', 'PT001', 'Điều chỉnh hạch toán — Việt Phát', '3311', '1121', 500],
    ])
    const afterStd = std([
      ['Ngày', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền'],
      ['2025-01-07', 'PT001', 'Điều chỉnh hạch toán — Việt Phát', '3311', '1121', 900],
    ])
    const core = runCorePipeline({
      before: { kind: 'BEFORE', filePath: 'b.xlsx', sheetName: 'NKC', headerRow: 1, mapping: MAPPING },
      after: { kind: 'AFTER', filePath: 'a.xlsx', sheetName: 'NKC', headerRow: 1, mapping: MAPPING },
      beforeStandardized: beforeStd,
      afterStandardized: afterStd,
      options: { excludeKetChuyen: false },
    })

    const wbOut = buildReportWorkbook({
      result: { ...(core as unknown as ReconcileResult), beforeEntries: [], afterEntries: [], startedAt: 0, finishedAt: 0 },
      excludeKetChuyen: false,
    })
    const outPath = tmpFile('report.xlsx')
    await wbOut.xlsx.writeFile(outPath)

    const rb = new ExcelJS.Workbook()
    await rb.xlsx.readFile(outPath)

    expect(rb.worksheets.map((w) => w.name)).toEqual([
      'NKC Truoc DC',
      'NKC Sau DC',
      'Chi tiet chenh lech',
      'Tong hop loai but toan',
      'B360 - But toan dieu chinh',
      'Anh huong BCTC',
      'Dieu chinh ton kho',
      'Loi du lieu',
      'Phan tich & Rui ro Cutoff',
    ])

    const detail = rb.getWorksheet('Chi tiet chenh lech')!
    expect(detail.rowCount).toBe(2) // header + 1 dòng lệch
    const row2 = detail.getRow(2)
    expect(String(row2.getCell(7).value)).toContain('VIỆT PHÁT') // Diễn giải unicode (đã UPPER như PQ)
    expect(row2.getCell(12).value).toBe(400) // Chênh lệch = 900 − 500

    // Màu vàng cho Đổi số tiền (FFF2CC)
    const fill = row2.getCell(1).fill as { fgColor?: { argb?: string } }
    expect(fill.fgColor?.argb).toBe('FFFFF2CC')

    // TK dạng text không mất số 0 đầu
    expect(String(row2.getCell(8).value)).toBe('3311')

    // ── Sheet B360 - But toan dieu chinh (mirror B360 / working paper):
    // Nợ 3311 / Có 1121, Số PS 400 → Dòng 6: Phải trả người bán NV giảm 400; Dòng 7: Tiền TS giảm 400
    const bt = rb.getWorksheet('B360 - But toan dieu chinh')!
    expect(bt.getCell('A3').value).toBe('TT')
    expect(bt.getCell('G3').value).toBe('ẢNH HƯỞNG CĐKT')
    expect(bt.getCell('L3').value).toBe('ẢNH HƯỞNG KQKD')
    expect(bt.getCell('P3').value).toBe('KIỂM TRA MAPPING & CÂN ĐỐI')

    const d6 = bt.getRow(6)
    expect(d6.getCell(4).value).toBe('3311')
    expect(d6.getCell(5).value).toBe('1121')
    expect(d6.getCell(6).value).toBe(400)
    expect(d6.getCell(7).value).toBe('Tiền')
    expect(d6.getCell(9).value).toBe(400) // TS Giảm = 400

    const d7 = bt.getRow(7)
    expect(d7.getCell(7).value).toBe('Phải trả người bán')
    expect(d7.getCell(11).value).toBe(400) // NV Giảm = 400
    // Kiểm tra định dạng số không có phần thập phân .00
    expect(bt.getCell('H2').numFmt).toBe('#,##0;[Red](#,##0);"-";@')
    expect(bt.getCell('I1').numFmt).toBe('[Red](#,##0);[Red](#,##0);"-";@')
    expect(d6.getCell(6).numFmt).toBe('#,##0;[Red](#,##0);"-";@')
    expect(d6.getCell(9).numFmt).toBe('#,##0;[Red](#,##0);"-";@')
    expect(d7.getCell(11).numFmt).toBe('#,##0;[Red](#,##0);"-";@')

    // ── Sheet ảnh hưởng BCTC: tổng kiểm tra CÂN; gom nhóm & mã số chuẩn khớp số liệu
    const ah = rb.getWorksheet('Anh huong BCTC')!
    let balanceCell: number | undefined
    let gomTienTsGiam: number | undefined
    let gomPhaiTraNvGiam: number | undefined
    let f111TsGiam: number | undefined
    let f112TsGiam: number | undefined
    ah.eachRow((row) => {
      const a = String(row.getCell(1).value ?? '')
      const b = String(row.getCell(2).value ?? '')
      if (b.startsWith('Chênh lệch cân đối')) balanceCell = Number(row.getCell(3).value)
      if (a === '' && b === 'Tiền') gomTienTsGiam = Number(row.getCell(4).value)
      if (a === '' && b === 'Phải trả người bán') gomPhaiTraNvGiam = Number(row.getCell(6).value)
      if (a === '111') f111TsGiam = Number(row.getCell(4).value)
      if (a === '112') f112TsGiam = Number(row.getCell(4).value)
    })
    expect(balanceCell).toBe(0) // TS giảm 400 − NV giảm 400 → CÂN
    expect(gomTienTsGiam).toBe(400) // Gom nhóm CĐKT: Tiền TS giảm 400
    expect(gomPhaiTraNvGiam).toBe(400) // Phải trả người bán NV giảm 400
    expect(f111TsGiam).toBe(400) // Mã số 111 Tiền: TS giảm 400
    expect(f112TsGiam).toBe(0) // Mã số 112: dữ liệu chỉ chứa "Tiền" — không khớp "Tiền gửi ngân hàng" (đúng语义 SUMIFS)
  }, 30000)
})
