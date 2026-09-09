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

export function fillBorrowingWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E100 - Vay - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. E 110 Lead schedule
  const wsE110 = wb.getWorksheet('E 110')
  if (wsE110) {
    // 34121 Vay ngắn hạn (Row 11)
    const sum3412CK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('3412') || a.matk === '3411N')
      .reduce((s, a) => s + (a.cock || a.nock || 0), 0)
    const sum3412DK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('3412') || a.matk === '3411N')
      .reduce((s, a) => s + (a.sdcdk || a.sdndk || 0), 0)
    setLeadRowValues(wsE110, 11, { ck: sum3412CK, dk: sum3412DK })

    // 3411 Vay dài hạn (Row 16)
    const sum3411CK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('3411') && a.matk !== '3411N')
      .reduce((s, a) => s + (a.cock || a.nock || 0), 0)
    const sum3411DK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('3411') && a.matk !== '3411N')
      .reduce((s, a) => s + (a.sdcdk || a.sdndk || 0), 0)
    setLeadRowValues(wsE110, 16, { ck: sum3411CK, dk: sum3411DK })

    itemsCount += 2
    updatedSheets.push('E 110')
  }

  // 3. E 191 Phát sinh vay & trả nợ vay
  const wsE191 = wb.getWorksheet('E 191') || wb.getWorksheet('E191')
  if (wsE191) {
    const loanEntries = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('341') || t.credit.startsWith('341'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15)

    let r = 14
    for (const item of loanEntries) {
      const row = wsE191.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push(wsE191.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
