import ExcelJS from 'exceljs'
import type { ProfileSummary } from '../../domain/profiling/dataProfiler'
import type { DiffRow } from '../../domain/types'

const MONEY_FMT = '#,##0;[Red](#,##0);-'
const FILL_HEADER = 'D9D9D9'
const FILL_SECTION = 'E2EFDA' // xanh lá nhạt kiểm toán
const FILL_ALERT = 'FCE4D6'   // cam nhạt cảnh báo

function styleHeaderRow(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: 'FF000000' } }
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${FILL_HEADER}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    }
  })
  row.height = 24
}

function setColumnWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })
}

function applyBorders(ws: ExcelJS.Worksheet, fromRow: number, toRow: number, numCols: number): void {
  for (let r = fromRow; r <= toRow; r++) {
    const row = ws.getRow(r)
    for (let c = 1; c <= numCols; c++) {
      const cell = row.getCell(c)
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      }
    }
  }
}

/**
 * Viết nội dung phân tích Data Profiler & Cutoff vào một Worksheet.
 */
export function writeProfilerSummaryToWorksheet(ws: ExcelJS.Worksheet, summary: ProfileSummary): void {
  setColumnWidths(ws, [6, 28, 16, 18, 22, 28])

  // Tiêu đề chính
  const titleRow = ws.addRow(['BÁO CÁO TRỰC QUAN HÓA DỮ LIỆU & PHÂN TÍCH RỦI RO KHÓA SỔ (DATA PROFILING & CUTOFF)'])
  titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } }
  ws.mergeCells(1, 1, 1, 6)
  titleRow.height = 30
  titleRow.getCell(1).alignment = { vertical: 'middle' }

  // Thông tin tổng quan
  const subRow = ws.addRow([
    `Tổng số dòng kiểm tra: ${summary.quality.totalRows.toLocaleString('vi-VN')} dòng | ` +
    `Tổng phát sinh: ${Number(summary.totalProfiledAmount).toLocaleString('vi-VN')} đ | ` +
    `Ngày kết xuất: ${new Date().toLocaleDateString('vi-VN')}`,
  ])
  subRow.font = { italic: true, size: 10, color: { argb: 'FF595959' } }
  ws.mergeCells(2, 1, 2, 6)
  ws.addRow([]) // blank

  // ── PHẦN 1: BẢNG PHÂN TẦNG RỦI RO THEO GIÁ TRỊ ──
  const sec1 = ws.addRow(['I. PHÂN TẦNG RỦI RO THEO GIÁ TRỊ PHÁT SINH'])
  sec1.font = { bold: true, size: 11, color: { argb: 'FF1F4E79' } }
  sec1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${FILL_SECTION}` } }
  ws.mergeCells(sec1.number, 1, sec1.number, 6)

  const h1 = ws.addRow(['STT', 'Tầng giá trị', 'Mức độ rủi ro', 'Số lượng dòng', 'Tỷ trọng dòng (%)', 'Tổng giá trị phát sinh (VNĐ)'])
  styleHeaderRow(h1)

  const r1Start = ws.rowCount + 1
  summary.tiers.forEach((t, idx) => {
    const row = ws.addRow([
      idx + 1,
      t.label,
      t.subLabel,
      t.count,
      t.percentOfTotal / 100,
      Number(t.totalAmount),
    ])
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(4).numFmt = '#,##0'
    row.getCell(5).numFmt = '0.0%'
    row.getCell(6).numFmt = MONEY_FMT
  })
  applyBorders(ws, r1Start, ws.rowCount, 6)
  ws.addRow([]) // blank

  // ── PHẦN 2: BẢNG PHÂN BỔ DÒNG TIỀN 12 THÁNG ──
  const sec2 = ws.addRow(['II. PHÂN BỔ DÒNG TIỀN 12 THÁNG & CHÊNH LỆCH ĐIỀU CHỈNH'])
  sec2.font = { bold: true, size: 11, color: { argb: 'FF1F4E79' } }
  sec2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${FILL_SECTION}` } }
  ws.mergeCells(sec2.number, 1, sec2.number, 6)

  const h2 = ws.addRow(['STT', 'Tháng chứng từ', 'Số lượng bút toán', 'Tổng giá trị (VNĐ)', 'Số dòng có chênh lệch', 'Tổng chênh lệch sau ĐC (VNĐ)'])
  styleHeaderRow(h2)

  const r2Start = ws.rowCount + 1
  summary.monthly.forEach((m) => {
    const row = ws.addRow([
      m.month,
      `Tháng ${String(m.month).padStart(2, '0')}`,
      m.count,
      Number(m.totalAmount),
      m.diffCount,
      Number(m.totalDiffAmount),
    ])
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(3).numFmt = '#,##0'
    row.getCell(4).numFmt = MONEY_FMT
    row.getCell(5).numFmt = '#,##0'
    row.getCell(6).numFmt = MONEY_FMT
  })
  applyBorders(ws, r2Start, ws.rowCount, 6)
  ws.addRow([]) // blank

  // ── PHẦN 3: CẢNH BÁO RỦI RO KIỂM TOÁN ĐẶC BIỆT ──
  const sec3 = ws.addRow(['III. NHẬN DIỆN RỦI RO KIỂM TOÁN ĐẶC BIỆT (CUTOFF & TIỀN TRÒN)'])
  sec3.font = { bold: true, size: 11, color: { argb: 'FFC00000' } }
  sec3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${FILL_ALERT}` } }
  ws.mergeCells(sec3.number, 1, sec3.number, 6)

  const h3 = ws.addRow(['STT', 'Chỉ tiêu rủi ro kiểm toán', 'Đánh giá rủi ro', 'Số lượng phát sinh', 'Tổng giá trị liên quan (VNĐ)', 'Thủ tục kiểm toán khuyến nghị'])
  styleHeaderRow(h3)

  const r3Start = ws.rowCount + 1
  const cutoffRow = ws.addRow([
    1,
    'Giao dịch ngày khóa sổ 31/12 (Cutoff Risk)',
    'Rủi ro sai lệch niên độ',
    summary.cutoff.count31Dec,
    Number(summary.cutoff.totalAmount31Dec),
    'So khớp hóa đơn, biên bản giao nhận và sao kê ngân hàng quanh ngày 31/12',
  ])
  cutoffRow.getCell(1).alignment = { horizontal: 'center' }
  cutoffRow.getCell(3).alignment = { horizontal: 'center' }
  cutoffRow.getCell(4).numFmt = '#,##0'
  cutoffRow.getCell(5).numFmt = MONEY_FMT

  const roundRow = ws.addRow([
    2,
    'Giao dịch số tiền tròn chục/trăm triệu (>=10tr)',
    'Rủi ro ước tính/bút toán khống',
    summary.quality.roundAmountCount,
    0,
    'Kiểm tra hợp đồng và cơ sở tính toán của các số tiền làm tròn bất thường',
  ])
  roundRow.getCell(1).alignment = { horizontal: 'center' }
  roundRow.getCell(3).alignment = { horizontal: 'center' }
  roundRow.getCell(4).numFmt = '#,##0'
  roundRow.getCell(5).value = '-'
  roundRow.getCell(5).alignment = { horizontal: 'center' }

  applyBorders(ws, r3Start, ws.rowCount, 6)
}

/**
 * Xuất chi tiết danh sách chứng từ lọc sang một Worksheet riêng.
 */
function writeFilteredRowsToWorksheet(ws: ExcelJS.Worksheet, rows: readonly DiffRow[], filterDesc?: string): void {
  setColumnWidths(ws, [6, 12, 16, 14, 35, 10, 10, 18, 18, 18, 28])

  const titleRow = ws.addRow([`DANH SÁCH CHỨNG TỪ THEO BỘ LỌC: ${filterDesc ? filterDesc.toUpperCase() : 'TẤT CẢ'}`])
  titleRow.font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } }
  ws.mergeCells(1, 1, 1, 11)
  titleRow.height = 26
  titleRow.getCell(1).alignment = { vertical: 'middle' }

  const sub = ws.addRow([`Tổng số chứng từ trong danh sách: ${rows.length.toLocaleString('vi-VN')} dòng`])
  sub.font = { italic: true, size: 10, color: { argb: 'FF595959' } }
  ws.mergeCells(2, 1, 2, 11)
  ws.addRow([])

  const h = ws.addRow([
    'STT',
    'Nguồn',
    'Ngày chứng từ',
    'Số chứng từ',
    'Diễn giải / Nội dung',
    'TK Nợ',
    'TK Có',
    'Sau điều chỉnh',
    'Trước điều chỉnh',
    'Chênh lệch',
    'Nhận xét',
  ])
  styleHeaderRow(h)

  const startR = ws.rowCount + 1
  rows.forEach((r, idx) => {
    const row = ws.addRow([
      idx + 1,
      r.kind === 'ADDED_AFTER' ? '+ Thêm sau ĐC' : r.kind === 'REMOVED_AFTER' ? '− Xóa sau ĐC' : '~ Đổi số tiền',
      r.dateISO ?? '',
      r.voucher,
      r.description,
      r.debit,
      r.credit,
      Number(r.amountAfter),
      Number(r.amountBefore),
      Number(r.difference),
      r.note,
    ])
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(4).alignment = { horizontal: 'center' }
    row.getCell(6).alignment = { horizontal: 'center' }
    row.getCell(7).alignment = { horizontal: 'center' }
    row.getCell(8).numFmt = MONEY_FMT
    row.getCell(9).numFmt = MONEY_FMT
    row.getCell(10).numFmt = MONEY_FMT
  })
  applyBorders(ws, startR, ws.rowCount, 11)
}

/**
 * Xây dựng Workbook hoàn chỉnh cho Báo cáo Data Profiler độc lập.
 */
export function buildProfilerWorkbook(
  summary: ProfileSummary,
  filteredRows?: readonly DiffRow[],
  filterDesc?: string,
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft Profiler'
  wb.created = new Date()

  // Sheet 1: Tổng hợp phân tích
  const ws1 = wb.addWorksheet('Tong hop Phan tich & Cutoff')
  writeProfilerSummaryToWorksheet(ws1, summary)

  // Sheet 2: Danh sách chứng từ theo bộ lọc (nếu có dữ liệu)
  if (filteredRows && filteredRows.length > 0) {
    const ws2 = wb.addWorksheet('Chi tiet chung tu loc')
    writeFilteredRowsToWorksheet(ws2, filteredRows, filterDesc)
  }

  return wb
}
