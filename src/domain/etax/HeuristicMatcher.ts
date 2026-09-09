/**
 * Heuristic Matcher: Đối chiếu và ánh xạ các chỉ tiêu và phụ lục tờ khai thuế
 * Cung cấp từ điển tên gọi chuẩn theo quy định của Tổng cục Thuế
 */
export class HeuristicMatcher {
  /** Từ điển tên tiếng Việt chuẩn của các chỉ tiêu chính và phụ lục */
  public static readonly INDICATOR_NAMES: Record<string, string> = {
    ctA1: 'Tổng lợi nhuận kế toán trước thuế',
    ctB1: 'Điều chỉnh tăng tổng lợi nhuận trước thuế',
    ctB2: 'Các khoản điều chỉnh tăng doanh thu',
    ctB3: 'Chi phí của phần doanh thu điều chỉnh giảm',
    ctB4: 'Các khoản chi không được trừ khi xác định TNCT',
    ctB5: 'Thuế TNDN đã nộp cho phần thu nhập ở nước ngoài',
    ctB6: 'Điều chỉnh tăng LN do chênh lệch tỷ giá',
    ctB7: 'Các khoản điều chỉnh tăng khác',
    ctB8: 'Điều chỉnh giảm tổng lợi nhuận trước thuế',
    ctB9: 'Giảm trừ do xác định lại doanh thu',
    ctB10: 'Giảm trừ do xác định lại chi phí',
    ctB11: 'Thu nhập được miễn thuế (cổ tức, chia lãi...)',
    ctB12: 'Chuyển lỗ từ các năm trước',
    ctB13: 'Giảm do chênh lệch tỷ giá hối đoái',
    ctB14: 'Các khoản điều chỉnh giảm khác',
    ctB15: 'Tổng chi phí lãi vay không được trừ (Nghị định 132)',
    ctC1: 'Thu nhập chịu thuế (= A1 + B1 - B8)',
    ctC2: 'Thu nhập miễn thuế',
    ctC3: 'Lỗ chuyển kỳ này (= C3a + C3b)',
    ctC3a: 'Lỗ từ hoạt động SXKD chuyển sang',
    ctC3b: 'Lỗ từ chuyển nhượng BĐS chuyển sang',
    ctC4: 'Thu nhập tính thuế (= C1 - C2 - C3)',
    ctC5: 'Phần trích lập Quỹ KH&CN (nếu có)',
    ctC6: 'Thu nhập tính thuế sau trích lập Quỹ',
    ctC7: 'Thu nhập tính thuế áp dụng thuế suất 20%',
    ctC7_thuNhap: 'Thu nhập tính thuế tính theo thuế suất 20%',
    ctC8: 'Thu nhập tính thuế áp dụng thuế suất ưu đãi',
    ctC9: 'Thuế TNDN tính theo thuế suất 20%',
    ctC10: 'Thuế TNDN tính theo thuế suất ưu đãi',
    ctC11: 'Thuế TNDN chênh lệch do áp dụng thuế suất ưu đãi',
    ctC12: 'Thuế TNDN được miễn, giảm',
    ctC13: 'Thuế TNDN nộp ở nước ngoài được trừ',
    ctC14: 'Thuế TNDN phải nộp từ SXKD',
    ctC15: 'Thuế TNDN được gia hạn',
    ctC16: 'Thuế TNDN không được gia hạn',
    ctC17: 'Thuế TNDN phải nộp sau gia hạn',
    ctD1: 'Thu nhập chịu thuế từ chuyển nhượng BĐS',
    ctD2: 'Lỗ từ chuyển nhượng BĐS năm trước chuyển sang',
    ctD3: 'Thu nhập tính thuế từ chuyển nhượng BĐS',
    ctD4: 'Thuế TNDN từ chuyển nhượng BĐS',
    ctD5: 'Thuế TNDN từ BĐS được miễn, giảm',
    ctD6: 'Thuế TNDN phải nộp từ chuyển nhượng BĐS',
    ctD7: 'Thuế TNDN từ BĐS được gia hạn',
    ctD8: 'Thuế TNDN từ BĐS phải nộp sau gia hạn',
    ctE: 'Tổng số thuế TNDN đã tạm nộp trong năm',
    ctE1: 'Thuế TNDN tạm nộp các quý từ SXKD',
    ctE2: 'Thuế TNDN tạm nộp các quý từ BĐS',
    ctE3: 'Thuế TNDN tạm nộp khác',
    ctG: 'Tổng số thuế TNDN đã nộp',
    ctG1: 'Số thuế TNDN nộp thừa sau quyết toán',
    ctG2: 'Số thuế TNDN còn phải nộp sau quyết toán',
    // Phụ lục 03-1A
    ct01: 'Doanh thu bán hàng và cung cấp dịch vụ',
    ct02: 'Doanh thu bán hàng cho các bên liên kết',
    ct03: 'Các khoản giảm trừ doanh thu',
    ct04: 'Doanh thu thuần về bán hàng và CCDV',
    ct05: 'Doanh thu thuần cho các bên liên kết',
    ct06: 'Giá vốn hàng bán',
    ct07: 'Giá vốn hàng bán cho các bên liên kết',
    ct08: 'Lợi nhuận gộp về bán hàng và CCDV',
    ct09: 'Doanh thu hoạt động tài chính',
    ct10: 'Chi phí tài chính',
    ct11: 'Trong đó: Chi phí lãi vay',
    ct12: 'Chi phí lãi vay từ các bên liên kết',
    ct13: 'Chi phí bán hàng',
    ct14: 'Chi phí quản lý doanh nghiệp',
    ct15: 'Lợi nhuận thuần từ hoạt động kinh doanh',
    ct16: 'Thu nhập khác',
    ct17: 'Chi phí khác',
    ct18: 'Lợi nhuận khác',
    ct19: 'Tổng lợi nhuận kế toán trước thuế (khớp [A1])',
    ct20: 'Chi phí thuế TNDN hiện hành',
    ct21: 'Chi phí thuế TNDN hoãn lại',
    ct22: 'Lợi nhuận sau thuế TNDN',
    ctM_GCN: 'Mã số giấy chứng nhận đăng ký kinh doanh liên kết',
  }

