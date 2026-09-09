import ExcelJS from 'exceljs'
import { applyMainFilter } from '../../domain/pipeline/mainReport'
import { moneyFromJSON } from '../../domain/money'
import type { BctcResult } from '../../domain/bctc/aggregate'
import type { WorkingPaperLine } from '../../domain/bctc/workingPaper'
import type { DiffRow, ExportEntryRow, ErrorLine, InventoryRow, EntryTypeGroup, ReconcileResult } from '../../domain/types'

const MONEY_FMT = '#,##0;[Red](#,##0);-'
const DATE_FMT = 'dd/mm/yyyy'

const FILL_ADDED = 'C6EFCE' // xanh lá — Thêm sau ĐC
const FILL_REMOVED = 'FFC7A0' // cam — Xóa sau ĐC
const FILL_CHANGED = 'FFF2CC' // vàng — Đổi số tiền
const FILL_HEADER = 'D9D9D9'

export interface ExportBuildInput {
  result: ReconcileResult
  excludeKetChuyen: boolean
}

function styleHeader(ws: ExcelJS.Worksheet): void {
  const header = ws.getRow(1)
  header.font = { bold: true }
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${FILL_HEADER}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  header.height = 22
}

function setWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })
}

function writeSourceSheet(
  wb: ExcelJS.Workbook,
  name: string,
  rows: readonly ExportEntryRow[],
): void {
  const ws = wb.addWorksheet(name)
  ws.columns = [
    { header: 'STT', key: 'stt' },
    { header: 'Ngày', key: 'date' },
    { header: 'Số chứng từ', key: 'voucher' },
    { header: 'Diễn giải', key: 'description' },
    { header: 'TK Nợ', key: 'debit' },
    { header: 'TK Có', key: 'credit' },
    { header: 'Số tiền', key: 'amount' },
  ]
  rows.forEach((r, i) => {
    const dateCell: string | Date = r.dateISO ? isoToDate(r.dateISO) : (r.displayDate ?? '')
    const row = ws.addRow([i + 1, dateCell, r.voucher, r.description, r.debit, r.credit, moneyNumber(r.amountJSON)])
    row.getCell(2).numFmt = DATE_FMT
    row.getCell(5).numFmt = '@'
    row.getCell(6).numFmt = '@'
    row.getCell(7).numFmt = MONEY_FMT
  })
  styleHeader(ws)
  setWidths(ws, [6, 12, 14, 46, 10, 10, 16])
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 7 } }
}

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1))
}

function moneyNumber(json: string): number {
  const m = moneyFromJSON(json)
  return Number(m.raw) / Math.pow(10, m.scale)
}

function kindFill(kind: DiffRow['kind']): string {
  if (kind === 'ADDED_AFTER') return FILL_ADDED
  if (kind === 'REMOVED_AFTER') return FILL_REMOVED
  return FILL_CHANGED
}

function writeDetailSheet(wb: ExcelJS.Workbook, rows: readonly DiffRow[]): void {
  const ws = wb.addWorksheet('Chi tiet chenh lech')
  ws.columns = [
    { header: 'STT' }, { header: 'Nguồn' }, { header: 'Khóa dò' }, { header: 'Ngày chứng từ' },
    { header: 'LoiNgay' }, { header: 'Số chứng từ' }, { header: 'Diễn giải' },
    { header: 'TK Nợ' }, { header: 'TK Có' },
    { header: 'Sau điều chỉnh' }, { header: 'Trước điều chỉnh' }, { header: 'Chênh lệch' },
    { header: 'Nhận xét' }, { header: 'Ưu tiên xử lý' },
  ]
  rows.forEach((r) => {
    const dateCell: string | Date = !r.loiNgay && /^\d{4}-\d{2}-\d{2}$/.test(extractISO(r)) ? isoToDate(extractISO(r)) : r.dateDisplay
    const row = ws.addRow([
      r.stt, r.kind === 'ADDED_AFTER' ? 'Thêm sau ĐC' : r.kind === 'REMOVED_AFTER' ? 'Xóa sau ĐC' : 'Đổi số tiền',
      r.key, dateCell, r.loiNgay ? 'x' : '', r.voucher, r.description, r.debit, r.credit,
      moneyNumber(r.amountAfter), moneyNumber(r.amountBefore), moneyNumber(r.difference), r.note, r.priority,
    ])
    const fill = kindFill(r.kind)
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } }
    })
    row.getCell(4).numFmt = DATE_FMT
    for (const col of [8, 9]) row.getCell(col).numFmt = '@'
    for (const col of [10, 11, 12]) row.getCell(col).numFmt = MONEY_FMT
  })
  styleHeader(ws)
  setWidths(ws, [6, 13, 40, 12, 8, 13, 42, 9, 9, 15, 15, 13, 34, 20])
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 14 } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

