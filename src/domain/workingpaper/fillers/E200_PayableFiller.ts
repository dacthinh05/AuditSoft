import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
  findWorksheetFuzzy,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
  styleCellAmount,
  styleCellCode,
  styleCellDate,
  styleCellText,
} from '../helpers'

export function fillPayableWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E200 - Phai tra - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. E 210 Lead schedule
  const wsE210 = findWorksheetFuzzy(wb, ['E 210', 'E210'])
  if (wsE210) {
    const sum331CoCK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.cock || 0), 0)
    const sum331NoCK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.nock || 0), 0)
    const sum331CoDK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.sdcdk || 0), 0)
    const sum331NoDK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.sdndk || 0), 0)

    // Trả trước cho người bán ngắn hạn (Dư Nợ 331) - Row 13
    setLeadRowValues(wsE210, 13, { ck: sum331NoCK, dk: sum331NoDK })

    // Phải trả người bán ngắn hạn (Dư Có 331) - Row 16
    setLeadRowValues(wsE210, 16, { ck: sum331CoCK, dk: sum331CoDK })

    itemsCount += 2
    updatedSheets.push(wsE210.name)
  }
  // 2.1 E 250.2 Chi tiết số dư phải trả người bán (331) theo Nhà cung cấp
  const wsE250_2 = findWorksheetFuzzy(wb, ['E 250.2', 'E250.2', 'E 250.1', 'E250.1'])
  if (wsE250_2) {
    const vendorBalanceMap = new Map<string, { no: number; co: number; desc: string }>()
    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('331') || t.credit.startsWith('331')) {
        const key = t.custId || (t.desc.split(' ')[0] ?? 'NCC')
        const curr = vendorBalanceMap.get(key) ?? { no: 0, co: 0, desc: t.desc }
        if (t.debit.startsWith('331')) curr.no += t.amount
        if (t.credit.startsWith('331')) curr.co += t.amount
        vendorBalanceMap.set(key, curr)
      }
    }

    const sortedVendors = Array.from(vendorBalanceMap.entries())
      .sort((a, b) => Math.abs(b[1].co - b[1].no) - Math.abs(a[1].co - a[1].no))
      .slice(0, 25)

    let r = 20
    for (const [vendorId, bal] of sortedVendors) {
      const net = bal.co - bal.no
      const row = wsE250_2.getRow(r)
      styleCellCode(row.getCell(1), vendorId)
      styleCellText(row.getCell(2), bal.desc.slice(0, 50))
      styleCellAmount(row.getCell(3), net > 0 ? net : 0) // Dư Có 331 (Phải trả)
      styleCellAmount(row.getCell(4), net < 0 ? Math.abs(net) : 0) // Dư Nợ 331 (Trả trước)
      r++
      itemsCount++
    }
    updatedSheets.push(wsE250_2.name)
  }


  // 3. E 291 Chọn mẫu kiểm tra phát sinh phải trả người bán (Hàng 20-42, giữ hàng 44 =SUM)
  const wsE291 = findWorksheetFuzzy(wb, ['E 291', 'E291', 'E 251', 'E251'])
  if (wsE291) {
    const topPurchases = ctx.nkcTransactions
      .filter((t) => t.credit.startsWith('331'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)

    let r = 20
    for (const item of topPurchases) {
      const row = wsE291.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push(wsE291.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
