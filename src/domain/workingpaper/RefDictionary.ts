/**
 * Bảng tham chiếu mã Giấy làm việc (W/P Ref) tương ứng với từng tài khoản kế toán
 * Nguồn dữ liệu: D:\Desktop\Ref.xlsx (63 tài khoản chuẩn mực kiểm toán VACPA)
 */
export const WP_REF_MAP: Record<string, string> = {
  // Tiền & tương đương tiền
  '111': 'D190',
  '112': 'D190',
  '113': 'D190',

  // Các khoản đầu tư
  '121': 'D290',
  '128': 'D290',
  '221': 'D290',
  '222': 'D290',
  '228': 'D290',
  '229': 'D290',
  '2291': 'D290',

  // Phải thu
  '131': 'D390',
  '136': 'D390',
  '138': 'D390',
  '1388': 'D390',
  '2293': 'D390',

  // Hàng tồn kho
  '151': 'D590',
  '152': 'D590',
  '153': 'D590',
  '154': 'D590',
  '155': 'D590',
  '156': 'D590',
  '157': 'D590',
  '158': 'D590',
  '611': 'D590',
  '2294': 'D590',

  // Tài sản cố định & XDCB
  '211': 'D790',
  '212': 'D790',
  '213': 'D790',
  '214': 'D790',
  '241': 'D790',

  // Chi phí trả trước, tạm ứng, ký cược
  '141': 'D690',
  '242': 'D690',
  '244': 'D690',

  // Vay & nợ thuê tài chính
  '341': 'E190',
  '3411': 'E190',
  '3412': 'E190',
  '3414': 'E190',
  '3415': 'E190',

  // Phải trả người bán & phải trả khác
  '331': 'E290',
  '3311': 'E290',
  '3312': 'E290',
  '3381': 'E290',
  '3388': 'E290',

  // Thuế & các khoản phải nộp nhà nước
  '133': 'E390',
  '1331': 'E390',
  '1332': 'E390',
  '333': 'E390',
  '3331': 'E390',
  '3332': 'E390',
  '3333': 'E390',
  '3334': 'E390',
  '3335': 'E390',
  '3338': 'E390',
  '3339': 'E390',

  // Phải trả người lao động & trích theo lương
  '334': 'E490',
  '3341': 'E490',
  '3348': 'E490',
  '335': 'E490',
  '3382': 'E490',
  '3383': 'E490',
  '3384': 'E490',
  '3386': 'E490',
  '3387': 'E490',
  '3389': 'E490',
  '3532': 'E490',

  // Vốn chủ sở hữu
  '411': 'F100',
  '412': 'F100',
  '413': 'F100',
  '414': 'F100',
  '418': 'F100',
  '421': 'F100',

  // Doanh thu & thu nhập
  '511': 'G190',
  '515': 'G190',
  '521': 'G190',
  '711': 'G190',

  // Chi phí sản xuất & giá vốn
  '621': 'G290',
  '622': 'G290',
  '627': 'G290',
  '632': 'G290',

  // Chi phí bán hàng
  '641': 'G390',

  // Chi phí quản lý doanh nghiệp
  '642': 'G490',

  // Chi phí khác & thuế TNDN
  '811': 'G590',
  '821': 'G590',
}

/**
 * Tra cứu mã Giấy Làm Việc (W/P Ref) tương ứng với một tài khoản kế toán
 * Ưu tiên khớp 4 số -> 3 số -> 2 số
 */
export function getWorkingPaperRef(account: string): string {
  if (!account) return ''
  const clean = account.trim()

  // 1. Khớp 4 số
  if (clean.length >= 4 && WP_REF_MAP[clean.slice(0, 4)]) {
    return WP_REF_MAP[clean.slice(0, 4)]!
  }

  // 2. Khớp 3 số
  if (clean.length >= 3 && WP_REF_MAP[clean.slice(0, 3)]) {
    return WP_REF_MAP[clean.slice(0, 3)]!
  }

  // 3. Khớp 2 số
  if (clean.length >= 2 && WP_REF_MAP[clean.slice(0, 2)]) {
    return WP_REF_MAP[clean.slice(0, 2)]!
  }

  return ''
}
