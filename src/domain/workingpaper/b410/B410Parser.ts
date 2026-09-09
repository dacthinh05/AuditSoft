import path from 'node:path'
import ExcelJS from 'exceljs'
import type { B410Issue, B410ParsedFile } from './B410Types'
import { filterAndExtractShapes } from './B410ShapeFilter'

/**
 * Chuẩn hóa tên sheet: chữ thường, bỏ dấu tiếng Việt, bỏ khoảng trắng và ký tự đặc biệt
 */
export function normalizeSheetName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Trích xuất giá trị text an toàn từ cell (kể cả richText hay formula)
 */
export function extractCellText(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return ''

  if (typeof cell.value === 'object') {
    // RichText format: { richText: [{ text: '...' }] }
    if ('richText' in cell.value && Array.isArray((cell.value as { richText: unknown[] }).richText)) {
      const parts = (cell.value as { richText: { text?: string }[] }).richText
      return parts.map((p) => p.text || '').join('').trim()
    }
    // Formula result
    if ('result' in cell.value && (cell.value as { result?: unknown }).result !== undefined) {
      const res = (cell.value as { result: unknown }).result
      return res !== null && res !== undefined ? String(res).trim() : ''
    }
    // Date object
    if (cell.value instanceof Date) {
      return cell.value.toLocaleDateString('vi-VN')
    }
  }

  return cell.value !== null && cell.value !== undefined ? String(cell.value).trim() : ''
}

/**
 * Tìm sheet B410 chuẩn trong workbook theo quy chuẩn ưu tiên
 */
export function findB410Sheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  if (!wb.worksheets || wb.worksheets.length === 0) {
    throw new Error('Workbook không có worksheet nào.')
  }

  // 1. Kiểm tra theo tên chuẩn hóa
  const candidateScores: { ws: ExcelJS.Worksheet; score: number }[] = []

  for (const ws of wb.worksheets) {
    const norm = normalizeSheetName(ws.name)
    let score = 0

    if (norm.includes('saisot') && norm.includes('luuy')) {
      score += 100
    } else if (norm.includes('b410') || norm.includes('b.410')) {
      score += 80
    } else if (norm.includes('luuy') || norm.includes('saisot')) {
      score += 50
    }

    // Kiểm tra nội dung các ô tiêu đề (dòng 7 đến 12)
    let hasGlv = false
    let hasThucTrang = false
    let hasHuongXuLy = false

    for (let r = 7; r <= Math.min(13, ws.rowCount); r++) {
      const row = ws.getRow(r)
      for (let c = 1; c <= 8; c++) {
        const txt = extractCellText(row.getCell(c)).toLowerCase()
        if (txt.includes('giay lv') || txt.includes('glv')) hasGlv = true
        if (txt.includes('thuc trang')) hasThucTrang = true
        if (txt.includes('huong xu ly')) hasHuongXuLy = true
      }
    }
    if (hasGlv) score += 30
    if (hasThucTrang) score += 30
    if (hasHuongXuLy) score += 30

    if (score > 0) {
      candidateScores.push({ ws, score })
    }
  }

  if (candidateScores.length > 0) {
    candidateScores.sort((a, b) => b.score - a.score)
    const best = candidateScores[0]
    if (best) return best.ws
  }

  // Fallback: sheet đầu tiên
  const first = wb.worksheets[0]
  if (!first) throw new Error('Không tìm thấy sheet nào trong file.')
  return first
}



/**
 * Parse toàn bộ một file B410 nguồn thành dữ liệu trung gian chuẩn
 */
