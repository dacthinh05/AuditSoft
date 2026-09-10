import type { DiffRow } from '../types'
import { moneyFromJSON } from '../money'

export type AmountTierKey = 'LOW' | 'MEDIUM' | 'HIGH' | 'KEY_ITEM'

export interface AmountTierBucket {
  key: AmountTierKey
  label: string
  subLabel: string
  minAmount: bigint
  maxAmount: bigint | null
  count: number
  totalAmount: bigint
  percentOfTotal: number
}

export interface MonthlyBucket {
  month: number // 1..12
  label: string // "T01", "T02", ... "T12"
  count: number
  totalAmount: bigint
  diffCount: number
  totalDiffAmount: bigint
}

export interface CutoffStats {
  count31Dec: number
  totalAmount31Dec: bigint
  countWeekend: number
  totalAmountWeekend: bigint
}

export interface AccountPairStat {
  debit: string
  credit: string
  pairKey: string
  count: number
  totalAmount: bigint
}

export interface DataQualityStats {
  totalRows: number
  addedCount: number
  removedCount: number
  changedCount: number
  roundAmountCount: number // nghiệp vụ số tiền tròn chục triệu/trăm triệu
}

export interface ProfileSummary {
  quality: DataQualityStats
  monthly: MonthlyBucket[]
  cutoff: CutoffStats
  tiers: AmountTierBucket[]
  topPairs: AccountPairStat[]
  maxMonthlyAmount: bigint
  maxMonthlyCount: number
  totalProfiledAmount: bigint
}

// Ngưỡng phân tầng kiểm toán mặc định (VND)
// T1: Dưới 50tr
// T2: 50tr - 500tr
// T3: 500tr - 2 tỷ
// T4: Trên 2 tỷ (Key Items)
export const TIER_THRESHOLDS = {
  LOW_MAX: 50_000_000n,
  MED_MAX: 500_000_000n,
  HIGH_MAX: 2_000_000_000n,
}

/**
 * Trích xuất tháng (1-12) và ngày từ dateISO hoặc dateDisplay
 */
export function extractMonthAndDay(dateISO: string | null, dateDisplay?: string): { month: number | null; day: number | null; isWeekend: boolean } {
  if (dateISO) {
    // format YYYY-MM-DD
    const parts = dateISO.split('-')
    if (parts.length >= 3) {
      const m = parseInt(parts[1] || '', 10)
      const d = parseInt(parts[2] || '', 10)
      if (m >= 1 && m <= 12) {
        // Kiểm tra cuối tuần (Thứ 7 = 6, CN = 0)
        let isWeekend = false
        try {
          const dt = new Date(dateISO)
          const dayOfWeek = dt.getDay()
          isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        } catch {
          // ignore
        }
        return { month: m, day: d, isWeekend }
      }
    }
  }

  if (dateDisplay) {
    // format DD/MM/YYYY
    const parts = dateDisplay.split('/')
    if (parts.length >= 2) {
      const d = parseInt(parts[0] || '', 10)
      const m = parseInt(parts[1] || '', 10)
      if (m >= 1 && m <= 12) {
        return { month: m, day: d, isWeekend: false }
      }
    }
  }

  return { month: null, day: null, isWeekend: false }
}

/**
 * Lõi tính toán Data Profiler O(N) tối ưu hóa cho tập dữ liệu lớn
 */
