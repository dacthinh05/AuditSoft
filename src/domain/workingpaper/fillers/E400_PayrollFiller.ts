import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
  styleCellAmount,
} from '../helpers'

export function fillPayrollWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E400 - Luong - Mau 2025 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. E 410 Lead schedule
  const wsE410 = wb.getWorksheet('E 410')
  if (wsE410) {
    const payMap: Record<string, number> = {
      '3341': 11,
      '3342': 12,
      '335': 15,
      '3382': 17,
      '3383': 18,
      '3384': 19,
      '3386': 20,
    }

    for (const [prefix, rowNum] of Object.entries(payMap)) {
      const acc = ctx.cdfsAccounts.get(prefix)
      setLeadRowValues(wsE410, rowNum, {
        ck: acc?.cock || acc?.nock || 0,
        dk: acc?.sdcdk || acc?.sdndk || 0,
      })
      itemsCount++
    }
    updatedSheets.push('E 410')
  }

  // 3. E 490 Đối chiếu phân tích biến động chi phí lương 12 tháng
  const wsE490 = wb.getWorksheet('E 490') || wb.getWorksheet('E490')
  if (wsE490) {
    const monthlySalary = new Array(12).fill(0)
    for (const t of ctx.nkcTransactions) {
      if (t.credit.startsWith('334') && (t.debit.startsWith('622') || t.debit.startsWith('627') || t.debit.startsWith('641') || t.debit.startsWith('642'))) {
        const mIdx = Math.max(0, Math.min(11, t.month - 1))
        monthlySalary[mIdx] = (monthlySalary[mIdx] ?? 0) + t.amount
      }
    }

    const r = 24
    for (let m = 0; m < 12; m++) {
      const row = wsE490.getRow(r + m)
      styleCellAmount(row.getCell(3), monthlySalary[m] ?? 0)
      itemsCount++
    }
    updatedSheets.push(wsE490.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
