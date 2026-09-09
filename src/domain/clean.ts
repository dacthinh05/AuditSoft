/** Coerce giá trị ô Excel (string | number | Date | {richText|result|text}) → chuỗi thô. */
export function coerceCellToString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'object') {
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    const o = v as Record<string, unknown>
    const richText = o.richText
    if (Array.isArray(richText)) {
      return richText
        .map((t) => (t != null && typeof t === 'object' && 'text' in t ? String((t as { text: unknown }).text ?? '') : ''))
        .join('')
    }
    if ('result' in o) return coerceCellToString(o.result)
    if ('text' in o) return coerceCellToString(o.text)
    if ('error' in o) return ''
    if ('hyperlink' in o && !('text' in o)) return ''
  }
  return String(v)
}

/** CLEAN + trim + chuẩn hóa xuống dòng/khoảng trắng — giữ nội dung hiển thị. */
export function cleanText(input: string): string {
  let s = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  s = s.replace(/\r\n?/g, '\n')
  s = s.replaceAll('\n', ' ')
  s = s.replace(/[ \t\u00A0]+/g, ' ')
  return s.trim()
}

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').replaceAll('Đ', 'D')
}

/** Chuẩn hóa phục vụ khóa/tìm kiếm: CLEAN → bỏ dấu → uppercase → gộp khoảng trắng. */
export function normalizeForKey(input: string): string {
  return cleanText(stripDiacritics(input)).toUpperCase().replace(/\s+/g, ' ').trim()
}
