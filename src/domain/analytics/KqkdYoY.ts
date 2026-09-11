import { moneyToNumber } from '../money'
import { TK_GIA_VON } from '../bctc/catalog'
import type { IncomeStatementData, JournalEntry } from '../../shared/types/analytics'
import type { KqkdYoYRow } from './types'

interface BaseDef {
  maSo: string
  chiTieu: string
  prefixes: string[]
  side: 'debit' | 'credit'
}

const BASE_DEFS: BaseDef[] = [
  { maSo: '01', chiTieu: 'Doanh thu bán hàng và cung cấp dịch vụ', prefixes: ['511'], side: 'credit' },
  { maSo: '02', chiTieu: 'Các khoản giảm trừ doanh thu', prefixes: ['521'], side: 'debit' },
  { maSo: '11', chiTieu: 'Giá vốn hàng bán', prefixes: [...TK_GIA_VON], side: 'debit' },
  { maSo: '25', chiTieu: 'Chi phí bán hàng', prefixes: ['641'], side: 'debit' },
  { maSo: '26', chiTieu: 'Chi phí quản lý doanh nghiệp', prefixes: ['642'], side: 'debit' },
  { maSo: '30', chiTieu: 'Doanh thu hoạt động tài chính', prefixes: ['515'], side: 'credit' },
  { maSo: '31', chiTieu: 'Chi phí tài chính', prefixes: ['635'], side: 'debit' },
  { maSo: '40', chiTieu: 'Chi phí khác', prefixes: ['811'], side: 'debit' },
  { maSo: '51', chiTieu: 'Thu nhập khác', prefixes: ['711'], side: 'credit' },
]

function sub(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null) return null
  return a - b
}

const DERIVED: Array<{ maSo: string; chiTieu: string; compute: (m: Map<string, number | null>) => number | null }> = [
  { maSo: '10', chiTieu: 'Doanh thu thuần', compute: (m) => sub(m.get('01'), m.get('02')) },
  { maSo: '60', chiTieu: 'Lợi nhuận gộp', compute: (m) => sub(m.get('10'), m.get('11')) },
  {
    maSo: '70',
    chiTieu: 'Lợi nhuận thuần từ hoạt động kinh doanh',
    compute: (m) => {
      const parts = [m.get('60'), m.get('30'), m.get('31'), m.get('25'), m.get('26')]
      if (parts.some((v) => v == null)) return null
      const [g, f1, f2, s, a] = parts as number[]
      return (g ?? 0) + (f1 ?? 0) - (f2 ?? 0) - (s ?? 0) - (a ?? 0)
    },
  },
]

const DISPLAY_ORDER = ['01', '02', '10', '11', '60', '30', '31', '25', '26', '70', '51', '40']

/**
 * Dựng dòng KQKD năm nay vs năm trước.
 * Ưu tiên số B02 (income); mã nào thiếu thì cộng dồn NKC theo map TK.
 * prior/diff/pct = null khi thiếu số năm trước (UI hiện '-').
 */
export function buildKqkdYoY(
  income: IncomeStatementData | null,
  entries: JournalEntry[],
): { rows: KqkdYoYRow[]; fromB02: boolean } {
  const b02 = new Map<string, { current: number | null; prior: number | null }>()
  if (income) {
    for (const l of income.lines) {
      b02.set(l.maSo, {
        current: l.current ? moneyToNumber(l.current) : null,
        prior: l.prior ? moneyToNumber(l.prior) : null,
      })
    }
  }

  const debitSums = new Map<string, number>()
  const creditSums = new Map<string, number>()
  for (const e of entries) {
    const v = moneyToNumber(e.amount)
    debitSums.set(e.debitAccount, (debitSums.get(e.debitAccount) ?? 0) + v)
    creditSums.set(e.creditAccount, (creditSums.get(e.creditAccount) ?? 0) + v)
  }
  const pickSum = (def: BaseDef): number => {
    const sums = def.side === 'debit' ? debitSums : creditSums
    let total = 0
    for (const [acc, val] of sums) {
      if (def.prefixes.some((p) => acc.startsWith(p))) total += val
    }
    return total
  }

  const cur = new Map<string, number | null>()
  const pri = new Map<string, number | null>()
  let fromB02 = false
  const hasNkc = entries.length > 0

  for (const def of BASE_DEFS) {
    const b = b02.get(def.maSo)
    if (b?.current != null) {
      cur.set(def.maSo, b.current)
      fromB02 = true
    } else {
      cur.set(def.maSo, hasNkc ? pickSum(def) : null)
    }
    if (b?.prior != null) {
      pri.set(def.maSo, b.prior)
      fromB02 = true
    } else {
      pri.set(def.maSo, null)
    }
  }

  for (const def of DERIVED) {
    const b = b02.get(def.maSo)
    cur.set(def.maSo, b?.current ?? def.compute(cur))
    pri.set(def.maSo, b?.prior ?? def.compute(pri))
    if (b?.current != null || b?.prior != null) fromB02 = true
  }

  const names = new Map<string, string>([
    ...BASE_DEFS.map((d): [string, string] => [d.maSo, d.chiTieu]),
    ...DERIVED.map((d): [string, string] => [d.maSo, d.chiTieu]),
  ])
  const rows: KqkdYoYRow[] = []
  for (const maSo of DISPLAY_ORDER) {
    const c = cur.get(maSo)
    const p = pri.get(maSo)
    if ((c == null || c === 0) && (p == null || p === 0) && !b02.has(maSo)) continue
    const diff = c != null && p != null ? c - p : null
    const pct = diff != null && p !== 0 && p != null ? Number(((diff / p) * 100).toFixed(1)) : null
    rows.push({ maSo, chiTieu: names.get(maSo) ?? maSo, current: c ?? 0, prior: p ?? null, diff, pct })
  }
  return { rows, fromB02 }
}
