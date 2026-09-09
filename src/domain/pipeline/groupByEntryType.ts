import { GROUP_ABS_THRESHOLD } from '../constants'
import { moneyFromJSON, moneyToJSON, parseMoney, subtractMoney, sumMoney, type Money } from '../money'
import type { DiffRow, EntryTypeGroup, EntryTypeSummary } from '../types'

function left4(account: string): string {
  return account.slice(0, 4)
}

interface RuleDef {
  id: number
  name: string
  codes: readonly string[]
  prefixDigit?: string
}

const RULES: readonly RuleDef[] = [
  { id: 1, name: 'Tiền', codes: ['111', '112', '113'] },
  { id: 2, name: 'Đầu tư tài chính', codes: ['121', '128', '228'] },
  { id: 3, name: 'Phải thu', codes: ['131', '136', '138'] },
  { id: 4, name: 'Hàng tồn kho', codes: ['151', '152', '153', '154', '155', '156', '157', '158'] },
  { id: 5, name: 'TSCĐ & trả trước', codes: ['211', '212', '213', '214', '217', '241', '242'] },
  { id: 6, name: 'Lương & nhân sự', codes: ['334', '335', '338'] },
  { id: 7, name: 'Thuế', codes: ['333', '133', '821'] },
  { id: 8, name: 'Phải trả/NCC', codes: ['331'] },
  { id: 9, name: 'Vốn chủ sở hữu', codes: ['411', '421'] },
  { id: 10, name: 'Doanh thu & thu nhập', codes: ['711'], prefixDigit: '5' },
  { id: 11, name: 'Chi phí & giá vốn', codes: ['811'], prefixDigit: '6' },
]

export function phanHanhLabel(id: number, name: string): string {
  return `${String(id).padStart(2, '0')} - ${name}`
}

/** Phân loại phần hành TT200 theo 3 số đầu của TK Nợ hoặc TK Có — ưu tiên thứ tự quy tắc 01→12. */
export function classifyPhanHanh(debit: string, credit: string): { id: number; name: string } {
  for (const rule of RULES) {
    for (const acc of [debit, credit]) {
      if (rule.codes.some((c) => acc.startsWith(c))) return { id: rule.id, name: rule.name }
      if (rule.prefixDigit != null && acc.startsWith(rule.prefixDigit)) return { id: rule.id, name: rule.name }
    }
  }
  return { id: 12, name: 'Khác' }
}

const NOTE_BY_PHAN_HANH: Record<number, string> = {
  4: 'Rà soát tồn kho',
  5: 'Rà soát TSCĐ/CPTT',
  6: 'Rà soát lương',
  7: 'Rà soát thuế',
  8: 'Rà soát NCC',
}
const FALLBACK = 'Rà soát nghiệp vụ'

function sourceLabel(kind: DiffRow['kind']): string {
  if (kind === 'ADDED_AFTER') return 'Thêm sau ĐC'
  if (kind === 'REMOVED_AFTER') return 'Xóa sau ĐC'
  return 'Đổi số tiền'
}

function absAligned(m: Money): bigint {
  const raw = m.raw < 0n ? -m.raw : m.raw
  return raw * 10n ** BigInt(18 - Math.min(m.scale, 18))
}

function sign(m: Money): number {
  return m.raw < 0n ? -1 : m.raw > 0n ? 1 : 0
}

/** Màn hình "Tổng hợp theo loại bút toán" — tái hiện sheet Tong hop loai but toan:
 * - Gom LEFT4(TK Nợ)|LEFT4(TK Có) từ CHI TIẾT SAU LỌC, gộp mọi Nguồn vào một dòng.
 * - Chỉ giữ nhóm |Chênh lệch| > 0.5.
 * - Nhận xét theo thứ tự: Chuyển TK hạch toán → Đổi số tiền → Bù trừ/đảo bút toán →
 *   Ghi bổ sung / Hủy/xóa bút toán → theo phần hành.
 * - Sort: phần hành ↑ → PairKey → TK Nợ → TK Có → |Chênh lệch| ↓. */
