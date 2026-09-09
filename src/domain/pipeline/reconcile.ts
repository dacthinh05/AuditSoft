import { DIFF_META } from '../constants'
import { addMoney, moneyToJSON, MONEY_ZERO, subtractMoney, type Money } from '../money'
import type { DiffKind, DiffRow, NormalizedEntry } from '../types'
import { buildKey, type BuildKeyOptions } from './buildKey'

export type ReconcileMatchOptions = BuildKeyOptions

interface GroupedSide {
  key: string
  /** List.Max ngày (ISO lớn nhất) trong nhóm */
  dateISO: string | null
  voucher: string
  description: string
  debit: string
  credit: string
  total: Money
  loiNgayTexts: string[]
}

function maxStr(a: string, b: string): string {
  return a > b ? a : b
}

/** Group theo Khóa dò — đại diện = List.Max từng trường văn bản, Ngày = Max, tiền = Sum. */
export function groupEntries(
  entries: readonly NormalizedEntry[],
  options: ReconcileMatchOptions = {},
): Map<string, GroupedSide> {
  const map = new Map<string, GroupedSide>()
  for (const e of entries) {
    const key = buildKey(e, options)
    const amount = e.amount ?? MONEY_ZERO
    const existing = map.get(key)
    if (existing) {
      existing.total = addMoney(existing.total, amount)
      existing.voucher = maxStr(existing.voucher, e.voucher)
      existing.description = maxStr(existing.description, e.description)
      existing.debit = maxStr(existing.debit, e.debit)
      existing.credit = maxStr(existing.credit, e.credit)
      if (e.dateISO && (!existing.dateISO || e.dateISO > existing.dateISO)) existing.dateISO = e.dateISO
      if (existing.loiNgayTexts.at(-1) !== rawLoiNgay(e)) existing.loiNgayTexts.push(rawLoiNgay(e))
    } else {
      map.set(key, {
        key,
        dateISO: e.dateISO,
        voucher: e.voucher,
        description: e.description,
        debit: e.debit,
        credit: e.credit,
        total: amount,
        loiNgayTexts: rawLoiNgay(e) === '' ? [] : [rawLoiNgay(e)],
      })
    }
  }
  return map
}

function rawLoiNgay(e: NormalizedEntry): string {
  // LoiNgay của PQ = text gốc khi parse lỗi; tái hiện qua displayDate khi dateISO=null
  return e.dateISO == null && e.rawDateText !== '' ? e.rawDateText : ''
}

function isAbsGreaterThanMilli(m: Money): boolean {
  const absRaw = m.raw < 0n ? -m.raw : m.raw
  return absRaw * 1000n > 10n ** BigInt(m.scale)
}

/** Bước B — Full outer join Trước↔Sau theo Khóa dò; chỉ giữ |Chênh lệch| > 0.001.
 *  Nguồn xác định THEO GIÁ TRỊ như M: Trước=0 → "Thêm sau ĐC"; Sau=0 → "Xóa sau ĐC"; else "Đổi số tiền". */
export function reconcileSources(
  beforeEntries: readonly NormalizedEntry[],
  afterEntries: readonly NormalizedEntry[],
  options: ReconcileMatchOptions = {},
): { rows: DiffRow[]; matchedEqualCount: number } {
  const afterMap = groupEntries(afterEntries, options)
  const beforeMap = groupEntries(beforeEntries, options)

  const keys = new Set<string>()
  for (const k of beforeMap.keys()) keys.add(k)
  for (const k of afterMap.keys()) keys.add(k)

  let matchedEqualCount = 0
  const rows: DiffRow[] = []

  for (const key of keys) {
    const a = afterMap.get(key)
    const b = beforeMap.get(key)
    const sauTotal = a?.total ?? MONEY_ZERO
    const truocTotal = b?.total ?? MONEY_ZERO
    const lech = subtractMoney(sauTotal, truocTotal)

    if (!isAbsGreaterThanMilli(lech)) {
      matchedEqualCount++
      continue
    }

    let kind: DiffKind
    if (truocTotal.raw === 0n) kind = 'ADDED_AFTER'
    else if (sauTotal.raw === 0n) kind = 'REMOVED_AFTER'
    else kind = 'AMOUNT_CHANGED'

    const repDate = a?.dateISO ?? b?.dateISO ?? null
    const repVoucher = a?.voucher ?? b?.voucher ?? ''
    const repDescription = a?.description ?? b?.description ?? ''
    const repDebit = a?.debit ?? b?.debit ?? ''
    const repCredit = a?.credit ?? b?.credit ?? ''
    const loiNgayText = a?.loiNgayTexts.join(' | ') || b?.loiNgayTexts.join(' | ') || ''
    const meta = DIFF_META[kind]

    rows.push({
      stt: 0,
      kind,
      key,
      dateISO: repDate,
      dateDisplay: repDate ?? '',
      loiNgay: loiNgayText !== '',
      loiNgayText,
      voucher: repVoucher,
      description: repDescription,
      debit: repDebit,
      credit: repCredit,
      amountAfter: moneyToJSON(sauTotal),
      amountBefore: moneyToJSON(truocTotal),
      difference: moneyToJSON(lech),
      note: meta.nhanXet,
      priority: meta.uuTien,
    })
  }

  // Table.Sort {{"Ngày chứng từ", Asc},{"Số chứng từ", Asc}} — null/invalid xuống cuối
  rows.sort((x, y) => {
    const dx = x.dateISO ?? '9999-12-31'
    const dy = y.dateISO ?? '9999-12-31'
    if (dx !== dy) return dx < dy ? -1 : 1
    if (x.voucher !== y.voucher) return x.voucher < y.voucher ? -1 : 1
    return x.key < y.key ? -1 : x.key > y.key ? 1 : 0
  })
  rows.forEach((r, i) => {
    r.stt = i + 1
  })

  return { rows, matchedEqualCount }
}
