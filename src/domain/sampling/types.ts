import type { Money } from '../money'

export type SamplingMethod = 'MUS' | 'RANDOM' | 'STRATIFIED'

export type SelectionReason =
  | 'HIGH_VALUE' // Khoản mục giá trị cao (>= PM) kiểm tra 100%
  | 'SPECIFIC_RISK' // Khoản mục rủi ro đặc thù (cuối kỳ, tròn số, từ khóa, bất thường)
  | 'MUS_SAMPLE' // Mẫu chọn theo bước nhảy đơn vị tiền tệ (Monetary Unit Sampling)
  | 'RANDOM_SAMPLE' // Mẫu ngẫu nhiên

/** 4 Tiêu chí Benchmark chuẩn VSA 320 / Mẫu A710 */
export type BenchmarkBase = 'REVENUE' | 'TOTAL_ASSETS' | 'EQUITY' | 'PROFIT_BEFORE_TAX' | 'MANUAL'

export interface BenchmarkGuideRange {
  min: number
  max: number
  default: number
  unit: string
  label: string
}

export const BENCHMARK_RANGES: Record<BenchmarkBase, BenchmarkGuideRange> = {
  REVENUE: { min: 0.5, max: 3.0, default: 1.0, unit: '%', label: '[0,5% - 3%] Doanh thu bán hàng' },
  TOTAL_ASSETS: { min: 1.0, max: 2.0, default: 1.0, unit: '%', label: '[1% - 2%] Tổng tài sản' },
  EQUITY: { min: 1.0, max: 5.0, default: 2.0, unit: '%', label: '[1% - 5%] Vốn chủ sở hữu' },
  PROFIT_BEFORE_TAX: { min: 5.0, max: 10.0, default: 5.0, unit: '%', label: '[5% - 10%] Lợi nhuận trước thuế' },
  MANUAL: { min: 0, max: 100, default: 1.0, unit: '%', label: 'Tùy chỉnh thủ công' },
}

export interface BenchmarkConfig {
  base: BenchmarkBase
  /** Tỷ lệ % áp dụng (d) */
  percentage: number
  /** Tỷ lệ tính PM theo OM (f) - Mặc định 75% trong khung [50%-75%] */
  pmRatio: number
  /** Tỷ lệ tính CTT theo OM (h) - Mặc định 4% trong khung [0%-4%] */
  cttRatio: number
  /** Điều chỉnh biến động bất thường (b) */
  abnormalAdjustment?: number
}

export type AccountSideFilter = 'DEBIT' | 'CREDIT' | 'BOTH'

export type AuditSectionKey =
  | 'REVENUE_511'
  | 'INVENTORY'
  | 'ALL'
  | 'CUSTOM'

export interface AuditSectionDef {
  key: AuditSectionKey
  label: string
  prefixes: readonly string[]
  desc: string
  defaultSide: AccountSideFilter
}

export const AUDIT_SECTIONS: readonly AuditSectionDef[] = [
  {
    key: 'REVENUE_511',
    label: '1. Doanh thu bán hàng & Thu nhập (TK 511, 515, 711 — Bên Có)',
    prefixes: ['511', '515', '711'],
    desc: 'Lấy mẫu phát sinh CÓ ghi nhận doanh thu bán hàng & cung cấp dịch vụ (đối ứng Nợ 131, 112, 111, loại trừ kết chuyển 911)',
    defaultSide: 'CREDIT',
  },
  {
    key: 'INVENTORY',
    label: '2. Mua hàng & Nhập kho HTK (TK 151, 152, 153, 156 — Bên Nợ)',
    prefixes: ['151', '152', '153', '155', '156', '158'],
    desc: 'Lấy mẫu phát sinh NỢ mua hàng & nhập kho vật tư hàng hóa mới (đối ứng Có 331, 112, 111; tự động loại trừ phân bổ, khấu hao 214, 242, kết chuyển)',
    defaultSide: 'DEBIT',
  },
  {
    key: 'ALL',
    label: '3. Toàn bộ sổ (Tất cả bút toán NKC)',
    prefixes: [],
    desc: 'Lấy mẫu tổng hợp trên toàn bộ danh sách chứng từ NKC',
    defaultSide: 'BOTH',
  },
  {
    key: 'CUSTOM',
    label: '4. Tùy chỉnh đầu tài khoản...',
    prefixes: [],
    desc: 'Nhập bất kỳ đầu tài khoản kế toán nào cần kiểm tra (Ví dụ: 131, 242, 642, 331...)',
    defaultSide: 'BOTH',
  },
]

