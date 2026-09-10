import ExcelJS from 'exceljs'
import type { B410NormalizedIssue, B410ParsedFile, B410ConsolidationReport } from './B410Types'
import { findB410Sheet, extractCellText, normalizeSheetName } from './B410Parser'
import { countTextLines } from './B410Normalizer'
import { normalizeWorkbookSharedFormulas } from '../helpers'

const BORDER_COLOR = { argb: 'FF000000' }

/**
 * Sinh border chuẩn xác theo quy cách của file mẫu B410:
 * 1. "viền thì gạch đôi": Khung ngoài cùng của bảng (trái Col 2, phải Col 9, trên Header, dưới Footer) là `double`.
 * 2. "cột thì gạch ngang": Các đường phân cách cột dọc bên trong là nét liền `thin`.
 * 3. "TÊN NGƯỜI THỰC HIỆN ra gạch ngang": Đường viền ngang trên & dưới dòng Người thực hiện là nét liền `thin`.
 */
export function getCellBorder(options: {
  col: number;
  rowType: 'header' | 'data' | 'blank' | 'performer' | 'footer';
  isFirstDataRow?: boolean;
  startCol?: number;
  endCol?: number;
}): Partial<ExcelJS.Borders> {
  const { col, rowType, isFirstDataRow, startCol = 2, endCol = 9 } = options
  const isLeftEdge = col === startCol
  const isRightEdge = col === endCol
  const left: ExcelJS.Border = isLeftEdge
    ? { style: 'double', color: BORDER_COLOR }
    : { style: 'thin', color: BORDER_COLOR }
  const right: ExcelJS.Border = isRightEdge
    ? { style: 'double', color: BORDER_COLOR }
    : { style: 'thin', color: BORDER_COLOR }

  // Trên & Dưới (Dòng ngang)
  let top: ExcelJS.Border
  let bottom: ExcelJS.Border

  if (rowType === 'header') {
    top = { style: 'double', color: BORDER_COLOR }
    bottom = { style: 'thin', color: BORDER_COLOR }
  } else if (rowType === 'performer') {
    top = { style: 'thin', color: BORDER_COLOR }
    bottom = { style: 'thin', color: BORDER_COLOR }
  } else if (rowType === 'footer') {
    top = { style: 'thin', color: BORDER_COLOR }
    bottom = { style: 'double', color: BORDER_COLOR }
  } else {
    // Dòng dữ liệu hoặc dòng trống
    top = isFirstDataRow
      ? { style: 'thin', color: BORDER_COLOR }
      : { style: 'hair', color: BORDER_COLOR }
    bottom = { style: 'hair', color: BORDER_COLOR }
  }

  return { left, right, top, bottom }
}

const DEFAULT_FONT: Partial<ExcelJS.Font> = {
  name: 'Cambria',
  size: 10,
}

export interface RenderOptions {
  masterTemplatePath: string
  outputPath: string
  normalizedIssues: B410NormalizedIssue[]
  parsedFiles: B410ParsedFile[]
  warnings: string[]
  duplicatesDetected: number
  startTimeMs: number
}

/**
 * Render bảng B410 Master chuẩn cấu trúc và xuất ra file Excel .xlsx
 */