function extractISO(row: DiffRow): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(row.key.split('\u00A6')[0] ?? '')
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}

function writeGroupsSheet(wb: ExcelJS.Workbook, groups: readonly EntryTypeGroup[]): void {
  const ws = wb.addWorksheet('Tong hop loai but toan')
  ws.columns = [
    { header: 'Phần hành' }, { header: 'Nhóm TK (Nợ|Có)' }, { header: 'Các loại Nguồn' },
    { header: 'Số dòng chi tiết' }, { header: 'Số CT không trùng' },
    { header: 'CT đại diện' }, { header: 'Diễn giải đại diện' },
    { header: 'TK Nợ gom' }, { header: 'TK Có gom' },
    { header: 'Tổng Sau điều chỉnh' }, { header: 'Tổng Trước điều chỉnh' }, { header: 'Chênh lệch' },
    { header: 'Nhận xét' },
  ]
  groups.forEach((g) => {
    const row = ws.addRow([
      `${String(g.phanHanhId).padStart(2, '0')} - ${g.phanHanhName}`, g.key, g.sources.join(' + '),
      g.detailCount, g.distinctVoucherCount, g.repVoucher, g.repDescription,
      g.debitGrouped, g.creditGrouped,
      moneyNumber(g.sumAfter), moneyNumber(g.sumBefore), moneyNumber(g.sumDifference), g.note,
    ])
    for (const col of [10, 11, 12]) row.getCell(col).numFmt = MONEY_FMT
    for (const col of [8, 9]) row.getCell(col).numFmt = '@'
  })
  styleHeader(ws)
  setWidths(ws, [22, 16, 26, 10, 11, 13, 40, 9, 9, 17, 17, 14, 30])
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 13 } }
}