export type SamplingStrategyFilter = 'ALL' | 'KEY_ITEMS' | 'RISK_ITEMS' | 'INTERVAL_MUS' | 'RANDOM'

export interface SamplingConfig {
  /** Mức trọng yếu tổng thể (OM) */
  overallMateriality: number
  /** Mức trọng yếu thực hiện (PM) - ngưỡng kiểm tra 100% */
  performanceMateriality: number
  /** Ngưỡng sai sót có thể bỏ qua (CTT) */
  clearlyTrivial: number
  /** Mức độ tin cậy kiểm toán (85%, 90%, 95%) */
  confidenceLevel: 85 | 90 | 95
  /** Phương pháp chọn mẫu */
  method: SamplingMethod
  /** Cấu hình Benchmark tính mức trọng yếu */
  benchmark: BenchmarkConfig
  /** Phần hành kiểm toán được chọn */
  section: AuditSectionKey
  /** Mã đầu tài khoản tùy chỉnh khi cần */
  customAccountPrefix?: string
  /** Số lượng mẫu mong muốn (tùy chọn ghi đè) */
  targetSampleSize?: number
  /** Điểm bắt đầu ngẫu nhiên cho MUS */
  randomStart?: number
  /** Bật/tắt quét mẫu rủi ro đặc thù */
  includeRiskItems?: boolean
  /** Bật/tắt loại trừ bút toán kết chuyển 911 */
  excludeKetChuyen?: boolean
  /** Bật/tắt tự động gom các dòng cùng Số chứng từ / Hóa đơn trước khi lấy mẫu */
  groupByVoucher?: boolean
}

export const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  base: 'REVENUE',
  percentage: 1.0, // 1% Doanh thu (511)
  pmRatio: 0.75, // PM = 75% OM
  cttRatio: 0.04, // CTT = 4% OM (Chuẩn mẫu A710)
  abnormalAdjustment: 0,
}

export const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  overallMateriality: 1_000_000_000,
  performanceMateriality: 750_000_000,
  clearlyTrivial: 40_000_000,
  confidenceLevel: 95,
  method: 'MUS',
  benchmark: DEFAULT_BENCHMARK_CONFIG,
  section: 'REVENUE_511',
  customAccountPrefix: '',
  includeRiskItems: true,
  excludeKetChuyen: true,
  groupByVoucher: true,
}

export interface SampleableItem {
  id: string
  rowIndex: number
  displayDate: string
  voucher: string
  description: string
  debit: string
  credit: string
  amount: number
  rawAmount?: Money
  /** Ngoại tệ USD (nếu có) */
  foreignAmount?: number | null
  /** Tỷ giá hạch toán */
  exchangeRate?: number | null
  /** Số dòng chi tiết nếu đã gom theo hóa đơn/chứng từ */
  subItemCount?: number
}

export interface SelectedSampleItem extends SampleableItem {
  sampleNo: number
  reason: SelectionReason
  stratum: 'KEY_ITEMS' | 'RISK_ITEMS' | 'REPRESENTATIVE_SAMPLE'
  samplingInterval?: number
  cumulativeAmount?: number
  riskNote?: string
}

export interface StratumSummary {
  name: string
  itemCount: number
  totalAmount: number
  selectedCount: number
  selectedAmount: number
  coverageRatio: number // Tỷ lệ % số tiền đã chọn / tổng tiền tầng
}

export interface SamplingSummary {
  populationCount: number
  populationTotalAmount: number
  sectionFilteredCount: number
  sectionFilteredAmount: number
  totalSelectedCount: number
  totalSelectedAmount: number
  totalCoveragePercent: number // % giá trị tiền được bao phủ bởi mẫu chọn trên phần hành
  samplingInterval: number
  riskFactor: number
  isVoucherGrouped?: boolean
  benchmarkUsed?: {
    baseName: string
    baseAmount: number
    adjustedBaseAmount: number
    percentage: number
    computedOM: number
    computedPM: number
    computedCTT: number
  }
  strata: {
    keyItems: StratumSummary
    riskItems: StratumSummary
    representative: StratumSummary
    trivial: StratumSummary
  }
}

export interface SamplingResult {
  config: SamplingConfig
  summary: SamplingSummary
  selectedSamples: SelectedSampleItem[]
  allPopulationItems: SampleableItem[]
  filteredPopulationItems: SampleableItem[]
}
