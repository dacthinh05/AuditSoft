/**
 * Cấu trúc kiểu dữ liệu cho Module Chuyển Đổi QTT TNDN (03/TNDN)
 * Hỗ trợ chuyển đổi từ TT 151/2014, TT 156/2013 sang TT 80/2021/TT-BTC
 */

/** Node cây XML độc lập không phụ thuộc DOMParser của trình duyệt */
export interface XmlNode {
  tag: string
  attributes: Record<string, string>
  children: XmlNode[]
  text: string
  parent?: XmlNode | null
}

/** Thông tin chung tờ khai (<TTinChung>) */
export interface TaxGeneralInfo {
  maTKhai: string
  tenTKhai: string
  pbanXml: string
  loaiTKhai: 'C' | 'B' // C: Chính thức, B: Bổ sung
  soLan?: number
  mst: string
  tenNNT: string
  dchiNNT?: string
  ngayNop?: string
  cqtNoiNop?: {
    maCQT?: string
    tenCQT?: string
  }
  kyKKhai: {
    kieuKy: 'N' | 'Q' | 'M' // N: Năm, Q: Quý, M: Tháng
    kyKKhaiTuNgay: string
    kyKKhaiDenNgay: string
    kyKKhaiTuThang?: string
    kyKKhaiDenThang?: string
  }
  nganhNgheKD?: string
}

/** 
 * Các chỉ tiêu Tờ khai chính 03/TNDN
 * Hỗ trợ cả tên thẻ cũ (<ctA1>, <ctB1>) và cấu trúc TT 80
 */
export interface Qtt03MainIndicators {
  // Nhóm A: Kết quả kinh doanh
  ctA1: number // Lợi nhuận kế toán trước thuế

  // Nhóm B: Điều chỉnh tăng/giảm LNTT
  ctB1: number // Điều chỉnh tăng LNTT
  ctB2: number // Các khoản điều chỉnh tăng doanh thu
  ctB3: number // Chi phí của phần doanh thu điều chỉnh giảm
  ctB4: number // Các khoản chi không được trừ
  ctB5: number // Thuế TNDN đã nộp cho phần thu nhập nhận được ở nước ngoài
  ctB6: number // Điều chỉnh tăng LN do chênh lệch tỷ giá
  ctB7: number // Các khoản điều chỉnh tăng khác
  ctB8: number // Điều chỉnh giảm LNTT
  ctB9: number // Giảm trừ do xác định lại doanh thu
  ctB10: number // Giảm trừ do xác định lại chi phí
  ctB11: number // Thu nhập được miễn thuế (cổ tức, lợi nhuận chia...)
  ctB12: number // Chuyển lỗ từ các năm trước
  ctB13: number // Giảm do chênh lệch tỷ giá
  ctB14: number // Các khoản điều chỉnh giảm khác

  // Nhóm C: Thu nhập tính thuế & Thuế TNDN phải nộp
  ctC1: number // Thu nhập chịu thuế (= A1 + B1 - B8)
  ctC2: number // Thu nhập miễn thuế
  ctC3: number // Lỗ chuyển kỳ này (= C3a + C3b)
  ctC3a: number // Lỗ từ SXKD
  ctC3b: number // Lỗ từ BĐS
  ctC4: number // Thu nhập tính thuế (= C1 - C2 - C3)
  ctC5: number // Quỹ KH&CN
  ctC6: number // Thu nhập tính thuế sau trích lập Quỹ
  ctC7: number // Tính theo thuế suất 20%
  ctC8: number // Tính theo thuế suất ưu đãi
  ctC9: number // Thuế suất khác
  ctC10: number // Thuế TNDN phát sinh từ SXKD
  ctC11: number // Thuế TNDN được miễn, giảm
  ctC12: number // Thuế TNDN đã nộp ở nước ngoài được trừ
  ctC13: number // Thuế TNDN phải nộp từ SXKD
  ctC14: number // Thuế TNDN được gia hạn
  ctC15: number // Thuế TNDN không được gia hạn
  ctC16: number // Thuế TNDN phải nộp sau gia hạn

  // Nhóm D: Hoạt động chuyển nhượng BĐS
  ctD1: number // Thu nhập chịu thuế từ BĐS
  ctD2: number // Lỗ từ BĐS năm trước chuyển sang
  ctD3: number // Thu nhập tính thuế từ BĐS
  ctD4: number // Thuế TNDN từ BĐS
  ctD5: number // Thuế TNDN từ BĐS được miễn, giảm
  ctD6: number // Thuế TNDN phải nộp từ BĐS
  ctD7: number // Thuế TNDN từ BĐS được gia hạn
  ctD8: number // Thuế TNDN từ BĐS phải nộp sau gia hạn

