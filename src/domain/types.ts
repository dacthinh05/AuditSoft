import type { Money } from './money'

export type SourceKind = 'BEFORE' | 'AFTER'

/** Chỉ số cột (0-based) trong ma trận dữ liệu thô. null = chưa map. */
export interface ColumnMapping {
  date: number | null
  voucher: number | null
  description: number | null
  debit: number | null
  credit: number | null
  amount: number | null
  /** Mã đối tượng / Mã KH (optional, metadata phân tích — không tham gia khóa so khớp) */
  partnerCode?: number | null
  /** Tên khách hàng / đối tượng (optional) */
  partnerName?: number | null
  /** Tỷ giá hạch toán (optional) */
  exchangeRate?: number | null
  /** Số tiền ngoại tệ (optional) */
  foreignAmount?: number | null
}

export type RowErrorCode = 'LOI_NGAY' | 'LOI_TIEN' | 'THIEU_TK_NO' | 'THIEU_TK_CO'

export const ROW_ERROR_LABELS: Record<RowErrorCode, string> = {
  LOI_NGAY: 'LoiNgay',
  LOI_TIEN: 'LoiTien',
  THIEU_TK_NO: 'Thiếu TK Nợ',
  THIEU_TK_CO: 'Thiếu TK Có',
}

export interface NormalizedEntry {
  /** Số thứ tự dòng trong sheet (theo file Excel, 1-based) */
  rowIndex: number
  displayDate: string
  dateISO: string | null
  /** Text gốc của ô ngày — dùng làm phần ngày trong khóa khi ngày lỗi */
  rawDateText: string
  /** UPPER(TRIM) như PQ */
  voucher: string
  description: string
  /** chỉ TRIM, giữ nguyên hoa/thường như PQ */
  debit: string
  credit: string
  /** đã Number.Round về nguyên (scale=0); null không xảy ra sau chuẩn hóa */
  amount: Money | null
  /** Mã đối tượng / Mã KH (null khi file không có cột) */
  partnerCode: string | null
  /** Tên khách hàng / đối tượng (null khi file không có cột) */
  partnerName: string | null
  /** Tỷ giá hạch toán (null khi trống/lỗi) */
  exchangeRate: Money | null
  /** Số tiền ngoại tệ (null khi trống/lỗi) */
  foreignAmount: Money | null
  errors: RowErrorCode[]
}

export interface DroppedLine {
  rowIndex: number
  reason: string
}

export interface StandardizeStats {
  dataRows: number
  blankRows: number
  zeroOrBadAmountRows: number
  errorRows: number
}

export interface StandardizeResult {
  entries: NormalizedEntry[]
  stats: StandardizeStats
  dropped: DroppedLine[]
}

export type DiffKind = 'ADDED_AFTER' | 'REMOVED_AFTER' | 'AMOUNT_CHANGED'

export interface DiffMeta {
  nguon: string
  nhanXet: string
  uuTien: string
}

/** Các trường tiền là MoneyJSON ("scale|raw") để giữ chính xác qua IPC. */
export interface DiffRow {
  stt: number
  kind: DiffKind
  key: string
  dateISO: string | null
  dateDisplay: string
  loiNgay: boolean
  loiNgayText: string
  voucher: string
  description: string
  debit: string
  credit: string
  amountAfter: string
  amountBefore: string
  difference: string
  note: string
  priority: string
}

export interface MainSummary {
  totalBefore: string
  totalAfter: string
  totalDifference: string
  lineCountBefore: number
  lineCountAfter: number
  diffLineCount: number
  addedCount: number
  removedCount: number
  changedCount: number
  filteredLineCount: number
  filteredTotalDifference: string
  blankRowsBefore: number
  blankRowsAfter: number
  zeroOrBadAmountRowsBefore: number
  zeroOrBadAmountRowsAfter: number
}

export interface InventoryRow {
  group: string
  ghiNo: string
  ghiCo: string
  net: string
  gross: string
  isTotal: boolean
}

export interface EntryTypeGroup {
  stt: number
  key: string
  /** UPPER(TRIM(SốCT đại diện + '|' + Diễn giải đại diện)) */
  pairKey: string
  sources: string[]
  detailCount: number
  distinctVoucherCount: number
  repVoucher: string
  repDescription: string
  debitGrouped: string
  creditGrouped: string
  sumAfter: string
  sumBefore: string
  sumDifference: string
  phanHanhId: number
  phanHanhName: string
  note: string
}

export interface EntryTypeSummary {
  filteredLineCount: number
  groupCount: number
  collapsedLines: number
  totalAfter: string
  totalBefore: string
  totalDifference: string
}

export interface ErrorLine {
  source: SourceKind
  rowIndex: number
  displayDate: string
  voucher: string
  description: string
  debit: string
  credit: string
  amountDisplay: string
  errors: string[]
}

export type { BctcRow, BctcResult } from './bctc/aggregate'

export interface SourceConfig {
  kind: SourceKind
  filePath: string
  sheetName: string
  headerRow: number
  mapping: ColumnMapping
}

export interface SourceStatsFull {
  kind: SourceKind
  filePath: string
  sheetName: string
  headerRow: number
  dataRows: number
  blankRows: number
  zeroOrBadAmountRows: number
  errorRows: number
  totalAmount: string
}

/** Dòng nguồn chuẩn hóa dùng cho xuất Excel (amount là MoneyJSON). */
export interface ExportEntryRow {
  rowIndex: number
  displayDate: string
  dateISO: string | null
  voucher: string
  description: string
  debit: string
  credit: string
  amountJSON: string
}

export interface ReconcileResult {
  before: SourceStatsFull
  after: SourceStatsFull
  beforeEntries: ExportEntryRow[]
  afterEntries: ExportEntryRow[]
  diffRows: DiffRow[]
  summary: MainSummary
  inventory: InventoryRow[]
  groups: EntryTypeGroup[]
  entryTypeSummary: EntryTypeSummary
  errors: ErrorLine[]
  matchedEqualCount: number
  /** Ảnh hưởng bút toán điều chỉnh lên CĐKT & KQKD (mirror B360 / Anh huong BCTC) */
  bctc: import('./bctc/aggregate').BctcResult
  startedAt: number
  finishedAt: number
}

export type ProgressPhase =
  | 'reading_before'
  | 'reading_after'
  | 'standardizing'
  | 'reconciling'
  | 'reporting'
  | 'exporting'

export interface ProgressMessage {
  phase: ProgressPhase
  processed: number
  total: number
  percent: number
  elapsedMs: number
}
