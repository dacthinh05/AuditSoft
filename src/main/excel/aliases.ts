import { normalizeText } from '../../shared/utils/text'

export interface FieldAliases {
  semantic: string
  aliases: string[]
  /** bắt buộc để sheet được chấp nhận ở loại này */
  core?: boolean
}

export const GL_FIELDS: FieldAliases[] = [
  {
    semantic: 'postingDate',
    core: true,
    aliases: [
      'NGAY', 'NGAY CT', 'NGAY CHUNG TU', 'NGAY HACH TOAN', 'POSTING DATE', 'DOCUMENT DATE',
      'NGAY GHI SO', 'DATE',
    ],
  },
  {
    semantic: 'documentNumber',
    aliases: ['SO CT', 'SO CHUNG TU', 'SO PHIEU', 'VOUCHER NO', 'DOCUMENT NO', 'SO CTU', 'CHUNG TU'],
  },
  {
    semantic: 'description',
    core: true,
    aliases: ['NOI DUNG', 'DIEN GIAI', 'NOI DUNG NGHIEP VU', 'DESCRIPTION', 'MEMO', 'LY DO', 'DIEN GIAI NGHIEN'],
  },
  {
    semantic: 'debitAccount',
    core: true,
    aliases: ['TK NO', 'TAI KHOAN NO', 'DEBIT ACCOUNT', 'TKN', 'TK NO CO', 'ACCOUNT DEBIT'],
  },
  {
    semantic: 'creditAccount',
    core: true,
    aliases: ['TK CO', 'TAI KHOAN CO', 'CREDIT ACCOUNT', 'TKC', 'ACCOUNT CREDIT'],
  },
  {
    semantic: 'amount',
    core: true,
    aliases: ['SO TIEN', 'THANH TIEN', 'SO TIEN VND', 'AMOUNT', 'GIA TRI', 'SO TIEN PHAT SINH'],
  },
  { semantic: 'exchangeRate', aliases: ['TY GIA', 'EXCHANGE RATE'] },
  { semantic: 'foreignAmount', aliases: ['USD', 'NGOAI TE', 'NGUYEN TE', 'FOREIGN AMOUNT', 'SO TIEN USD', 'USD AMT'] },
  { semantic: 'objectCode', aliases: ['MA KH', 'MA DOI TUONG', 'MA KHACH HANG', 'DOI TUONG', 'CUSTOMER CODE', 'VENDOR CODE'] },
  { semantic: 'customerName', aliases: ['TEN KH', 'TEN KHACH HANG', 'TEN DOI TUONG', 'CUSTOMER NAME'] },
]

export const TB_FIELDS: FieldAliases[] = [
  { semantic: 'account', core: true, aliases: ['MATK', 'MA TK', 'MA TAI KHOAN', 'TAI KHOAN', 'ACCOUNT CODE', 'TK', 'SO TAI KHOAN'] },
  { semantic: 'accountName', aliases: ['TENTK', 'TEN TK', 'TEN TAI KHOAN', 'ACCOUNT NAME', 'TEN'] },
  { semantic: 'openingDebit', aliases: ['SDNDK', 'SO DU NO DAU KY', 'SD NO DK', 'OPENING DEBIT', 'DU NO DAU KY'] },
  { semantic: 'openingCredit', aliases: ['SDCDK', 'SO DU CO DAU KY', 'SD CO DK', 'OPENING CREDIT', 'DU CO DAU KY'] },
  { semantic: 'movementDebit', aliases: ['PS NO', 'PHAT SINH NO', 'DEBIT MOVEMENT'] },
  { semantic: 'movementCredit', aliases: ['PS CO', 'PHAT SINH CO', 'CREDIT MOVEMENT'] },
  { semantic: 'closingDebit', aliases: ['NO CK', 'DU NO CUOI KY', 'SO DU NO CUOI KY', 'CLOSING DEBIT', 'NO CUOI KY'] },
  { semantic: 'closingCredit', aliases: ['CO CK', 'DU CO CUOI KY', 'SO DU CO CUOI KY', 'CLOSING CREDIT', 'CO CUOI KY'] },
]

export const IS_FIELDS: FieldAliases[] = [
  { semantic: 'maSo', core: true, aliases: ['MS', 'MA SO', 'MASO', 'CODE'] },
  { semantic: 'chiTieu', core: true, aliases: ['CHI TIEU', 'CHITIEU', 'KHOAN MUC', 'ITEM', 'CHI TIÊU'] },
  { semantic: 'currentYear', aliases: ['NAM NAY', 'CURRENT YEAR', 'KY NAY', 'SO NAM NAY', 'THIS YEAR', 'NAM 2025', 'NAM 2026'] },
  { semantic: 'priorYear', aliases: ['NAM TRUOC', 'PRIOR YEAR', 'KY TRUOC', 'SO NAM TRUOC', 'LAST YEAR', 'NAM 2024'] },
]

