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

export function fillInventoryWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D500 - HTK - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D 510 Lead schedule
  const wsD510 = wb.getWorksheet('D 510')
  if (wsD510) {
    const invMap: Record<string, number> = {
      '151': 12,
      '152': 13,
      '153': 14,
      '154': 15,
      '155': 16,
      '156': 17,
      '157': 18,
      '158': 19,
      '2294': 20,
    }

    for (const [prefix, rowNum] of Object.entries(invMap)) {
      const accounts = Array.from(ctx.cdfsAccounts.values()).filter((a) => a.matk.startsWith(prefix))
      const isProvision = prefix === '2294' || prefix === '159'
      const sumCK = accounts.reduce((s, a) => s + (isProvision ? (a.cock || a.nock || 0) : (a.nock || 0)), 0)
      const sumDK = accounts.reduce((s, a) => s + (isProvision ? (a.sdcdk || a.sdndk || 0) : (a.sdndk || 0)), 0)

      setLeadRowValues(wsD510, rowNum, { ck: sumCK, dk: sumDK })
      itemsCount++
    }
    updatedSheets.push('D 510')
  }

  // 3. D 595 Cutoff Phiếu nhập kho / xuất kho
  const wsD595 = wb.getWorksheet('D595') || wb.getWorksheet('D 595')
  if (wsD595) {
    const invEntries = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('15') || t.credit.startsWith('15'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15)

    let r = 13
    for (const item of invEntries) {
      const row = wsD595.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellAmount(row.getCell(4), item.amount)
      styleCellCode(row.getCell(5), item.debit)
      styleCellCode(row.getCell(6), item.credit)
      r++
      itemsCount++
    }
    updatedSheets.push(wsD595.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
