import { moneyToNumber, type Money } from '../../domain/money'
import type { MaterialityConfig } from '../../shared/types/analytics'

export function pct(part: number, whole: number): number | null {
  if (whole === 0) return null
  return part / whole
}

export function growthPct(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null
  return (current - prior) / Math.abs(prior)
}

export function ppChange(current: number, prior: number): number {
  return (current - prior) * 100
}

/** Điểm materiality theo tỷ lệ amount/OM (0..40) — explainable. */
export function materialityScore(amount: Money, om: Money): number {
  const ratio = moneyToNumber(amount) / Math.max(1, moneyToNumber(om))
  if (ratio >= 1) return 40
  if (ratio >= 0.5) return 32
  if (ratio >= 0.2) return 24
  if (ratio >= 0.1) return 16
  if (ratio >= 0.05) return 8
  return 0
}

export function isAboveClearlyTrivial(amount: Money, m: MaterialityConfig): boolean {
  return amount.raw >= m.clearlyTrivial.raw
}
