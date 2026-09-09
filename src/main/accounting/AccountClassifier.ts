import { coerceAccountCode } from '../../shared/utils/text'

/** Tên hiển thị TK cấp 1 theo TT200 (dùng cho UI/report). */
export const VN_ACCOUNT_NAMES: Record<string, string> = {
  '111': 'Tiền mặt', '112': 'Tiền gửi ngân hàng', '113': 'Tiền đang chuyển',
  '121': 'Chứng khoán kinh doanh', '128': 'Đầu tư nắm giữ đến ngày đáo hạn',
  '131': 'Phải thu khách hàng', '132': 'Trả trước cho người bán', '133': 'Thuế GTGT được khấu trừ',
  '136': 'Phải thu nội bộ', '138': 'Phải thu khác', '141': 'Tạm ứng',
  '151': 'Hàng mua đang đi đường', '152': 'Nguyên vật liệu', '153': 'Công cụ dụng cụ',
  '154': 'Chi phí SXKD dở dang', '155': 'Thành phẩm', '156': 'Hàng hóa', '157': 'Hàng gửi bán', '158': 'Hàng tồn kho bất thường',
  '211': 'TSCĐ hữu hình', '212': 'TSCĐ thuê tài chính', '213': 'TSCĐ vô hình', '214': 'Hao mòn TSCĐ',
  '217': 'TSCĐ dở dang', '221': 'Đầu tư vào công ty con', '222': 'Đầu tư vào công ty liên doanh, liên kết',
  '228': 'Đầu tư góp vốn vào đơn vị khác', '229': 'Dự phòng giảm giá đầu tư dài hạn',
  '241': 'Xây dựng cơ bản dở dang', '242': 'Chi phí trả trước', '244': 'Tài sản cầm cố, thế chấp',
  '331': 'Phải trả người bán', '333': 'Thuế và các khoản phải nộp NN', '334': 'Phải trả người lao động',
  '335': 'Chi phí phải trả', '336': 'Phải trả nội bộ', '337': 'Phải trả theo tiến độ HĐ XD',
  '338': 'Phải trả, phải nộp khác', '341': 'Vay và nợ thuê tài chính', '343': 'Phát hành cổ phiếu lại',
  '352': 'Quỹ dự phòng tài chính', '411': 'Vốn đầu tư của CSH', '412': 'Thặng dư vốn CP',
  '413': 'Chênh lệch tỷ giá hối đoái', '414': 'Quỹ đầu tư phát triển', '418': 'Các quỹ thuộc vốn CSH',
  '419': 'Quỹ khác thuộc vốn CSH', '421': 'LNST chưa phân phối',
  '511': 'Doanh thu bán hàng & CCDV', '515': 'Doanh thu HĐTC', '521': 'Các khoản giảm trừ DT', '711': 'Thu nhập khác',
  '611': 'Mua hàng', '621': 'Chi phí NVL trực tiếp', '622': 'Chi phí nhân công trực tiếp',
  '623': 'Chi phí sử dụng máy thi công', '627': 'Chi phí sản xuất chung', '631': 'Giá thành thực tế NVL/TPhẩm',
  '632': 'Giá vốn hàng bán', '635': 'Chi phí tài chính', '641': 'Chi phí bán hàng',
  '642': 'Chi phí QLDN', '811': 'Chi phí khác', '821': 'Chi phí thuế TNDN', '911': 'Xác định KQKD',
}

const VALID_ACCOUNT_RE = /^[0-9]{1,10}[A-Z]*$/

export function isValidAccountCode(code: string): boolean {
  return code !== '' && VALID_ACCOUNT_RE.test(code)
}

export function normalizeAccount(v: unknown): { code: string; valid: boolean } {
  const code = coerceAccountCode(v)
  return { code, valid: isValidAccountCode(code) }
}

/** Prefix-based hierarchy: isAccount('64276','642') === true (§7). */
export function isAccount(account: string, groupPrefix: string): boolean {
  if (!account || !groupPrefix) return false
  const a = coerceAccountCode(account)
  const g = coerceAccountCode(groupPrefix)
  if (!a || !g) return false
  return a.startsWith(g)
}

export function accountLevel(account: string): number {
  const code = coerceAccountCode(account)
  // TT200: cấp 1 = 3 chữ số; mỗi cấp tiếp theo +1 chữ số
  if (code.length <= 3) return 1
  return Math.min(1 + (code.length - 3), 6)
}

/** Chuỗi prefix cha→con: '64276' → ['642','6427','64276']. */
export function accountChain(account: string): string[] {
  const code = coerceAccountCode(account)
  const chain: string[] = []
  if (code.length >= 3) {
    chain.push(code.slice(0, 3))
    for (let i = 4; i <= code.length; i++) chain.push(code.slice(0, i))
  }
  return chain
}

export function displayName(account: string): string {
  const l1 = coerceAccountCode(account).slice(0, 3)
  return VN_ACCOUNT_NAMES[l1] ?? ''
}