  /** Danh mục tên hiển thị của các phụ lục thuế */
  public static readonly APPENDIX_NAMES: Record<string, string> = {
    PLuc_03_1A_TNDN: 'Phụ lục 03-1A: Kết quả hoạt động SXKD',
    PL03_1A_TNDN: 'Phụ lục 03-1A: Kết quả hoạt động SXKD',
    PL03_1A: 'Phụ lục 03-1A: Kết quả hoạt động SXKD',
    BangKe_03_1A: 'Phụ lục 03-1A: Kết quả hoạt động SXKD',
    PLuc_03_2A_TNDN: 'Phụ lục 03-2A: Bảng chuyển lỗ',
    PL03_2A_TNDN: 'Phụ lục 03-2A: Bảng chuyển lỗ',
    PL03_2A: 'Phụ lục 03-2A: Bảng chuyển lỗ',
    PLuc_03_3A_TNDN: 'Phụ lục 03-3A: Thuế TNDN ưu đãi đầu tư mới',
    PL03_3A_TNDN: 'Phụ lục 03-3A: Thuế TNDN ưu đãi đầu tư mới',
    PLuc_03_5_TNDN: 'Phụ lục 03-5: Thuế TNDN đã nộp ở nước ngoài',
    PL03_5_TNDN: 'Phụ lục 03-5: Thuế TNDN đã nộp ở nước ngoài',
    PLuc_03_8A_TNDN: 'Phụ lục 03-8A: Phân bổ thuế TNDN cho cơ sở khác tỉnh',
    PL03_8A_TNDN: 'Phụ lục 03-8A: Phân bổ thuế TNDN cho cơ sở khác tỉnh',
    'PL_GDLK2-01': 'Phụ lục GDLK-01: Quan hệ & Giao dịch liên kết (NĐ 132)',
    'PL_GDLK2-02': 'Phụ lục GDLK-02: Danh mục hồ sơ thông tin tập đoàn (NĐ 132)',
    'PL_GDLK2-03': 'Phụ lục GDLK-03: Báo cáo lợi nhuận liên kết (NĐ 132)',
    'PL_GDLK2-04': 'Phụ lục GDLK-04: Kê khai các bên liên kết (NĐ 132)',
  }

  /** Lấy tên hiển thị của một phụ lục */
  public static getAppendixTitle(tag: string): string {
    return HeuristicMatcher.APPENDIX_NAMES[tag] || `Phụ lục ${tag}`
  }

  /** Lấy tên hiển thị của một mã chỉ tiêu */
  public static getIndicatorName(code: string): string {
    const key = code.startsWith('ct') ? code : `ct${code}`
    return HeuristicMatcher.INDICATOR_NAMES[key] || `Chỉ tiêu ${code}`
  }

  /** Chuẩn hóa mã chỉ tiêu: [A1] -> ctA1, 01 -> ct01, ctA1 -> ctA1 */
  public static normalizeIndicatorCode(raw: string): string {
    const clean = raw.replace(/[\[\]\s]/g, '').trim()
    return clean.startsWith('ct') ? clean : `ct${clean}`
  }
}
