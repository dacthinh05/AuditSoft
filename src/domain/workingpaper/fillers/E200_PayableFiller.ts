import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
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
  const wsE210 = wb.getWorksheet('E 210')
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
    updatedSheets.push('E 210')
  }

  // 3. E 291 Chọn mẫu kiểm tra phát sinh phải trả người bán
  const wsE291 = wb.getWorksheet('E 291') || wb.getWorksheet('E291')
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
