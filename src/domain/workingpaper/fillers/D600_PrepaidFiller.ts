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
  const wsD610 = findWorksheetFuzzy(wb, ['D 610', 'D610'])
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

    updatedSheets.push(wsD610.name)
  }

  // 3. D 690 Chi tiết phát sinh chi phí trả trước (242)
  const wsD690 = findWorksheetFuzzy(wb, ['D 690', 'D690'])
  if (wsD690) {
    // Bảng 1 (Hàng 15-17): Cơ cấu đối ứng Nợ/Có TK 242
    let psNo112 = 0
    let psNo331 = 0
    let psNoKhac = 0
    let psCo627 = 0
    let psCo641 = 0
    let psCo642 = 0

    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('242')) {
        if (t.credit.startsWith('112') || t.credit.startsWith('111')) psNo112 += t.amount
        else if (t.credit.startsWith('331')) psNo331 += t.amount
        else psNoKhac += t.amount
      }
      if (t.credit.startsWith('242')) {
        if (t.debit.startsWith('627')) psCo627 += t.amount
        else if (t.debit.startsWith('641')) psCo641 += t.amount
        else if (t.debit.startsWith('642')) psCo642 += t.amount
      }
    }

    // Điền bảng 1: Chỉ điền cột B/C (Nợ) và F/G (Có), giữ nguyên công thức tỷ lệ cột D/H và SUM hàng 19
    styleCellCode(wsD690.getCell('B15'), '112/111')
    styleCellAmount(wsD690.getCell('C15'), psNo112)
    styleCellCode(wsD690.getCell('B16'), '331')
    styleCellAmount(wsD690.getCell('C16'), psNo331)
    styleCellCode(wsD690.getCell('B17'), 'Khác')
    styleCellAmount(wsD690.getCell('C17'), psNoKhac)

    styleCellCode(wsD690.getCell('F15'), '627')
    styleCellAmount(wsD690.getCell('G15'), psCo627)
    styleCellCode(wsD690.getCell('F16'), '641')
    styleCellAmount(wsD690.getCell('G16'), psCo641)
    styleCellCode(wsD690.getCell('F17'), '642')
    styleCellAmount(wsD690.getCell('G17'), psCo642)
    itemsCount += 12

    // Bảng 2 (Hàng 32-40): Mẫu kiểm tra phát sinh tăng TK 242 (tối đa 9 dòng, không đè hàng 41 =SUM(F32:F40))
    const increase242 = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('242'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 9)

    for (let i = 0; i < 9; i++) {
      const r = 32 + i
      const row = wsD690.getRow(r)
      const item = increase242[i]
      if (item) {
        styleCellDate(row.getCell(1), item.dateVal)
        styleCellCode(row.getCell(2), item.docNo)
        styleCellText(row.getCell(3), item.desc)
        styleCellCode(row.getCell(4), item.debit)
        styleCellCode(row.getCell(5), item.credit)
        styleCellAmount(row.getCell(6), item.amount)
        styleCellCode(row.getCell(9), 'P')
        itemsCount++
      } else {
        row.getCell(1).value = ''
        row.getCell(2).value = ''
        row.getCell(3).value = ''
        row.getCell(4).value = ''
        row.getCell(5).value = ''
        row.getCell(6).value = 0
        row.getCell(9).value = ''
      }
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
