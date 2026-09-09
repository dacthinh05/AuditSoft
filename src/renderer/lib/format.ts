const NF = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

/** Định dạng tiền kiểu VN: 1.234.567; âm trong ngoặc (1.234). */
export function formatMoney(json: string): string {
  const idx = json.indexOf('|')
  if (idx < 0) return '0'
  const rawStr = json.slice(idx + 1)
  if (!/^-?\d+$/.test(rawStr)) return '0'
  const raw = BigInt(rawStr)
  const abs = raw < 0n ? -raw : raw
  const s = NF.format(abs)
  return raw < 0n ? `(${s})` : s
}

export function formatNumber(v: number | null | undefined): string {
  if (v == null || v === 0) return '-'
  const s = NF.format(Math.abs(v))
  return v < 0 ? `(${s})` : s
}

export function formatMoneySigned(json: string): string {
  const idx = json.indexOf('|')
  const raw = BigInt(json.slice(idx + 1))
  const base = formatMoney(json)
  return raw > 0n ? `+${base}` : base
}

export function formatDateISO(iso: string | null, fallback = ''): string {
  if (!iso) return fallback
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}p ${s % 60}s` : `${s}s`
}
