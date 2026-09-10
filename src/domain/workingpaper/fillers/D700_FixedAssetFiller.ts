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
  const wsD710 = findWorksheetFuzzy(wb, ['D 710', 'D710'])
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
    updatedSheets.push(wsD710.name)
  }

  // 3. D 790 Mua sắm tăng giảm TSCĐ
  const wsD790 = findWorksheetFuzzy(wb, ['D 790', 'D790'])
  if (wsD790) {
    // Bảng 1 (Hàng 15-16): Cơ cấu đối ứng TK 211
    let psNo331 = 0
    let psNo112 = 0
    let psCo214 = 0
    let psCo811 = 0
    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('211')) {
        if (t.credit.startsWith('331')) psNo331 += t.amount
        else psNo112 += t.amount
      }
      if (t.credit.startsWith('211')) {
        if (t.debit.startsWith('214')) psCo214 += t.amount
        else psCo811 += t.amount
      }
    }

    // Điền đối ứng TK 211 (giữ nguyên công thức tỷ lệ cột D/H và SUM hàng 17)
    styleCellCode(wsD790.getCell('B15'), '331/241')
    styleCellAmount(wsD790.getCell('C15'), psNo331)
    styleCellCode(wsD790.getCell('B16'), '112/111')
    styleCellAmount(wsD790.getCell('C16'), psNo112)
    styleCellCode(wsD790.getCell('F15'), '214')
    styleCellAmount(wsD790.getCell('G15'), psCo214)
    styleCellCode(wsD790.getCell('F16'), '811/Khác')
    styleCellAmount(wsD790.getCell('G16'), psCo811)
    itemsCount += 8

    // Bảng 2 (Hàng 38-44): Mẫu kiểm tra phát sinh tăng TSCĐ (tối đa 7 dòng, không đè hàng 45 =SUM(F38:F44))
    const faAdditions = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('211') || t.debit.startsWith('241'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7)

    for (let i = 0; i < 7; i++) {
      const r = 38 + i
      const row = wsD790.getRow(r)
      const item = faAdditions[i]
      if (item) {
        styleCellDate(row.getCell(1), item.dateVal)
        styleCellCode(row.getCell(2), item.docNo)
        styleCellText(row.getCell(3), item.desc)
        styleCellCode(row.getCell(4), item.debit)
        styleCellCode(row.getCell(5), item.credit)
        styleCellAmount(row.getCell(6), item.amount)
        styleCellCode(row.getCell(8), 'P')
        itemsCount += 7
      } else {
        row.getCell(1).value = ''
        row.getCell(2).value = ''
        row.getCell(3).value = ''
        row.getCell(4).value = ''
        row.getCell(5).value = ''
        row.getCell(6).value = 0
        row.getCell(8).value = ''
      }
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
