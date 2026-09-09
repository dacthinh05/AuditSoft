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

export function fillFixedAssetWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D700 - Tai san - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D 710 Lead schedule
  const wsD710 = wb.getWorksheet('D 710')
  if (wsD710) {
    const faMap: Record<string, number> = {
      '2111': 11,
      '2112': 12,
      '2113': 13,
      '2114': 14,
      '2141': 17,
    }

    for (const [prefix, rowNum] of Object.entries(faMap)) {
      const acc = ctx.cdfsAccounts.get(prefix)
      const isDepr = prefix.startsWith('214')
      const ck = isDepr ? (acc?.cock || acc?.nock || 0) : (acc?.nock || acc?.cock || 0)
      const dk = isDepr ? (acc?.sdcdk || acc?.sdndk || 0) : (acc?.sdndk || acc?.sdcdk || 0)

      setLeadRowValues(wsD710, rowNum, { ck, dk })
      itemsCount++
    }
    updatedSheets.push('D 710')
  }

  // 3. D 790 Mua sắm tăng giảm TSCĐ
  const wsD790 = wb.getWorksheet('D 790') || wb.getWorksheet('D790')
  if (wsD790) {
    const faAdditions = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('211') || t.credit.startsWith('211') || t.debit.startsWith('241'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15)

    let r = 14
    for (const item of faAdditions) {
      const row = wsD790.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push(wsD790.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