export const IS_SEMANTIC_LABELS: string[] = [
  'DOANH THU BAN HANG VA CUNG CAP DICH VU',
  'CAC KHOAN GIAM TRU DOANH THU',
  'DOANH THU THUAN',
  'GIA VON HANG BAN',
  'LOI NHUAN GOP',
  'DOANH THU HOAT DONG TAI CHINH',
  'CHI PHI TAI CHINH',
  'CHI PHI LAI VAY',
  'CHI PHI BAN HANG',
  'CHI PHI QUAN LY DOANH NGHIEP',
  'LOI NHUAN THUAN TU HOAT DONG KINH DOANH',
  'THU NHAP KHAC',
  'CHI PHI KHAC',
  'LOI NHUAN KHAC',
  'TONG LOI NHUAN KE TOAN TRUOC THUE',
  'CHI PHI THUE THU NHAP DOANH NGHIEP HIEN HANH',
  'CHI PHI THUE THU NHAP DOANH NGHIEP HOAN LAI',
  'LOI NHUAN SAU THUE',
]

const ALIAS_INDEX_CACHE = new Map<FieldAliases[], Map<string, string>>()

function aliasIndex(fields: FieldAliases[]): Map<string, string> {
  let idx = ALIAS_INDEX_CACHE.get(fields)
  if (!idx) {
    idx = new Map<string, string>()
    for (const f of fields) for (const a of f.aliases) idx.set(normalizeText(a), f.semantic)
    ALIAS_INDEX_CACHE.set(fields, idx)
  }
  return idx
}

export interface AliasMatchResult {
  /** semantic → column index (0-based) */
  mapping: Record<string, number | null>
  /** semantic → TẤT CẢ các cột khớp (header trùng tên, vd. hai cột "Năm nay") */
  duplicateColumns: Record<string, number[]>
  matchedCount: number
  coreMatched: number
  coreRequired: number
  evidence: Array<{ header: string; column: number; semantic: string }>
  confidence: number
}

/** Map từng ô của dòng candidate sang semantic bằng alias dictionary. */
export function matchHeaderRow(
  rowCells: unknown[],
  fields: FieldAliases[],
): AliasMatchResult {
  const idx = aliasIndex(fields)
  const mapping: Record<string, number | null> = {}
  const duplicateColumns: Record<string, number[]> = {}
  for (const f of fields) {
    mapping[f.semantic] = null
    duplicateColumns[f.semantic] = []
  }
  const evidence: AliasMatchResult['evidence'] = []
  let matchedCount = 0
  let coreMatched = 0
  const coreRequired = fields.filter((f) => f.core).length

  rowCells.forEach((rawCell, colIdx) => {
    if (rawCell == null) return
    const text = normalizeText(typeof rawCell === 'object' && !(rawCell instanceof Date) ? String((rawCell as { text?: unknown }).text ?? '') : rawCell)
    if (text === '' || text.length > 60) return
    const exact = idx.get(text)
    if (exact) {
      duplicateColumns[exact]!.push(colIdx)
      if (mapping[exact] == null) {
        mapping[exact] = colIdx
        matchedCount++
        const isCore = fields.find((f) => f.semantic === exact)?.core === true
        if (isCore) coreMatched++
        evidence.push({ header: String(rawCell), column: colIdx, semantic: exact })
      }
      return
    }
    // fuzzy: header chứa đúng 1 alias làm prefix/suffix (vd "PS NỢ (USD)")
    for (const f of fields) {
      if (mapping[f.semantic] != null) continue
      for (const a of f.aliases) {
        const na = normalizeText(a)
        if (na.length >= 4 && (text.startsWith(na + ' ') || text.endsWith(' ' + na) || text.includes(' ' + na + ' '))) {
          mapping[f.semantic] = colIdx
          matchedCount++
          if (f.core) coreMatched++
          evidence.push({ header: String(rawCell), column: colIdx, semantic: f.semantic })
          break
        }
      }
      if (mapping[f.semantic] != null) break
    }
  })

  const confidence =
    matchedCount === 0 ? 0 : Math.min(1, (coreMatched / Math.max(1, coreRequired)) * 0.75 + (matchedCount / (fields.length)) * 0.25)
  return { mapping, duplicateColumns, matchedCount, coreMatched, coreRequired, evidence, confidence }
}
