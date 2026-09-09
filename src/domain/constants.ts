import type { DiffKind, DiffMeta } from './types'

export const MAIN_EXCLUDE_ACCOUNT_PREFIX = '911'

export const OPTIONAL_KET_CHUYEN_KEYWORD = 'KET CHUYEN'

export const DIFF_META: Record<DiffKind, DiffMeta> = {
  ADDED_AFTER: {
    nguon: 'Thêm sau ĐC',
    nhanXet: 'Có ở NKC sau, không có ở NKC trước',
    uuTien: 'Ghi bổ sung',
  },
  REMOVED_AFTER: {
    nguon: 'Xóa sau ĐC',
    nhanXet: 'Có ở NKC trước, không có ở NKC sau',
    uuTien: 'Kiểm tra bút toán bị hủy',
  },
  AMOUNT_CHANGED: {
    nguon: 'Đổi số tiền',
    nhanXet: 'Cùng bút toán nhưng số tiền thay đổi',
    uuTien: 'Kiểm tra chứng từ gốc',
  },
}

export const UU_TIEN_ORDER: readonly string[] = [
  'Ghi bổ sung',
  'Kiểm tra chứng từ gốc',
  'Kiểm tra bút toán bị hủy',
]

export const INVENTORY_GROUPS: readonly string[] = ['152', '153', '154', '155', '156', '157', '158']

export const INVENTORY_TOTAL_LABEL = 'TỔNG TỒN KHO'

export interface PhanHanhRule {
  id: number
  name: string
  codes: readonly string[]
  /** khoảng mã liên tiếp, ví dụ [151,157] */
  range?: readonly [number, number]
  /** match theo chữ số đầu của tài khoản, ví dụ '5' cho doanh thu */
  firstDigit?: string
}

export const PHAN_HANH_RULES: readonly PhanHanhRule[] = [
  { id: 1, name: 'Tiền', codes: ['111', '112', '113'] },
  { id: 2, name: 'Đầu tư tài chính', codes: ['121', '128', '228'] },
  { id: 3, name: 'Phải thu', codes: ['131', '136', '138'] },
  { id: 4, name: 'Hàng tồn kho', codes: [], range: [151, 157] },
  { id: 5, name: 'TSCĐ & trả trước', codes: ['211', '212', '213', '214', '217', '241', '242'] },
  { id: 6, name: 'Lương & nhân sự', codes: ['334', '335', '338'] },
  { id: 7, name: 'Thuế', codes: ['333', '133', '821'] },
  { id: 8, name: 'Phải trả/NCC', codes: ['331'] },
  { id: 9, name: 'Vốn chủ sở hữu', codes: ['411', '421'] },
  { id: 10, name: 'Doanh thu & thu nhập', codes: ['711'], firstDigit: '5' },
  { id: 11, name: 'Chi phí & giá vốn', codes: ['811'], firstDigit: '6' },
  { id: 12, name: 'Khác', codes: [] },
]

export const PHAN_HANH_NOTE_BY_ID: Record<number, string> = {
  4: 'Rà soát tồn kho',
  5: 'Rà soát TSCĐ/CPTT',
  6: 'Rà soát lương',
  7: 'Rà soát thuế',
  8: 'Rà soát NCC',
}

export const FALLBACK_NOTE = 'Rà soát nghiệp vụ'

export const GROUP_ABS_THRESHOLD = '0.5'
