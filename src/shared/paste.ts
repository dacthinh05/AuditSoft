import { coerceCellToString } from '../domain/clean'
import type { ColumnMapping } from '../domain/types'

export interface ParsedPaste {
  matrix: unknown[][]
  headerRowIndex: number
}

/** Parse TSV/CSV dán từ clipboard Excel (phân tách tab, hỗ trợ nhiều dòng). */
export function parseClipboardTable(text: string): ParsedPaste {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim() !== '')
  const matrix = lines.map((line) => line.split('\t'))
  // Ô số dạng text giữ nguyên chuỗi; ô trống → null để chuẩn hóa xử lý đồng nhất
  const cleaned: unknown[][] = matrix.map((row) =>
    row.map((cell) => {
      const t = cell.trim()
      return t === '' ? null : t
    }),
  )
  return { matrix: cleaned, headerRowIndex: guessHeaderRow(cleaned) }
}

function guessHeaderRow(matrix: unknown[][]): number {
  const roles: Record<keyof ColumnMapping, string[]> = {
    date: ['NGAY'],
    voucher: ['SO CHUNG TU', 'SO CT', 'CHUNG TU', 'SOCT'],
    description: ['DIEN GIAI', 'NOI DUNG', 'LY DO'],
    debit: ['TK NO', 'TAI KHOAN NO', 'NO'],
    credit: ['TK CO', 'TAI KHOAN CO', 'CO'],
    amount: ['SO TIEN', 'SO PHAT SINH', 'GIA TRI', 'THANH TIEN'],
  }
  const limit = Math.min(matrix.length, 5)
  for (let r = 0; r < limit; r++) {
    const cells = (matrix[r] ?? []).map((c) => coerceCellToString(c))
    let hits = 0
    for (const syns of Object.values(roles)) {
      if (cells.some((c) => {
        const n = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').toUpperCase().trim()
        return syns.includes(n)
      })) hits++
    }
    if (hits >= 3) return r
  }
  return -1
}
