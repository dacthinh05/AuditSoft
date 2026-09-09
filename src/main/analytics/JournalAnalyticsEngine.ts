import { addMoney, type Money } from '../../domain/money'
import { MONEY_ZERO } from '../../domain/money'
import { normalizeKeyword } from '../../shared/utils/text'
import type { AccountStats, DuplicateGroups, JournalEntry, PairStats, RareCounterResult, RoundNumberResult, WeekendResult, YearEndWindowResult } from '../../shared/types/analytics'
import { isAccount } from '../accounting/AccountClassifier'

/** Thống kê theo TK nguyên bản (Map-based, O(n)). */
export function computeAccountStats(entries: readonly JournalEntry[]): Map<string, AccountStats> {
  const map = new Map<string, AccountStats>()
  const touch = (acc: string): AccountStats => {
    let s = map.get(acc)
    if (!s) {
      s = { account: acc, debitTurnover: MONEY_ZERO, creditTurnover: MONEY_ZERO, count: 0, firstDate: null, lastDate: null }
      map.set(acc, s)
    }
    return s
  }
  for (const e of entries) {
    if (e.debitAccount) {
      const s = touch(e.debitAccount)
      s.debitTurnover = addMoney(s.debitTurnover, e.amount)
      s.count++
      trackDate(s, e.postingDate)
    }
    if (e.creditAccount) {
      const s = touch(e.creditAccount)
      s.creditTurnover = addMoney(s.creditTurnover, e.amount)
      if (e.creditAccount !== e.debitAccount) s.count++
      trackDate(s, e.postingDate)
    }
  }
  return map
}

function trackDate(s: { firstDate: string | null; lastDate: string | null }, iso: string | null): void {
  if (!iso) return
  if (!s.firstDate || iso < s.firstDate) s.firstDate = iso
  if (!s.lastDate || iso > s.lastDate) s.lastDate = iso
}

const pairKey = (d: string, c: string) => `${d}>${c}`

/** Ma trận cặp đối ứng theo TK cấp 1 (LEFT3) — §25. */
export function computePairStats(entries: readonly JournalEntry[]): Map<string, PairStats> {
  const map = new Map<string, PairStats>()
  for (const e of entries) {
    const d = e.debitAccount.slice(0, 3)
    const c = e.creditAccount.slice(0, 3)
    if (!d || !c) continue
    const key = pairKey(d, c)
    let p = map.get(key)
    if (!p) {
      p = { debit: d, credit: c, count: 0, total: MONEY_ZERO, firstDate: null, lastDate: null }
      map.set(key, p)
    }
    p.count++
    p.total = addMoney(p.total, e.amount)
    if (e.postingDate && (!p.firstDate || e.postingDate < p.firstDate)) p.firstDate = e.postingDate
    if (e.postingDate && (!p.lastDate || e.postingDate > p.lastDate)) p.lastDate = e.postingDate
  }
  return map
}

/** Trùng lặp exact (ngày+sốCT+N+C+tiền) và near-dup (ngày+N+C+tiền, khác số CT). */
export function detectDuplicates(entries: readonly JournalEntry[]): DuplicateGroups {
  const exactMap = new Map<string, JournalEntry[]>()
  const nearMap = new Map<string, JournalEntry[]>()
  for (const e of entries) {
    if (!e.postingDate || e.amount.raw === 0n) continue
    const exKey = `${e.postingDate}|${e.documentNumber ?? ''}|${e.debitAccount}|${e.creditAccount}|${e.amount.raw}`
    push(exactMap, exKey, e)
    if (e.documentNumber != null) {
      const nKey = `${e.postingDate}|${e.debitAccount}|${e.creditAccount}|${e.amount.raw}`
      push(nearMap, nKey, e)
    }
  }
  const exact: DuplicateGroups['exact'] = []
  for (const [key, list] of exactMap) {
    if (list.length > 1) exact.push({ key, ids: list.map((x) => x.id), totalAmount: sumOf(list) })
  }
  // near-dup chỉ giữ khi số CT khác nhau thật sự
  const near: DuplicateGroups['nearDuplicate'] = []
  for (const [key, list] of nearMap) {
    const docs = new Set(list.map((x) => x.documentNumber))
    if (list.length > 1 && docs.size > 1) near.push({ key, ids: list.map((x) => x.id), totalAmount: sumOf(list) })
  }
  return { exact, nearDuplicate: near }
}

function push(map: Map<string, JournalEntry[]>, key: string, e: JournalEntry): void {
  const arr = map.get(key)
  if (arr) arr.push(e)
  else map.set(key, [e])
}

