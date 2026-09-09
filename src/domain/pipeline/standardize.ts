import { coerceCellToString } from '../clean'
import { parseMoney, roundToIntegerHalfEven, type Money } from '../money'
import { parseDateCell } from '../parseDate'
import type { ColumnMapping, DroppedLine, NormalizedEntry, RowErrorCode, StandardizeResult } from '../types'

function cellAt(row: readonly unknown[], idx: number | null): unknown {
  if (idx == null || idx < 0 || idx >= row.length) return null
  return row[idx] ?? null
}

/** Text.Trim của M: cắt đầu/cuối (giữ khoảng trắng bên trong — tái hiện y hệt). */
export function pqTrim(s: string): string {
  return s.replace(/^[\s\u00A0\u2007\u202F]+|[\s\u00A0\u2007\u202F]+$/g, '')
}

/** Bước A — thay pqNKC_Truoc/Sau_ChuanHoa:
 * 1. Lỗi ô → null (coerceCellToString trả '' cho {error}).
 * 2. fnNgayAnToan: date/serial/dd-MM/yyyy; lỗi → giữ text gốc + cờ LoiNgay.
 * 3. BoRong: loại Số tiền null/0 (đếm + ghi danh sách dropped).
 * 4. SốCT/Diễn giải → UPPER(TRIM); TK Nợ/Có → TRIM; Số tiền → Number.Round nguyên.
 * 5. Khóa dò dựng ở buildKey theo công thức M. */
export function standardizeSource(input: {
  rows: readonly (readonly unknown[])[]
  firstDataRowIndex: number
  mapping: ColumnMapping
}): StandardizeResult {
  const { rows, firstDataRowIndex, mapping } = input
  const entries: NormalizedEntry[] = []
  const dropped: DroppedLine[] = []
  let blankRows = 0

  for (let i = firstDataRowIndex; i < rows.length; i++) {
    const row = rows[i] ?? []
    const dateRaw = cellAt(row, mapping.date)
    const voucherRaw = pqTrim(coerceCellToString(cellAt(row, mapping.voucher)))
    const descRaw = pqTrim(coerceCellToString(cellAt(row, mapping.description)))
    const debitRaw = cellAt(row, mapping.debit)
    const creditRaw = cellAt(row, mapping.credit)
    const amountRaw = cellAt(row, mapping.amount)

    const isEmptyCell = (x: unknown) => coerceCellToString(x).trim() === ''
    const allEmpty =
      isEmptyCell(dateRaw) && voucherRaw === '' && descRaw === '' && isEmptyCell(debitRaw) && isEmptyCell(creditRaw) && isEmptyCell(amountRaw)
    if (allEmpty) {
      blankRows++
      continue
    }

    // BoRong: SelectRows [Số tiền] <> null and <> 0
    const amountParsed = parseMoney(amountRaw)
    if (amountParsed == null || amountParsed.raw === 0n) {
      dropped.push({
        rowIndex: i + 1,
        reason: amountRaw == null || isEmptyCell(amountRaw) ? 'Số tiền trống' : `Số tiền bằng 0 hoặc lỗi (${pqTrim(coerceCellToString(amountRaw))})`,
      })
      continue
    }
    const amount: Money = roundToIntegerHalfEven(amountParsed)

    const errors: RowErrorCode[] = []
    const parsedDate = parseDateCell(dateRaw)
    const rawDateText = pqTrim(coerceCellToString(dateRaw))
    if (mapping.date != null && rawDateText !== '' && (parsedDate == null || parsedDate.iso == null)) {
      errors.push('LOI_NGAY')
    }
    if (mapping.debit != null && pqTrim(coerceCellToString(debitRaw)) === '') errors.push('THIEU_TK_NO')
    if (mapping.credit != null && pqTrim(coerceCellToString(creditRaw)) === '') errors.push('THIEU_TK_CO')

    entries.push({
      rowIndex: i + 1,
      displayDate: parsedDate?.display ?? rawDateText,
      dateISO: parsedDate?.iso ?? null,
      rawDateText,
      voucher: voucherRaw.toUpperCase(),
      description: descRaw.toUpperCase(),
      debit: pqTrim(coerceCellToString(debitRaw)),
      credit: pqTrim(coerceCellToString(creditRaw)),
      amount,
      errors,
    })
  }

  const errorRows = entries.reduce((acc, e) => acc + (e.errors.length > 0 ? 1 : 0), 0)
  return {
    entries,
    stats: { dataRows: entries.length, blankRows, zeroOrBadAmountRows: dropped.length, errorRows },
    dropped,
  }
}