  // Nhóm E: Thuế TNDN tạm nộp trong năm
  ctE1: number // Tổng số thuế TNDN đã tạm nộp trong năm
  ctE2: number // Tạm nộp từ SXKD
  ctE3: number // Tạm nộp từ BĐS
  ctE4: number // Tạm nộp khác

  // Nhóm G: Chênh lệch sau quyết toán
  ctG1: number // Số thuế TNDN nộp thừa
  ctG2: number // Số thuế TNDN còn phải nộp
}

/** Phụ lục 03-1A/TNDN: Kết quả hoạt động SXKD (19 chỉ tiêu) */
export interface QttPL03_1AData {
  ct01: number // Doanh thu bán hàng và cung cấp dịch vụ
  ct02: number // Doanh thu bán hàng cho các bên liên kết
  ct03: number // Các khoản giảm trừ doanh thu
  ct04: number // Doanh thu thuần về bán hàng và CCDV (= 01 - 03)
  ct05: number // Doanh thu thuần cho các bên liên kết
  ct06: number // Giá vốn hàng bán
  ct07: number // Giá vốn hàng bán từ các bên liên kết
  ct08: number // Lợi nhuận gộp về bán hàng và CCDV (= 04 - 06)
  ct09: number // Doanh thu hoạt động tài chính
  ct10: number // Chi phí tài chính
  ct11: number // Trong đó: Chi phí lãi vay
  ct12: number // Chi phí lãi vay từ các bên liên kết
  ct13: number // Chi phí bán hàng
  ct14: number // Chi phí quản lý doanh nghiệp
  ct15: number // Lợi nhuận thuần từ hoạt động kinh doanh (= 08 + 09 - 10 - 13 - 14)
  ct16: number // Thu nhập khác
  ct17: number // Chi phí khác
  ct18: number // Lợi nhuận khác (= 16 - 17)
  ct19: number // Tổng lợi nhuận kế toán trước thuế (= 15 + 18) -> Khớp với [A1]
}

/** Dòng chi tiết chuyển lỗ trong Phụ lục 03-2A/TNDN */
export interface QttPL03_2ARow {
  stt: number
  loaiChuyenLo?: string // 'SXKD' hoặc 'BDS'
  namPhatSinh: number // Ví dụ 2019, 2020
  soLoPhatSinh: number
  soLoDaChuyen: number // Số lỗ đã chuyển các kỳ trước
  soLoChuyenKyNay: number // Số lỗ chuyển trong kỳ này
  soLoConLai: number // Số lỗ còn được chuyển sang các kỳ sau
}

/** Phụ lục 03-8A/TNDN: Bảng phân bổ thuế TNDN cho cơ sở khác tỉnh (TT 80) */
export interface QttPL03_8ARow {
  stt: number
  tenCoSo: string
  mstCoSo?: string
  cqtCoSo: string
  tyLePhanBo: number // 1 = 100%
  soThuePhanBo: number
}

/** Chi tiết đối chiếu của từng phụ lục đính kèm */
export interface AppendixMeta {
  tag: string
  name: string
  fieldCount: number
  diffs: DiffItem[]
}

/** Toàn bộ dữ liệu của tờ khai 03/TNDN */
export interface Qtt03Document {
  version: 'TT151' | 'TT80' | 'UNKNOWN'
  generalInfo: TaxGeneralInfo
  mainForm: Qtt03MainIndicators
  pl03_1a?: QttPL03_1AData
  pl03_2a?: QttPL03_2ARow[]
  pl03_8a?: QttPL03_8ARow[]
  appendices?: AppendixMeta[]
  rawXmlTree: XmlNode
}

/** Từng dòng chỉ tiêu trong bảng đối chiếu sai lệch */
export interface DiffItem {
  code: string
  name: string
  oldValue: number
  newValue: number
  variance: number // newValue - oldValue
  status: 'MATCHED' | 'NEW' | 'MISSING' | 'MISMATCH'
}

/** Báo cáo kiểm định đối chiếu số liệu tổng thể */
export interface Qtt03ReconcileSummary {
  isAllPassed: boolean
  totalOldRevenue: number
  totalNewRevenue: number
  oldLntt: number
  newLntt: number
  oldTaxPayable: number
  newTaxPayable: number
  netVariance: number // Phải bằng 0 VNĐ
  mainFormDiffs: DiffItem[]
  pl03_1aDiffs: DiffItem[]
  pl03_2aDiffs: {
    namPhatSinh: number
    oldChuyen: number
    newChuyen: number
    variance: number
    status: 'MATCHED' | 'MISMATCH'
  }[]
  appendixList: AppendixMeta[]
  invariants: {
    name: string
    description: string
    passed: boolean
    actualValue?: string
  }[]
  warnings: string[]
}
