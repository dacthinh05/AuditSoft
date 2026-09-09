import ExcelJS from 'exceljs'
import fs from 'node:fs'
import { coerceCellToString } from '../../domain/clean'

export interface ScannedSheet {
  name: string
  rowCount: number
  preview: unknown[][]
}

export interface ScanResult {
  sheetNames: string[]
  sheets: Map<string, ScannedSheet>
}

const PREVIEW_LIMIT = 25

interface RowLike {
  values?: unknown[]
}

interface WorksheetLike {
  name: string
  on(event: 'row', cb: (row: RowLike) => void): void
}

interface ReaderLike {
  on(event: string, cb: (...args: never[]) => void): unknown
  read(): void
}

function toDense(values: unknown[], coerceObjects: boolean): unknown[] {
  const dense: unknown[] = []
  for (let i = 1; i < values.length; i++) {
    const v = values[i]
    if (coerceObjects && typeof v === 'object' && v !== null && !(v instanceof Date)) {
      dense.push(coerceCellToString(v))
    } else {
      dense.push(v ?? null)
    }
  }
  return dense
}

interface FullLoadResult {
  sheetNames: string[]
  matrices: unknown[][][]
}

/** Fallback: đọc toàn bộ workbook vào bộ nhớ (chậm hơn nhưng luôn hoạt động). */
async function fullLoad(filePath: string): Promise<FullLoadResult> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  return {
    sheetNames: wb.worksheets.map((w) => w.name),
    matrices: wb.worksheets.map((w) =>
      Array.from({ length: w.rowCount }, (_, i) => toDense((w.getRow(i + 1).values as unknown[]) ?? [], false)),
    ),
  }
}

/** Quét workbook — ưu tiên streaming (nhanh, ít RAM); lỗi thì fallback full-load. */
export async function scanWorkbook(filePath: string): Promise<ScanResult> {
  try {
    return await scanViaStream(filePath)
  } catch {
    const full = await fullLoad(filePath)
    const sheets = new Map<string, ScannedSheet>()
    full.sheetNames.forEach((name, idx) => {
      const matrix = full.matrices[idx] ?? []
      sheets.set(name, { name, rowCount: matrix.length, preview: matrix.slice(0, PREVIEW_LIMIT) })
    })
    return { sheetNames: full.sheetNames, sheets }
  }
}

function scanViaStream(filePath: string): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const raw = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
      worksheets: 'emit',
      sharedStrings: 'cache',
      styles: 'cache',
      hyperlinks: 'ignore',
    })
    const reader = raw as unknown as ReaderLike

    let settled = false
    const accs: { name: string; rowCount: number; preview: unknown[][]; collectedRows: number }[] = []

    reader.on('worksheet', ((wsUnknown: unknown) => {
      const w = wsUnknown as WorksheetLike
      const acc = { name: w.name, rowCount: 0, preview: [] as unknown[][], collectedRows: 0 }
      accs.push(acc)
      w.on('row', (row) => {
        acc.rowCount++
        if (acc.collectedRows < PREVIEW_LIMIT) {
          acc.preview.push(toDense(row.values ?? [], true))
          acc.collectedRows++
        }
      })
    }) as never)
    reader.on('error', ((err: Error) => {
      if (!settled) {
        settled = true
        stream.destroy()
        reject(err)
      }
    }) as never)
    reader.on('end', (() => {
      if (!settled) {
        settled = true
        stream.destroy()
        const sheets = new Map<string, ScannedSheet>()
        for (const { name, rowCount, preview } of accs) {
          sheets.set(name, { name, rowCount, preview })
        }
        resolve({ sheetNames: accs.map((a) => a.name), sheets })
      }
    }) as never)

    try {
      reader.read()
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

/** Đọc toàn bộ dòng của MỘT sheet thành ma trận dense 0-based.
 *  Ưu tiên streaming + tiến độ; lỗi thì fallback full-load. */
export async function readSheetRows(
  filePath: string,
  sheetName: string,
  onProgress?: (processedRows: number) => void,
): Promise<{ rows: unknown[][]; totalRows: number }> {
  try {
    return await readViaStream(filePath, sheetName, onProgress)
  } catch {
    const full = await fullLoad(filePath)
    const idx = full.sheetNames.findIndex((n) => n === sheetName)
    if (idx < 0) throw new Error(`Không tìm thấy sheet "${sheetName}". Các sheet: ${full.sheetNames.join(', ')}`)
    const rows = full.matrices[idx] ?? []
    onProgress?.(rows.length)
    return { rows, totalRows: rows.length }
  }
}

/** Đọc sheet bằng full-load (không streaming) — dùng trong worker để tránh tmp.file() của ExcelJS. */
export async function readSheetRowsDirect(
  filePath: string,
  sheetName: string,
  onProgress?: (processedRows: number) => void,
): Promise<{ rows: unknown[][]; totalRows: number }> {
  const full = await fullLoad(filePath)
  const idx = full.sheetNames.findIndex((n) => n === sheetName)
  if (idx < 0) throw new Error(`Không tìm thấy sheet "${sheetName}". Các sheet: ${full.sheetNames.join(', ')}`)
  const rows = full.matrices[idx] ?? []
  onProgress?.(rows.length)
  return { rows, totalRows: rows.length }
}

function readViaStream(
  filePath: string,
  sheetName: string,
  onProgress?: (processedRows: number) => void,
): Promise<{ rows: unknown[][]; totalRows: number }> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const raw = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
      worksheets: 'emit',
      sharedStrings: 'cache',
      styles: 'cache',
      hyperlinks: 'ignore',
    })
    const reader = raw as unknown as ReaderLike

    let processed = 0
    const rows: unknown[][] = []
    let settled = false

    reader.on('worksheet', ((wsUnknown: unknown) => {
      const w = wsUnknown as WorksheetLike
      if (w.name !== sheetName) return
      w.on('row', (row) => {
        processed++
        rows.push(toDense(row.values ?? [], false))
        if (onProgress && processed % 5000 === 0) onProgress(processed)
      })
    }) as never)
    reader.on('error', ((err: Error) => {
      if (!settled) {
        settled = true
        stream.destroy()
        reject(err)
      }
    }) as never)
    reader.on('end', (() => {
      if (!settled) {
        settled = true
        stream.destroy()
        resolve({ rows, totalRows: processed })
      }
    }) as never)

    try {
      reader.read()
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}
