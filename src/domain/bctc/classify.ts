import { stripDiacritics } from '../clean'
import { DANH_MUC_TAI_KHOAN, TK_GIA_VON, type BaoCao, type DanhMucTaiKhoan, type Nhom } from './catalog'

export interface ButToanInput {
  tkNo: string
  tkCo: string
  soPS: number
}

export interface PhanLoaiTk {
  nhom: Nhom
  baoCao: BaoCao
  chiTieu: string
}

const INDEX = new Map<string, DanhMucTaiKhoan>(DANH_MUC_TAI_KHOAN.map((d) => [d.tk3, d]))

export const CHUA_KHAI_BAO_MESSAGE = 'Chưa khai báo tài khoản trong DanhMucChiTieu'

/** 3 ký tự số đầu của số hiệu TK (bỏ qua hậu tố chữ như "131T28"). */
export function extractTk3(tk: string): string {
  const digits = String(tk ?? '').replace(/[^0-9]/g, '')
  return digits.slice(0, 3)
}

/** LEFT(tk,3) tra DM_ChiTieu; ngoại lệ ép "Giá vốn hàng bán" cho nhóm 61x/62x/631/632. */
export function classifyAccount(tk: string): PhanLoaiTk | null {
  const tk3 = extractTk3(tk)
  if (tk3 === '' || tk3.length < 3) return null
  const found = INDEX.get(tk3)
  if (!found) return null
  let chiTieu = found.chiTieu
  if (TK_GIA_VON.has(tk3) && found.baoCao === 'KQKD' && found.nhom === 'CP') {
    chiTieu = 'Giá vốn hàng bán'
  }
  return { nhom: found.nhom, baoCao: found.baoCao, chiTieu }
}

export interface RowImpacts {
  x: number // ảnh hưởng lợi nhuận
  y: number // tài sản thuần
  z: number // nguồn vốn thuần (đã cộng X trừ khi chạm 421)
  zBeforeProfit: number // Z chưa cộng lợi nhuận (để kiểm thử/hiển thị)
  aa: number // chênh lệch cân đối = Y − Z
  ab: 'CÂN' | 'KHÔNG CÂN - KIỂM TRA MAPPING' | 'CHƯA KIỂM TRA CÂN'
  noMapped: PhanLoaiTk | null
  coMapped: PhanLoaiTk | null
  involves421: boolean
}

export function isAbsBelowOne(v: number): boolean {
  return Math.abs(v) < 1
}

/** Cột dẫn xuất P–AB của sheet B360 — tái hiện đúng công thức Excel gốc. */
export function computeRow(row: ButToanInput): RowImpacts {
  const no = classifyAccount(row.tkNo)
  const co = classifyAccount(row.tkCo)
  const a = Number(row.soPS) || 0

  const isRev = (p: PhanLoaiTk | null): number => (p && p.baoCao === 'KQKD' && p.nhom === 'DT' ? a : 0)
  const isExp = (p: PhanLoaiTk | null): number => (p && p.baoCao === 'KQKD' && p.nhom === 'CP' ? a : 0)

  const x = isRev(co) - isRev(no) - isExp(no) + isExp(co)
  const y = (no && no.baoCao === 'CDKT' && no.nhom === 'TS' ? a : 0) - (co && co.baoCao === 'CDKT' && co.nhom === 'TS' ? a : 0)
  const zBeforeProfit =
    (co && co.baoCao === 'CDKT' && co.nhom === 'NV' ? a : 0) - (no && no.baoCao === 'CDKT' && no.nhom === 'NV' ? a : 0)

  const involves421 = extractTk3(row.tkNo) === '421' || extractTk3(row.tkCo) === '421'
  const z = involves421 ? zBeforeProfit : zBeforeProfit + x

  const aa = y - z

  const hasMissing =
    (row.tkNo !== '' && row.tkNo != null && no == null) || (row.tkCo !== '' && row.tkCo != null && co == null)
  const ab: RowImpacts['ab'] = hasMissing ? 'CHƯA KIỂM TRA CÂN' : isAbsBelowOne(aa) ? 'CÂN' : 'KHÔNG CÂN - KIỂM TRA MAPPING'

  return { x, y, z, zBeforeProfit, aa, ab, noMapped: no, coMapped: co, involves421 }
}

// ───────────────────────── Quy tắc Giấy làm việc ─────────────────────────

function containsWord(hayUpper: string, keyword: string): boolean {
  const pattern = keyword
    .split(' ')
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+')
  const re = new RegExp(`(^|[^A-Z0-9])${pattern}([^A-Z0-9]|$)`)
  return re.test(hayUpper)
}

function containsAny(hayUpper: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => containsWord(hayUpper, k))
}

const GLV_FALLBACK = 'Cần bổ sung quy tắc'

/** Gợi ý mã giấy làm việc — đúng thứ tự ưu tiên D100–F100 của workbook. */
export function suggestWorkingPaper(input: { noiDung: string; tkNo: string; tkCo: string }): string {
  const nd = stripDiacritics(String(input.noiDung ?? '').toUpperCase())
  const no = extractTk3(input.tkNo)
  const co = extractTk3(input.tkCo)
  const both = [no, co]

  const has = (...codes: string[]): boolean => both.some((c) => codes.includes(c))
  const inRange = (lo: number, hi: number): boolean =>
    both.some((c) => /^\d{3}$/.test(c) && Number(c) >= lo && Number(c) <= hi)

  if (containsAny(nd, ['PHAN BO'])) return 'D600'
  if (containsAny(nd, ['LUONG']) || has('334')) return 'E400'
  if (containsAny(nd, ['THUE']) || has('333', '133', '821')) return 'E300'
  if (containsAny(nd, ['VAY']) || has('341')) return 'E100'
  if (containsAny(nd, ['KHO', 'NVL', 'THANH PHAM']) || inRange(151, 157) || has('621', '622', '623', '627', '631', '632'))
    return 'D500'
  if (containsAny(nd, ['PHAI TRA']) || has('331', '335', '336', '337', '338')) return 'E200'
  if (containsAny(nd, ['TAI SAN']) || has('211', '212', '213', '214', '217', '241', '242', '244')) return 'D700'
  if (containsAny(nd, ['VON']) || has('411', '412', '413', '414', '418', '421')) return 'F100'
  if (has('131', '132', '136', '138', '141')) return 'D300'
  if (has('111', '112', '128')) return 'D100'
  return GLV_FALLBACK
}