export async function parseB410File(filePath: string): Promise<B410ParsedFile> {
  const fileName = path.basename(filePath)
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)

  const mainWs = findB410Sheet(wb)
  const mainSheetName = mainWs.name

  // Danh sách các sheet phụ đính kèm
  const extraSheetNames = wb.worksheets
    .filter((w) => w.name !== mainSheetName)
    .map((w) => w.name)

  const rowCount = mainWs.rowCount
  if (rowCount < 5) {
    return {
      filePath,
      fileName,
      mainSheetName,
      issues: [],
      extraSheetNames,
      performerNames: [],
    }
  }

  // 1. Dò tìm dòng tiêu đề bảng (headerRow) và toạ độ cột động (hỗ trợ cả GLV ở Col 1, 2 hoặc 3)
  let headerRow = -1
  let codeCol = -1
  let descCol = -1
  let actionCol = -1
  let commentCol = -1

  for (let r = 6; r <= Math.min(16, rowCount); r++) {
    const row = mainWs.getRow(r)
    let count = 0

    for (let c = 1; c <= 8; c++) {
      const norm = normalizeSheetName(extractCellText(row.getCell(c)))
      if (norm.includes('glv') || norm.includes('giaylv')) count++
      if (norm.includes('thuctrang')) count++
      if (norm.includes('huongxuly')) count++
    }

    if (count >= 2) {
      headerRow = r
      for (let c = 1; c <= 9; c++) {
        const norm = normalizeSheetName(extractCellText(row.getCell(c)))
        if (codeCol === -1 && (norm.includes('glv') || norm.includes('giaylv'))) {
          codeCol = c
        } else if (descCol === -1 && norm.includes('thuctrang')) {
          descCol = c
        } else if (actionCol === -1 && norm.includes('huongxuly')) {
          actionCol = c
        } else if (commentCol === -1 && (norm.includes('ykien') || norm.includes('khachhang'))) {
          commentCol = c
        }
      }
      break
    }
  }
  // Fallback an toàn nếu thiếu cột
  if (headerRow === -1) headerRow = 8
  // Dò tìm chính xác cột GLV dựa vào dữ liệu thực tế (dạng E340.1, D140, TH1...)
  if (codeCol === -1 || codeCol === descCol || codeCol > descCol) {
    let detectedCodeCol = -1
    for (let r = headerRow + 1; r <= Math.min(headerRow + 6, rowCount); r++) {
      const row = mainWs.getRow(r)
      for (let c = 1; c <= Math.min(4, descCol > 1 ? descCol : 4); c++) {
        const val = extractCellText(row.getCell(c))
        if (/^[A-Za-z]{1,4}\s*\d+/i.test(val) && val.length <= 15) {
          detectedCodeCol = c
          break
        }
      }
      if (detectedCodeCol !== -1) break
    }

    if (detectedCodeCol !== -1) {
      codeCol = detectedCodeCol
      if (descCol <= codeCol) descCol = codeCol + 1
      if (actionCol <= descCol) actionCol = descCol + 2
    } else if (descCol > 1) {
      codeCol = descCol === 2 ? 1 : 2
    } else {
      codeCol = 3
      descCol = 4
    }
  }
  if (actionCol === -1) actionCol = descCol + 2
  if (commentCol === -1) commentCol = actionCol + 3
  // 2. Trích xuất tên KTV ban đầu từ Header (nếu có)
  let initialPerformer = ''
  for (let r = 1; r <= Math.min(headerRow + 2, rowCount); r++) {
    const row = mainWs.getRow(r)
    for (let c = 1; c <= 8; c++) {
      const txt = extractCellText(row.getCell(c))
      const match = txt.match(/(?:người\s*thực\s*hiện|nguoi\s*thuc\s*hien|thực\s*hiện|thuc\s*hien|ktv)\s*[:\-–]\s*([^\r\n]+)/i)
      if (match && match[1] && match[1].trim().length > 1) {
        initialPerformer = match[1].trim()
        break
      }
    }
    if (initialPerformer) break
  }

  if (!initialPerformer) {
    // Lấy token tên cuối cùng từ file name
    const parts = fileName.replace(/\.[^/.]+$/, '').split('-')
    const lastPart = parts[parts.length - 1]?.trim()
    initialPerformer = lastPart && lastPart.length > 1 ? lastPart : fileName
  }

  // 3. Trích xuất và lọc danh sách Shape/Ảnh hợp lệ
  const shapeFilterRes = filterAndExtractShapes(mainWs, wb, {
    minDataRow: headerRow + 1,
    maxDataRow: rowCount,
    contentColStart: descCol,
    contentColEnd: descCol + 1,
  })
  // 4. Quét từng dòng dữ liệu từ headerRow + 1 đến hết
  const issues: B410Issue[] = []
  const performerNamesSet = new Set<string>()
  performerNamesSet.add(initialPerformer)
  let currentPerformer = initialPerformer
  let unassignedIssuesStartIndex = 0
  for (let r = headerRow + 1; r <= rowCount; r++) {
    const row = mainWs.getRow(r)
    const c2 = extractCellText(row.getCell(2)) // STT
    const c3 = extractCellText(row.getCell(codeCol)) // GLV
    const cDesc = extractCellText(row.getCell(descCol)) // Thực trạng
    const cAction = extractCellText(row.getCell(actionCol)) // Hướng xử lý
    const cComment = extractCellText(row.getCell(commentCol)) // Ý kiến KH
    // Tiêu chí nhận diện mã GLV:
    const normGlv = normalizeSheetName(c3)
    const isHeaderWord = /^(giaylv|glv|stt|tt|bangke|thuctrang|huongxuly|ykien|nguoi|thuchien|congty)/i.test(normGlv)
    const hasGlvCode = (/^[A-Za-z0-9]/.test(c3) && !isHeaderWord && c3.length <= 20) || /^[A-Za-z]{1,4}\s*\d+/i.test(extractCellText(row.getCell(1)))

    // 1. Kiểm tra nếu là dòng chốt KTV: "Người thực hiện: ..." (CHỈ KHI DÒNG ĐÓ KHÔNG CÓ MÃ GLV)
    let pName = ''
    if (!hasGlvCode) {
      for (let c = 1; c <= 8; c++) {
        const cellText = extractCellText(row.getCell(c))
        const match = cellText.match(/^\s*(?:người\s*thực\s*hiện|nguoi\s*thuc\s*hien|ktv\s*thực\s*hiện|ktv)\s*[:\-–]\s*([^\r\n]+)/i)
        if (match && match[1] && match[1].trim().length > 1) {
          pName = match[1].trim()
          break
        }
      }
    }

    if (pName && pName.length > 1) {
      currentPerformer = pName
      performerNamesSet.add(pName)
      if (issues.length > 0 && unassignedIssuesStartIndex === 0) {
        for (let i = 0; i < issues.length; i++) {
          const iss = issues[i]
          if (iss) iss.performer = pName
        }
        unassignedIssuesStartIndex = issues.length
      }
      continue // Không coi dòng người thực hiện là 1 issue
    }

    // Bỏ qua dòng lời cảm ơn / chốt cuối bảng (không phải là issue)
    const normContent = (cDesc + ' ' + cAction + ' ' + c3).toLowerCase()
    if (normContent.includes('xin cảm ơn') || normContent.includes('xin cam on') || normContent.includes('sự hợp tác')) {
      continue
    }
    const hasSttNumber = /^\d+$/.test(c2)
    const hasContent = cDesc.length > 0 || cAction.length > 0

    if (!isHeaderWord && (hasGlvCode || hasSttNumber) && hasContent) {
      const rowHeight = row.height || 18
      let finalGlv = c3
      if (finalGlv.length > 20) {
        const val1 = extractCellText(row.getCell(1))
        const val2 = extractCellText(row.getCell(2))
        if (/^[A-Za-z]{1,4}\s*\d+/i.test(val1) && val1.length <= 15) {
          finalGlv = val1
        } else if (/^[A-Za-z]{1,4}\s*\d+/i.test(val2) && val2.length <= 15) {
          finalGlv = val2
        } else {
          finalGlv = `Lưu ý ${issues.length + 1}`
        }
      }

      issues.push({
        id: `${fileName}_R${r}`,
        sourceFile: fileName,
        sourceSheet: mainSheetName,
        sourceRow: r,
        glv: finalGlv || `Lưu ý ${issues.length + 1}`,
        finding: cDesc,
        recommendation: cAction,
        rawFinding: row.getCell(descCol).value,
        rawRecommendation: row.getCell(actionCol).value,
        customerComment: cComment || undefined,
        performer: currentPerformer,
        sourceRowHeight: rowHeight,
        calculatedHeight: rowHeight,
        images: [],
      })
    }
  }
  // 5. Gán ảnh vào đúng lưu ý tương ứng theo khoảng cách dòng gần nhất
  for (const img of shapeFilterRes.validImages) {
    let bestIssue: B410Issue | null = null
    let minDistance = 999

    for (let i = 0; i < issues.length; i++) {
      const iss = issues[i]
      if (iss) {
        const dist = Math.abs(img.originalRow - iss.sourceRow)
        if (dist < minDistance) {
          minDistance = dist
          bestIssue = iss
        }
      }
    }

    if (bestIssue && minDistance <= 3.5) {
      bestIssue.images.push(img)
    }
  }
  return {
    filePath,
    fileName,
    mainSheetName,
    issues,
    extraSheetNames,
    performerNames: Array.from(performerNamesSet),
  }
}
