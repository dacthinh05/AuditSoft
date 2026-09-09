import { INVENTORY_GROUPS, INVENTORY_TOTAL_LABEL } from '../constants'
import { moneyFromJSON, moneyToJSON, subtractMoney, sumMoney, type Money } from '../money'
import type { DiffRow, InventoryRow } from '../types'

function abs(m: Money): Money {
  return m.raw < 0n ? { raw: -m.raw, scale: m.scale } : m
}

/** Panel "Tổng hợp điều chỉnh tồn kho theo TK" (152–158):
 * - Ghi Nợ tăng = Σ Chênh lệch dòng có 3 số đầu TK Nợ = nhóm
 * - Ghi Có giảm = Σ Chênh lệch dòng có 3 số đầu TK Có = nhóm
 * - Net = Nợ − Có
 * - Gross (Tổng gộp) = Σ |Chênh lệch| mọi dòng có TK Nợ hoặc TK Có thuộc nhóm. */
export function buildInventorySummary(rows: readonly DiffRow[]): InventoryRow[] {
  interface Bucket {
    ghiNo: Money
    ghiCo: Money
    gross: Money
  }
  const acc = new Map<string, Bucket>()
  for (const g of INVENTORY_GROUPS) {
    acc.set(g, { ghiNo: sumMoney([]), ghiCo: sumMoney([]), gross: sumMoney([]) })
  }

  for (const row of rows) {
    const diff = moneyFromJSON(row.difference)
    for (const g of INVENTORY_GROUPS) {
      const bucket = acc.get(g)
      if (!bucket) continue
      const debitHit = row.debit.startsWith(g)
      const creditHit = row.credit.startsWith(g)
      if (debitHit || creditHit) bucket.gross = sumMoney([bucket.gross, abs(diff)])
      if (debitHit) bucket.ghiNo = sumMoney([bucket.ghiNo, diff])
      if (creditHit) bucket.ghiCo = sumMoney([bucket.ghiCo, diff])
    }
  }

  const out: InventoryRow[] = []
  let totalGhiNo = sumMoney([])
  let totalGhiCo = sumMoney([])
  let totalGross = sumMoney([])

  for (const g of INVENTORY_GROUPS) {
    const b = acc.get(g)
    if (!b) continue
    out.push({
      group: g,
      ghiNo: moneyToJSON(b.ghiNo),
      ghiCo: moneyToJSON(b.ghiCo),
      net: moneyToJSON(subtractMoney(b.ghiNo, b.ghiCo)),
      gross: moneyToJSON(b.gross),
      isTotal: false,
    })
    totalGhiNo = sumMoney([totalGhiNo, b.ghiNo])
    totalGhiCo = sumMoney([totalGhiCo, b.ghiCo])
    totalGross = sumMoney([totalGross, b.gross])
  }

  out.push({
    group: INVENTORY_TOTAL_LABEL,
    ghiNo: moneyToJSON(totalGhiNo),
    ghiCo: moneyToJSON(totalGhiCo),
    net: moneyToJSON(subtractMoney(totalGhiNo, totalGhiCo)),
    gross: moneyToJSON(totalGross),
    isTotal: true,
  })

  return out
}
