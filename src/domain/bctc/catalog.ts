/** ===== Danh mục tài khoản – mirror sheet DM_ChiTieu (62 TK cấp 1) ===== */
export type BaoCao = 'CDKT' | 'KQKD'
export type Nhom = 'TS' | 'NV' | 'DT' | 'CP'

export interface DanhMucTaiKhoan {
  tk3: string
  baoCao: BaoCao
  nhom: Nhom
  chiTieu: string
  quyTacChay: string
}

function tk(tk3: string, baoCao: BaoCao, nhom: Nhom, chiTieu: string, quyTacChay: string): DanhMucTaiKhoan {
  return { tk3, baoCao, nhom, chiTieu, quyTacChay }
}

const NO_TANG = 'Nợ tăng, Có giảm'
const CO_TANG = 'Có tăng, Nợ giảm'

export const DANH_MUC_TAI_KHOAN: readonly DanhMucTaiKhoan[] = [
  // ── CDKT · Tài sản ──
  tk('111', 'CDKT', 'TS', 'Tiền', NO_TANG),
  tk('112', 'CDKT', 'TS', 'Tiền', NO_TANG),
  tk('113', 'CDKT', 'TS', 'Tiền', NO_TANG),
  tk('121', 'CDKT', 'TS', 'Chứng khoán kinh doanh', NO_TANG),
  tk('128', 'CDKT', 'TS', 'Đầu tư nắm giữ đến ngày đáo hạn', NO_TANG),
  tk('131', 'CDKT', 'TS', 'Phải thu khách hàng', NO_TANG),
  tk('132', 'CDKT', 'TS', 'Phải thu khách hàng', NO_TANG),
  tk('133', 'CDKT', 'TS', 'Thuế giá trị gia tăng được khấu trừ', NO_TANG),
  tk('136', 'CDKT', 'TS', 'Phải thu nội bộ', NO_TANG),
  tk('138', 'CDKT', 'TS', 'Phải thu khác', NO_TANG),
  tk('141', 'CDKT', 'TS', 'Tạm ứng', NO_TANG),
  tk('151', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('152', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('153', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('154', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('155', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('156', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('157', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('158', 'CDKT', 'TS', 'Hàng tồn kho', NO_TANG),
  tk('211', 'CDKT', 'TS', 'Tài sản cố định hữu hình', NO_TANG),
  tk('212', 'CDKT', 'TS', 'Tài sản cố định thuê tài chính', NO_TANG),
  tk('213', 'CDKT', 'TS', 'Tài sản cố định vô hình', NO_TANG),
  tk('214', 'CDKT', 'TS', 'Hao mòn TSCĐ', CO_TANG),
  tk('217', 'CDKT', 'TS', 'TSCĐ dở dang', NO_TANG),
  tk('221', 'CDKT', 'TS', 'Đầu tư vào công ty con', NO_TANG),
  tk('222', 'CDKT', 'TS', 'Đầu tư vào công ty liên doanh, liên kết', NO_TANG),
  tk('228', 'CDKT', 'TS', 'Đầu tư góp vốn vào đơn vị khác', NO_TANG),
  tk('229', 'CDKT', 'TS', 'Dự phòng tổn thất tài sản', CO_TANG),
  tk('241', 'CDKT', 'TS', 'Xây dựng cơ bản dở dang', NO_TANG),
  tk('242', 'CDKT', 'TS', 'Chi phí trả trước', NO_TANG),
  tk('244', 'CDKT', 'TS', 'Tài sản cầm cố, thế chấp', NO_TANG),
  tk('331', 'CDKT', 'NV', 'Phải trả người bán', CO_TANG),
  tk('333', 'CDKT', 'NV', 'Thuế và các khoản phải nộp Nhà nước', CO_TANG),
  tk('334', 'CDKT', 'NV', 'Phải trả người lao động', CO_TANG),
  tk('335', 'CDKT', 'NV', 'Chi phí phải trả', CO_TANG),
  tk('336', 'CDKT', 'NV', 'Phải trả nội bộ', CO_TANG),
  tk('337', 'CDKT', 'NV', 'Phải trả theo tiến độ kế hoạch', CO_TANG),
  tk('338', 'CDKT', 'NV', 'Phải trả, phải nộp khác', CO_TANG),
  tk('341', 'CDKT', 'NV', 'Vay và nợ thuê tài chính', CO_TANG),
  tk('352', 'CDKT', 'NV', 'Dự phòng phải trả', CO_TANG),
  tk('353', 'CDKT', 'NV', 'Quỹ khen thưởng, phúc lợi', CO_TANG),
  tk('356', 'CDKT', 'NV', 'Quỹ phát triển khoa học và công nghệ', CO_TANG),
  tk('411', 'CDKT', 'NV', 'Vốn đầu tư của chủ sở hữu', CO_TANG),
  tk('412', 'CDKT', 'NV', 'Thặng dư vốn cổ phần', CO_TANG),
  tk('413', 'CDKT', 'NV', 'Chênh lệch tỷ giá hối đoái', CO_TANG),
  tk('414', 'CDKT', 'NV', 'Quỹ đầu tư phát triển', CO_TANG),
  tk('418', 'CDKT', 'NV', 'Các quỹ thuộc vốn chủ sở hữu', CO_TANG),
  tk('419', 'CDKT', 'NV', 'Quỹ khác thuộc vốn chủ sở hữu', CO_TANG),
  tk('421', 'CDKT', 'NV', 'Lợi nhuận sau thuế chưa phân phối', CO_TANG),
  tk('511', 'KQKD', 'DT', 'Doanh thu bán hàng và cung cấp dịch vụ', CO_TANG),
  tk('515', 'KQKD', 'DT', 'Doanh thu hoạt động tài chính', CO_TANG),
  tk('521', 'KQKD', 'DT', 'Các khoản giảm trừ doanh thu', NO_TANG),
  tk('711', 'KQKD', 'DT', 'Thu nhập khác', CO_TANG),
  // ── KQKD · Chi phí ──
  tk('611', 'KQKD', 'CP', 'Giá vốn hàng bán', NO_TANG),
  tk('621', 'KQKD', 'CP', 'Giá vốn hàng bán', NO_TANG),
  tk('622', 'KQKD', 'CP', 'Giá vốn hàng bán', NO_TANG),
  tk('623', 'KQKD', 'CP', 'Giá vốn hàng bán', NO_TANG),
  tk('627', 'KQKD', 'CP', 'Giá vốn hàng bán', NO_TANG),
  tk('631', 'KQKD', 'CP', 'Giá vốn hàng bán', NO_TANG),
  tk('632', 'KQKD', 'CP', 'Giá vốn hàng bán', NO_TANG),
  tk('635', 'KQKD', 'CP', 'Chi phí tài chính', NO_TANG),
  tk('641', 'KQKD', 'CP', 'Chi phí bán hàng', NO_TANG),
  tk('642', 'KQKD', 'CP', 'Chi phí quản lý doanh nghiệp', NO_TANG),
  tk('811', 'KQKD', 'CP', 'Chi phí khác', NO_TANG),
  tk('821', 'KQKD', 'CP', 'Chi phí thuế thu nhập doanh nghiệp', NO_TANG),
]

export const TK_GIA_VON = new Set(['611', '621', '622', '623', '627', '631', '632'])

/** ===== Danh mục chỉ tiêu BCTC chuẩn (mirror sheet Anh huong BCTC) ===== */
export interface ChiTieuChuan {
  maSo: string
  chiTieu: string
}

export const CHI_TIEU_CDKT_CHUAN: readonly ChiTieuChuan[] = [
  { maSo: '100', chiTieu: 'A. TÀI SẢN NGẮN HẠN' },
  { maSo: '110', chiTieu: 'I. Tiền và tương đương tiền' },
  { maSo: '111', chiTieu: 'Tiền' },
  { maSo: '112', chiTieu: 'Tiền gửi ngân hàng' },
  { maSo: '113', chiTieu: 'Tiền đang chuyển' },
  { maSo: '120', chiTieu: 'II. Đầu tư tài chính ngắn hạn' },
  { maSo: '121', chiTieu: 'Chứng khoán kinh doanh' },
  { maSo: '128', chiTieu: 'Đầu tư nắm giữ đến ngày đáo hạn' },
  { maSo: '131', chiTieu: 'Phải thu khách hàng' },
  { maSo: '136', chiTieu: 'Phải thu nội bộ ngắn hạn' },
  { maSo: '138', chiTieu: 'Phải thu khác' },
  { maSo: '141', chiTieu: 'Tạm ứng' },
  { maSo: '150', chiTieu: 'III. Hàng tồn kho' },
  { maSo: '151', chiTieu: 'Hàng mua đang đi đường' },
  { maSo: '152', chiTieu: 'Nguyên vật liệu' },
  { maSo: '153', chiTieu: 'Công cụ dụng cụ' },
  { maSo: '154', chiTieu: 'Chi phí sản xuất kinh doanh dở dang' },
  { maSo: '155', chiTieu: 'Thành phẩm' },
  { maSo: '156', chiTieu: 'Hàng hóa' },
  { maSo: '157', chiTieu: 'Hàng gửi bán' },
  { maSo: '210', chiTieu: 'Tài sản cố định' },
  { maSo: '211', chiTieu: 'TSCĐ hữu hình' },
  { maSo: '212', chiTieu: 'TSCĐ thuê tài chính' },
  { maSo: '213', chiTieu: 'TSCĐ vô hình' },
  { maSo: '214', chiTieu: 'Hao mòn TSCĐ' },
  { maSo: '242', chiTieu: 'Chi phí trả trước' },
  { maSo: '413', chiTieu: 'Chênh lệch tỷ giá hối đoái' },
  { maSo: '421', chiTieu: 'Lợi nhuận sau thuế chưa phân phối' },
]

export const CHI_TIEU_KQKD_CHUAN: readonly ChiTieuChuan[] = [
  { maSo: '01', chiTieu: 'Doanh thu bán hàng và cung cấp dịch vụ' },
  { maSo: '02', chiTieu: 'Các khoản giảm trừ doanh thu' },
  { maSo: '10', chiTieu: 'Doanh thu thuần' },
  { maSo: '11', chiTieu: 'Giá vốn hàng bán' },
  { maSo: '25', chiTieu: 'Chi phí bán hàng' },
  { maSo: '26', chiTieu: 'Chi phí quản lý doanh nghiệp' },
  { maSo: '30', chiTieu: 'Doanh thu hoạt động tài chính' },
  { maSo: '31', chiTieu: 'Chi phí tài chính' },
  { maSo: '40', chiTieu: 'Chi phí khác' },
  { maSo: '51', chiTieu: 'Thu nhập khác' },
  { maSo: '60', chiTieu: 'Lợi nhuận gộp' },
  { maSo: '70', chiTieu: 'Lợi nhuận thuần từ hoạt động kinh doanh' },
]
