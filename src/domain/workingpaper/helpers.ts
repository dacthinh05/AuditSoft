import type ExcelJS from 'exceljs'
import type { EngagementInfo } from './types'

export function cellScalar(v: ExcelJS.CellValue): unknown {
  if (v == null) return null
  if (v instanceof Date) return v
  if (typeof v === 'object') {
    const obj = v as unknown as Record<string, unknown>
    if ('richText' in obj && Array.isArray(obj.richText)) {
      return (obj.richText as Array<{ text?: string }>).map((r) => r.text ?? '').join('')
    }
    if ('sharedFormula' in obj || 'formula' in obj) {
      return obj.result !== undefined ? obj.result : null
    }
    if ('text' in obj) return String(obj.text)
    return v
  }
  return v
}

export function cellNumber(v: ExcelJS.CellValue): number {
  const scalar = cellScalar(v)
  if (typeof scalar === 'number') return isNaN(scalar) ? 0 : scalar
  if (typeof scalar === 'string') {
    const clean = scalar.replace(/[,\s]/g, '')
    const n = parseFloat(clean)
    return isNaN(n) ? 0 : n
  }
  return 0
}

/**
 * Format bất kỳ giá trị ngày thành chuỗi chuẩn Việt Nam DD/MM/YYYY
 */
export function formatDateVN(val: unknown): string {
  if (val == null || val === '') return ''
  if (typeof val === 'string') {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(val)
    if (m && m[1] && m[2] && m[3]) {
      const d = m[3].padStart(2, '0')
      const mo = m[2].padStart(2, '0')
      return `${d}/${mo}/${m[1]}`
    }
  }

  if (typeof val === 'number') {
    if (val > 30000 && val < 60000) {
      const date = new Date((val - 25569) * 86400 * 1000)
      const d = String(date.getUTCDate()).padStart(2, '0')
      const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
      const y = date.getUTCFullYear()
      return `${d}/${mo}/${y}`
    }
  }

  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0')
    const mo = String(val.getMonth() + 1).padStart(2, '0')
    const y = val.getFullYear()
    return `${d}/${mo}/${y}`
  }

  return String(val)
}

const _THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
}

const DEFAULT_FONT: Partial<ExcelJS.Font> = {
  name: 'Cambria',
  size: 10,
}

export function styleCellAmount(cell: ExcelJS.Cell, val: number, isBold = false): void {
  cell.value = Number(val) || 0
  cell.numFmt = '#,##0'
  cell.alignment = { horizontal: 'right', vertical: 'middle' }
  if (isBold) {
    cell.font = { ...(cell.font || DEFAULT_FONT), bold: true }
  }
}

export function styleCellDate(cell: ExcelJS.Cell, val: unknown): void {
  cell.value = formatDateVN(val)
  cell.numFmt = '@'
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
}

export function styleCellCode(cell: ExcelJS.Cell, val: string, isBold = false): void {
  cell.value = String(val || '')
  cell.numFmt = '@'
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  if (isBold) {
    cell.font = { ...(cell.font || DEFAULT_FONT), bold: true }
  }
}

export function styleCellText(cell: ExcelJS.Cell, val: string, isBold = false): void {
  cell.value = String(val || '')
  cell.numFmt = '@'
  cell.alignment = { horizontal: 'left', vertical: 'middle' }
  if (isBold) {
    cell.font = { ...(cell.font || DEFAULT_FONT), bold: true }
  }
}

/**
 * Điền một dòng trong Bảng Lead Schedule (xx110 / xx210 / xx310...)
 * Đảm bảo:
 * - Điền Số trước KT (C4) và Số đầu kỳ (C7)
 * - Tuyệt đối không ghi đè làm mất công thức SUM hoặc công thức điều chỉnh ở C5 / C6
 */
