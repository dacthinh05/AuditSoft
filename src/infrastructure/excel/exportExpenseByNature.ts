import ExcelJS from 'exceljs'
import type { ExpenseByNatureReport, ExpenseNatureCategory } from '../../domain/analytics/types'

const MONEY_FMT = '#,##0;[Red]-#,##0;"-"'

const CATEGORY_CONFIG: {
  key: ExpenseNatureCategory
  label: string
  groupTitle: string
  colorArgb: string
  rowProp: 'rawMaterials' | 'labor' | 'depreciation' | 'outsideServices' | 'otherCash'
}[] = [
  {
    key: 'RAW_MATERIALS',
    label: 'Nguyên Vật Liệu',
    groupTitle: 'I. CHI PHÍ NGUYÊN VẬT LIỆU',
    colorArgb: 'FFE2EFDA', // Xanh lá nhạt
    rowProp: 'rawMaterials',
  },
  {
    key: 'LABOR',
    label: 'Nhân Công',
    groupTitle: 'II. CHI PHÍ NHÂN CÔNG',
    colorArgb: 'FFDDEBF7', // Xanh dương nhạt
    rowProp: 'labor',
  },
  {
    key: 'DEPRECIATION',
    label: 'Khấu Hao',
    groupTitle: 'III. CHI PHÍ KHẤU HAO TSCĐ',
    colorArgb: 'FFFFF2CC', // Vàng nhạt
    rowProp: 'depreciation',
  },
  {
    key: 'OUTSIDE_SERVICES',
    label: 'Dịch Vụ Ngoài',
    groupTitle: 'IV. CHI PHÍ DỊCH VỤ MUA NGOÀI',
    colorArgb: 'FFFCE4D6', // Cam nhạt
    rowProp: 'outsideServices',
  },
  {
    key: 'OTHER_CASH',
    label: 'Khác Bằng Tiền',
    groupTitle: 'V. CHI PHÍ KHÁC BẰNG TIỀN',
    colorArgb: 'FFF2F2F2', // Xám nhạt
    rowProp: 'otherCash',
  },
]