export function profileDiffRows(rows: DiffRow[]): ProfileSummary {
  const quality: DataQualityStats = {
    totalRows: rows.length,
    addedCount: 0,
    removedCount: 0,
    changedCount: 0,
    roundAmountCount: 0,
  }

  const cutoff: CutoffStats = {
    count31Dec: 0,
    totalAmount31Dec: 0n,
    countWeekend: 0,
    totalAmountWeekend: 0n,
  }

  // Khởi tạo 12 tháng
  const monthly: MonthlyBucket[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: `T${String(i + 1).padStart(2, '0')}`,
    count: 0,
    totalAmount: 0n,
    diffCount: 0,
    totalDiffAmount: 0n,
  }))

  // Khởi tạo 4 tầng tiền
  const tierMap: Record<AmountTierKey, { count: number; total: bigint }> = {
    LOW: { count: 0, total: 0n },
    MEDIUM: { count: 0, total: 0n },
    HIGH: { count: 0, total: 0n },
    KEY_ITEM: { count: 0, total: 0n },
  }

  const pairCounts = new Map<string, { debit: string; credit: string; count: number; totalAmount: bigint }>()
  let totalProfiledAmount = 0n

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!

    // 1. Phân loại chất lượng
    if (row.kind === 'ADDED_AFTER') quality.addedCount++
    else if (row.kind === 'REMOVED_AFTER') quality.removedCount++
    else if (row.kind === 'AMOUNT_CHANGED') quality.changedCount++

    // 2. Lấy số tiền giao dịch hiệu dụng (tuyệt đối)
    let rawAmount = 0n
    try {
      const amtAfter = moneyFromJSON(row.amountAfter).raw
      const amtBefore = moneyFromJSON(row.amountBefore).raw
      const diffAmt = moneyFromJSON(row.difference).raw

      // Lấy số tiền phát sinh lớn nhất giữa Trước và Sau (hoặc số chênh lệch)
      const absAfter = amtAfter < 0n ? -amtAfter : amtAfter
      const absBefore = amtBefore < 0n ? -amtBefore : amtBefore
      const absDiff = diffAmt < 0n ? -diffAmt : diffAmt

      rawAmount = absAfter > absBefore ? absAfter : absBefore
      if (rawAmount === 0n) rawAmount = absDiff
    } catch {
      rawAmount = 0n
    }

    totalProfiledAmount += rawAmount

    // 3. Kiểm tra số tiền tròn chục triệu (>= 10.000.000 và chia hết 10.000.000)
    if (rawAmount >= 10_000_000n && rawAmount % 10_000_000n === 0n) {
      quality.roundAmountCount++
    }

    // 4. Phân tầng giá trị (Tiers)
    if (rawAmount < TIER_THRESHOLDS.LOW_MAX) {
      tierMap.LOW.count++
      tierMap.LOW.total += rawAmount
    } else if (rawAmount < TIER_THRESHOLDS.MED_MAX) {
      tierMap.MEDIUM.count++
      tierMap.MEDIUM.total += rawAmount
    } else if (rawAmount < TIER_THRESHOLDS.HIGH_MAX) {
      tierMap.HIGH.count++
      tierMap.HIGH.total += rawAmount
    } else {
      tierMap.KEY_ITEM.count++
      tierMap.KEY_ITEM.total += rawAmount
    }

    // 5. Phân phối thời gian & Cutoff
    const { month, day, isWeekend } = extractMonthAndDay(row.dateISO, row.dateDisplay)
    if (month !== null && month >= 1 && month <= 12) {
      const mb = monthly[month - 1]!
      mb.count++
      mb.totalAmount += rawAmount

      // Nếu dòng có chênh lệch khác 0
      try {
        const diffRaw = moneyFromJSON(row.difference).raw
        if (diffRaw !== 0n) {
          mb.diffCount++
          mb.totalDiffAmount += diffRaw < 0n ? -diffRaw : diffRaw
        }
      } catch {
        // ignore
      }

      // Nhận diện ngày 31/12 (Cutoff rủi ro)
      if (month === 12 && day === 31) {
        cutoff.count31Dec++
        cutoff.totalAmount31Dec += rawAmount
      }
    }

    if (isWeekend) {
      cutoff.countWeekend++
      cutoff.totalAmountWeekend += rawAmount
    }

    // 6. Cặp tài khoản đối ứng (Top Pairs)
    const deb = (row.debit || '').trim()
    const cred = (row.credit || '').trim()
    if (deb && cred) {
      const pKey = `${deb}>${cred}`
      let pEntry = pairCounts.get(pKey)
      if (!pEntry) {
        pEntry = { debit: deb, credit: cred, count: 0, totalAmount: 0n }
        pairCounts.set(pKey, pEntry)
      }
      pEntry.count++
      pEntry.totalAmount += rawAmount
    }
  }

  // Tính max monthly cho hiển thị biểu đồ tỷ lệ
  let maxMonthlyAmount = 0n
  let maxMonthlyCount = 0
  for (let m = 0; m < 12; m++) {
    const mb = monthly[m]!
    if (mb.totalAmount > maxMonthlyAmount) maxMonthlyAmount = mb.totalAmount
    if (mb.count > maxMonthlyCount) maxMonthlyCount = mb.count
  }

  // Đóng gói mảng Tiers với tỷ lệ %
  const totalCount = rows.length || 1
  const tiers: AmountTierBucket[] = [
    {
      key: 'LOW',
      label: 'Dưới 50 triệu',
      subLabel: 'Nhỏ lẻ',
      minAmount: 0n,
      maxAmount: TIER_THRESHOLDS.LOW_MAX,
      count: tierMap.LOW.count,
      totalAmount: tierMap.LOW.total,
      percentOfTotal: Math.round((tierMap.LOW.count / totalCount) * 100),
    },
    {
      key: 'MEDIUM',
      label: '50 – 500 triệu',
      subLabel: 'Trung bình',
      minAmount: TIER_THRESHOLDS.LOW_MAX,
      maxAmount: TIER_THRESHOLDS.MED_MAX,
      count: tierMap.MEDIUM.count,
      totalAmount: tierMap.MEDIUM.total,
      percentOfTotal: Math.round((tierMap.MEDIUM.count / totalCount) * 100),
    },
    {
      key: 'HIGH',
      label: '500 triệu – 2 tỷ',
      subLabel: 'Giá trị lớn',
      minAmount: TIER_THRESHOLDS.MED_MAX,
      maxAmount: TIER_THRESHOLDS.HIGH_MAX,
      count: tierMap.HIGH.count,
      totalAmount: tierMap.HIGH.total,
      percentOfTotal: Math.round((tierMap.HIGH.count / totalCount) * 100),
    },
    {
      key: 'KEY_ITEM',
      label: 'Trên 2 tỷ',
      subLabel: 'Trọng yếu',
      minAmount: TIER_THRESHOLDS.HIGH_MAX,
      maxAmount: null,
      count: tierMap.KEY_ITEM.count,
      totalAmount: tierMap.KEY_ITEM.total,
      percentOfTotal: Math.round((tierMap.KEY_ITEM.count / totalCount) * 100),
    },
  ]

  // Lấy Top 10 cặp tài khoản theo số tiền
  const topPairs = Array.from(pairCounts.values())
    .map((p) => ({ ...p, pairKey: `${p.debit}>${p.credit}` }))
    .sort((a, b) => (b.totalAmount > a.totalAmount ? 1 : b.totalAmount < a.totalAmount ? -1 : 0))
    .slice(0, 8)

  return {
    quality,
    monthly,
    cutoff,
    tiers,
    topPairs,
    maxMonthlyAmount,
    maxMonthlyCount,
    totalProfiledAmount,
  }
}
