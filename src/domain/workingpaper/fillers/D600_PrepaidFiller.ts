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

export function fillPrepaidWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D600 - Phan bo - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D 610 Lead schedule
  const wsD610 = wb.getWorksheet('D 610')
  if (wsD610) {
    // 141 Tạm ứng (Row 11)
    const acc141 = ctx.cdfsAccounts.get('141')
    setLeadRowValues(wsD610, 11, { ck: acc141?.nock ?? 0, dk: acc141?.sdndk ?? 0 })
    itemsCount++

    // 242.DH Chi phí trả trước (Row 15)
    const acc242 = ctx.cdfsAccounts.get('242')
    setLeadRowValues(wsD610, 15, { ck: acc242?.nock ?? 0, dk: acc242?.sdndk ?? 0 })
    itemsCount++

    // 244.DH Ký quỹ ký cược (Row 19)
    const acc244 = ctx.cdfsAccounts.get('244')
    setLeadRowValues(wsD610, 19, { ck: acc244?.nock ?? 0, dk: acc244?.sdndk ?? 0 })
    itemsCount++

    updatedSheets.push('D 610')
  }

  // 3. D 690 Chi tiết các khoản phát sinh 242 / 141
  const wsD690 = wb.getWorksheet('D 690') || wb.getWorksheet('D690')
  if (wsD690) {
    const prepaidEntries = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('242') || t.credit.startsWith('242') || t.debit.startsWith('141') || t.credit.startsWith('141'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)

    let r = 14
    for (const item of prepaidEntries) {
      const row = wsD690.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push(wsD690.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