function getColLetter(colIdx: number): string {
  let letter = ''
  let temp = colIdx
  while (temp > 0) {
    const rem = (temp - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    temp = Math.floor((temp - 1) / 26)
  }
  return letter
}

export function buildExpenseByNatureWorkbook(
  report: ExpenseByNatureReport,
  clientName = 'Doanh nghiệp kiểm toán',
  fiscalYear = '2026',
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft - Intelligent Audit Suite'
  wb.lastModifiedBy = 'AuditSoft'
  wb.created = new Date()

  const ws = wb.addWorksheet('ChiPhi_YeuTo_12M', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 1, ySplit: 7 }],
  })

  // 1. Tiêu đề Báo cáo (Rows 1-4)
  const r1 = ws.getRow(1)
  r1.getCell(1).value = `ĐƠN VỊ: ${clientName.toUpperCase()}`
  r1.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E293B' } }

  const r2 = ws.getRow(2)
  r2.getCell(1).value = `NIÊN ĐỘ KHÓA SỔ: 31/12/${fiscalYear}`
  r2.getCell(1).font = { italic: true, size: 10, color: { argb: 'FF64748B' } }

  const r4 = ws.getRow(4)
  r4.getCell(1).value = 'MA TRẬN CHI PHÍ THEO YẾU TỐ 12 THÁNG & BẢNG ĐỐI CHIẾU THUYẾT MINH BCTC'
  r4.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF0F172A' } }

  const r5 = ws.getRow(5)
  r5.getCell(1).value = 'Căn cứ: Chuẩn mực VAS 01 / Thông tư 200/2014/TT-BTC (Mục 28) • Đơn vị tính: VNĐ'
  r5.getCell(1).font = { italic: true, size: 10.5, color: { argb: 'FF475569' } }

  // 2. Xây dựng cấu trúc Cột theo 5 Yếu tố
  // Cột 1: Kỳ Kế Toán
  // Các cột con của từng nhóm + Cột Tổng nhóm
  let currentCol = 2
  const groupColMap = new Map<
    ExpenseNatureCategory,
    {
      startCol: number
      endCol: number
      subtotalCol: number
      accounts: { colIdx: number; code: string; name: string }[]
    }
  >()

  const breakdowns = report.accountBreakdowns || []

  for (const cat of CATEGORY_CONFIG) {
    const accs = breakdowns.filter((b) => b.category === cat.key)
    const startCol = currentCol
    const catAccCols: { colIdx: number; code: string; name: string }[] = []

    if (accs.length > 0) {
      for (const a of accs) {
        catAccCols.push({ colIdx: currentCol, code: a.accountCode, name: a.accountName })
        currentCol++
      }
    } else {
      // Nếu không có tài khoản chi tiết riêng, tạo 1 cột đại diện cho nhóm
      catAccCols.push({ colIdx: currentCol, code: cat.label, name: `Chi phí ${cat.label.toLowerCase()}` })
      currentCol++
    }

    // Cột tổng nhóm
    const subtotalCol = currentCol
    currentCol++

    groupColMap.set(cat.key, {
      startCol,
      endCol: subtotalCol,
      subtotalCol,
      accounts: catAccCols,
    })
  }

  // Cột Tổng 5 Yếu Tố
  const grandTotalCol = currentCol
  currentCol++

  // Cột Spacer
  const spacerCol = currentCol
  currentCol++

  // 2 Cột Thuyết minh BCTC
  const reconLabelCol = currentCol
  const reconAmountCol = currentCol + 1

  // 3. Render Header Rows 6 & 7
  const row6 = ws.getRow(6)
  const row7 = ws.getRow(7)
  row6.height = 26
  row7.height = 36

  // Cột A: Kỳ Kế Toán
  ws.mergeCells('A6:A7')
  const cellA6 = ws.getCell('A6')
  cellA6.value = 'KỲ KẾ TOÁN'
  cellA6.font = { bold: true, size: 11, color: { argb: 'FF0F172A' } }
  cellA6.alignment = { vertical: 'middle', horizontal: 'center' }
  cellA6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  ws.getColumn(1).width = 16

  // Render Header từng nhóm
  for (const cat of CATEGORY_CONFIG) {
    const info = groupColMap.get(cat.key)!
    const startL = getColLetter(info.startCol)
    const endL = getColLetter(info.endCol)

    // Tầng 1: Tên Cụm Yếu Tố
    ws.mergeCells(`${startL}6:${endL}6`)
    const gCell = ws.getCell(`${startL}6`)
    gCell.value = cat.groupTitle
    gCell.font = { bold: true, size: 10.5, color: { argb: 'FF0F172A' } }
    gCell.alignment = { vertical: 'middle', horizontal: 'center' }
    gCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cat.colorArgb } }

    // Tầng 2: Chi tiết từng tài khoản
    for (const a of info.accounts) {
      const aCell = row7.getCell(a.colIdx)
      aCell.value = `${a.code}\n${a.name}`
      aCell.font = { bold: true, size: 9.5, color: { argb: 'FF334155' } }
      aCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cat.colorArgb } }
      ws.getColumn(a.colIdx).width = Math.max(16, Math.min(24, a.name.length * 0.85))
    }

    // Tầng 2: Cột Tổng Nhóm
    const subCell = row7.getCell(info.subtotalCol)
    subCell.value = `TỔNG ${cat.label.toUpperCase()}`
    subCell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } }
    subCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cat.colorArgb } }
    ws.getColumn(info.subtotalCol).width = 18
  }

  // Header Cột Tổng 5 Yếu Tố
  const grandL = getColLetter(grandTotalCol)
  ws.mergeCells(`${grandL}6:${grandL}7`)
  const grandCell = ws.getCell(`${grandL}6`)
  grandCell.value = 'TỔNG 5 YẾU TỐ\nCHI PHÍ'
  grandCell.font = { bold: true, size: 11, color: { argb: 'FF0F172A' } }
  grandCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  grandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } } // Xanh lá nổi bật
  ws.getColumn(grandTotalCol).width = 20

  // Header Spacer
  ws.getColumn(spacerCol).width = 4

  // Header Bảng Thuyết Minh BCTC
  const rLabelL = getColLetter(reconLabelCol)
  const rAmtL = getColLetter(reconAmountCol)
  ws.mergeCells(`${rLabelL}6:${rAmtL}6`)
  const reconHeaderCell = ws.getCell(`${rLabelL}6`)
  reconHeaderCell.value = 'BẢNG ĐỐI CHIẾU THUYẾT MINH BCTC (MỤC 28)'
  reconHeaderCell.font = { bold: true, size: 11, color: { argb: 'FF1E1B4B' } }
  reconHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' }
  reconHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }

  const rLabelCell7 = row7.getCell(reconLabelCol)
  rLabelCell7.value = 'Chỉ Tiêu Cân Đối Luân Chuyển'
  rLabelCell7.font = { bold: true, size: 10, color: { argb: 'FF3730A3' } }
  rLabelCell7.alignment = { vertical: 'middle', horizontal: 'center' }
  rLabelCell7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }
  ws.getColumn(reconLabelCol).width = 44

  const rAmtCell7 = row7.getCell(reconAmountCol)
  rAmtCell7.value = 'Số Tiền (VNĐ)'
  rAmtCell7.font = { bold: true, size: 10, color: { argb: 'FF3730A3' } }
  rAmtCell7.alignment = { vertical: 'middle', horizontal: 'center' }
  rAmtCell7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }
  ws.getColumn(reconAmountCol).width = 22

  // 4. Điền Dữ Liệu 12 Tháng (Hàng 8 đến 19)
  for (let m = 0; m < 12; m++) {
    const rowNum = 8 + m
    const row = ws.getRow(rowNum)
    row.height = 20

    // Cột A: Tháng
    const cellA = row.getCell(1)
    cellA.value = `Tháng ${String(m + 1).padStart(2, '0')}`
    cellA.font = { bold: true, size: 10, color: { argb: 'FF334155' } }
    cellA.alignment = { vertical: 'middle', horizontal: 'center' }

    // Điền các cột tài khoản con và tổng nhóm
    const subtotalCellLetters: string[] = []

    for (const cat of CATEGORY_CONFIG) {
      const info = groupColMap.get(cat.key)!

      if (info.accounts.length > 0 && info.accounts[0]?.code !== cat.label) {
        for (const a of info.accounts) {
          const breakdown = breakdowns.find((b) => b.category === cat.key && b.accountCode === a.code)
          const amt = breakdown ? breakdown.monthlyAmounts[m] ?? 0 : 0
          const cell = row.getCell(a.colIdx)
          cell.value = amt
          cell.numFmt = MONEY_FMT
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          cell.font = { size: 9.5 }
        }

        // Cột Tổng Nhóm: dùng công thức =SUM(CộtĐầu:CộtCuối)
        const firstColL = getColLetter(info.startCol)
        const lastAccColL = getColLetter(info.subtotalCol - 1)
        const subCell = row.getCell(info.subtotalCol)
        subCell.value = { formula: `SUM(${firstColL}${rowNum}:${lastAccColL}${rowNum})` }
        subCell.numFmt = MONEY_FMT
        subCell.font = { bold: true, size: 10 }
        subCell.alignment = { vertical: 'middle', horizontal: 'right' }
      } else {
        // Không có tài khoản con riêng lẻ, lấy số tổng từ rowProp
        const amt = report.rows[m]?.[cat.rowProp] ?? 0
        const subCell = row.getCell(info.subtotalCol)
        subCell.value = amt
        subCell.numFmt = MONEY_FMT
        subCell.font = { bold: true, size: 10 }
        subCell.alignment = { vertical: 'middle', horizontal: 'right' }
      }

      subtotalCellLetters.push(`${getColLetter(info.subtotalCol)}${rowNum}`)
    }

    // Cột Tổng 5 Yếu Tố: formula cộng 5 cột subtotal
    const grandCell = row.getCell(grandTotalCol)
    grandCell.value = { formula: subtotalCellLetters.join('+') }
    grandCell.numFmt = MONEY_FMT
    grandCell.font = { bold: true, size: 10.5, color: { argb: 'FF15803D' } }
    grandCell.alignment = { vertical: 'middle', horizontal: 'right' }
    grandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }
  }

  // 5. Dòng CẢ NĂM (Hàng 20)
  const sumRow = ws.getRow(20)
  sumRow.height = 24
  const sumCellA = sumRow.getCell(1)
  sumCellA.value = 'CẢ NĂM'
  sumCellA.font = { bold: true, size: 11, color: { argb: 'FF0F172A' } }
  sumCellA.alignment = { vertical: 'middle', horizontal: 'center' }
  sumCellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }

  // Công thức SUM cả năm cho tất cả các cột dữ liệu
  for (let c = 2; c <= grandTotalCol; c++) {
    const colL = getColLetter(c)
    const cell = sumRow.getCell(c)
    cell.value = { formula: `SUM(${colL}8:${colL}19)` }
    cell.numFmt = MONEY_FMT
    cell.font = { bold: true, size: 10.5, color: c === grandTotalCol ? { argb: 'FF15803D' } : { argb: 'FF0F172A' } }
    cell.alignment = { vertical: 'middle', horizontal: 'right' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: c === grandTotalCol ? { argb: 'FFDCFCE7' } : { argb: 'FFF8FAFC' },
    }
  }

  // 6. Điền Bảng Thuyết Minh BCTC (Cột bên phải, Rows 8-16)
  const recon = report.bctcReconciliation
  const grandAnnualCellRef = `${grandL}20`

  const reconItems: {
    label: string
    value: number | { formula: string }
    isBold?: boolean
    color?: string
    bg?: string
  }[] = [
    {
      label: 'Cộng 5 yếu tố chi phí phát sinh trong kỳ',
      value: { formula: grandAnnualCellRef },
      isBold: true,
      color: 'FF15803D',
      bg: 'FFF0FDF4',
    },
    {
      label: '(+) Chi phí SXKD dở dang đầu năm (TK 154 ĐK)',
      value: recon.wipOpening154,
    },
    {
      label: '(+) Tồn kho thành phẩm đầu năm (TK 155 ĐK)',
      value: recon.finishedOpening155,
    },
    {
      label: '(-) Chi phí SXKD dở dang cuối năm (TK 154 CK)',
      value: -recon.wipClosing154,
    },
    {
      label: '(-) Tồn kho thành phẩm cuối năm (TK 155 CK)',
      value: -recon.finishedClosing155,
    },
    {
      label: 'TỔNG CỘNG CHI PHÍ SXKD TRONG KỲ (Luân chuyển)',
      value: { formula: `SUM(${rAmtL}8:${rAmtL}12)` },
      isBold: true,
      bg: 'FFF1F5F9',
    },
    {
      label: '(Đối ứng sổ kế toán: Nợ 911 / Có 632, 641, 642)',
      value: recon.totalTransferred911Cost,
      color: 'FF475569',
    },
    {
      label: 'YẾU TỐ CHI PHÍ (ĐỘ LỆCH KIỂM TRA)',
      value: { formula: `${rAmtL}13-${rAmtL}14` },
      isBold: true,
      color: recon.isBalanced ? 'FF15803D' : 'FFDC2626',
      bg: recon.isBalanced ? 'FFDCFCE7' : 'FFFEE2E2',
    },
    {
      label: 'Đánh giá kiểm toán:',
      value: {
        formula: `IF(ABS(${rAmtL}15)<1000,"CÂN ĐỐI 100% (Chuẩn VAS 01)","LỆCH: Kiểm tra xuất nội bộ / giảm giá vốn")`,
      },
      isBold: true,
      color: recon.isBalanced ? 'FF15803D' : 'FFDC2626',
    },
  ]

  reconItems.forEach((item, idx) => {
    const rowNum = 8 + idx
    const row = ws.getRow(rowNum)
    const lCell = row.getCell(reconLabelCol)
    const aCell = row.getCell(reconAmountCol)

    lCell.value = item.label
    lCell.font = { bold: item.isBold ?? false, size: 9.5, color: item.color ? { argb: item.color } : undefined }
    lCell.alignment = { vertical: 'middle', horizontal: 'left' }

    aCell.value = item.value
    if (typeof item.value === 'number' || (typeof item.value === 'object' && 'formula' in item.value)) {
      if (idx !== 8) aCell.numFmt = MONEY_FMT
    }
    aCell.font = { bold: item.isBold ?? false, size: 10, color: item.color ? { argb: item.color } : undefined }
    aCell.alignment = { vertical: 'middle', horizontal: idx === 8 ? 'left' : 'right' }

    if (item.bg) {
      lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.bg } }
      aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.bg } }
    }
  })

  // 7. Kẻ viền (Borders) cho toàn bộ 2 bảng
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  }

  // Viền bảng Ma trận (Hàng 6 đến 20, Cột 1 đến grandTotalCol)
  for (let r = 6; r <= 20; r++) {
    const row = ws.getRow(r)
    for (let c = 1; c <= grandTotalCol; c++) {
      const cell = row.getCell(c)
      cell.border = thinBorder
      if (r === 20) {
        cell.border = {
          ...thinBorder,
          bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        }
      }
    }
  }

  // Viền bảng Thuyết minh BCTC (Hàng 6 đến 16, 2 cột)
  for (let r = 6; r <= 16; r++) {
    const row = ws.getRow(r)
    row.getCell(reconLabelCol).border = thinBorder
    row.getCell(reconAmountCol).border = thinBorder
    if (r === 16) {
      row.getCell(reconLabelCol).border = { ...thinBorder, bottom: { style: 'medium', color: { argb: 'FF475569' } } }
      row.getCell(reconAmountCol).border = { ...thinBorder, bottom: { style: 'medium', color: { argb: 'FF475569' } } }
    }
  }

  return wb
}
