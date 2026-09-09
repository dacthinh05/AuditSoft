import ExcelJS from 'exceljs'
import type { AuditSamplingWpResult } from './auditSamplingWp'

const MONEY_FMT = '#,##0;[Red](#,##0);"-"'

/**
 * XUẤT FILE EXCEL QUY TRÌNH CHỌN MẪU KIỂM TOÁN CHUẨN MẪU BIỂU (A810 / G191)
 * Dựng chính xác 100% bố cục bảng tính 10 dòng và danh sách mẫu chọn theo mẫu KTV thực địa.
 */
export function buildSamplingWorkbook(wp: AuditSamplingWpResult): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft NKC'
  wb.created = new Date()

  // ══════════════════════════════════════════════════════════════════════
  // SHEET 1: QUY TRÌNH CHỌN MẪU (Quy trinh chon mau)
  // ══════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Quy trinh chon mau')
  ws1.views = [{ showGridLines: true }]
  ws1.columns = [
    { width: 5 }, // A
    { width: 44 }, // B
    { width: 12 }, // C
    { width: 14 }, // D
    { width: 22 }, // E (Số liệu)
    { width: 12 }, // F
    { width: 20 }, // G
    { width: 12 }, // H
    { width: 3 }, // I
    { width: 48 }, // J (Hướng dẫn)
  ]

  // 1. Header Information
  ws1.getCell('A1').value = 'Khách hàng:'
  ws1.getCell('A1').font = { bold: true, size: 10 }
  ws1.getCell('B1').value = 'CÔNG TY TNHH ABC'
  ws1.getCell('B1').font = { bold: true, size: 10 }

  ws1.getCell('A2').value = 'Niên độ:'
  ws1.getCell('B2').value = wp.periodStr

  // 2. Section Title
  ws1.getCell('A5').value = `C.1.a. Chọn mẫu kiểm tra ${wp.sectionName.toLowerCase()}`
  ws1.getCell('A5').font = { bold: true, size: 11, color: { argb: 'FF002060' } }

  ws1.getCell('A11').value = 'Công việc thực hiện:'
  ws1.getCell('A11').font = { bold: true, size: 10 }

  ws1.getCell('A12').value = '1. Xác định cỡ mẫu:'
  ws1.getCell('A12').font = { bold: true, underline: true, size: 10 }

  // 3. Method Descriptions
  ws1.getCell('B13').value = '- Mục đích kiểm tra:'
  ws1.getCell('D13').value = wp.purposeText

  ws1.getCell('B14').value = '- Đơn vị lấy mẫu áp dụng:'
  ws1.getCell('D14').value = wp.populationUnitText

  ws1.getCell('B15').value = '- Lấy mẫu thống kê hay phi thống kê:'
  ws1.getCell('D15').value = wp.methodType

  ws1.getCell('B16').value = '- Mức độ đảm bảo mong muốn từ việc thực hiện thử nghiệm cơ bản:'
  ws1.getCell('D16').value = wp.assuranceText
  ws1.getCell('D16').font = { bold: true }

  ws1.getCell('B17').value = '- Hệ số rủi ro:'
  ws1.getCell('D17').value = wp.riskFactor
  ws1.getCell('D17').font = { bold: true }

  // 4. Bảng 10 dòng tính toán cỡ mẫu
  ws1.getCell('E19').value = wp.periodStr
  ws1.getCell('E19').font = { bold: true }
  ws1.getCell('E19').alignment = { horizontal: 'center' }

  ws1.getCell('E20').value = `TK ${wp.accountCode}`
  ws1.getCell('E20').font = { bold: true, underline: true }
  ws1.getCell('E20').alignment = { horizontal: 'center' }

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  }

  const stepRowsData = [
    { row: 21, label: '1 - Giá trị tổng thể lấy mẫu:', val: wp.steps.totalAmount.numericValue, fmt: MONEY_FMT, fill: 'D9E1F2' },
    { row: 22, label: '2 - Mức trọng yếu thực hiện chi tiết: (A710)', val: wp.steps.pmDetailed.numericValue, fmt: MONEY_FMT, fill: 'D9E1F2' },
    { row: 23, label: '2.1 - Tỷ lệ % mức trọng yếu khoản mục so với tổng thể', val: wp.steps.pmRatio.numericValue, fmt: '0.0%', fill: 'FFFFFF' },
    { row: 24, label: '2.2 - Mức trọng yếu thực hiện khoản mục', val: { formula: 'E22*E23', result: wp.steps.pmItem.numericValue }, fmt: MONEY_FMT, fill: 'FFFFFF' },
    { row: 25, label: '3 - Mức độ đảm bảo yêu cầu', val: { formula: 'D17', result: wp.steps.riskFactor.numericValue }, fmt: '0.00', fill: 'FFFFFF' },
    { row: 26, label: '4 - Khoảng cách mẫu: (=2.2/3)', val: { formula: 'E24/E25', result: wp.steps.kcm.numericValue }, fmt: MONEY_FMT, fill: 'FFFFFF' },
    { row: 27, label: '5 - Giá trị phần tử lớn hơn KCM (1)', val: wp.steps.highValueItems.numericValue, fmt: MONEY_FMT, fill: 'D9E1F2' },
    { row: 28, label: '    Số lượng mẫu', val: wp.steps.highValueCount.numericValue, fmt: '#,##0', fill: 'E2EFDA' },
    { row: 29, label: '6 - Giá trị phần tử đặc biệt (2)', val: wp.steps.riskItems.numericValue, fmt: MONEY_FMT, fill: 'D9E1F2' },
    { row: 30, label: '    Số lượng mẫu', val: wp.steps.riskCount.numericValue, fmt: '#,##0', fill: 'E2EFDA' },
    { row: 31, label: '7 - Cỡ mẫu còn lại', val: { formula: 'ROUND((E21-E27-E29)/E26,0)', result: wp.steps.remainingSampleSize.numericValue }, fmt: '#,##0', fill: 'FFFFFF' },
    { row: 32, label: '8 - Tổng mẫu chọn', val: { formula: 'E28+E30+E31', result: wp.steps.totalSampleSize.numericValue }, fmt: '#,##0', fill: 'FFFFFF' },
    { row: 33, label: '9 - Số nghiệp vụ còn lại {sau khi trừ (1) và (2)}', val: wp.steps.remainingTxCount.numericValue, fmt: '#,##0', fill: 'FFFFFF' },
    { row: 34, label: '10 - Bước nhảy', val: { formula: 'ROUND(E33/E31,0)', result: wp.steps.stepJump.numericValue }, fmt: '#,##0', fill: 'FFF2CC' },
  ]

  for (const item of stepRowsData) {
    const r = item.row
    ws1.getCell(`B${r}`).value = item.label
    ws1.getCell(`B${r}`).font = { size: 9.5, italic: item.label.startsWith('2.1') || item.label.startsWith('2.2') }
    ws1.getCell(`B${r}`).border = thinBorder

    const valCell = ws1.getCell(`E${r}`)
    valCell.value = item.val
    valCell.numFmt = item.fmt
    valCell.font = { bold: true, size: 9.5 }
    valCell.alignment = { horizontal: 'right', vertical: 'middle' }
    valCell.border = thinBorder
    if (item.fill) {
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${item.fill}` } }
    }
  }

  // 5. Kết luận
  ws1.getCell('A39').value = 'KẾT LUẬN:'
  ws1.getCell('A39').font = { bold: true, size: 10 }
  ws1.getCell('B40').value = `Xác định được cỡ mẫu kiểm ${wp.steps.totalSampleSize.numericValue} phần tử phù hợp để đánh giá tính hợp lý về ${wp.sectionName.toLowerCase()} ghi nhận trong kỳ.`
  ws1.getCell('B40').font = { italic: true, size: 9.5 }

  // ══════════════════════════════════════════════════════════════════════
  // SHEET 2: DANH SÁCH MẪU ĐƯỢC CHỌN (Danh sach mau)
  // ══════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Danh sach mau')
  ws2.views = [{ showGridLines: true, state: 'frozen', ySplit: 7 }]
  ws2.columns = [
    { width: 6 }, // STT
    { width: 28 }, // Phân tầng mẫu
    { width: 34 }, // Lý do / Dấu hiệu chọn
    { width: 12 }, // Ngày CT
    { width: 15 }, // Số CT
    { width: 38 }, // Diễn giải
    { width: 10 }, // TK Nợ
    { width: 10 }, // TK Có
    { width: 18 }, // Số tiền (VND)
    { width: 16 }, // Ngoại tệ (USD)
    { width: 12 }, // Tỷ giá
    { width: 24 }, // Tham chiếu KTV
  ]

  // Header Title
  ws2.getCell('A1').value = 'BẢNG TỔNG HỢP CÁC MẪU ĐƯỢC CHỌN KIỂM TRA THỰC ĐỊA (VSA 530)'
  ws2.getCell('A1').font = { bold: true, size: 12, color: { argb: 'FF002060' } }

  ws2.getCell('A2').value = `Phần hành: ${wp.sectionName} (TK ${wp.accountCode}) | Tổng mẫu chọn: ${wp.summary.selectedCount} mẫu | Tỷ lệ bao phủ: ${wp.summary.coveragePercent.toFixed(1)}%`
  ws2.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF595959' } }

  // Table Headers
  const tableHeaders = [
    'STT',
    'Phân tầng mẫu',
    'Lý do / Dấu hiệu chọn',
    'Ngày CT',
    'Số CT',
    'Diễn giải / Nội dung',
    'TK Nợ',
    'TK Có',
    'Số tiền (VND)',
    'Ngoại tệ (USD)',
    'Tỷ giá',
    'Ghi chú KTV / Tham chiếu',
  ]
  const headerRow = ws2.getRow(7)
  headerRow.height = 24
  tableHeaders.forEach((th, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = th
    cell.font = { bold: true, size: 9.5, color: { argb: 'FF1E293B' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    cell.border = thinBorder
  })

  // Data Rows
  wp.samples.forEach((sample, i) => {
    const rIdx = 8 + i
    const row = ws2.getRow(rIdx)
    row.height = 20

    row.getCell(1).value = sample.stt
    row.getCell(2).value = sample.categoryLabel
    row.getCell(3).value = sample.riskNote
    row.getCell(4).value = sample.displayDate
    row.getCell(5).value = sample.voucher
    row.getCell(6).value = sample.description
    row.getCell(7).value = sample.debit
    row.getCell(8).value = sample.credit
    row.getCell(9).value = sample.amount
    row.getCell(10).value = sample.foreignAmount && sample.foreignAmount > 0 ? sample.foreignAmount : null
    row.getCell(11).value = sample.exchangeRate && sample.exchangeRate > 0 ? sample.exchangeRate : null
    row.getCell(12).value = '[Chờ đối chiếu]'

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' }
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle' }
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(12).alignment = { horizontal: 'center', vertical: 'middle' }

    row.getCell(7).numFmt = '@'
    row.getCell(8).numFmt = '@'
    row.getCell(9).numFmt = MONEY_FMT
    row.getCell(10).numFmt = '#,##0.00;[Red](#,##0.00);"-"'
    row.getCell(11).numFmt = '#,##0.00;[Red](#,##0.00);"-"'

    let bgFill = 'FFFFFF'
    if (sample.category === 'KCM_HIGH_VALUE') bgFill = 'FEF3C7'
    else if (sample.category === 'SPECIFIC_RISK') bgFill = 'FEE2E2'

    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c)
      cell.font = { size: 9 }
      cell.border = thinBorder
      if (bgFill !== 'FFFFFF' && (c === 1 || c === 2 || c === 3)) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgFill}` } }
      }
    }
  })

  return wb
}
