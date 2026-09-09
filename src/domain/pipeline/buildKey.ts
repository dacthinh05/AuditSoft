import type { NormalizedEntry } from '../types'

const KEY_SEPARATOR = '\u00A6'

export interface BuildKeyOptions {
  ignoreDescription?: boolean
  accountLevel?: 'exact' | 'level1'
}

/** Khóa dò:
 * (if Ngày=null then UPPER(TRIM(Text.From(Ngay_Goc ?? ""))) else yyyyMMdd)
 * & "¦" & SốCT(đã UPPER/TRIM) & [DiễnGiải] & "¦" & TKNợ & "¦" & TKCó */
export function buildKey(entry: NormalizedEntry, options: BuildKeyOptions = {}): string {
  const datePart = entry.dateISO ? entry.dateISO.replaceAll('-', '') : entry.rawDateText.toUpperCase()
  const debit = options.accountLevel === 'level1' ? (entry.debit.replace(/[^0-9]/g, '').slice(0, 3) || entry.debit) : entry.debit
  const credit = options.accountLevel === 'level1' ? (entry.credit.replace(/[^0-9]/g, '').slice(0, 3) || entry.credit) : entry.credit

  if (options.ignoreDescription) {
    return [datePart, entry.voucher, debit, credit].join(KEY_SEPARATOR)
  }
  return [datePart, entry.voucher, entry.description, debit, credit].join(KEY_SEPARATOR)
}
export { KEY_SEPARATOR }
