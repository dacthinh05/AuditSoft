/** Chuẩn hóa văn bản cho khớp header/từ khóa — NFC + UPPER + bỏ dấu + gộp space + bỏ dấu câu. */
export function normalizeText(s: unknown): string {
  if (s == null) return ''
  let t = String(s).normalize('NFC')
  t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  t = t.replace(/đ/g, 'd').replace(/Đ/g, 'D')
  t = t.toUpperCase()
  t = t.replace(/[.,:;()\-_/\\'"?!]+/g, ' ')
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

/** Chuẩn hóa cho khớp từ khóa trong diễn giải (giữ nội dung, bỏ dấu để so khớp). */
export function normalizeKeyword(s: unknown): string {
  return normalizeText(s)
}

/** Coerce số hiệu tài khoản từ ô Excel: number → chuỗi an toàn (tránh scientific notation), trim. */
export function coerceAccountCode(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return ''
    if (Number.isInteger(v)) return String(v)
    // 11220.0 kiểu float — cắt phần lẻ thập phân an toàn
    return BigInt(Math.trunc(v)).toString()
  }
  if (typeof v === 'bigint') return v.toString()
  let t = String(v).trim()
  if (/^\d+(\.0+)?$/.test(t)) t = t.replace(/\.0+$/, '')
  t = t.replace(/\s+/g, '')
  return t.toUpperCase()
}
