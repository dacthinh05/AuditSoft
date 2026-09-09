import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
  styleCellAmount,
} from '../helpers'

export function fillTaxWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E300 - Thue - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. E 310 Lead schedule
  const wsE310 = wb.getWorksheet('E 310')
  if (wsE310) {
    // 1331 Thuế GTGT được khấu trừ (Row 11)
    const acc1331 = ctx.cdfsAccounts.get('1331')
    setLeadRowValues(wsE310, 11, { ck: acc1331?.nock ?? 0, dk: acc1331?.sdndk ?? 0 })

    // 1332 Thuế GTGT TSCĐ (Row 12)
    const acc1332 = ctx.cdfsAccounts.get('1332')
    setLeadRowValues(wsE310, 12, { ck: acc1332?.nock ?? 0, dk: acc1332?.sdndk ?? 0 })

    // 33311 Thuế GTGT đầu ra (Row 19)
    const acc33311 = ctx.cdfsAccounts.get('33311')
    setLeadRowValues(wsE310, 19, { ck: acc33311?.cock ?? 0, dk: acc33311?.sdcdk ?? 0 })

    // 33312 Thuế GTGT hàng nhập khẩu (Row 20)
    const acc33312 = ctx.cdfsAccounts.get('33312')
    setLeadRowValues(wsE310, 20, { ck: acc33312?.cock ?? 0, dk: acc33312?.sdcdk ?? 0 })

    // 3333 Thuế XNK (Row 21)
    const acc3333 = ctx.cdfsAccounts.get('3333')
    setLeadRowValues(wsE310, 21, { ck: acc3333?.cock ?? 0, dk: acc3333?.sdcdk ?? 0 })

    // 3334 Thuế TNDN (Row 22)
    const acc3334 = ctx.cdfsAccounts.get('3334')
    setLeadRowValues(wsE310, 22, { ck: acc3334?.cock ?? 0, dk: acc3334?.sdcdk ?? 0 })

    // 3335 Thuế TNCN (Row 23)
    const acc3335 = ctx.cdfsAccounts.get('3335')
    setLeadRowValues(wsE310, 23, { ck: acc3335?.cock ?? 0, dk: acc3335?.sdcdk ?? 0 })

    itemsCount += 7
    updatedSheets.push('E 310')
  }

  // 3. E 380 Đối chiếu kê khai thuế 12 tháng
  const wsE380 = wb.getWorksheet('E 380') || wb.getWorksheet('E380')
  if (wsE380) {
    const vatInMonthly = new Array(12).fill(0)
    const vatOutMonthly = new Array(12).fill(0)

    for (const t of ctx.nkcTransactions) {
      const mIdx = Math.max(0, Math.min(11, t.month - 1))
      if (t.debit.startsWith('1331')) vatInMonthly[mIdx] += t.amount
      if (t.credit.startsWith('33311')) vatOutMonthly[mIdx] += t.amount
    }

    const r = 19
    for (let m = 0; m < 12; m++) {
      const row = wsE380.getRow(r + m)
      styleCellAmount(row.getCell(2), vatInMonthly[m] ?? 0)
      styleCellAmount(row.getCell(3), vatOutMonthly[m] ?? 0)
      itemsCount += 2
    }
    updatedSheets.push(wsE380.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
