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

export function fillReceivableWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D300 - Phai thu - Mau 2025 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D 310 Lead schedule
  const wsD310 = findWorksheetFuzzy(wb, ['D 310', 'D310'])
  if (wsD310) {
    const acc131 = ctx.cdfsAccounts.get('131') || ctx.cdfsAccounts.get('1311') || ctx.cdfsAccounts.get('1312')
    if (acc131) {
      const sum131NoCK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.nock || 0), 0)
      const sum131CoCK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.cock || 0), 0)
      const sum131NoDK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.sdndk || 0), 0)
      const sum131CoDK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.sdcdk || 0), 0)

      // Dư Nợ 131 (Phải thu khách hàng) - Row 12
      setLeadRowValues(wsD310, 12, { ck: sum131NoCK, dk: sum131NoDK })

      // Dư Có 131 (Người mua trả tiền trước) - Row 14
      setLeadRowValues(wsD310, 14, { ck: sum131CoCK, dk: sum131CoDK })

      // Dự phòng 2293 - Row 16
      const acc2293 = ctx.cdfsAccounts.get('2293') || ctx.cdfsAccounts.get('139')
      setLeadRowValues(wsD310, 16, { ck: acc2293?.cock ?? 0, dk: acc2293?.sdcdk ?? 0 })

      itemsCount += 3
    }
    updatedSheets.push(wsD310.name)
  }

  // 3. D 351.2 Chi tiết công nợ khách hàng
  const wsD351 = findWorksheetFuzzy(wb, ['D 351.2', 'D351.2', 'D 351.1', 'D351.1', 'D351'])
  if (wsD351) {
    const custBalanceMap = new Map<string, { no: number; co: number; desc: string }>()

    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('131') || t.credit.startsWith('131')) {
        const key = t.custId || (t.desc.split(' ')[0] ?? 'KHACH_HANG')
        const curr = custBalanceMap.get(key) ?? { no: 0, co: 0, desc: t.desc }
        if (t.debit.startsWith('131')) curr.no += t.amount
        if (t.credit.startsWith('131')) curr.co += t.amount
        custBalanceMap.set(key, curr)
      }
    }

    const sortedCusts = Array.from(custBalanceMap.entries())
      .sort((a, b) => Math.abs(b[1].no - b[1].co) - Math.abs(a[1].no - a[1].co))
      .slice(0, 30)

    let r = 14
    for (const [custId, bal] of sortedCusts) {
      const net = bal.no - bal.co
      const row = wsD351.getRow(r)
      styleCellCode(row.getCell(1), custId)
      styleCellText(row.getCell(2), bal.desc.slice(0, 50))
      styleCellAmount(row.getCell(3), net > 0 ? net : 0) // Dư Nợ
      styleCellAmount(row.getCell(4), net < 0 ? Math.abs(net) : 0) // Dư Có
      r++
      itemsCount++
    }
    updatedSheets.push(wsD351.name)
  }

  // 4. D 391 Chọn mẫu kiểm tra phát sinh công nợ phải thu
  const wsD391 = findWorksheetFuzzy(wb, ['D 391', 'D391', 'D 354', 'D354'])
  if (wsD391) {
    const topReceivableEntries = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('131') || t.credit.startsWith('131'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)

    let r = 15
    for (const t of topReceivableEntries) {
      const row = wsD391.getRow(r)
      styleCellDate(row.getCell(1), t.dateVal)
      styleCellCode(row.getCell(2), t.docNo)
      styleCellText(row.getCell(3), t.desc)
      styleCellCode(row.getCell(4), t.debit)
      styleCellCode(row.getCell(5), t.credit)
      styleCellAmount(row.getCell(6), t.amount)
      r++
      itemsCount++
    }
    updatedSheets.push(wsD391.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
