import type { Money } from '../../domain/money'
import { parseMoney } from '../../domain/money'
import type { IncomeStatementData, IncomeStatementLine } from '../../shared/types/analytics'
import { normalizeKeyword } from '../../shared/utils/text'
import { isBlankRow, type MatrixRow } from '../excel/WorkbookReader'

export interface IncomeStatementMapping {
  maSo: number | null
  chiTieu: number | null
  currentYear: number | null
  priorYear: number | null
}

function moneyOrNull(v: unknown): Money | null {
  if (v == null) return null
  const t = String(v).trim()
  if (t === '') return null
  if (String(t).includes('#')) return null // #REF!, #DIV/0! … — không tin công thức lỗi (§51)
  return parseMoney(t)
}

/** Map KQKD theo MÃ SỐ + keyword chỉ tiêu — không theo vị trí dòng (§10 prompt). */
export function normalizeIncomeStatement(input: {
  matrix: MatrixRow[]
  mapping: IncomeStatementMapping
  headerRowIndex: number
  fileName: string
  sheetName: string
}): IncomeStatementData {
  const { matrix, mapping, headerRowIndex, fileName, sheetName } = input
  const lines = new Map<string, IncomeStatementLine>()
  const usedCols = Object.values(mapping).filter((v): v is number => v != null)

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!row || isBlankRow(row, usedCols)) continue

    let maSo = mapping.maSo != null ? String(row[mapping.maSo] ?? '').trim() : ''
    if (!/^\d{1,3}$/.test(maSo)) {
      // dòng đặc biệt (SUMIF cặp TK…) → bỏ
      maSo = ''
    }
    const chiTieu = mapping.chiTieu != null ? String(row[mapping.chiTieu] ?? '').trim() : ''
    if (!maSo && !chiTieu) continue
    if (!maSo) continue

    const key = padMa(maSo)
    const existing = lines.get(key)
    const current = moneyOrNull(mapping.currentYear != null ? row[mapping.currentYear] : null)
    const prior = moneyOrNull(mapping.priorYear != null ? row[mapping.priorYear] : null)
    if (!existing) {
      lines.set(key, { maSo: key, chiTieu, current, prior })
    } else {
      // giữ giá trị số đầu tiên hợp lệ cho mỗi mã số
      if (existing.current == null && current != null) existing.current = current
      if (existing.prior == null && prior != null) existing.prior = prior
    }
  }

  return {
    lines: [...lines.values()].sort((a, b) => Number(a.maSo) - Number(b.maSo)),
    source: { fileName, sheetName, rowNumber: headerRowIndex + 1 },
  }
}

export function padMa(maSo: string): string {
  return maSo.padStart(2, '0')
}

const KEYWORD_TO_MASO: Array<[string, string]> = [
  ['DOANH THU BAN HANG', '01'],
  ['CAC KHOAN GIAM TRU DOANH THU', '02'],
  ['DOANH THU THUAN', '10'],
  ['GIA VON HANG BAN', '11'],
  ['LOI NHUAN GOP', '20'],
  ['DOANH THU HOAT DONG TAI CHINH', '21'],
  ['CHI PHI TAI CHINH', '22'],
  ['CHI PHI LAI VAY', '23'],
  ['CHI PHI BAN HANG', '24'],
  ['CHI PHI QUAN LY DOANH NGHIEP', '25'],
  ['LOI NHUAN THUAN TU HOAT DONG KINH DOANH', '30'],
  ['THU NHAP KHAC', '31'],
  ['CHI PHI KHAC', '32'],
  ['LOI NHUAN KHAC', '40'],
  ['TONG LOI NHUAN KE TOAN TRUOC THUE', '50'],
  ['THUE TNDN HIEN HANH', '51'],
  ['CHI PHI THUE THU NHAP DOANH NGHIEP HIEN HANH', '51'],
  ['THUE TNDN HOAN LAI', '52'],
  ['CHI PHI THUE THU NHAP DOANH NGHIEP HOAN LAI', '52'],
  ['LOI NHUAN SAU THUE', '60'],
]

/** Fallback khi thiếu cột MS: đoán mã số theo tên chỉ tiêu. */
export function guessMaFromLabel(chiTieu: string): string | null {
  const t = normalizeKeyword(chiTieu)
  for (const [kw, maSo] of KEYWORD_TO_MASO) if (t.includes(kw)) return maSo
  return null
}
