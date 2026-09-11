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
    const s = val.trim()
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s
    const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s)
    if (m && m[1] && m[2] && m[3]) {
      const d = m[3].padStart(2, '0')
      const mo = m[2].padStart(2, '0')
      return `${d}/${mo}/${m[1]}`
    }
    const parsed = new Date(s)
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0')
      const mo = String(parsed.getMonth() + 1).padStart(2, '0')
      const y = parsed.getFullYear()
      return `${d}/${mo}/${y}`
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

/**
 * Format dòng tổng cộng chuẩn kiểm toán: Viền trên nét đơn, viền dưới gạch chân đôi (double underline)
 */
export function styleTotalDoubleUnderline(row: ExcelJS.Row, startCol = 1, endCol = 8): void {
  for (let c = startCol; c <= endCol; c++) {
    const cell = row.getCell(c)
    cell.font = { ...DEFAULT_FONT, bold: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'double', color: { argb: 'FF000000' } },
      left: cell.border?.left,
      right: cell.border?.right,
    }
  }
}

/**
 * Format ô bút toán điều chỉnh AJE: Nền vàng nhạt cảnh báo (#FFF2CC), viền cam nhạt
 */
export function styleAjeAdjustmentCell(cell: ExcelJS.Cell, val: number): void {
  cell.value = Number(val) || 0
  cell.numFmt = '#,##0;[Red](#,##0);-'
  cell.font = { ...DEFAULT_FONT, bold: true, color: { argb: 'FFC00000' } }
  cell.alignment = { horizontal: 'right', vertical: 'middle' }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF2CC' },
  }
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFF8A153' } },
    bottom: { style: 'thin', color: { argb: 'FFF8A153' } },
    left: { style: 'thin', color: { argb: 'FFF8A153' } },
    right: { style: 'thin', color: { argb: 'FFF8A153' } },
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
 * Tự động tính tổng số dư tài khoản (Rollup) từ CDFS:
 * - Nếu có tài khoản chính xác và có số dư > 0 -> dùng số dư đó.
 * - Nếu không có hoặc số dư = 0 -> tự động cộng dồn tất cả tài khoản con bắt đầu bằng prefix (ví dụ 1521, 1522 -> 152).
 */
export function getAccountRollup(
  cdfsMap: Map<string, { matk: string; tentk: string; sdndk?: number; sdcdk?: number; psndk?: number; pscdk?: number; nock?: number; cock?: number }>,
  prefix: string,
): { ck: number; dk: number; tentk: string } {
  const exact = cdfsMap.get(prefix)
  const exactCK = (exact?.nock || exact?.cock || 0)
  const exactDK = (exact?.sdndk || exact?.sdcdk || 0)

  // Nếu tài khoản mẹ đã có số dư riêng
  if (exact && (exactCK !== 0 || exactDK !== 0)) {
    return { ck: exactCK, dk: exactDK, tentk: exact.tentk }
  }

  // Nếu không, rollup từ tất cả các tài khoản con bắt đầu bằng prefix
  let sumCK = 0
  let sumDK = 0
  let detectedName = exact?.tentk || ''

  for (const acc of cdfsMap.values()) {
    if (acc.matk.startsWith(prefix) && acc.matk !== prefix) {
      sumCK += (acc.nock || acc.cock || 0)
      sumDK += (acc.sdndk || acc.sdcdk || 0)
      if (!detectedName) detectedName = acc.tentk
    }
  }

  return {
    ck: sumCK || exactCK,
    dk: sumDK || exactDK,
    tentk: detectedName || exact?.tentk || prefix,
  }
}

/**
 * Điền chuẩn xác dòng dữ liệu vào Lead Schedule
 * Đảm bảo:
 * - Điền Số trước KT (Cột D / 4) và Số đầu kỳ (Cột G / 7 hoặc Cột H / 8)
 * - Tự động phát hiện nếu ô có công thức thì TUYỆT ĐỐI KHÔNG GHI ĐÈ!
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
  const colDkIdx = options.colDk ?? 7
  const cDk = row.getCell(colDkIdx)

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

  // Cột Số trước KT (thường là Cột 4 - D)
  // Chỉ ghi nếu ô không phải là công thức SUM / link
  if (!(c4.value && typeof c4.value === 'object' && 'formula' in c4.value)) {
    c4.value = Number(options.ck) || 0
    c4.numFmt = '#,##0'
    c4.alignment = { horizontal: 'right', vertical: 'middle' }
  }

  // Cột Số đầu kỳ / Năm trước (Cột 7 - G hoặc Cột 8 - H)
  if (!(cDk.value && typeof cDk.value === 'object' && 'formula' in cDk.value)) {
    cDk.value = Number(options.dk) || 0
    cDk.numFmt = '#,##0'
    cDk.alignment = { horizontal: 'right', vertical: 'middle' }
  }
}

/**
 * Chuẩn hóa và làm sạch các công thức Shared Formula bị lỗi trong template
 */
