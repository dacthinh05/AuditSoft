import { AUDIT_SECTIONS, type AuditSectionDef, type AuditSectionKey, type SampleableItem } from './types'

export function getSectionDef(key: AuditSectionKey): AuditSectionDef | undefined {
  return AUDIT_SECTIONS.find((s) => s.key === key)
}

function is911(debit: string, credit: string): boolean {
  return debit.startsWith('911') || credit.startsWith('911')
}

const ALLOCATION_CLOSING_KEYWORDS = [
  'PHÂN BỔ',
  'PHAN BO',
  'KẾT CHUYỂN',
  'KET CHUYEN',
  'KHẤU HAO',
  'KHAU HAO',
  'TRÍCH KHẤU HAO',
  'TRICH KHAU HAO',
  'KCKD',
  'TRÍCH TRƯỚC',
  'TRICH TRUOC',
  'ĐÁNH GIÁ LẠI',
  'DANH GIA LAI',
]

/**
 * Kiểm tra nghiệp vụ có phải là bút toán phân bổ / trích khấu hao / kết chuyển nội bộ hay không
 */
export function isAllocationOrClosing(item: SampleableItem): boolean {
  // 1. Kiểm tra tài khoản kết chuyển 911
  if (is911(item.debit, item.credit)) return true

  // 2. Kiểm tra tài khoản khấu hao 214 hoặc phân bổ CPTT 242 ở bên Có
  if (item.credit.startsWith('214') || item.credit.startsWith('242')) return true

  // 3. Kiểm tra diễn giải chứa từ khóa phân bổ / kết chuyển / khấu hao
  const upperDesc = (item.description || '').toUpperCase()
  for (const kw of ALLOCATION_CLOSING_KEYWORDS) {
    if (upperDesc.includes(kw)) return true
  }

  // 4. Kiểm tra tiền tố KC ngắn (ví dụ: "KC DT", "KC CP", "KC GIA VON")
  if (/^KC\s+/i.test(item.description || '')) return true

  // 5. Kiểm tra TK Nợ hoặc TK Có ghi chữ "Kết chuyển" hoặc "KC" (khi file kế toán bị lệch cột)
  const upperDebit = (item.debit || '').toUpperCase()
  const upperCredit = (item.credit || '').toUpperCase()
  if (upperDebit.includes('KẾT') || upperDebit.includes('KET') || upperDebit.startsWith('KC')) return true
  if (upperCredit.includes('KẾT') || upperCredit.includes('KET') || upperCredit.startsWith('KC')) return true

  // 6. Kiểm tra số chứng từ bắt đầu bằng NVK mà có dấu hiệu kết chuyển
  const upperVoucher = (item.voucher || '').toUpperCase()
  if (upperVoucher.startsWith('NVK') && (upperDebit.includes('KẾT') || upperCredit.includes('KẾT') || upperDebit.includes('911') || upperCredit.includes('911') || Math.abs(item.amount) === 911)) {
    return true
  }

  return false
}

/** Lọc danh sách chứng từ theo Phần hành kiểm toán được chọn */
export function filterBySection(
  items: readonly SampleableItem[],
  sectionKey: AuditSectionKey,
  customPrefix?: string,
  exclude911 = true,
  accountSide?: 'DEBIT' | 'CREDIT' | 'BOTH',
): SampleableItem[] {
  const section = getSectionDef(sectionKey)

  return items.filter((item) => {
    // 1. Loại trừ kết chuyển 911 và bút toán phân bổ nếu được yêu cầu
    if (exclude911 && isAllocationOrClosing(item)) {
      return false
    }

    // 2. Nếu chọn Toàn bộ sổ -> chấp nhận mọi chứng từ
    if (sectionKey === 'ALL') {
      return true
    }

    // 3. Nếu chọn Tùy chỉnh đầu tài khoản
    if (sectionKey === 'CUSTOM') {
      const p = (customPrefix ?? '').trim()
      if (!p) return true
      return item.debit.startsWith(p) || item.credit.startsWith(p)
    }

    // 4. Phần hành 1: Doanh thu bán hàng & Thu nhập (TK 511, 515, 711 — Bên Có)
    if (sectionKey === 'REVENUE_511') {
      // Loại bỏ bút toán kết chuyển 911 hoặc phân bổ nội bộ
      if (isAllocationOrClosing(item)) return false
      // Bút toán doanh thu chuẩn: Ghi CÓ TK 511, 515, 711 hoặc NỢ 521 (giảm trừ doanh thu)
      const isRevenueCredit = item.credit.startsWith('511') || item.credit.startsWith('515') || item.credit.startsWith('711')
      const isDeductionDebit = item.debit.startsWith('521')
      return isRevenueCredit || isDeductionDebit
    }

    // 5. Phần hành 2: Mua hàng & Nhập kho Hàng tồn kho (TK 151, 152, 153, 155, 156, 158 — Bên Nợ)
    if (sectionKey === 'INVENTORY') {
      // Bắt buộc loại trừ 100% bút toán phân bổ CPTT, trích khấu hao, kết chuyển chi phí
      if (isAllocationOrClosing(item)) return false

      // Chỉ lấy phát sinh NỢ các tài khoản kho vật tư hàng hóa thực tế (151, 152, 153, 155, 156, 158, 611)
      // Loại trừ 154 (chi phí SXKD dở dang) và 157 (hàng gửi bán) để tránh dính chi phí phân bổ
      const validInvDebits = ['151', '152', '153', '155', '156', '158', '611']
      const isDebitInv = validInvDebits.some((p) => item.debit.startsWith(p))
      if (!isDebitInv) return false

      // Đối ứng Có phải là các nguồn mua hàng / nhập kho thực tế:
      // Phải trả NCC (331, 338), Tiền (111, 112), Vay (341), Tạm ứng (141, 138), Thuế NK (333), Hàng đi đường (151)
      const validContraCredit = ['331', '112', '111', '338', '341', '311', '141', '138', '333', '151', '411', '128']
      const isValidContra = validContraCredit.some((p) => item.credit.startsWith(p))
      if (!isValidContra) return false

      // Loại trừ đối ứng với 214 (khấu hao), 242 (phân bổ), 621, 622, 627, 154
      const invalidContra = ['214', '242', '621', '622', '627', '154', '911']
      if (invalidContra.some((p) => item.credit.startsWith(p))) return false

      return true
    }
    // 6. Xử lý trường hợp có prefix nhưng không thuộc nhóm trên
    if (section && section.prefixes.length > 0) {
      const side = accountSide ?? section.defaultSide ?? 'BOTH'
      if (side === 'DEBIT') {
        return section.prefixes.some((prefix) => item.debit.startsWith(prefix))
      }
      if (side === 'CREDIT') {
        return section.prefixes.some((prefix) => item.credit.startsWith(prefix))
      }
      return section.prefixes.some((prefix) => item.debit.startsWith(prefix) || item.credit.startsWith(prefix))
    }

    return true
  })
}
