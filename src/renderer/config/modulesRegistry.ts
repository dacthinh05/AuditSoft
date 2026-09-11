export type ModuleCategory = 'reconcile' | 'sampling' | 'tax' | 'upcoming'

export interface ModuleDefinition {
  id: string
  code: string            // Mã hiển thị (01, 02...)
  title: string           // Tiêu đề đầy đủ
  shortTitle: string      // Tiêu đề ngắn gọn
  category: ModuleCategory
  categoryName: string
  description: string     // Mô tả nghiệp vụ kiểm toán
  highlights: string[]    // 3 gạch đầu dòng tính năng nổi bật
  status: 'active' | 'coming_soon'
  badgeText?: string
  viewKey?: 'b410' | 'setup' | 'sampling' | 'workingpaper' | 'qtt03' | 'analytics' | 'taxstats' | 'taxrisk'
  accentColor: string     // Màu nhận diện viền / icon
  accentBg: string        // Nền icon mềm
}

export const MODULES_REGISTRY: ModuleDefinition[] = [
  // ── GIAI ĐOẠN 1: KHỞI TẠO & SỔ SÁCH ──
  {
    id: 'reconcile_nkc',
    code: '01',
    title: 'Đối Chiếu 2 Sổ NKC',
    shortTitle: 'Đối Chiếu 2 Sổ NKC',
    category: 'reconcile',
    categoryName: 'Đối Chiếu & Báo Cáo',
    description: 'So khớp tốc độ cao dữ liệu hai sổ Nhật ký chung, phát hiện nhanh chênh lệch từng bút toán.',
    highlights: [
      'Xử lý mượt mà trên 100.000 dòng',
      'Phân loại chênh lệch: Lệch tiền, thừa, thiếu',
      'Kéo thả file hoặc dán trực tiếp từ clipboard',
    ],
    status: 'active',
    badgeText: 'BƯỚC 1: NẠP & SO KHỚP',
    viewKey: 'setup',
    accentColor: '#2563eb',
    accentBg: '#eff6ff',
  },

  // ── GIAI ĐOẠN 2: RÀ SOÁT & PHÂN TÍCH SƠ BỘ ──
  {
    id: 'analytics_vsa520',
    code: '02',
    title: 'Phân Tích Sổ NKC (VSA 520)',
    shortTitle: 'Phân Tích Sổ NKC',
    category: 'reconcile',
    categoryName: 'Đối Chiếu & Báo Cáo',
    description: 'Quét rủi ro bên liên quan, bóc tách EBITDA và trực quan hóa dữ liệu bằng đồ thị tương quan tài chính.',
    highlights: [
      'Tính EBITDA khống chế lãi vay 30%',
      'Quét giao dịch vay mượn 0% lãi suất',
      'Ma trận 12 tháng & Đồ thị tài chính',
    ],
    status: 'active',
    badgeText: 'BƯỚC 2: PHÂN TÍCH VSA 520',
    viewKey: 'analytics',
    accentColor: '#0284c7',
    accentBg: '#f0f9ff',
  },
  {
    id: 'tax_stats_vsa520',
    code: '03',
    title: 'Đối Chiếu Tờ Khai Thuế',
    shortTitle: 'Thống Kê Thuế',
    category: 'tax',
    categoryName: 'Hỗ Trợ Thuế Điện Tử',
    description: 'Thống kê tự động tờ khai GTGT, TNCN và đối chiếu chéo doanh thu, chi phí lương với Sổ Nhật ký chung.',
    highlights: [
      'Kéo thả hàng loạt file XML/ZIP',
      'Đối chiếu thuế với TK 511, TK 334',
      'Lập bảng chênh lệch chi tiết từng kỳ',
    ],
    status: 'active',
    badgeText: 'BƯỚC 2: ĐỐI CHIẾU THUẾ',
    viewKey: 'taxstats',
    accentColor: '#0d9488',
    accentBg: '#f0fdfa',
  },
  {
    id: 'tax_risk_scanner',
    code: '04',
    title: 'Rà Soát Rủi Ro Thuế & Tính B4',
    shortTitle: 'Rà Soát Rủi Ro Thuế',
    category: 'tax',
    categoryName: 'Hỗ Trợ Thuế Điện Tử',
    description: 'Quét tự động các khoản chi tiền mặt rủi ro và ước tính nhanh Chỉ tiêu B4 cho Tờ khai QTT TNDN.',
    highlights: [
      'Quét chi tiền mặt >= 5 triệu (NĐ 181/2025)',
      'Phát hiện chia nhỏ hóa đơn cùng ngày',
      'Ước tính số tiền loại trừ Chỉ tiêu B4',
    ],
    status: 'active',
    badgeText: 'BƯỚC 2: RỦI RO THUẾ NĐ 181',
    viewKey: 'taxrisk',
    accentColor: '#d97706',
    accentBg: '#fffbeb',
  },

  // ── GIAI ĐOẠN 3: TRỌNG YẾU & BỐC MẪU ──
  {
    id: 'sampling_vsa530',
    code: '05',
    title: 'Chọn Mẫu Theo VSA 530',
    shortTitle: 'Chọn Mẫu VSA 530',
    category: 'sampling',
    categoryName: 'Chuẩn Mực & Bốc Mẫu',
    description: 'Bốc mẫu kiểm toán tuân thủ VSA 530: Phân tầng Key items, lấy mẫu MUS và chọn mẫu đặc biệt thủ công.',
    highlights: [
      'Tự tính cỡ mẫu theo rủi ro',
      'Duyệt và tick chọn phần tử đặc biệt',
      'Lọc bỏ các bút toán kết chuyển',
    ],
    status: 'active',
    badgeText: 'BƯỚC 3: CHUẨN MỰC VSA 530',
    viewKey: 'sampling',
    accentColor: '#7c3aed',
    accentBg: '#f5f3ff',
  },

  // ── GIAI ĐOẠN 4: LẬP HỒ SƠ & TỔNG HỢP BÁO CÁO ──
  {
    id: 'wp_generator',
    code: '06',
    title: 'Lập 15 Giấy Làm Việc Tự Động',
    shortTitle: 'Lập 15 Giấy Làm Việc',
    category: 'sampling',
    categoryName: 'Chuẩn Mực & Bốc Mẫu',
    description: 'Trích xuất số liệu từ Sổ Cái và NKC để tự động sinh trọn bộ 15 Giấy làm việc theo chuẩn hồ sơ VACPA.',
    highlights: [
      'Hệ thống form mẫu chuẩn VACPA',
      'Tự động điền số dư và phát sinh',
      'Tích hợp bảng Thủ tục kiểm toán VSA',
    ],
    status: 'active',
    badgeText: 'BƯỚC 4: LẬP 15 GLV',
    viewKey: 'workingpaper',
    accentColor: '#0284c7',
    accentBg: '#f0f9ff',
  },
  {
    id: 'b410',
    code: '07',
    title: 'Tổng Hợp B410',
    shortTitle: 'Tổng Hợp B410',
    category: 'reconcile',
    categoryName: 'Đối Chiếu & Báo Cáo',
    description: 'Hợp nhất nhiều file B410 chi tiết thành một bản Master duy nhất, tự động căn chỉnh và giữ nguyên định dạng.',
    highlights: [
      'Gộp nhiều file Excel bằng 1 click',
      'Giữ nguyên định dạng và công thức',
      'Cảnh báo trùng lặp bút toán',
    ],
    status: 'active',
    badgeText: 'BƯỚC 4: TỔNG HỢP SAI SÓT',
    viewKey: 'b410',
    accentColor: '#059669',
    accentBg: '#ecfdf5',
  },

  // ── CÔNG CỤ TIỆN ÍCH & MỞ RỘNG ──
  {
    id: 'etax_qtt03',
    code: '08',
    title: 'Chuyển Đổi Tờ Khai eTax',
    shortTitle: 'Chuyển Đổi Tờ Khai eTax',
    category: 'tax',
    categoryName: 'Hỗ Trợ Thuế Điện Tử',
    description: 'Nâng cấp file XML Tờ khai Quyết toán TNDN sang chuẩn TT 80/2021 mới nhất (XML 2.9.4).',
    highlights: [
      'Tương thích 100% với iTaxViewer',
      'Đồng bộ cấu trúc từ phần mềm HTKK',
      'Giữ nguyên chữ ký số và Phụ lục',
    ],
    status: 'active',
    badgeText: 'TIỆN ÍCH THUẾ TT 80',
    viewKey: 'qtt03',
    accentColor: '#ea580c',
    accentBg: '#fff7ed',
  },
  {
    id: 'ai_audit_copilot',
    code: '09',
    title: 'Trợ Lý AI Soát Xét Báo Cáo',
    shortTitle: 'Trợ Lý AI Soát Xét',
    category: 'upcoming',
    categoryName: 'Lộ Trình Phát Triển',
    description: 'Sử dụng AI phân tích tính hợp lý của BCTC, phát hiện mâu thuẫn số liệu và cảnh báo rủi ro gian lận.',
    highlights: [
      'Phân tích Thuyết minh BCTC (VSA 240)',
      'Phát hiện bất thường trong ước tính kế toán',
      'Gợi ý thủ tục kiểm toán chuyên sâu',
    ],
    status: 'coming_soon',
    badgeText: 'LỘ TRÌNH 2026-2027',
    accentColor: '#6366f1',
    accentBg: '#eef2ff',
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
