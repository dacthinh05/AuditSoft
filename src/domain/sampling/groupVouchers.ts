import type { SampleableItem } from './types'

/**
 * TỰ ĐỘNG GOM NHÓM CÁC DÒNG CÙNG SỐ CHỨNG TỪ / HÓA ĐƠN TRƯỚC KHI CHỌN MẪU
 * Tránh việc 1 hóa đơn lớn 1 tỷ bị xé nhỏ thành nhiều dòng 100tr lọt khỏi diện kiểm tra 100%.
 */
export function groupItemsByVoucher(items: readonly SampleableItem[]): SampleableItem[] {
  const map = new Map<string, {
    base: SampleableItem
    totalAmount: number
    totalForeignAmount: number
    count: number
    descriptions: Set<string>
  }>()

  for (const it of items) {
    const key = (it.voucher || '').trim().toUpperCase()
    // Nếu không có số chứng từ -> giữ dòng độc lập
    if (!key) {
      continue
    }

    const groupKey = `${it.displayDate}|${key}`
    const existing = map.get(groupKey)
    const absAmt = Math.abs(it.amount)
    const foreignAmt = it.foreignAmount ? Math.abs(it.foreignAmount) : 0

    if (existing) {
      existing.totalAmount += absAmt
      existing.totalForeignAmount += foreignAmt
      existing.count++
      if (it.description) existing.descriptions.add(it.description)
    } else {
      const descriptions = new Set<string>()
      if (it.description) descriptions.add(it.description)
      map.set(groupKey, {
        base: it,
        totalAmount: absAmt,
        totalForeignAmount: foreignAmt,
        count: 1,
        descriptions,
      })
    }
  }

  // Danh sách các dòng không có số chứng từ
  const noVoucherItems = items.filter((it) => !(it.voucher || '').trim())

  // Chuyển đổi các nhóm thành SampleableItem hoàn chỉnh
  const groupedItems: SampleableItem[] = []

  for (const g of map.values()) {
    let summaryDesc = g.base.description
    if (g.count > 1) {
      const descList = Array.from(g.descriptions).slice(0, 2).join('; ')
      summaryDesc = `${descList} (${g.count} dòng chi tiết)`
    }

    groupedItems.push({
      ...g.base,
      amount: g.totalAmount,
      foreignAmount: g.totalForeignAmount > 0 ? g.totalForeignAmount : g.base.foreignAmount,
      subItemCount: g.count,
      description: summaryDesc,
    })
  }

  return [...groupedItems, ...noVoucherItems]
}
