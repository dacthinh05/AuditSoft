import { extractTk3, suggestWorkingPaper } from './classify'
import type { BctcAnalysis, GomNhomCdktRow, GomNhomKqkdRow } from './aggregate'

export interface WorkingPaperLine {
  /** STT bút toán (chỉ hiển thị ở dòng đầu của bút toán) */
  stt: number | ''
  /** Tham chiếu giấy làm việc */
  glv: string
  /** NỘI DUNG / Diễn giải chứng từ */
  noiDung: string
  /** TK NỢ */
  tkNo: string
  /** TK CÓ */
  tkCo: string
  /** SỐ PS */
  soPS: number | null

  // ẢNH HƯỞNG CĐKT (Cộng gộp theo từng chỉ tiêu chuẩn)
  cdktChiTieu: string
  tsTang: number
  tsGiam: number
  nvTang: number
  nvGiam: number

  // ẢNH HƯỞNG KQKD (Cộng gộp theo từng chỉ tiêu chuẩn)
  kqkdChiTieu: string
  kqkdTang: number
  kqkdGiam: number

  // KIỂM TRA MAPPING (TK Nợ dò)
  kiemTra: string

  /** Đánh dấu dòng đầu tiên của bút toán (phục vụ styling/border) */
  isFirstLineOfEntry: boolean
  isSecondLineOfEntry?: boolean
  groupedCount?: number
}

export interface WorkingPaperHeaderMeta {
  khachHang: string
  nienDo: string
  dot: string
  donViKiemToan: string
  nguoiThucHien: string
  soDienThoai: string
}

export const DEFAULT_HEADER_META: WorkingPaperHeaderMeta = {
  khachHang: 'CÔNG TY TNHH CÔNG NGHIỆP YEI JER (VIỆT NAM)',
  nienDo: '31 / 12 / 2025',
  dot: 'Đợt 1: 01/01 - 30/06/2025',
  donViKiemToan: 'Công ty TNHH kiểm toán BẮC ĐẨU',
  nguoiThucHien: 'Nguyễn Đắc Thịnh',
  soDienThoai: '0817.567.008',
}

/**
 * TẠO BẢNG WORKING PAPER SONG SONG (Chuẩn mẫu Excel B360 / Bút toán điều chỉnh):
 * - Vế trái (Cột A-F): Danh sách TỪNG BÚT TOÁN ĐIỀU CHỈNH CHI TIẾT (1 dòng / bút toán, không gom bút toán).
 * - Vế giữa (Cột G-K): Các CHỈ TIÊU CĐKT BỊ ẢNH HƯỞNG, ĐÃ CỘNG GỘP và sắp xếp theo thứ tự chỉ tiêu chuẩn.
 * - Vế phải (Cột L-N): Các CHỈ TIÊU KQKD BỊ ẢNH HƯỞNG, ĐÃ CỘNG GỘP và sắp xếp theo thứ tự chỉ tiêu chuẩn.
 * - Cột kiểm tra (Cột P / O): TK Nợ dò.
 */
export function generateWorkingPaperLines(
  analyses: readonly BctcAnalysis[],
  cdktRows: readonly GomNhomCdktRow[] = [],
  kqkdRows: readonly GomNhomKqkdRow[] = [],
): WorkingPaperLine[] {
  const maxLen = Math.max(analyses.length, cdktRows.length, kqkdRows.length)
  const result: WorkingPaperLine[] = []

  for (let i = 0; i < maxLen; i++) {
    const an = analyses[i]
    const cdkt = cdktRows[i]
    const kqkd = kqkdRows[i]

    let stt: number | '' = ''
    let glv = ''
    let noiDung = ''
    let tkNo = ''
    let tkCo = ''
    let soPS: number | null = null
    let kiemTra = ''

    if (an) {
      const rawRow = an.row
      const rawDiff = Number(rawRow.difference.slice(rawRow.difference.indexOf('|') + 1))
      tkNo = rawDiff < 0 ? rawRow.credit : rawRow.debit
      tkCo = rawDiff < 0 ? rawRow.debit : rawRow.credit
      stt = i + 1
      glv = an.glv || suggestWorkingPaper({ noiDung: an.row.description, tkNo, tkCo })
      noiDung = an.row.description
      soPS = an.soPS
      kiemTra = extractTk3(tkNo) || tkNo
    }

    result.push({
      stt,
      glv,
      noiDung,
      tkNo,
      tkCo,
      soPS,

      cdktChiTieu: cdkt ? cdkt.chiTieu : '',
      tsTang: cdkt ? cdkt.tsTang : 0,
      tsGiam: cdkt ? cdkt.tsGiam : 0,
      nvTang: cdkt ? cdkt.nvTang : 0,
      nvGiam: cdkt ? cdkt.nvGiam : 0,

      kqkdChiTieu: kqkd ? kqkd.chiTieu : '',
      kqkdTang: kqkd ? kqkd.tang : 0,
      kqkdGiam: kqkd ? kqkd.giam : 0,

      kiemTra,
      isFirstLineOfEntry: true,
      isSecondLineOfEntry: false,
    })
  }

  return result
}

/** Tương thích: bảng working paper chuẩn hóa song song */
export function generateAggregatedWorkingPaperLines(
  analyses: readonly BctcAnalysis[],
  cdktRows: readonly GomNhomCdktRow[] = [],
  kqkdRows: readonly GomNhomKqkdRow[] = [],
): WorkingPaperLine[] {
  return generateWorkingPaperLines(analyses, cdktRows, kqkdRows)
}