function sumOf(list: readonly JournalEntry[]): Money {
  return list.reduce((acc, e) => addMoney(acc, e.amount), MONEY_ZERO)
}

/** Bút toán tròn số: amount chia hết divisor và ≥ minAmount. */
export function detectRoundNumbers(entries: readonly JournalEntry[], divisor: bigint, minAmount: Money): RoundNumberResult {
  const ids: string[] = []
  let total = MONEY_ZERO
  for (const e of entries) {
    if (e.amount.raw < minAmount.raw) continue
    if (divisor > 0n && e.amount.raw % divisor === 0n && e.amount.raw !== 0n) {
      ids.push(e.id)
      total = addMoney(total, e.amount)
    }
  }
  return { ids, count: ids.length, total }
}

/** Bút toán cuối tuần + tỷ lệ chung của DN (để tránh flag khi DN chạy 7 ngày). */
export function detectWeekendEntries(entries: readonly JournalEntry[], dateFn: (iso: string) => Date): WeekendResult {
  let weekend = 0
  const ids: string[] = []
  let dated = 0
  for (const e of entries) {
    if (!e.postingDate) continue
    dated++
    const dow = dateFn(e.postingDate).getUTCDay()
    if (dow === 0 || dow === 6) {
      weekend++
      ids.push(e.id)
    }
  }
  return { ids, share: dated === 0 ? 0 : weekend / dated, total: weekend }
}

const MANUAL_KEYWORDS = [
  'DIEU CHINH', 'DIEU CHINH CUOI NAM', 'BUT TOAN KHAC', 'KET CHUYEN', 'PHAN BO',
  'TRICH TRUOC', 'HOAN NHAP', 'CORRECTION', 'ADJUSTMENT', 'MANUAL', 'RECLASS',
]

/** Bút toán thủ công theo keyword diễn giải (không kết luận — chỉ flag để review). */
export function detectManualKeywordEntries(entries: readonly JournalEntry[]): string[] {
  const ids: string[] = []
  for (const e of entries) {
    const t = normalizeKeyword(e.description)
    if (MANUAL_KEYWORDS.some((k) => t.includes(k))) ids.push(e.id)
  }
  return ids
}

/** Bút toán trong cửa sổ cuối kỳ chạm nhóm ưu tiên (§15.2). */
export function detectYearEndWindow(
  entries: readonly JournalEntry[],
  fiscalYearEndMMDD: string,
  windowDays: number,
  year: number,
): YearEndWindowResult {
  const end = parseIso(`${year}-${fiscalYearEndMMDD}`)
  if (!end) return { ids: [], total: MONEY_ZERO, byPriorityAccounts: false }
  const startMs = end.getTime() - (windowDays - 1) * 86400000
  const priority = ['511', '521', '632', '641', '642', '635', '811', '131', '331', '151', '152', '153', '154', '155', '156', '157', '711']
  const ids: string[] = []
  let total = MONEY_ZERO
  let hitPriority = false
  for (const e of entries) {
    if (!e.postingDate) continue
    const d = parseIso(e.postingDate)
    if (!d) continue
    const t = d.getTime()
    if (t < startMs || t > end.getTime() + 86399000) continue
    ids.push(e.id)
    total = addMoney(total, e.amount)
    if ([e.debitAccount, e.creditAccount].some((a) => priority.some((p) => isAccount(a, p)))) hitPriority = true
  }
  return { ids, total, byPriorityAccounts: hitPriority }
}

function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

/**
 * Cặp đối ứng hiếm: học frequency chính doanh nghiệp này — pair xuất hiện ít,
 * chiếm tỷ trọng thấp của cả hai TK, nhưng tổng tiền material.
 */
export function detectRareCounterAccounts(
  pairStats: ReadonlyMap<string, PairStats>,
  accountStats: ReadonlyMap<string, AccountStats>,
  opts: { maxCount: number; maxShare: number; minTotal: Money },
): RareCounterResult {
  const pairs: RareCounterResult['pairs'] = []
  for (const p of pairStats.values()) {
    if (p.count > opts.maxCount) continue
    if (p.total.raw < opts.minTotal.raw) continue
    const dStat = accountStats.get(p.debit)
    const cStat = accountStats.get(p.credit)
    const dShare = dStat && dStat.count > 0 ? p.count / dStat.count : 0
    const cShare = cStat && cStat.count > 0 ? p.count / cStat.count : 0
    if (Math.max(dShare, cShare) <= opts.maxShare) {
      pairs.push({ debit: p.debit, credit: p.credit, count: p.count, total: p.total })
    }
  }
  pairs.sort((a, b) => b.total.raw > a.total.raw ? 1 : -1)
  return { pairs }
}
