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
  const wsE110 = findWorksheetFuzzy(wb, ['E 110', 'E110'])
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
    updatedSheets.push(wsE110.name)
  }

  // 3. E 191 Phân tích chi phí lãi vay & mẫu chi phí lãi vay
  const wsE191 = findWorksheetFuzzy(wb, ['E 191', 'E191'])
  if (wsE191) {
    // Bảng 1 (Hàng 24-35): Biến động chi phí lãi vay 12 tháng (cột B 'Số tiền')
    const monthlyInterest = new Array(12).fill(0)
    const interestEntries = []
    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('635')) {
        interestEntries.push(t)
        const mIdx = Math.max(0, Math.min(11, t.month - 1))
        monthlyInterest[mIdx] += t.amount
      }
    }

    for (let m = 0; m < 12; m++) {
      const row = wsE191.getRow(24 + m)
      styleCellAmount(row.getCell(2), monthlyInterest[m] ?? 0)
      itemsCount++
      // Cột 3 (C) có công thức =B24/$B$36, hàng 36 có công thức =SUM(B24:B35) -> KHÔNG ĐÈ!
    }

    // Bảng 2 (Hàng 44+): Kiểm tra chọn mẫu chi phí lãi vay
    const topInterest = interestEntries.sort((a, b) => b.amount - a.amount).slice(0, 12)
    let r = 44
    for (const item of topInterest) {
      const row = wsE191.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(6), item.debit)
      styleCellCode(row.getCell(7), item.credit)
      styleCellAmount(row.getCell(8), item.amount)
      r++
      itemsCount += 6
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
