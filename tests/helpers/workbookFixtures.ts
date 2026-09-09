import ExcelJS from 'exceljs'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function tmpDir(prefix = 'auditsoft-test'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
}

export interface GlRowSpec {
  date?: unknown
  doc?: unknown
  desc?: unknown
  debit?: unknown
  credit?: unknown
  amount?: unknown
  fx?: unknown
  usd?: unknown
  objCode?: unknown
}

/** Ghi workbook GL với header tùy biến (mảng headers đặt tại headerRowNumber). */
export async function writeGlWorkbook(
  filePath: string,
  opts: {
    headers?: string[]
    rows: GlRowSpec[]
    headerRowNumber?: number
    titleAbove?: string
    subtotalAboveHeader?: boolean
    blankRowsBetween?: boolean
    mergedDescriptionHeader?: boolean
    formulaAmountRows?: number[]
  },
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')
  const headerRowNumber = opts.headerRowNumber ?? 1

  const lines: unknown[][] = []
  if (opts.titleAbove) lines.push([opts.titleAbove])
  if (opts.subtotalAboveHeader)
    lines.push(['', '', '', '', '', { formula: 'SUBTOTAL(9,G3:G1048576)', result: null }])
  while (lines.length < headerRowNumber - 1) lines.push([])

  const headers = opts.headers ?? ['NGÀY', 'SỐ CT', 'NỘI DUNG', 'TK NỢ', 'TK CÓ', 'SỐ TIỀN', 'TỶ GIÁ', 'USD', 'MÃ KH']
  const hasMerge = opts.mergedDescriptionHeader === true && opts.headers == null
  if (hasMerge) {
    // "NỘI DUNG" gộp 2 cột C:D — giá trị nằm ở ô master (C)
    lines.push([...headers.slice(0, 2), headers[2]!, null, ...headers.slice(3)])
  } else {
    lines.push([...headers])
  }

  // Ghi theo vị trí dòng tường minh. LƯU Ý ExcelJS:
  //  - row.values là mảng 1-indexed (values[1] → cột A) → KHÔNG thêm leading null
  //  - dòng trống phải có ít nhất 1 ô (' ') mới tồn tại trong file xlsx
  const writeRow = (n: number, line: unknown[]): void => {
    if (line.length === 0) ws.getRow(n).getCell(1).value = ' '
    else ws.getRow(n).values = line as ExcelJS.CellValue[]
  }
  let rowNum = 1
  for (const line of lines) {
    writeRow(rowNum, line)
    rowNum++
  }

  let i = 0
  for (const row of opts.rows) {
    if (opts.blankRowsBetween && i > 0) {
      writeRow(rowNum, [])
      rowNum++
    }
    i++
    const values: unknown[] = [
      row.date ?? null,
      row.doc ?? null,
      row.desc ?? null,
      ...(hasMerge ? [null] : []),
      row.debit ?? null,
      row.credit ?? null,
      null,
      row.fx ?? null,
      row.usd ?? null,
      row.objCode ?? null,
    ]
    const amountIdx = hasMerge ? 6 : 5
    values[amountIdx] =
      opts.formulaAmountRows?.includes(i) === true
        ? { formula: `100000*${i}`, result: 100000 * i }
        : (row.amount ?? null)
    writeRow(rowNum, values)
    rowNum++
  }
  await wb.xlsx.writeFile(filePath)
}

export interface TbRowSpec {
  account: string
  name?: string
  sdndk?: number
  sdcdk?: number
  psNo?: number
  psCo?: number
  noCk?: number
  coCk?: number
}

export async function writeTbWorkbook(filePath: string, rows: TbRowSpec[], sheetName = 'DATA', headerAt = 1): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)
  let pad = 1
  while (pad < headerAt) { ws.getRow(pad).getCell(1).value = ' '; pad++ }
  ws.addRow(['MATK', 'TENTK', 'SDNDK', 'SDCDK', 'PS No', 'PS Co', 'No CK', 'Co CK'])
  for (const r of rows) {
    ws.addRow([r.account, r.name ?? '', r.sdndk ?? 0, r.sdcdk ?? 0, r.psNo ?? 0, r.psCo ?? 0, r.noCk ?? 0, r.coCk ?? 0])
  }
  await wb.xlsx.writeFile(filePath)
}

export interface IsRowSpec {
  maSo?: string
  chiTieu: string
  current?: number | null
  prior?: number | null
}

export async function writeIsWorkbook(filePath: string, rows: IsRowSpec[], sheetName = 'BC-KQKD', headerAt = 1): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)
  let pad = 1
  while (pad < headerAt) { ws.getRow(pad).getCell(1).value = ' '; pad++ }
  ws.addRow(['MS', 'CHỈ TIÊU', 'Năm nay', 'Năm trước'])
  for (const r of rows) {
    ws.addRow([r.maSo ?? null, r.chiTieu, r.current ?? null, r.prior ?? null])
  }
  await wb.xlsx.writeFile(filePath)
}