export function normalizeWorkbookSharedFormulas(wb: ExcelJS.Workbook): void {
  if (!wb || !('worksheets' in wb) || !Array.isArray(wb.worksheets)) {
    return
  }
  for (const ws of wb.worksheets) {
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && typeof cell.value === 'object') {
          const val = cell.value as unknown as Record<string, unknown>
          if ('sharedFormula' in val && !('formula' in val)) {
            cell.value = val.result !== undefined ? (val.result as string | number | boolean | Date) : null
          } else if ('formula' in val && typeof val.formula === 'string') {
            // Chỉ làm sạch nếu công thức chứa lỗi #REF! bị đứt gãy
            if (val.formula.includes('#REF!')) {
              cell.value = val.result !== undefined ? (val.result as string | number | boolean | Date) : null
            }
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
export function fillAddSheet(ws: ExcelJS.Worksheet, engagement: EngagementInfo, monthlyRevenue12M?: number[]): void {
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
  const rawP1 = engagement.auditPeriod1?.replace(/^Đợt 1:\s*/i, '').trim() || `01/01 - 30/06/${yearStr}`
  a3Cell.value = `Đợt 1:             ${rawP1}`

  // A4: Đợt 2
  const a4Cell = ws.getCell('A4')
  const rawP2 = engagement.auditPeriod2?.replace(/^Đợt 2:\s*/i, '').trim() || `01/07 - 31/12/${yearStr}`
  a4Cell.value = `Đợt 2:             ${rawP2}`

  // Auditor & Reviewer
  // Auditor & Reviewer (Chỉ ghi nếu ô không có công thức tham chiếu sẵn)
  if (engagement.auditorName) {
    ws.getCell('G3').value = engagement.auditorName
    const k3 = ws.getCell('K3')
    if (k3.value !== null && !(typeof k3.value === 'object' && 'formula' in k3.value)) {
      k3.value = engagement.auditorName
    }
  }

  if (engagement.auditFirmName) {
    ws.getCell('F1').value = engagement.auditFirmName
    const g1 = ws.getCell('G1')
    if (g1.value !== null && !(typeof g1.value === 'object' && 'formula' in g1.value)) {
      g1.value = engagement.auditFirmName
    }
  }

  // Thống kê Doanh thu 12 tháng (F24:F35) làm nguồn cho công thức =+ADD!F24..F35 trên G353/G453
  if (monthlyRevenue12M && Array.isArray(monthlyRevenue12M) && monthlyRevenue12M.length >= 12) {
    for (let m = 0; m < 12; m++) {
      const row = 24 + m
      const rev = monthlyRevenue12M[m] ?? 0
      const cell = ws.getCell(`F${row}`)
      cell.value = rev
      cell.numFmt = '#,##0'
    }
  }
}

export function findWorksheetFuzzy(wb: any, candidates: string | string[]): any {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_\-.]/g, "");
  for (const name of list) {
    const ws = wb.getWorksheet(name);
    if (ws) return ws;
  }
  for (const name of list) {
    const norm = normalize(name);
    const matched = wb.worksheets.find((w: any) => normalize(w.name) === norm);
    if (matched) return matched;
  }
  return undefined
}

/**
 * Tính tổng số tiền điều chỉnh thuần từ danh sách bút toán điều chỉnh AJE (VSA 500 / VSA 450)
 * @param entries Danh sách bút toán điều chỉnh
 * @param accountPrefix Tiền tố tài khoản cần tính (vd: '111', '112', '131', '331'...)
 * @param normalBalance Chiều số dư thông thường: 'DEBIT' (Tài sản) hoặc 'CREDIT' (Nguồn vốn, Doanh thu)
 */
export function computeAccountAdjustment(
  entries: Array<{ tkNo: string; tkCo: string; soTien: number }> | undefined,
  accountPrefix: string,
  normalBalance: 'DEBIT' | 'CREDIT' = 'DEBIT',
): number {
  if (!entries || entries.length === 0) return 0
  let debitAdj = 0
  let creditAdj = 0

  for (const e of entries) {
    if (e.tkNo && e.tkNo.startsWith(accountPrefix)) {
      debitAdj += Math.abs(e.soTien || 0)
    }
    if (e.tkCo && e.tkCo.startsWith(accountPrefix)) {
      creditAdj += Math.abs(e.soTien || 0)
    }
  }

  return normalBalance === 'DEBIT' ? debitAdj - creditAdj : creditAdj - debitAdj
}

/**
 * Khối chú giải ký hiệu kiểm toán (Tickmarks) chuẩn mực theo Hồ sơ kiểm toán mẫu VACPA
 */
export const VACPA_TICKMARKS_LEGEND = [
  { symbol: '^', desc: 'Đã kiểm tra số cộng số học (Footing / Cross-footing).' },
  { symbol: '✓', desc: 'Đã kiểm tra đối chiếu với chứng từ gốc hợp lệ (Vouching to source documents).' },
  { symbol: 'GL', desc: 'Đã khớp đúng với Sổ Cái (Agreed to General Ledger).' },
  { symbol: 'TB', desc: 'Đã khớp đúng Bảng Cân Đối Số Phát Sinh (Agreed to Trial Balance).' },
]
