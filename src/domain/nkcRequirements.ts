import type { ColumnMapping, SourceConfig } from './types'
import { ROW_ERROR_LABELS, type RowErrorCode } from './types'

/** Mức dữ liệu NKC mà một module yêu cầu trước khi mở khóa. */
export type DataRequirement = 'NONE' | 'BEFORE' | 'BOTH'

/**
 * Map module → yêu cầu dữ liệu.
 * - NONE: không cần NKC (nhập liệu, công cụ độc lập).
 * - BEFORE: chỉ cần NKC TRƯỚC điều chỉnh (Nguồn ①).
 * - BOTH: cần cả TRƯỚC + SAU điều chỉnh (Nguồn ① + ②).
 * ViewKey lạ (chưa khai báo) mặc định NONE — fail-open để không chặn oan.
 */
export const MODULE_DATA_REQUIREMENTS: Record<string, DataRequirement> = {
  hub: 'NONE',
  setup: 'NONE',
  b410: 'NONE',
  qtt03: 'NONE',
  analytics: 'BEFORE',
  taxstats: 'BEFORE',
  sampling: 'BEFORE',
  workingpaper: 'BEFORE',
  results: 'BOTH',
}

export function getDataRequirement(view: string): DataRequirement {
  return MODULE_DATA_REQUIREMENTS[view] ?? 'NONE'
}

/** 6 cột bắt buộc của file NKC chuẩn (tái dùng cho UI, nguồn duy nhất thay mảng FIELDS cũ trong SetupPage). */
export const NKC_COLUMN_SPEC: { key: keyof ColumnMapping; label: string; desc: string }[] = [
  { key: 'date', label: 'Ngày ghi sổ', desc: 'Ngày chứng từ (nhận diện ngày Excel, serial hoặc dd-MM-yyyy)' },
  { key: 'voucher', label: 'Số chứng từ', desc: 'Số phiếu / số hóa đơn (tự UPPER + TRIM)' },
  { key: 'description', label: 'Diễn giải', desc: 'Nội dung nghiệp vụ (tự UPPER + TRIM)' },
  { key: 'debit', label: 'Tài khoản Nợ', desc: 'TK Nợ đối ứng (giữ nguyên hoa/thường, TRIM)' },
  { key: 'credit', label: 'Tài khoản Có', desc: 'TK Có đối ứng (giữ nguyên hoa/thường, TRIM)' },
  { key: 'amount', label: 'Số tiền phát sinh', desc: 'Giá trị phát sinh (làm tròn nguyên, loại dòng null/0)' },
]

/** Quy tắc xử lý từng dòng — diễn giải 1-1 từ `standardizeSource` (không định nghĩa song song). */
export const NKC_ROW_RULES: { title: string; detail: string }[] = [
  { title: 'Dòng trống toàn bộ', detail: 'Bỏ qua, chỉ đếm vào số dòng trống (blankRows).' },
  { title: 'Số tiền trống / bằng 0 / lỗi', detail: 'Loại khỏi dữ liệu, ghi danh sách dòng bị loại (dropped) kèm lý do.' },
  { title: 'Ngày không đọc được', detail: 'Giữ lại dòng, giữ text gốc, gắn cờ lỗi ngày.' },
  { title: 'Thiếu TK Nợ / TK Có', detail: 'Giữ lại dòng, gắn cờ thiếu tài khoản tương ứng.' },
]

export const NKC_ERROR_CODES: { code: RowErrorCode; label: string }[] = (
  Object.keys(ROW_ERROR_LABELS) as RowErrorCode[]
).map((code) => ({ code, label: ROW_ERROR_LABELS[code] }))

/** Ảnh chụp tối thiểu của một phía nguồn trong store (cfg + pasted) — đủ cho selectors, không phụ thuộc store. */
export interface NkcSideSnapshot {
  cfg: SourceConfig | null
  pasted: unknown
}

function isSideReady(side: NkcSideSnapshot): boolean {
  if (side.pasted != null) return true
  if (side.cfg == null) return false
  return NKC_COLUMN_SPEC.every((f) => side.cfg?.mapping[f.key] != null)
}

/** Nguồn ① (BEFORE) đã sẵn sàng: đã dán dữ liệu hoặc đã ghép đủ 6 cột. */
export function isBeforeReady(before: NkcSideSnapshot): boolean {
  return isSideReady(before)
}

/** Nguồn ② (AFTER) đã sẵn sàng: đã dán dữ liệu hoặc đã ghép đủ 6 cột. */
export function isAfterReady(after: NkcSideSnapshot): boolean {
  return isSideReady(after)
}

/** Module có được mở với trạng thái dữ liệu hiện tại không. */
export function isModuleUnlocked(
  view: string,
  before: NkcSideSnapshot,
  after: NkcSideSnapshot,
): boolean {
  const req = getDataRequirement(view)
  if (req === 'NONE') return true
  if (!isBeforeReady(before)) return false
  if (req === 'BOTH' && !isAfterReady(after)) return false
  return true
}
