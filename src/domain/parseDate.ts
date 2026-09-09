export interface ParsedDate {
  /** yyyy-MM-dd hoặc null nếu không hợp lệ (đánh dấu LoiNgay) */
  iso: string | null
  /** Chuỗi hiển thị gốc/định dạng dd/MM/yyyy */
  display: string
}

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30)

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function isoFromUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

function displayFromUTC(d: Date): string {
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

function buildUTC(y: number, m: number, d: number): Date | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return dt
}

export function excelSerialToUTC(serial: number): Date | null {
  if (!Number.isFinite(serial)) return null
  const ms = EXCEL_EPOCH_MS + Math.floor(serial) * 86400000
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  if (y < 1900 || y > 2100) return null
  return d
}

const MONTH_NAMES = new Map<string, number>([
  ['JAN', 1], ['FEB', 2], ['MAR', 3], ['APR', 4], ['MAY', 5], ['JUN', 6],
  ['JUL', 7], ['AUG', 8], ['SEP', 9], ['OCT', 10], ['NOV', 11], ['DEC', 12],
  ['T1', 1], ['T2', 2], ['T3', 3], ['T4', 4], ['T5', 5], ['T6', 6],
  ['T7', 7], ['T8', 8], ['T9', 9], ['T10', 10], ['T11', 11], ['T12', 12],
])

function monthFromName(name: string): number | null {
  const n = name.toUpperCase().replace(/\./g, '')
  const direct = MONTH_NAMES.get(n)
  if (direct != null) return direct
  const thang = /^TH(?:ÁNG|ANG)?\s?(\d{1,2})$/.exec(stripDiacriticsLocal(n))
  if (thang) {
    const m = Number(thang[1])
    if (m >= 1 && m <= 12) return m
  }
  return null
}

function stripDiacriticsLocal(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Parse ngày từ ô Excel: serial, Date object, {result}, chuỗi dd/MM/yyyy | ISO | dd/Mon/yy ("15/Jan/25"). */
export function parseDateCell(v: unknown): ParsedDate | null {
  if (v == null) return null
  if (typeof v === 'object' && !(v instanceof Date)) {
    const o = v as Record<string, unknown>
    if ('result' in o) return parseDateCell(o.result)
    if ('text' in o) return parseDateCell(o.text)
    return null
  }
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return { iso: null, display: '' }
    return { iso: isoFromUTC(v), display: displayFromUTC(v) }
  }
  if (typeof v === 'number') {
    const d = excelSerialToUTC(v)
    if (!d) return { iso: null, display: String(v) }
    return { iso: isoFromUTC(d), display: displayFromUTC(d) }
  }

  const t = String(v).trim()
  if (t === '') return null

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t)
  if (isoMatch) {
    const d = buildUTC(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]))
    if (d) return { iso: isoFromUTC(d), display: displayFromUTC(d) }
    return { iso: null, display: t }
  }

  const dmMatch = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(t)
  if (dmMatch) {
    let y = Number(dmMatch[3])
    if (y < 100) y += y < 70 ? 2000 : 1900
    const d = buildUTC(y, Number(dmMatch[2]), Number(dmMatch[1]))
    if (d) return { iso: isoFromUTC(d), display: displayFromUTC(d) }
    return { iso: null, display: t }
  }

  // dd/Mon/yy — "15/Jan/25", "15-Tháng 1-2025", "15 T12 25"
  const dayMonthName = /^(\d{1,2})[\s/\-.]+([A-Za-z.]{2,12})[\s/\-.]+(\d{2,4})$/.exec(t)
  if (dayMonthName) {
    const m = monthFromName(dayMonthName[2] ?? '')
    let y = Number(dayMonthName[3])
    if (y < 100) y += y < 70 ? 2000 : 1900
    if (m != null) {
      const d = buildUTC(y, m, Number(dayMonthName[1]))
      if (d) return { iso: isoFromUTC(d), display: displayFromUTC(d) }
    }
    return { iso: null, display: t }
  }

  // Mon dd, yy — "Jan 15, 2025"
  const monthNameDay = /^([A-Za-z.]{3,12})[\s./-]+(\d{1,2}),?\s+(\d{2,4})$/.exec(t)
  if (monthNameDay) {
    const m = monthFromName(monthNameDay[1] ?? '')
    let y = Number(monthNameDay[3])
    if (y < 100) y += y < 70 ? 2000 : 1900
    if (m != null) {
      const d = buildUTC(y, m, Number(monthNameDay[2]))
      if (d) return { iso: isoFromUTC(d), display: displayFromUTC(d) }
    }
    return { iso: null, display: t }
  }

  return { iso: null, display: t }
}
