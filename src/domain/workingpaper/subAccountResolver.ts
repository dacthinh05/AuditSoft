import type { CdfsAccountRow } from './types'

export interface AllocatedSubAccount {
  tk: string
  ten: string
  ck: number
  dk: number
  isOtherGroup?: boolean
  isEmpty?: boolean
}

export interface SubAccountAllocationOptions {
  /** Tiền tố tài khoản cần lọc, ví dụ: '112', '1281', '3411', ['3412', '3411N'] */
  prefix: string | string[]
  /** Các mã tài khoản mẹ cần loại trừ, ví dụ: ['112', '1121', '1122'] */
  excludeExact?: string[]
  /** Số dòng tối đa của form Excel */
  maxRows: number
  /** Tên hiển thị cho dòng gom nhóm còn lại khi vượt quá maxRows */
  otherGroupName?: string
  /** Chiều số dư: 'DEBIT' (Tài sản) hoặc 'CREDIT' (Nguồn vốn) */
  balanceType?: 'DEBIT' | 'CREDIT'
}

/**
 * Universal Subaccount Allocation Engine
 * Tự động phân cấp cây tài khoản, lọc các tài khoản con chi tiết,
 * áp dụng thuật toán Pareto (Top + Khác) và xóa sạch các dòng rỗng dư thừa.
 */
export function resolveSubAccountAllocation(
  cdfsAccounts: Map<string, CdfsAccountRow> | CdfsAccountRow[],
  options: SubAccountAllocationOptions,
): AllocatedSubAccount[] {
  const {
    prefix,
    excludeExact = [],
    maxRows,
    otherGroupName = 'Các tài khoản khác',
    balanceType = 'DEBIT',
  } = options

  const accountsList = Array.isArray(cdfsAccounts)
    ? cdfsAccounts
    : Array.from(cdfsAccounts.values())

  const prefixes = Array.isArray(prefix) ? prefix : [prefix]
  const excludeSet = new Set(excludeExact.map((s) => s.trim()))

  // 1. Lọc các tài khoản con thuộc tiền tố
  const matches = accountsList.filter((a) => {
    const tk = a.matk.trim()
    if (excludeSet.has(tk)) return false
    return prefixes.some((p) => tk.startsWith(p) && tk.length >= p.length)
  })

  // Nếu lọc được tài khoản có độ dài lớn hơn tiền tố (tài khoản con thực sự),
  // ưu tiên lấy các tài khoản con và loại bỏ tài khoản mẹ trùng với tiền tố.
  const hasDeeperChildren = matches.some((a) =>
    prefixes.some((p) => a.matk.trim().length > p.length),
  )

  const refinedMatches = hasDeeperChildren
    ? matches.filter((a) => prefixes.every((p) => a.matk.trim() !== p))
    : matches

  // 2. Tính số dư để sắp xếp giảm dần theo quy mô
  const getCk = (a: CdfsAccountRow): number =>
    balanceType === 'CREDIT' ? a.cock || a.nock || 0 : a.nock || a.cock || 0

  const getDk = (a: CdfsAccountRow): number =>
    balanceType === 'CREDIT' ? a.sdcdk || a.sdndk || 0 : a.sdndk || a.sdcdk || 0

  const sorted = [...refinedMatches].sort((a, b) => getCk(b) - getCk(a))

  const results: AllocatedSubAccount[] = []

  // Trường hợp 1: Không có tài khoản nào phát sinh
  if (sorted.length === 0) {
    for (let i = 0; i < maxRows; i++) {
      results.push({ tk: '', ten: '', ck: 0, dk: 0, isEmpty: true })
    }
    return results
  }

  // Trường hợp 2: Số lượng tài khoản con <= maxRows (Điền 1:1 và pad dòng trống)
  if (sorted.length <= maxRows) {
    for (let i = 0; i < maxRows; i++) {
      const acc = sorted[i]
      if (acc) {
        results.push({
          tk: acc.matk,
          ten: acc.tentk,
          ck: getCk(acc),
          dk: getDk(acc),
          isEmpty: false,
        })
      } else {
        results.push({ tk: '', ten: '', ck: 0, dk: 0, isEmpty: true })
      }
    }
    return results
  }

  // Trường hợp 3: Số lượng tài khoản con > maxRows (Áp dụng Pareto: Top lớn nhất + Dòng Khác)
  const topCount = maxRows - 1
  for (let i = 0; i < topCount; i++) {
    const acc = sorted[i]!
    results.push({
      tk: acc.matk,
      ten: acc.tentk,
      ck: getCk(acc),
      dk: getDk(acc),
      isEmpty: false,
    })
  }

  // Gom các tài khoản còn lại
  const remaining = sorted.slice(topCount)
  const otherCk = remaining.reduce((s, a) => s + getCk(a), 0)
  const otherDk = remaining.reduce((s, a) => s + getDk(a), 0)

  results.push({
    tk: 'Khác',
    ten: otherGroupName,
    ck: otherCk,
    dk: otherDk,
    isOtherGroup: true,
    isEmpty: false,
  })

  return results
}