export function setLeadRowValues(
  ws: ExcelJS.Worksheet,
  r: number,
  options: {
    tk?: string
    ten?: string
    ck: number
    dk: number
    colTk?: number
    colTen?: number
    colCk?: number
    colAje?: number
    colSau?: number
    colDk?: number
  },
): void {
  const row = ws.getRow(r)
  const c1 = row.getCell(options.colTk ?? 1)
  const c2 = row.getCell(options.colTen ?? 2)
  const c4 = row.getCell(options.colCk ?? 4)
  const c7 = row.getCell(options.colDk ?? 7)

  if (options.tk && !(c1.value && typeof c1.value === 'object')) {
    c1.value = options.tk
    c1.numFmt = '@'
    c1.alignment = { horizontal: 'center', vertical: 'middle' }
  }
  if (options.ten && !(c2.value && typeof c2.value === 'object')) {
    c2.value = options.ten
    c2.numFmt = '@'
    c2.alignment = { horizontal: 'left', vertical: 'middle' }
  }

  // Cột 4: Số trước KT (D)
  c4.value = Number(options.ck) || 0
  c4.numFmt = '#,##0'
  c4.alignment = { horizontal: 'right', vertical: 'middle' }

  // Cột 7: Số đầu kỳ / Năm trước (G)
  c7.value = Number(options.dk) || 0
  c7.numFmt = '#,##0'
  c7.alignment = { horizontal: 'right', vertical: 'middle' }
  // Tuyệt đối không can thiệp Cột 5 (Điều chỉnh) hoặc Cột 6 (Sau KT) vì là công thức của template!
}

/**
 * Chuẩn hóa và làm sạch các công thức Shared Formula bị lỗi trong template
 */
export function normalizeWorkbookSharedFormulas(wb: ExcelJS.Workbook): void {
  for (const ws of wb.worksheets) {
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && typeof cell.value === 'object') {
          const val = cell.value as unknown as Record<string, unknown>
          if ('sharedFormula' in val && !('formula' in val)) {
            cell.value = val.result !== undefined ? (val.result as string | number | boolean | Date) : null
          }
        }
      })
    })
  }
}

/**
 * Điền chuẩn sheet ADD (Thông tin khách hàng & Niên độ kiểm toán)
 * Giữ đúng cấu trúc độ rộng chuỗi cho các công thức MID/RIGHT trong template.
 */
export function fillAddSheet(ws: ExcelJS.Worksheet, engagement: EngagementInfo): void {
  const yearStr = engagement.fiscalYearEnd.slice(-4) || '2026'

  // J2 / A1: Khách hàng
  const a1Cell = ws.getCell('A1')
  const a1Val = a1Cell.value
  if (a1Val && typeof a1Val === 'object' && 'formula' in a1Val) {
    ws.getCell('J2').value = engagement.clientName
  } else {
    a1Cell.value = `Khách hàng: ${engagement.clientName}`
    if (ws.getCell('J2').value !== null) ws.getCell('J2').value = engagement.clientName
  }

  // A2: Ngày khóa sổ / Niên độ
  const a2Cell = ws.getCell('A2')
  const a2Val = String(a2Cell.value || '')
  if (a2Val.includes('Ngày khóa sổ')) {
    a2Cell.value = `Ngày khóa sổ:          31 / 12 / ${yearStr}`
  } else {
    a2Cell.value = `Niên độ:          31/12 / ${yearStr}`
  }

  // A3: Đợt 1
  const a3Cell = ws.getCell('A3')
  const a3Val = String(a3Cell.value || '')
  if (a3Val.includes('01 / 01')) {
    a3Cell.value = `Đợt 1: 01 / 01 - 30 / 06 / ${yearStr}`
  } else {
    a3Cell.value = `Đợt 1:             01/01 - 30/06/${yearStr}`
  }

  // A4: Đợt 2
  const a4Cell = ws.getCell('A4')
  const a4Val = String(a4Cell.value || '')
  if (a4Val.includes('01 / 07')) {
    a4Cell.value = `Đợt 2: 01 / 07 - 31 / 12 / ${yearStr}`
  } else {
    a4Cell.value = `Đợt 2:             01/07 - 31/12/${yearStr}`
  }

  // Auditor & Reviewer
  if (engagement.auditorName) {
    ws.getCell('G3').value = engagement.auditorName
    if (ws.getCell('K3').value !== null) ws.getCell('K3').value = engagement.auditorName
  }

  if (engagement.auditFirmName) {
    ws.getCell('F1').value = engagement.auditFirmName
    if (ws.getCell('G1').value !== null) ws.getCell('G1').value = engagement.auditFirmName
  }
}
