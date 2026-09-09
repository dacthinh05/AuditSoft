import ExcelJS from 'exceljs'
import type { CellValue } from './cellValue'

export type MatrixRow = unknown[]

/** Giá trị ô đã flatten: Date giữ object, formula → cached result, richText → text. */
export function cellScalar(v: ExcelJS.CellValue): CellValue {
  if (v == null) return null
  if (v instanceof Date) return v
  if (typeof v === 'object') {
    const obj = v as unknown as Record<string, unknown>
    if ('richText' in obj && Array.isArray(obj.richText)) {
      return (obj.richText as Array<{ text?: string }>).map((r) => r.text ?? '').join('')
    }
    if ('sharedFormula' in obj || 'formula' in obj) {
      const result = 'result' in obj ? obj.result : undefined
      if (result == null) return null
      if (result instanceof Date) return result
      if (typeof result === 'object') {
        const r = result as unknown as Record<string, unknown>
        if ('error' in r) return `#ERR:${String(r.error)}`
        return JSON.stringify(r)
      }
      return result as CellValue
    }
    if ('text' in obj) return String(obj.text)
    if ('error' in obj) return `#ERR:${String(obj.error)}`
    if ('hyperlink' in obj && 'text' in obj) return String(obj.text)
    return String(v)
  }
  return v
}

/** Đọc toàn bộ sheet 1 lần thành matrix giá trị thô (đã flatten).
 *  Chống "memory bomb" trên sheet format thừa (vd. 16.381 cột): giới hạn theo vùng actual
 *  và trần cứng 512 cột / 1 triệu ô mỗi sheet. */
export async function readWorkbookMatrix(filePath: string): Promise<{ sheetName: string; matrix: unknown[][] }[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  const out: { sheetName: string; matrix: unknown[][] }[] = []
  for (const ws of wb.worksheets) {
    const maxCols = 512
    const maxCells = 1_000_000
    // Vùng dùng = số dòng/cột LỚN NHẤT từng chứa giá trị. Không dùng actualRowCount/
    // actualColumnCount (đếm SỐ LƯỢNG dòng/cột có giá trị) — nếu có dòng/cột trống ở đầu
    // hoặc xen giữa thì min() sẽ cắt mất phần dữ liệu cuối.
    let lastRowNum = 0
    let lastColNum = 0
    ws.eachRow((row, rowNum) => {
      if (rowNum > lastRowNum) lastRowNum = rowNum
      row.eachCell((_, colNum) => {
        if (colNum > lastColNum) lastColNum = colNum
      })
    })
    let rowCount = Math.min(ws.rowCount, lastRowNum)
    const colCount = Math.min(lastColNum, maxCols)
    while (rowCount * colCount > maxCells && rowCount > 1) rowCount = Math.floor(rowCount / 2)
    const matrix: unknown[][] = new Array(rowCount)
    for (let r = 1; r <= rowCount; r++) {
      const row = ws.getRow(r)
      const arr: unknown[] = new Array(colCount)
      for (let c = 1; c <= colCount; c++) {
        arr[c - 1] = cellScalar(row.getCell(c).value)
      }
      matrix[r - 1] = arr
    }
    out.push({ sheetName: ws.name, matrix })
  }
  return out
}

export function isBlankRow(row: unknown[], columns?: number[]): boolean {
  if (!row) return true
  if (columns && columns.length > 0) {
    return columns.every((cIdx) => row[cIdx] == null || String(row[cIdx]).trim() === '')
  }
  return row.every((c) => c == null || String(c).trim() === '')
}
