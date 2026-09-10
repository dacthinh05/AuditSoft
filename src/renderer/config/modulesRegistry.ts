export type ModuleCategory =
  | 'reconcile'    // Đối Chiếu & Báo Cáo
  | 'sampling'     // Chuẩn Mực & Bốc Mẫu
  | 'tax'          // Hỗ Trợ Thuế Điện Tử
  | 'upcoming'     // Lộ Trình Phát Triển

export type ModuleStatus = 'active' | 'beta' | 'coming_soon'

export interface ModuleDefinition {
  id: string
  code: string            // '#01', '#02', ...
  title: string
  shortTitle: string
  category: ModuleCategory
  categoryName: string
  description: string
  highlights: string[]
  status: ModuleStatus
  badgeText?: string
  viewKey?: 'b410' | 'setup' | 'sampling' | 'workingpaper' | 'qtt03' | 'analytics'
  accentColor: string     // Màu nhận diện viền / icon
  accentBg: string        // Nền icon mềm
}

export const MODULES_REGISTRY: ModuleDefinition[] = [
  {
    id: 'b410',
    code: '01',
    title: 'Tổng Hợp B410 — Bảng Tổng Hợp Sai Sót Kiểm Toán',
    shortTitle: 'Tổng Hợp B410',
    category: 'reconcile',
    categoryName: 'Đối Chiếu & Báo Cáo',
    description: 'Hợp nhất tự động nhiều file B410 chi tiết của KTV thành file Master duy nhất, tự động co giãn dòng và bảo toàn nguyên vẹn 100% định dạng.',
    highlights: [
      'Gộp nhiều file Excel B410 chi tiết chỉ với 1 click',
      'Giữ nguyên định dạng, công thức và độ cao dòng',
      'Cảnh báo sai lệch số thứ tự và trùng lặp bút toán',
    ],
    status: 'active',
    badgeText: 'TỰ ĐỘNG MASTER',
    viewKey: 'b410',
    accentColor: '#059669',
    accentBg: '#ecfdf5',
  },
  {
    id: 'reconcile_nkc',
    code: '02',
    title: 'Đối Chiếu 2 Sổ NKC — So Khớp Trước vs Sau Kiểm Toán',
    shortTitle: 'Đối Chiếu 2 Sổ NKC',
    category: 'reconcile',
    categoryName: 'Đối Chiếu & Báo Cáo',
    description: 'So khớp tốc độ cao 2 sổ Nhật ký chung (Trước vs Sau kiểm toán / Kế toán vs Thuế), phát hiện chênh lệch từng dòng bút toán, số tiền và ngày tháng.',
    highlights: [
      'Xử lý mượt mà trên 100.000 dòng bút toán',
      'Tự động phân loại chênh lệch: Lệch số tiền, Thừa, Thiếu',
      'Hỗ trợ kéo thả trực tiếp file Excel (.xlsx) hoặc dán clipboard',
    ],
    status: 'active',
    badgeText: 'SO KHỚP TỐC ĐỘ CAO',
    viewKey: 'setup',
    accentColor: '#2563eb',
    accentBg: '#eff6ff',
  },
  {
    id: 'sampling_vsa530',
    code: '03',
    title: 'Chọn Mẫu VSA 530 — Bốc Mẫu Kiểm Toán Chuyên Sâu',
    shortTitle: 'Chọn Mẫu VSA 530',
    category: 'sampling',
    categoryName: 'Chuẩn Mực & Bốc Mẫu',
    description: 'Bốc mẫu kiểm toán tuân thủ chuẩn mực VSA 530: Phân tầng phần tử trọng yếu (Key items), bước nhảy số học MUS kết hợp duyệt & chọn mẫu đặc biệt thủ công.',
    highlights: [
      'Tự động tính toán cỡ mẫu theo rủi ro kiểm toán',
      'Duyệt toàn bộ tổng thể và tick chọn phần tử đặc biệt',
      'Sắp xếp nhanh đa chiều, lọc bỏ bút toán kết chuyển',
    ],
    status: 'active',
    badgeText: 'CHUẨN MỰC VSA 530',
    viewKey: 'sampling',
    accentColor: '#7c3aed',
    accentBg: '#f5f3ff',
  },
  {
    id: 'etax_qtt03',
    code: '04',
    title: 'Chuyển Đổi Tờ Khai eTax — Nâng Cấp TT 80 XML 2.9.4',
    shortTitle: 'Chuyển Đổi Tờ Khai eTax',
    category: 'tax',
    categoryName: 'Hỗ Trợ Thuế Điện Tử',
    description: 'Nâng cấp và chuyển đổi file XML Tờ khai Quyết toán TNDN (Mẫu 03/TNDN) từ Thông tư 151 hoặc TT 80 bản cũ sang chuẩn TT 80/2021 (XML 2.9.4 / HTKK 5.6.2).',
    highlights: [
      'Chuyển đổi 1-click tương thích 100% iTaxViewer mới nhất',
      'Tự động đồng bộ cấu trúc từ phần mềm HTKK nội bộ',
      'Bảo toàn đầy đủ Phụ lục 03-1A/TNDN và chữ ký số',
    ],
    status: 'active',
    badgeText: 'XML TT 80 MỚI NHẤT',
    viewKey: 'qtt03',
    accentColor: '#ea580c',
    accentBg: '#fff7ed',
  },
  {
    id: 'analytics_vsa520',
    code: '05',
    title: 'Phân Tích Cơ Bản — VSA 520 & Thống Kê Thuế GTGT/TNCN',
    shortTitle: 'Phân Tích Cơ Bản',
    category: 'reconcile',
    categoryName: 'Đối Chiếu & Báo Cáo',
    description: 'Bóc tách EBITDA khống chế lãi vay 30% (Nghị định 132/2020), quét nghi ngờ bên liên quan (VSA 550), phân tích tỷ trọng Pareto khách hàng/NCC, ma trận 12 tháng & kéo thả tờ khai thuế đối chiếu chéo.',
    highlights: [
      'Khống chế 30% EBITDA & ước tính chi phí không được trừ Chỉ tiêu B4',
      'Phát hiện giao dịch vay mượn 0% lãi suất và tạm ứng tồn đọng lâu',
      'Kéo thả file XML/ZIP tờ khai 01/GTGT, 05/KK, 05/QTT đối chiếu chéo với NKC',
    ],
    status: 'active',
    badgeText: 'CHUẨN MỰC VSA 520',
    viewKey: 'analytics',
    accentColor: '#0284c7',
    accentBg: '#f0f9ff',
  },
  {
    id: 'wp_generator',
    code: '06',
    title: 'Lập 12 Giấy Làm Việc Tự Động (Working Papers)',
    shortTitle: 'Lập 12 Giấy Làm Việc',
    category: 'upcoming',
    categoryName: 'Lộ Trình Phát Triển',
    description: 'Tự động trích xuất số liệu từ Sổ Cái và NKC để sinh bộ 12 Giấy làm việc chuẩn mẫu VACPA (D100, D300, D500, E-series, G-series...), tích hợp sẵn bảng Thủ tục VSA và Sheet Tự chấm điểm.',
    highlights: [
      'Khung giấy làm việc theo hồ sơ kiểm toán mẫu VACPA',
      'Tự động điền số dư đầu kỳ, phát sinh và số dư cuối kỳ',
      'Tích hợp sẵn bảng Thủ tục kiểm toán VSA và Sheet Tự chấm điểm',
    ],
    status: 'coming_soon',
    badgeText: 'SẮP RA MẮT',
    viewKey: 'workingpaper',
    accentColor: '#0284c7',
    accentBg: '#f0f9ff',
  },
  {
    id: 'tax_risk_scanner',
    code: '07',
    title: 'Rà Soát Chi Phí Rủi Ro Thuế & B4 QTT 03/TNDN',
    shortTitle: 'Rà Soát Rủi Ro Thuế',
    category: 'upcoming',
    categoryName: 'Lộ Trình Phát Triển',
    description: 'Quét tự động các bút toán chi tiền mặt >= 20 triệu chia nhỏ, chi phí không có hóa đơn hợp lệ, lãi vay vượt trần Nghị định 132/2020.',
    highlights: [
      'Phát hiện giao dịch tiền mặt tách hóa đơn dưới 20 triệu',
      'Ước tính tự động giá trị điều chỉnh tăng doanh thu/chi phí B4',
      'Đối chiếu chéo hóa đơn điện tử Tổng cục Thuế',
    ],
    status: 'coming_soon',
    badgeText: 'LỘ TRÌNH 2026',
    accentColor: '#d97706',
    accentBg: '#fffbeb',
  },
]

export const MODULE_CATEGORIES: { key: ModuleCategory | 'all'; name: string }[] = [
  { key: 'all', name: 'Tất cả phân hệ' },
  { key: 'reconcile', name: 'Đối Chiếu & Báo Cáo' },
  { key: 'sampling', name: 'Chuẩn Mực & Bốc Mẫu' },
  { key: 'tax', name: 'Hỗ Trợ Thuế Điện Tử' },
  { key: 'upcoming', name: 'Lộ Trình Phát Triển' },
]

export function getActiveModules(): ModuleDefinition[] {
  return MODULES_REGISTRY.filter((m) => m.status === 'active')
}

export function getModuleByView(view: string): ModuleDefinition | undefined {
  if (view === 'results') {
    return MODULES_REGISTRY.find((m) => m.viewKey === 'setup')
  }
  return MODULES_REGISTRY.find((m) => m.viewKey === view)
}