function writeInventorySheet(wb: ExcelJS.Workbook, rows: readonly InventoryRow[]): void {
  const ws = wb.addWorksheet('Dieu chinh ton kho')
  ws.state = 'hidden'
  ws.columns = [
    { header: 'Nhóm TK tồn kho' }, { header: 'Ghi Nợ tăng' }, { header: 'Ghi Có giảm' },
    { header: 'Net' }, { header: 'Gross' },
  ]
  rows.forEach((r) => {
    const row = ws.addRow([r.group, moneyNumber(r.ghiNo), moneyNumber(r.ghiCo), moneyNumber(r.net), moneyNumber(r.gross)])
    for (const col of [2, 3, 4, 5]) row.getCell(col).numFmt = MONEY_FMT
    if (r.isTotal) {
      row.font = { bold: true }
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${FILL_HEADER}` } }
      })
    }
  })
  styleHeader(ws)
  setWidths(ws, [18, 18, 18, 16, 16])
}

function writeErrorsSheet(wb: ExcelJS.Workbook, errors: readonly ErrorLine[]): void {
  const ws = wb.addWorksheet('Loi du lieu')
  ws.columns = [
    { header: 'Nguồn' }, { header: 'Dòng (sheet)' }, { header: 'Ngày' }, { header: 'Số chứng từ' },
    { header: 'Diễn giải' }, { header: 'TK Nợ' }, { header: 'TK Có' }, { header: 'Số tiền' }, { header: 'Lỗi' },
  ]
  errors.forEach((e) => {
    const row = ws.addRow([
      e.source === 'BEFORE' ? 'NKC trước ĐC' : 'NKC sau ĐC', e.rowIndex, e.displayDate, e.voucher,
      e.description, e.debit, e.credit, e.amountDisplay, e.errors.join('; '),
    ])
    row.getCell(9).font = { color: { argb: 'FFCC0000' } }
  })
  styleHeader(ws)
  setWidths(ws, [14, 12, 12, 13, 40, 9, 9, 16, 28])
}

function writeWorkingPaperSheet(wb: ExcelJS.Workbook, lines: readonly WorkingPaperLine[]): void {
  const ws = wb.addWorksheet('B360 - But toan dieu chinh')
  ws.views = [{ state: 'frozen', ySplit: 5 }]
  ws.properties.tabColor = { argb: 'FF70AD47' }

  // ── 1. Summary Check Rows (Rows 1-2) ──
  const lastDataRow = Math.max(6, 5 + lines.length)
  const sumFmt = '#,##0.00;[Red](#,##0.00);"-";@'
  const redFmt = '[Red](#,##0.00);[Red](#,##0.00);"-";@'

  ws.getCell('H2').value = { formula: `SUM(H6:H${lastDataRow})` }
  ws.getCell('I2').value = { formula: `SUM(I6:I${lastDataRow})` }
  ws.getCell('J2').value = { formula: `SUM(J6:J${lastDataRow})` }
  ws.getCell('K2').value = { formula: `SUM(K6:K${lastDataRow})` }

  ws.getCell('I1').value = { formula: `(H2-I2)` }
  ws.getCell('K1').value = { formula: `(J2-K2)` }

  for (const cellRef of ['H2', 'I2', 'J2', 'K2']) {
    const c = ws.getCell(cellRef)
    c.font = { bold: true, size: 10 }
    c.numFmt = sumFmt
    c.alignment = { horizontal: 'right', vertical: 'middle' }
  }

  for (const cellRef of ['I1', 'K1']) {
    const c = ws.getCell(cellRef)
    c.font = { bold: true, size: 10, color: { argb: 'FFFF0000' } }
    c.numFmt = redFmt
    c.alignment = { horizontal: 'right', vertical: 'middle' }
  }

  // ── 2. Table Column Headers (Rows 3-5) ──
  ws.getRow(3).height = 24
  ws.getRow(4).height = 22
  ws.getRow(5).height = 20

  ws.getCell('A3').value = 'TT'
  ws.mergeCells('A3:A5')
  ws.getCell('B3').value = 'Tham chiếu giấy làm việc'
  ws.mergeCells('B3:B5')
  ws.getCell('C3').value = 'NỘI DUNG'
  ws.mergeCells('C3:C5')
  ws.getCell('D3').value = 'TK NỢ'
  ws.mergeCells('D3:D5')
  ws.getCell('E3').value = 'TK CÓ'
  ws.mergeCells('E3:E5')
  ws.getCell('F3').value = 'SỐ PS'
  ws.mergeCells('F3:F5')

  ws.getCell('G3').value = 'ẢNH HƯỞNG CĐKT'
  ws.mergeCells('G3:K3')
  ws.getCell('G4').value = 'Chỉ tiêu'
  ws.mergeCells('G4:G5')
  ws.getCell('H4').value = 'Tài sản'
  ws.mergeCells('H4:I4')
  ws.getCell('J4').value = 'Nguồn vốn'
  ws.mergeCells('J4:K4')
  ws.getCell('H5').value = 'Tăng'
  ws.getCell('I5').value = 'Giảm'
  ws.getCell('J5').value = 'Tăng'
  ws.getCell('K5').value = 'Giảm'

  ws.getCell('L3').value = 'ẢNH HƯỞNG KQKD'
  ws.mergeCells('L3:N3')
  ws.getCell('L4').value = 'Chỉ tiêu'
  ws.mergeCells('L4:L5')
  ws.getCell('M5').value = 'Tăng'
  ws.getCell('N5').value = 'Giảm'

  ws.getCell('P3').value = 'KIỂM TRA MAPPING & CÂN ĐỐI'
  ws.mergeCells('P3:P5')
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  }

  for (let r = 3; r <= 5; r++) {
    for (let c = 1; c <= 16; c++) {
      const cell = ws.getRow(r).getCell(c)
      cell.font = { bold: true, size: 9.5 }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = thinBorder
      if (c >= 7 && c <= 11) {
        if (r === 3) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
        else if (r === 4 && (c === 8 || c === 9 || c === 10 || c === 11)) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8EA9DB' } }
        else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } }
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
      }
    }
  }
  // ── 3. Data Rows ──
  const numFmt = '#,##0.00;[Red](#,##0.00);"-";@'

  lines.forEach((line, i) => {
    const rIdx = 6 + i
    const row = ws.getRow(rIdx)
    row.height = 20

    row.getCell(1).value = line.stt !== '' ? line.stt : ''
    row.getCell(2).value = line.glv
    row.getCell(3).value = line.noiDung
    row.getCell(4).value = line.tkNo
    row.getCell(5).value = line.tkCo
    row.getCell(6).value = line.soPS != null ? line.soPS : ''

    row.getCell(7).value = line.cdktChiTieu
    row.getCell(8).value = line.tsTang > 0 ? line.tsTang : null
    row.getCell(9).value = line.tsGiam > 0 ? line.tsGiam : null
    row.getCell(10).value = line.nvTang > 0 ? line.nvTang : null
    row.getCell(11).value = line.nvGiam > 0 ? line.nvGiam : null

    row.getCell(12).value = line.kqkdChiTieu
    row.getCell(13).value = line.kqkdTang > 0 ? line.kqkdTang : null
    row.getCell(14).value = line.kqkdGiam > 0 ? line.kqkdGiam : null

    row.getCell(16).value = line.kiemTra
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' }
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' }
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(12).alignment = { horizontal: 'left', vertical: 'middle' }
    row.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(14).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(15).alignment = { horizontal: 'center', vertical: 'middle' }

    row.getCell(4).numFmt = '@'
    row.getCell(5).numFmt = '@'
    row.getCell(16).numFmt = '@'
    for (const col of [6, 8, 9, 10, 11, 13, 14]) {
      row.getCell(col).numFmt = numFmt
    }

    for (let c = 1; c <= 16; c++) {
      const cell = row.getCell(c)
      cell.font = { size: 9.5 }
      cell.border = {
        top: { style: line.isFirstLineOfEntry ? 'thin' : 'hair', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: line.isSecondLineOfEntry ? 'thin' : 'hair', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      }
    }
  })

  setWidths(ws, [6, 18, 38, 10, 10, 14, 34, 14, 14, 14, 14, 32, 14, 14, 4, 14])
}

function writeBctcSummarySheet(wb: ExcelJS.Workbook, bctc: BctcResult): void {
  const ws = wb.addWorksheet('Anh huong BCTC')
  setWidths(ws, [9, 52, 16, 16, 16, 16])

  const title = (text: string): void => {
    const row = ws.addRow([null, text])
    row.font = { bold: true, size: 12 }
    row.height = 20
  }
  const header = (cells: string[]): void => {
    const row = ws.addRow([null, ...cells])
    row.font = { bold: true }
    row.eachCell((cell, colNumber) => {
      if (colNumber >= 2) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${FILL_HEADER}` } }
    })
  }

  title('TỔNG KIỂM TRA CÂN ĐỐI TOÀN BẢNG')
  const t = bctc.totals
  const totalRows: [string, number][] = [
    ['Tổng TS tăng', t.tongTaiSanTang],
    ['Tổng TS giảm', t.tongTaiSanGiam],
    ['Tổng NV tăng', t.tongNguonVonTang],
    ['Tổng NV giảm', t.tongNguonVonGiam],
    ['Chênh lệch cân đối (TS − NV)', t.chenhLechCanDoi],
    ['Ảnh hưởng lợi nhuận thuần (ΣX)', t.anhHuongLoiNhuanThuan],
    ['Số dòng chưa khai báo TK', t.soDongChuaMap],
  ]
  for (const [label, value] of totalRows) {
    const row = ws.addRow([null, label, value])
    row.getCell(3).numFmt = MONEY_FMT
    if (label.startsWith('Chênh lệch cân đối')) {
      row.getCell(2).font = { bold: true }
      row.getCell(3).font = { bold: true, color: { argb: t.canDoiToanBang ? 'FF007A3D' : 'FFCC0000' } }
      row.getCell(4).value = t.canDoiToanBang ? '✓ CÂN' : '⚠ KHÔNG CÂN'
      row.getCell(4).font = { bold: true, color: { argb: t.canDoiToanBang ? 'FF007A3D' : 'FFCC0000' } }
    }
  }
  ws.addRow([])

  title('GOM NHÓM ĐIỀU CHỈNH — CĐKT')
  header(['Chỉ tiêu', 'TS tăng', 'TS giảm', 'NV tăng', 'NV giảm'])
  for (const g of bctc.cdktRows) {
    const row = ws.addRow([null, g.chiTieu, g.tsTang, g.tsGiam, g.nvTang, g.nvGiam])
    for (const col of [3, 4, 5, 6]) row.getCell(col).numFmt = MONEY_FMT
  }
  ws.addRow([])

  title('GOM NHÓM ĐIỀU CHỈNH — KQKD')
  header(['Chỉ tiêu', 'Tăng lợi nhuận', 'Giảm lợi nhuận'])
  for (const g of bctc.kqkdRows) {
    const row = ws.addRow([null, g.chiTieu, g.tang, g.giam])
    for (const col of [3, 4]) row.getCell(col).numFmt = MONEY_FMT
  }
  ws.addRow([])

  title('ẢNH HƯỞNG THEO MÃ SỐ CHUẨN — BẢNG CÂN ĐỐI KẾ TOÁN')
  header(['Mã số', 'Chỉ tiêu', 'TS tăng', 'TS giảm', 'NV tăng', 'NV giảm'])
  for (const f of bctc.financialCdkt) {
    const row = ws.addRow([f.maSo, f.chiTieu, f.tsTang ?? 0, f.tsGiam ?? 0, f.nvTang ?? 0, f.nvGiam ?? 0])
    row.getCell(1).numFmt = '@'
    for (const col of [3, 4, 5, 6]) row.getCell(col).numFmt = MONEY_FMT
  }
  ws.addRow([])

  title('ẢNH HƯỞNG THEO MÃ SỐ CHUẨN — KẾT QUẢ HĐKD')
  header(['Mã số', 'Chỉ tiêu', 'Tăng lợi nhuận', 'Giảm lợi nhuận'])
  for (const f of bctc.financialKqkd) {
    const row = ws.addRow([f.maSo, f.chiTieu, f.tang ?? 0, f.giam ?? 0])
    row.getCell(1).numFmt = '@'
    for (const col of [3, 4]) row.getCell(col).numFmt = MONEY_FMT
  }
}

/** Dựng workbook báo cáo hoàn chỉnh (8 sheet, màu, định dạng, autofilter). */
export function buildReportWorkbook(input: ExportBuildInput): ExcelJS.Workbook {
  const { result, excludeKetChuyen } = input
  const filteredDiffRows = applyMainFilter(result.diffRows, { excludeKetChuyen })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft NKC'
  wb.created = new Date()

  writeSourceSheet(wb, 'NKC Truoc DC', result.beforeEntries)
  writeSourceSheet(wb, 'NKC Sau DC', result.afterEntries)
  writeDetailSheet(wb, filteredDiffRows)
  writeGroupsSheet(wb, result.groups)
  writeWorkingPaperSheet(wb, result.bctc.workingPaperLines)
  writeBctcSummarySheet(wb, result.bctc)
  writeInventorySheet(wb, result.inventory)
  writeErrorsSheet(wb, result.errors)
  return wb
}
