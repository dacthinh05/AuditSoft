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

export function fillExpenseWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. G210 Lead schedule Giá vốn hàng bán (632)
  const wsG210 = wb.getWorksheet('G210')
  if (wsG210) {
    const acc632 = ctx.cdfsAccounts.get('632')
    const acc6321 = ctx.cdfsAccounts.get('6321')
    const acc6322 = ctx.cdfsAccounts.get('6322')

    const cogsVal = acc632 != null ? acc632.psno : (acc6321?.psno ?? 0) + (acc6322?.psno ?? 0)
    setLeadRowValues(wsG210, 12, { ck: cogsVal, dk: cogsVal })
    itemsCount++

    updatedSheets.push('G210')
  }

  // 3. G291.2 Chọn mẫu phát sinh mua hàng (Nợ 152, 611 / Có 331)
  const wsG291_2 = wb.getWorksheet('G291.2')
  if (wsG291_2) {
    const purchaseSamples = ctx.nkcTransactions
      .filter((t) => (t.debit.startsWith('152') || t.debit.startsWith('611')) && t.credit.startsWith('331'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)

    let r = 14
    for (const item of purchaseSamples) {
      const row = wsG291_2.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(5), item.debit)
      styleCellCode(row.getCell(6), item.credit)
      styleCellAmount(row.getCell(7), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push('G291.2')
  }

  // 4. G310 Lead schedule Chi phí bán hàng (641)
  const wsG310 = wb.getWorksheet('G310')
  if (wsG310) {
    const acc641 = ctx.cdfsAccounts.get('641')
    if (acc641) {
      setLeadRowValues(wsG310, 12, { ck: acc641.psno, dk: acc641.psno })
      itemsCount++
    }
    updatedSheets.push('G310')
  }

  // 5. G410 Lead schedule Chi phí quản lý doanh nghiệp (642)
  const wsG410 = wb.getWorksheet('G410')
  if (wsG410) {
    const acc642 = ctx.cdfsAccounts.get('642')
    if (acc642) {
      setLeadRowValues(wsG410, 13, { ck: acc642.psno, dk: acc642.psno })
      itemsCount++
    }
    updatedSheets.push('G410')
  }

  // 6. G490 Chọn mẫu chi phí QLDN (642)
  const wsG490 = wb.getWorksheet('G490')
  if (wsG490) {
    const gnaSamples = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('642'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)

    let r = 20
    for (const item of gnaSamples) {
      const row = wsG490.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push('G490')
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