export function buildEntryTypeGroups(rows: readonly DiffRow[]): {
  groups: EntryTypeGroup[]
  summary: EntryTypeSummary
} {
  interface Accumulator {
    key: string
    sources: Set<string>
    detailCount: number
    vouchers: Set<string>
    repVoucher: string
    repDescription: string
    debitGrouped: string
    creditGrouped: string
    sumAfter: Money
    sumBefore: Money
  }

  const acc = new Map<string, Accumulator>()

  for (const row of rows) {
    const key = `${left4(row.debit)}|${left4(row.credit)}`
    let g = acc.get(key)
    if (!g) {
      g = {
        key,
        sources: new Set<string>(),
        detailCount: 0,
        vouchers: new Set<string>(),
        repVoucher: row.voucher,
        repDescription: row.description,
        debitGrouped: left4(row.debit),
        creditGrouped: left4(row.credit),
        sumAfter: sumMoney([]),
        sumBefore: sumMoney([]),
      }
      acc.set(key, g)
    }
    g.sources.add(sourceLabel(row.kind))
    g.detailCount++
    g.vouchers.add(row.voucher)
    g.sumAfter = sumMoney([g.sumAfter, moneyFromJSON(row.amountAfter)])
    g.sumBefore = sumMoney([g.sumBefore, moneyFromJSON(row.amountBefore)])
  }

  // PairKey = UPPER(TRIM(SốCT đại diện | Diễn giải đại diện)); sign theo từng nhóm
  const pairKeyOf = new Map<string, string>()
  const signOf = new Map<string, number>()
  for (const [key, g] of acc) {
    const diff = subtractMoney(g.sumAfter, g.sumBefore)
    signOf.set(key, sign(diff))
    const pk = `${g.repVoucher}|${g.repDescription}`.toUpperCase().trim()
    pairKeyOf.set(key, pk)
  }

  // Nhận xét #1: tồn tại NHÓM KHÁC có cùng PairKey nhưng đối dấu
  function hasOppositeSignTwin(pk: string, ownKey: string): boolean {
    const ownSign = signOf.get(ownKey)
    if (ownSign == null || ownSign === 0) return false
    for (const [key, otherPk] of pairKeyOf) {
      if (key === ownKey || otherPk !== pk) continue
      const s = signOf.get(key)
      if (s != null && s !== 0 && s !== ownSign) return true
    }
    return false
  }

  const threshold = parseMoney(GROUP_ABS_THRESHOLD) ?? sumMoney([])
  const out: EntryTypeGroup[] = []

  for (const g of acc.values()) {
    const diff = subtractMoney(g.sumAfter, g.sumBefore)
    if (absAligned(diff) <= absAligned(threshold)) continue

    const pk = pairKeyOf.get(g.key) ?? ''
    const phanHanh = classifyPhanHanh(g.debitGrouped, g.creditGrouped)

    let note: string
    if (hasOppositeSignTwin(pk, g.key)) note = 'Chuyển TK hạch toán'
    else if (g.sources.has('Đổi số tiền')) note = 'Đổi số tiền'
    else if (g.sources.has('Thêm sau ĐC') && g.sources.has('Xóa sau ĐC')) note = 'Bù trừ/đảo bút toán'
    else if (g.sources.has('Thêm sau ĐC')) note = 'Ghi bổ sung'
    else if (g.sources.has('Xóa sau ĐC')) note = 'Hủy/xóa bút toán'
    else note = NOTE_BY_PHAN_HANH[phanHanh.id] ?? FALLBACK

    out.push({
      stt: 0,
      key: g.key,
      pairKey: pk,
      sources: [...g.sources],
      detailCount: g.detailCount,
      distinctVoucherCount: g.vouchers.size,
      repVoucher: g.repVoucher,
      repDescription: g.repDescription,
      debitGrouped: g.debitGrouped,
      creditGrouped: g.creditGrouped,
      sumAfter: moneyToJSON(g.sumAfter),
      sumBefore: moneyToJSON(g.sumBefore),
      sumDifference: moneyToJSON(diff),
      phanHanhId: phanHanh.id,
      phanHanhName: phanHanh.name,
      note,
    })
  }

  out.sort((a, b) => {
    if (a.phanHanhId !== b.phanHanhId) return a.phanHanhId - b.phanHanhId
    if (a.pairKey !== b.pairKey) return a.pairKey < b.pairKey ? -1 : 1
    if (a.debitGrouped !== b.debitGrouped) return a.debitGrouped < b.debitGrouped ? -1 : 1
    if (a.creditGrouped !== b.creditGrouped) return a.creditGrouped < b.creditGrouped ? -1 : 1
    return absAligned(moneyFromJSON(b.sumDifference)) > absAligned(moneyFromJSON(a.sumDifference)) ? 1 : -1
  })
  out.forEach((r, i) => {
    r.stt = i + 1
  })

  const totalAfter = sumMoney(out.map((x) => moneyFromJSON(x.sumAfter)))
  const totalBefore = sumMoney(out.map((x) => moneyFromJSON(x.sumBefore)))

  return {
    groups: out,
    summary: {
      filteredLineCount: rows.length,
      groupCount: out.length,
      collapsedLines: rows.length - out.length,
      totalAfter: moneyToJSON(totalAfter),
      totalBefore: moneyToJSON(totalBefore),
      totalDifference: moneyToJSON(subtractMoney(totalAfter, totalBefore)),
    },
  }
}
