import type { Money } from '../../domain/money'

/** Định dạng tiền VND kiểu Việt Nam cho observation/report. */
export function formatVnd(m: Money): string {
  const abs = m.raw < 0n ? -m.raw : m.raw
  let s = abs.toString()
  if (m.scale > 0) s = s.slice(0, -m.scale) || '0'
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return m.raw < 0 ? `(${grouped})` : grouped
}

export function formatPct(ratio: number | null | undefined, digits = 1): string {
  if (ratio == null || !Number.isFinite(ratio)) return 'n/a'
  return `${(ratio * 100).toFixed(digits).replace('.', ',')}%`
}

export function formatPP(pp: number | null | undefined, digits = 1): string {
  if (pp == null || !Number.isFinite(pp)) return 'n/a'
  const sign = pp > 0 ? '+' : ''
  return `${sign}${pp.toFixed(digits).replace('.', ',')} pp`
}

export function formatSignedInt(v: number): string {
  return v.toLocaleString('vi-VN')
}