export async function renderMasterB410(options: RenderOptions): Promise<B410ConsolidationReport> {
  const {
    masterTemplatePath,
    outputPath,
    normalizedIssues,
    parsedFiles,
    warnings,
    duplicatesDetected,
    startTimeMs,
  } = options

  const masterWb = new ExcelJS.Workbook()
  await masterWb.xlsx.readFile(masterTemplatePath)

  const masterWs = findB410Sheet(masterWb)

  // 1. Dò tìm dòng tiêu đề của Master (thường là dòng 8, 9, 10 hoặc 11)
  let masterHeaderRow = 11
  const masterRowCount = masterWs.rowCount

  for (let r = 6; r <= Math.min(14, masterRowCount); r++) {
    const row = masterWs.getRow(r)
    let rowText = ''
    for (let c = 1; c <= 8; c++) {
      rowText += ' ' + extractCellText(row.getCell(c))
    }
    const norm = normalizeSheetName(rowText)
    if (norm.includes('thuctrang') || norm.includes('huongxuly') || norm.includes('giaylv') || norm.includes('glv')) {
      masterHeaderRow = r
      break
    }
  }
  const masterDataStartRow = masterHeaderRow + 1

  // Dò tìm toạ độ cột của Master (tự động thích ứng cả mẫu 9 cột chuẩn lẫn mẫu 7 cột không có STT)
  let mSttCol = -1
  let mCodeCol = -1
  let mDescCol = -1
  let mActionCol = -1
  let mCommentCol = -1

  const headerRowObj = masterWs.getRow(masterHeaderRow)
  for (let c = 1; c <= 9; c++) {
    const norm = normalizeSheetName(extractCellText(headerRowObj.getCell(c)))
    if (mSttCol === -1 && (norm === 'stt' || norm === 'tt' || norm.includes('sott'))) {
      mSttCol = c
    } else if (mCodeCol === -1 && (norm.includes('glv') || norm.includes('giaylv'))) {
      mCodeCol = c
    } else if (mDescCol === -1 && norm.includes('thuctrang')) {
      mDescCol = c
    } else if (mActionCol === -1 && norm.includes('huongxuly')) {
      mActionCol = c
    } else if (mCommentCol === -1 && (norm.includes('ykien') || norm.includes('khachhang'))) {
      mCommentCol = c
    }
  }

  const hasStt = mSttCol !== -1
  const tCodeCol = mCodeCol !== -1 ? mCodeCol : (hasStt ? 3 : 1)
  const tDescCol = mDescCol !== -1 ? mDescCol : (tCodeCol + 1)
  const tActionCol = mActionCol !== -1 ? mActionCol : (tDescCol + 2)
  const tCommentCol = mCommentCol !== -1 ? mCommentCol : (tActionCol + 3)

  const tStartCol = hasStt ? mSttCol : tCodeCol
  const tEndCol = tCommentCol

  // Canh chỉnh độ rộng các cột tối ưu nếu là mẫu 9 cột
  if (hasStt && tStartCol === 2 && tEndCol === 9) {
    const standardColWidths: Record<number, number> = {
      2: 5.2, 3: 10.5, 4: 32.0, 5: 38.0, 6: 22.0, 7: 22.0, 8: 22.0, 9: 22.0,
    }
    for (const [colIdx, w] of Object.entries(standardColWidths)) {
      masterWs.getColumn(Number(colIdx)).width = w
    }
  }
  // Xóa sạch ảnh cũ trong Master worksheet để không bao giờ bị đè hình cũ
  interface WorksheetInternalMedia {
    _media?: unknown[]
    _images?: unknown[]
  }
  const wsInternal = masterWs as unknown as WorksheetInternalMedia
  if (Array.isArray(wsInternal._media)) {
    wsInternal._media = []
  }
  if (Array.isArray(wsInternal._images)) {
    wsInternal._images = []
  }

  const mergesObj = (masterWs as unknown as { _merges?: Record<string, { model?: { top: number } }> })._merges
  if (mergesObj) {
    for (const key of Object.keys(mergesObj)) {
      const m = mergesObj[key]
      if (m && m.model && m.model.top >= masterDataStartRow) {
        try {
          masterWs.unMergeCells(key)
        } catch {}
      }
    }
  }
  for (let c = tStartCol; c <= tEndCol; c++) {
    const hCell = masterWs.getRow(masterHeaderRow).getCell(c)
    hCell.border = getCellBorder({ col: c, rowType: 'header', startCol: tStartCol, endCol: tEndCol })
    hCell.fill = { type: 'pattern', pattern: 'none' }
  }

  // 1. Xóa sạch 100% dữ liệu cũ, công thức cũ từ dòng sau header đến hết sheet
  const maxClearRow = Math.max(masterRowCount, masterDataStartRow + 200)
  for (let r = masterDataStartRow; r <= maxClearRow; r++) {
    const row = masterWs.getRow(r)
    row.values = []
    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c)
      cell.value = null
      cell.border = {}
      cell.fill = { type: 'pattern', pattern: 'none' }
    }
    row.height = 18
  }

  let destRow = masterDataStartRow
  let totalImagesCopied = 0

  for (const issue of normalizedIssues) {
    // 3.0. Nếu là bắt đầu nhóm KTV mới: chèn dòng tiêu đề "Người thực hiện: ..."
    if (issue.isPerformerGroupStart && issue.performer) {
      const performerRow = masterWs.getRow(destRow)
      performerRow.height = 20

      for (let c = tStartCol; c <= tEndCol; c++) {
        const pC = performerRow.getCell(c)
        pC.border = getCellBorder({ col: c, rowType: 'performer', startCol: tStartCol, endCol: tEndCol })
        pC.fill = { type: 'pattern', pattern: 'none' }
      }

      // Ô Code: gạch nối '-'
      const cCell = performerRow.getCell(tCodeCol)
      cCell.value = '-'
      cCell.font = { name: 'Cambria', size: 10, bold: true }
      cCell.alignment = { horizontal: 'center', vertical: 'middle' }

      // Ô Thực trạng: 'Người thực hiện: ...'
      const pCell = performerRow.getCell(tDescCol)
      pCell.value = `Người thực hiện: ${issue.performer}`
      pCell.font = {
        name: 'Cambria',
        size: 10,
        bold: true,
        italic: true,
        underline: true,
      }
      pCell.alignment = { horizontal: 'left', vertical: 'middle' }

      try {
        masterWs.mergeCells(destRow, tDescCol, destRow, tActionCol - 1)
        masterWs.mergeCells(destRow, tActionCol, destRow, tCommentCol - 1)
      } catch {}
      destRow++

      // Hàng trống sau dòng người thực hiện
      const postPBlank = masterWs.getRow(destRow)
      postPBlank.height = 12.75
      for (let c = tStartCol; c <= tEndCol; c++) {
        const bC = postPBlank.getCell(c)
        bC.border = getCellBorder({ col: c, rowType: 'blank', startCol: tStartCol, endCol: tEndCol })
        bC.fill = { type: 'pattern', pattern: 'none' }
      }
      try {
        masterWs.mergeCells(destRow, tDescCol, destRow, tActionCol - 1)
        masterWs.mergeCells(destRow, tActionCol, destRow, tCommentCol - 1)
      } catch {}
      destRow++
    }

    const row = masterWs.getRow(destRow)
    const isFirstDataRow = destRow === masterDataStartRow

    // Kẻ viền chuẩn cho tất cả các ô trong dòng dữ liệu
    for (let c = tStartCol; c <= tEndCol; c++) {
      const cellObj = row.getCell(c)
      cellObj.border = getCellBorder({ col: c, rowType: 'data', isFirstDataRow, startCol: tStartCol, endCol: tEndCol })
      cellObj.fill = { type: 'pattern', pattern: 'none' }
    }

    // Ghi STT nếu mẫu có cột STT
    if (hasStt && mSttCol !== -1) {
      const cellStt = row.getCell(mSttCol)
      cellStt.value = issue.continuousTt ? issue.continuousTt : null
      cellStt.font = { ...DEFAULT_FONT, bold: true }
      cellStt.alignment = { horizontal: 'center', vertical: 'top' }
    }

    // Ghi GLV
    const cellCode = row.getCell(tCodeCol)
    cellCode.value = issue.glv
    cellCode.font = { ...DEFAULT_FONT, bold: true }
    cellCode.alignment = { horizontal: 'center', vertical: 'top' }

    // Ghi Thực trạng
    const cellDesc = row.getCell(tDescCol)
    cellDesc.value = (issue.rawFinding !== undefined && issue.rawFinding !== null ? issue.rawFinding : issue.finding) as ExcelJS.CellValue
    if (typeof cellDesc.value === 'string') {
      cellDesc.font = { name: 'Cambria', size: 10, bold: false, italic: false }
    }
    cellDesc.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
    try {
      masterWs.mergeCells(destRow, tDescCol, destRow, tActionCol - 1)
    } catch {}

    // Ghi Hướng xử lý
    const cellAction = row.getCell(tActionCol)
    cellAction.value = (issue.rawRecommendation !== undefined && issue.rawRecommendation !== null ? issue.rawRecommendation : issue.recommendation) as ExcelJS.CellValue
    if (typeof cellAction.value === 'string') {
      cellAction.font = { name: 'Cambria', size: 10, bold: false, italic: false }
    }
    cellAction.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
    try {
      masterWs.mergeCells(destRow, tActionCol, destRow, tCommentCol - 1)
    } catch {}

    // Ghi Ý kiến khách hàng
    const cellComment = row.getCell(tCommentCol)
    if (issue.customerComment) {
      cellComment.value = issue.customerComment
    }
    cellComment.font = { name: 'Cambria', size: 10, bold: false, italic: false }
    cellComment.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

    // Căn chỉnh ảnh vừa vặn
    let finalRowHeight = issue.calculatedHeight
    if (issue.images && issue.images.length > 0) {
      const textLines = countTextLines(issue.finding, 66)
      const textHeightPt = textLines * 13.5 + 5

      for (const img of issue.images) {
        try {
          const imgId = masterWb.addImage({
            buffer: img.buffer as never,
            extension: img.extension as 'png' | 'jpeg' | 'gif',
          })
          const targetWPx = Math.min(460, Math.round(img.widthPt / 0.75))
          const targetHPx = Math.round(img.heightPt / 0.75)
          const targetHPt = img.heightPt

          const recLines = countTextLines(issue.recommendation, 64)
          const recHeightPt = recLines * 13.5 + 5
          const totalNeededHeight = Math.max(textHeightPt + 6 + targetHPt + 6, recHeightPt)
          finalRowHeight = Math.max(issue.calculatedHeight, Math.ceil(totalNeededHeight))
          row.height = finalRowHeight

          const topFraction = (textHeightPt + 6) / finalRowHeight
          const anchorCol = tDescCol - 1 + 0.08

          masterWs.addImage(imgId, {
            tl: ({ col: anchorCol, row: destRow - 1 + topFraction } as unknown) as ExcelJS.Anchor,
            ext: { width: targetWPx, height: targetHPx },
            editAs: 'oneCell',
          })
          totalImagesCopied++
        } catch (imgErr) {
          warnings.push(`Không thể sao chép ảnh tại dòng ${destRow}: ${String(imgErr)}`)
        }
      }
    } else {
      row.height = finalRowHeight
    }

    destRow++

    // Hàng trống giữa các issue
    const blankRow = masterWs.getRow(destRow)
    blankRow.height = 12.75
    for (let c = tStartCol; c <= tEndCol; c++) {
      const bC = blankRow.getCell(c)
      bC.border = getCellBorder({ col: c, rowType: 'blank', startCol: tStartCol, endCol: tEndCol })
      bC.fill = { type: 'pattern', pattern: 'none' }
    }
    try {
      masterWs.mergeCells(destRow, tDescCol, destRow, tActionCol - 1)
      masterWs.mergeCells(destRow, tActionCol, destRow, tCommentCol - 1)
    } catch {}

    destRow++
  }

  // Dòng chốt kết thúc bảng: "Xin cảm ơn sự hợp tác từ Quý Công ty."
  const footerRow = masterWs.getRow(destRow)
  footerRow.height = 20
  const footerCell = footerRow.getCell(tCodeCol)
  footerCell.value = 'Xin cảm ơn sự hợp tác từ Quý Công ty.'
  footerCell.font = { name: 'Cambria', size: 10, bold: true, italic: true }
  footerCell.alignment = { horizontal: 'left', vertical: 'middle' }
  try {
    masterWs.mergeCells(destRow, tCodeCol, destRow, tEndCol - 1)
  } catch {}
  for (let c = tStartCol; c <= tEndCol; c++) {
    footerRow.getCell(c).border = getCellBorder({ col: c, rowType: 'footer', startCol: tStartCol, endCol: tEndCol })
    footerRow.getCell(c).fill = { type: 'pattern', pattern: 'none' }
  }
  destRow++
  const remainingMax = masterWs.rowCount
  for (let r = destRow; r <= remainingMax; r++) {
    const rObj = masterWs.getRow(r)
    rObj.values = []
    for (let c = 1; c <= 10; c++) {
      rObj.getCell(c).border = {}
    }
  }
  // 6. Copy các sheet phụ đính kèm từ các file nguồn
  const seenSheetNames = new Set<string>()
  for (const w of masterWb.worksheets) {
    seenSheetNames.add(w.name.toLowerCase())
  }

  for (const pFile of parsedFiles) {
    if (pFile.extraSheetNames.length === 0) continue

    // Mở file nguồn để copy sheet
    try {
      const srcWb = new ExcelJS.Workbook()
      await srcWb.xlsx.readFile(pFile.filePath)

      for (const extraName of pFile.extraSheetNames) {
        const srcExtraWs = srcWb.getWorksheet(extraName)
        if (!srcExtraWs) continue

        // 1. Giữ nguyên tên sheet gốc, nếu Master đã có hoặc đã copy rồi thì bỏ qua (tránh trùng sheet (1), (2)...)
        const cleanName = extraName.trim().replace(/[\\/?*[\]:]/g, '')
        if (cleanName.length === 0) continue

        if (seenSheetNames.has(cleanName.toLowerCase())) {
          continue // Đã có sheet này trong Master rồi, không nhân bản
        }
        seenSheetNames.add(cleanName.toLowerCase())

        const newWs = masterWb.addWorksheet(cleanName)

        // 2. Copy toàn bộ pageSetup, properties, views
        if (srcExtraWs.pageSetup) {
          newWs.pageSetup = { ...srcExtraWs.pageSetup }
        }
        if (srcExtraWs.properties) {
          newWs.properties = { ...srcExtraWs.properties }
        }
        if (srcExtraWs.views) {
          try {
            newWs.views = JSON.parse(JSON.stringify(srcExtraWs.views))
          } catch {}
        }

        // 3. Copy column widths & properties
        srcExtraWs.columns.forEach((col, idx) => {
          if (col && col.width !== undefined) {
            newWs.getColumn(idx + 1).width = col.width
          }
          if (col && col.hidden) {
            newWs.getColumn(idx + 1).hidden = true
          }
        })

        // 4. Copy rows, row heights & cell styling
        srcExtraWs.eachRow({ includeEmpty: true }, (r, rNum) => {
          const destR = newWs.getRow(rNum)
          if (r.height !== undefined) {
            destR.height = r.height
          }
          r.eachCell({ includeEmpty: true }, (c, cNum) => {
            const destC = destR.getCell(cNum)

            // Neu la cong thuc, chuyen thanh gia tri tinh de tranh dut gay link ngoai [N]... giua cac file
            if (typeof c.value === 'object' && c.value !== null) {
              const valObj = c.value as unknown as Record<string, unknown>
              if ('richText' in valObj) {
                destC.value = c.value
              } else if ('result' in valObj && valObj.result !== undefined) {
                destC.value = valObj.result as ExcelJS.CellValue
              } else if ('formula' in valObj || 'sharedFormula' in valObj) {
                destC.value = (valObj.result !== undefined ? valObj.result : '') as ExcelJS.CellValue
              } else {
                destC.value = null
              }
            } else {
              destC.value = c.value
            }
            // Dam bao khong con formula model gay link
            const m = destC.model as unknown as Record<string, unknown>
            if (m) {
              delete m.formula
              delete m.sharedFormula
            }
            destC.font = c.font
            destC.alignment = c.alignment
            destC.border = c.border
            destC.fill = c.fill
            destC.numFmt = c.numFmt
          })
        })

        // 5. COPY TOÀN BỘ MERGE CELLS (CỰC KỲ QUAN TRỌNG ĐỂ KHÔNG BỊ VỠ KHUNG BẢNG KÊ)
        const srcMerges = (srcExtraWs as unknown as { _merges?: Record<string, { model?: { top: number; left: number; bottom: number; right: number } }> })._merges
        if (srcMerges) {
          for (const key of Object.keys(srcMerges)) {
            const m = srcMerges[key]
            if (m && m.model) {
              try {
                newWs.mergeCells(m.model.top, m.model.left, m.model.bottom, m.model.right)
              } catch {}
            }
          }
        }
      }
    } catch (sheetErr) {
      warnings.push(`Không thể copy sheet phụ từ ${pFile.fileName}: ${String(sheetErr)}`)
    }
  }

  // 7. Cấu hình in ấn chuẩn A4 Landscape
  masterWs.pageSetup = {
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: `${masterHeaderRow}:${masterHeaderRow}`,
    horizontalCentered: true,
  }

  // 8. Don dep an toan toan bo Defined Names rac & Shared/External Formula truoc khi ghi file
  masterWb.definedNames.model = []
  normalizeWorkbookSharedFormulas(masterWb)
  // 9. Lưu file .xlsx
  await masterWb.xlsx.writeFile(outputPath)
  const executionTimeMs = Date.now() - startTimeMs

  return {
    totalFiles: parsedFiles.length,
    totalIssues: normalizedIssues.length,
    totalImagesCopied,
    totalShapesDiscarded: 0,
    duplicatesDetected,
    executionTimeMs,
    warnings,
    outputPath,
  }
}
