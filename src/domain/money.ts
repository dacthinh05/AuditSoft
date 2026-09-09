export interface Money {
  readonly raw: bigint
  readonly scale: number
}

export const MONEY_ZERO: Money = makeMoney(0n, 0)

export function makeMoney(raw: bigint, scale: number): Money {
  return { raw, scale }
}

function pow10(n: number): bigint {
  return 10n ** BigInt(n)
}

function fromDecimalString(s: string): Money | null {
  const m = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s)
  if (!m) return null
  const sign = m[1] === '-' ? -1n : 1n
  const intPart = m[2] ?? '0'
  const fracPart = m[3] ?? ''
  const raw = sign * BigInt(intPart + fracPart)
  return makeMoney(raw, fracPart.length)
}

function numberToPlainString(v: number): string | null {
  if (!Number.isFinite(v)) return null
  let s = String(v)
  if (s.includes('e') || s.includes('E')) {
    s = v.toFixed(20).replace(/0+$/, '').replace(/\.$/, '')
  }
  return s
}

/** Parse số tiền từ number | bigint | string, hỗ trợ "1.234.567,89", "1,234,567.89", "(1.234)".
 *  Trả về null nếu rỗng hoặc không hợp lệ — không âm thầm biến lỗi thành 0. */
export function parseMoney(v: unknown): Money | null {
  if (v == null) return null
  if (typeof v === 'bigint') return makeMoney(v, 0)
  if (typeof v === 'number') {
    const s = numberToPlainString(v)
    return s == null ? null : fromDecimalString(s)
  }
  if (typeof v !== 'string') return null

  let t = v.replace(/[\s\u00A0\u2007\u202F]/g, '')
  if (t === '') return null
  let parenNeg = false
  if (/^\(.*\)$/.test(t)) {
    parenNeg = true
    t = t.slice(1, -1)
  }

  const lastComma = t.lastIndexOf(',')
  const lastDot = t.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      t = t.replace(/\./g, '').replace(',', '.')
    } else {
      t = t.replace(/,/g, '')
    }
  } else if (lastComma > -1) {
    if (/^[+-]?\d{1,3}(,\d{3})+$/.test(t)) {
      t = t.replace(/,/g, '')
    } else {
      t = t.replace(',', '.')
    }
  } else if (lastDot > -1) {
    if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(t)) {
      t = t.replace(/\./g, '')
    }
  }
  const parsed = fromDecimalString(t)
  if (!parsed) return null
  return parenNeg ? negate(parsed) : parsed
}

function alignScale(m: Money, scale: number): bigint {
  return m.raw * pow10(scale - m.scale)
}

export function addMoney(a: Money, b: Money): Money {
  const scale = Math.max(a.scale, b.scale)
  return makeMoney(alignScale(a, scale) + alignScale(b, scale), scale)
}

export function subtractMoney(a: Money, b: Money): Money {
  return addMoney(a, negate(b))
}

export function negate(m: Money): Money {
  return makeMoney(-m.raw, m.scale)
}

export function absMoney(m: Money): Money {
  return m.raw < 0n ? negate(m) : m
}

export function isZeroMoney(m: Money): boolean {
  return m.raw === 0n
}

export function cmpMoney(a: Money, b: Money): number {
  const scale = Math.max(a.scale, b.scale)
  const ra = alignScale(a, scale)
  const rb = alignScale(b, scale)
  return ra < rb ? -1 : ra > rb ? 1 : 0
}

export function sumMoney(values: readonly Money[]): Money {
  return values.reduce((acc, m) => addMoney(acc, m), MONEY_ZERO)
}

/** Chỉ dùng cho hiển thị/export — mọi tính toán phải qua addMoney/subtractMoney. */
export function moneyToNumber(m: Money): number {
  return Number(m.raw) / Math.pow(10, m.scale)
}

export function moneyToPlainString(m: Money): string {
  const absRaw = m.raw < 0n ? -m.raw : m.raw
  let s = absRaw.toString()
  if (m.scale > 0) {
    if (s.length <= m.scale) s = s.padStart(m.scale + 1, '0')
    const cut = s.length - m.scale
    s = `${s.slice(0, cut)}.${s.slice(cut)}`
  }
  return (m.raw < 0n ? '-' : '') + s
}

export function moneyToJSON(m: Money): string {
  return `${m.scale}|${m.raw}`
}

export function moneyFromJSON(json: string): Money {
  const idx = json.indexOf('|')
  if (idx < 0) return MONEY_ZERO
  const scale = Number(json.slice(0, idx))
  const raw = BigInt(json.slice(idx + 1))
  if (!Number.isInteger(scale) || scale < 0 || scale > 30) return MONEY_ZERO
  return makeMoney(raw, scale)
}

export function moneyFromNumber(n: number): Money {
  const m = parseMoney(n)
  return m ?? MONEY_ZERO
}

/** Number.Round của Power Query = làm tròn banker's (half-to-even) về số nguyên. */
export function roundToIntegerHalfEven(m: Money): Money {
  if (m.scale === 0) return m
  const p = pow10(m.scale)
  const neg = m.raw < 0n
  const absRaw = neg ? -m.raw : m.raw
  const q = absRaw / p
  const r = absRaw % p
  let rounded = q
  if (r * 2n > p) rounded = q + 1n
  else if (r * 2n === p && q % 2n === 1n) rounded = q + 1n
  return makeMoney(neg ? -rounded : rounded, 0)
}
