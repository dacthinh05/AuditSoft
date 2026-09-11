import type ExcelJS from 'exceljs'
import type { EngagementInfo } from '../types'
import type { OpenXmlPackageEditor } from './OpenXmlPackageEditor'
import { indexToColLetter } from './OpenXmlPackageEditor'
import { formatDateVN } from '../helpers'

/**
 * Adapter đa hình cho phép các hàm filler nhận cả OpenXmlPackageEditor (runtime)
 * lẫn ExcelJS.Workbook (trong các unit test).
 */
export function adaptEditor(target: unknown): OpenXmlPackageEditor {
  if (
    target &&
    typeof target === 'object' &&
    'hasSheet' in target &&
    typeof (target as { hasSheet: unknown }).hasSheet === 'function'
  ) {
    return target as OpenXmlPackageEditor
  }

  const wb = target as ExcelJS.Workbook
  const findWs = (name: string): ExcelJS.Worksheet | undefined => {
    const norm = name.toLowerCase().replace(/[\s_\-.]/g, '')
    return wb.worksheets.find((w) => {
      const wNorm = w.name.toLowerCase().replace(/[\s_\-.]/g, '')
      return wNorm.startsWith(norm) || norm.startsWith(wNorm)
    })
  }

  return {
    hasSheet: (name: string) => Boolean(findWs(name)),
    fillAddSheet: (eng: EngagementInfo) => {
      const ws = wb.getWorksheet('ADD') || findWs('ADD')
      if (ws) ws.getCell('A1').value = `Khách hàng: ${eng.clientName}`
    },
    setLeadRowValues: (
      sName: string,
      row: number,
      opts: {
        ck?: number
        dk?: number
        adj?: number
        tk?: string
        ten?: string
        colTk?: number
        colTen?: number
        colCk?: number
        colAdj?: number
        colDk?: number
      },
    ) => {
      const ws = findWs(sName)
      if (!ws) return
      const r = ws.getRow(row)
      if (opts.tk !== undefined) r.getCell(opts.colTk ?? 1).value = opts.tk
      if (opts.ten !== undefined) r.getCell(opts.colTen ?? 2).value = opts.ten
      if (opts.ck !== undefined) r.getCell(opts.colCk ?? 4).value = opts.ck
      if (opts.adj !== undefined) r.getCell(opts.colAdj ?? 5).value = opts.adj
      if (opts.dk !== undefined) r.getCell(opts.colDk ?? 7).value = opts.dk
    },
    fillTickmarksLegend: (sName: string, startRow: number, colSymbol = 2, colDesc = 3) => {
      const ws = findWs(sName)
      if (!ws) return
      ws.getCell(`${indexToColLetter(colSymbol)}${startRow}`).value = 'Chú thích ký hiệu kiểm toán (Tickmarks):'
      const legends = [
        { s: '^', d: 'Đã kiểm tra số cộng số học (Footing / Cross-footing).' },
        { s: '✓', d: 'Đã đối chiếu chứng từ gốc hợp lệ (Vouching to source documents).' },
        { s: 'GL', d: 'Đã khớp đúng với Sổ Cái (Agreed to General Ledger).' },
        { s: 'TB', d: 'Đã khớp đúng Bảng Cân Đối Số Phát Sinh (Agreed to Trial Balance).' },
      ]
      legends.forEach((item, idx) => {
        const r = startRow + 1 + idx
        ws.getCell(`${indexToColLetter(colSymbol)}${r}`).value = item.s
        ws.getCell(`${indexToColLetter(colDesc)}${r}`).value = item.d
      })
    },
    updateCell: (sName: string, cellRef: string, val: { number?: number; text?: string; date?: unknown }) => {
      const ws = findWs(sName)
      if (!ws) return
      const cell = ws.getCell(cellRef)
      if (val.number !== undefined) cell.value = val.number
      else if (val.text !== undefined) cell.value = val.text
      else if (val.date !== undefined) cell.value = formatDateVN(val.date)
    },
    fillRow: (
      sName: string,
      rowNum: number,
      cells: Array<{ number?: number; text?: string; date?: unknown } | number | string | null | undefined>,
      startCol = 1,
    ) => {
      const ws = findWs(sName)
      if (!ws) return
      cells.forEach((cellVal, idx) => {
        if (cellVal === null || cellVal === undefined) return
        const colLetter = indexToColLetter(startCol + idx)
        const cell = ws.getCell(`${colLetter}${rowNum}`)
        if (typeof cellVal === 'number') cell.value = cellVal
        else if (typeof cellVal === 'string') cell.value = cellVal
        else if (cellVal.number !== undefined) cell.value = cellVal.number
        else if (cellVal.text !== undefined) cell.value = cellVal.text
        else if (cellVal.date !== undefined) cell.value = formatDateVN(cellVal.date)
      })
    },
    fillSampleRow: (
      sName: string,
      rowNum: number,
      item: { date?: unknown; docNo?: string; desc?: string; amount?: number; debit?: string; credit?: string; colOffset?: number },
    ) => {
      const ws = findWs(sName)
      if (!ws) return
      const offset = item.colOffset ?? 1
      if (item.date !== undefined) ws.getCell(`${indexToColLetter(offset)}${rowNum}`).value = formatDateVN(item.date)
      if (item.docNo !== undefined) ws.getCell(`${indexToColLetter(offset + 1)}${rowNum}`).value = String(item.docNo ?? '')
      if (item.desc !== undefined) ws.getCell(`${indexToColLetter(offset + 2)}${rowNum}`).value = String(item.desc ?? '')
      if (item.amount !== undefined) ws.getCell(`${indexToColLetter(offset + 3)}${rowNum}`).value = Number(item.amount) || 0
      if (item.debit !== undefined) ws.getCell(`${indexToColLetter(offset + 4)}${rowNum}`).value = String(item.debit ?? '')
      if (item.credit !== undefined) ws.getCell(`${indexToColLetter(offset + 5)}${rowNum}`).value = String(item.credit ?? '')
    },
    save: (_path: string) => {},
  } as unknown as OpenXmlPackageEditor
}
