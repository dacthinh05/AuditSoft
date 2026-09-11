/**
 * PartnerExtractor Engine
 * Chuyên bóc tách Mã đối tượng (partnerCode) và Tên đối tác (partnerName)
 * từ các tài khoản công nợ/đối tượng có gắn đuôi (vd 3311ABC, 1311SH, 1411NAM, 1388_CTYA)
 * kết hợp với tra cứu Bảng CĐSPS (CDFS) hoặc nhận diện từ Diễn giải.
 */

export interface ExtractedPartnerResult {
  partnerCode: string | null
  partnerName: string | null
}

const PARTNER_ACCOUNT_PREFIXES = ['131', '331', '141', '138', '338', '128', '341']

/**
 * Trích xuất tên công ty/đối tác từ chuỗi diễn giải kế toán
 */
export function extractVendorNameFromDesc(desc: string | null | undefined): string | null {
  if (!desc) return null
  const upper = desc.toUpperCase()

  // Bắt các tiền tố pháp lý thông dụng trong diễn giải
  const match = upper.match(
    /(?:CÔNG TY|CTY|TNHH|CP|DOANH NGHIỆP|DNTN|NCC|NHÀ CUNG CẤP|ĐỐI TÁC|KHÁCH HÀNG|KH)\s+([^,;.\-_/\(\)]+)/i,
  )
  if (match && match[1]) {
    const clean = match[1].trim()
    if (clean.length >= 2 && !/^\d+$/.test(clean)) {
      return match[0].trim()
    }
  }
  return null
}

/**
 * Phân tách tài khoản kế toán công nợ nếu có gắn đuôi mã đối tượng
 * Ví dụ:
 * - 3311ABC -> code: 'ABC'
 * - 331_DBL -> code: 'DBL'
 * - 131.VINAMILK -> code: 'VINAMILK'
 * - 1311SH -> code: 'SH'
 * - 1411THINH -> code: 'THINH'
 * - 1111, 1121, 1521, 6421 -> null (không phải tài khoản công nợ chứa mã)
 */
export function extractPartnerCodeFromAccount(account: string | null | undefined): string | null {
  if (!account) return null
  const raw = account.trim().toUpperCase()

  // Kiểm tra tài khoản có thuộc nhóm đối tượng hay không
  const isTarget = PARTNER_ACCOUNT_PREFIXES.some((p) => raw.startsWith(p))
  if (!isTarget) return null

  // 1. Trường hợp có dấu phân cách rõ ràng: 331_ABC, 3311_DBL, 331.XYZ, 331-DBL
  const sepMatch = raw.match(/^(131\d*|331\d*|141\d*|138\d*|338\d*|128\d*|341\d*)[\s._\-\/]([A-Z0-9_\-]+)$/)
  if (sepMatch && sepMatch[2]) {
    const sub = sepMatch[2].trim()
    if (sub.length >= 1 && !/^\d{1,2}$/.test(sub)) {
      return sub
    }
  }

  // 2. Trường hợp gắn chữ cái trực tiếp: 3311ABC, 1311SH, 331BMW, 1411NAM
  const directAlphaMatch = raw.match(/^(131\d*|331\d*|141\d*|138\d*|338\d*|128\d*|341\d*)([A-Z][A-Z0-9_\-]*)$/)
  if (directAlphaMatch && directAlphaMatch[2]) {
    return directAlphaMatch[2].trim()
  }

  return null
}

/**
 * Trích xuất toàn diện Mã và Tên đối tác từ một dòng bút toán
 */
export function resolveEntryPartner(
  debitAccount: string | null | undefined,
  creditAccount: string | null | undefined,
  existingCode: string | null | undefined,
  existingName: string | null | undefined,
  description: string | null | undefined,
  cdfsNamesMap?: Map<string, string>,
): ExtractedPartnerResult {
  // 1. Nếu đã có sẵn mã và tên từ cột riêng trong file -> Sử dụng luôn
  const cleanCode = existingCode?.trim() || null
  const cleanName = existingName?.trim() || null

  if (cleanCode && cleanName) {
    return { partnerCode: cleanCode, partnerName: cleanName }
  }

  // 2. Thử bóc tách mã từ TK Nợ hoặc TK Có
  let extractedCode = cleanCode
  let sourceAccount = ''

  if (!extractedCode) {
    const fromDebit = extractPartnerCodeFromAccount(debitAccount)
    if (fromDebit) {
      extractedCode = fromDebit
      sourceAccount = debitAccount?.trim() || ''
    } else {
      const fromCredit = extractPartnerCodeFromAccount(creditAccount)
      if (fromCredit) {
        extractedCode = fromCredit
        sourceAccount = creditAccount?.trim() || ''
      }
    }
  }

  // 3. Tra cứu Tên đối tác
  let resolvedName = cleanName

  // Ưu tiên tra cứu từ Bảng CĐSPS nếu có
  if (!resolvedName && sourceAccount && cdfsNamesMap) {
    const cdfsName = cdfsNamesMap.get(sourceAccount) || cdfsNamesMap.get(sourceAccount.toUpperCase())
    if (cdfsName && cdfsName.trim()) {
      resolvedName = cdfsName.trim()
    }
  }

  // Nếu vẫn chưa có tên -> Quét từ cột Diễn giải
  if (!resolvedName && description) {
    resolvedName = extractVendorNameFromDesc(description)
  }

  // Nếu vẫn không có tên -> Fallback về mã đối tác
  if (!resolvedName && extractedCode) {
    resolvedName = `Đối tác ${extractedCode}`
  }

  return {
    partnerCode: extractedCode,
    partnerName: resolvedName,
  }
}
