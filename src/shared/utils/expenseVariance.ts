import type { KqkdLineDTO } from '../types/analytics'

export interface ExpenseVarRow {
  maSo: string
  chiTieu: string
  current: number | null
  prior: number | null
  change: number | null
  pctChange: number | null
  /** % đóng góp vào tổng mức TĂNG chi phí (null nếu không tăng) */
  shareOfIncrease: number | null
  /** true khi tốc độ tăng vượt tốc độ tăng doanh thu thuần */
  fasterThanRevenue: boolean
}

export interface ExpenseVarianceResult {
  rows: ExpenseVarRow[]
  totalCurrent: number
  totalPrior: number
  totalChange: number | null
  revenueGrowthPct: number | null
}

/** Các chỉ tiêu CHI PHÍ theo mã số KQKD chuẩn (Thông tư 200). */
const EXPENSE_LINES: ReadonlyArray<{ maSo: string; chiTieu: string }> = [
  { maSo: '11', chiTieu: 'Giá vốn hàng bán' },
  { maSo: '22', chiTieu: 'Chi phí tài chính' },
  { maSo: '24', chiTieu: 'Chi phí bán hàng' },
  { maSo: '25', chiTieu: 'Chi phí quản lý doanh nghiệp' },
  { maSo: '32', chiTieu: 'Chi phí khác' },
]

function growthPct(cur: number, pri: number): number | null {
  if (pri === 0) return cur === 0 ? 0 : null
  return (cur - pri) / Math.abs(pri)
}

/** Phân tích biến động chi phí: nay vs trước, % thay đổi, cơ cấu mức tăng, so với tăng trưởng DT. */
export function analyzeExpenseVariance(lines: readonly KqkdLineDTO[]): ExpenseVarianceResult {
  const revenue = lines.find((l) => l.maSo === '10')
  const revCur = revenue?.current ?? null
  const revPri = revenue?.prior ?? null
  const revenueGrowthPct =
    revCur != null && revPri != null ? growthPct(revCur, revPri) : null

  let totalCurrent = 0
  let totalPrior = 0
  for (const def of EXPENSE_LINES) {
    const l = lines.find((x) => x.maSo === def.maSo)
    if (l == null) continue
    if (l.current != null) totalCurrent += l.current
    if (l.prior != null) totalPrior += l.prior
  }
  const totalChange =
    totalPrior !== 0 || totalCurrent !== 0 ? totalCurrent - totalPrior : null

  const rows: ExpenseVarRow[] = EXPENSE_LINES.map((def) => {
    const l = lines.find((x) => x.maSo === def.maSo)
    const current = l?.current ?? null
    const prior = l?.prior ?? null
    const hasAny = current != null || prior != null
    const change = !hasAny ? null : (current ?? 0) - (prior ?? 0)
    const pctChange = current != null && prior != null ? growthPct(current, prior) : null
    return {
      maSo: def.maSo,
      chiTieu: def.chiTieu,
      current,
      prior,
      change,
      pctChange,
      shareOfIncrease:
        change != null && change > 0 && totalChange != null && totalChange > 0
          ? change / totalChange
          : null,
      fasterThanRevenue:
        pctChange != null && revenueGrowthPct != null && pctChange > revenueGrowthPct,
    }
  })

  return { rows, totalCurrent, totalPrior, totalChange, revenueGrowthPct }
}
