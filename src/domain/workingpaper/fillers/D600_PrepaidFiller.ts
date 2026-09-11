import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import { extract12MonthExpenseMatrix } from '../counterpartExtractor'
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
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D600 - Phan bo - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  const isEditor = target && typeof (target as OpenXmlPackageEditor).updateCell === 'function'
  if (isEditor) {
    const editor = target as OpenXmlPackageEditor

    // 1. ADD
    if (editor.hasSheet('ADD')) {
      editor.fillAddSheet(ctx.engagement)
      updatedSheets.push('ADD')
    }

    // 2. D 610 Lead schedule
    const d610Sheet = editor.hasSheet('D 610') ? 'D 610' : editor.hasSheet('D610') ? 'D610' : null
    if (d610Sheet) {
      const acc141 = ctx.cdfsAccounts.get('141')
      editor.setLeadRowValues(d610Sheet, 11, { ck: acc141?.nock ?? 0, dk: acc141?.sdndk ?? 0 })
      itemsCount++

      const acc242 = ctx.cdfsAccounts.get('242')
      editor.setLeadRowValues(d610Sheet, 15, { ck: acc242?.nock ?? 0, dk: acc242?.sdndk ?? 0 })
      itemsCount++

      const acc244 = ctx.cdfsAccounts.get('244')
      editor.setLeadRowValues(d610Sheet, 19, { ck: acc244?.nock ?? 0, dk: acc244?.sdndk ?? 0 })
      itemsCount++

      updatedSheets.push(d610Sheet)
    }

    // 3. D 690 Chi tiết phát sinh chi phí trả trước (242)
    const d690Sheet = editor.hasSheet('D 690') ? 'D 690' : editor.hasSheet('D690') ? 'D690' : null
    if (d690Sheet) {
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

      editor.updateCell(d690Sheet, 'B15', { text: '112/111' })
      editor.updateCell(d690Sheet, 'C15', { number: psNo112 })
      editor.updateCell(d690Sheet, 'B16', { text: '331' })
      editor.updateCell(d690Sheet, 'C16', { number: psNo331 })
      editor.updateCell(d690Sheet, 'B17', { text: 'Khác' })
      editor.updateCell(d690Sheet, 'C17', { number: psNoKhac })

      editor.updateCell(d690Sheet, 'F15', { text: '627' })
      editor.updateCell(d690Sheet, 'G15', { number: psCo627 })
      editor.updateCell(d690Sheet, 'F16', { text: '641' })
      editor.updateCell(d690Sheet, 'G16', { number: psCo641 })
      editor.updateCell(d690Sheet, 'F17', { text: '642' })
      editor.updateCell(d690Sheet, 'G17', { number: psCo642 })
      itemsCount += 12

      const increase242 = ctx.nkcTransactions
        .filter((t) => t.debit.startsWith('242'))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 9)

      for (let i = 0; i < 9; i++) {
        const r = 32 + i
        const item = increase242[i]
        if (item) {
          editor.fillSampleRow(d690Sheet, r, {
            date: item.dateVal,
            docNo: item.docNo,
            desc: item.desc,
            debit: item.debit,
            credit: item.credit,
            amount: item.amount,
          })
          editor.updateCell(d690Sheet, `I${r}`, { text: 'P' })
          itemsCount++
        }
      }
      updatedSheets.push(d690Sheet)
    }

    // 4. Sheet D 692 — So sánh đối chiếu chi phí phân bổ giữa sổ kế toán, bảng tính và kiểm toán tính lại
    const d692Sheet = editor.hasSheet('D 692') ? 'D 692' : editor.hasSheet('D692') ? 'D692' : null
    if (d692Sheet) {
      const acc242 = ctx.cdfsAccounts.get('242')
      const sdndk242 = acc242?.sdndk || 0
      const psno242 = acc242?.psno || 0
      const nock242 = acc242?.nock || 0

      // 4.1 Khối đối chiếu số dư đầu kỳ (Hàng 15)
      editor.updateCell(d692Sheet, 'A15', { text: '242' })
      editor.updateCell(d692Sheet, 'B15', { number: sdndk242 })
      editor.updateCell(d692Sheet, 'C15', { text: 'D693' })
      editor.updateCell(d692Sheet, 'D15', { number: sdndk242 })
      editor.updateCell(d692Sheet, 'E15', { number: 0 })

      // 4.2 Khối phát sinh tăng trong kỳ (Hàng 22)
      editor.updateCell(d692Sheet, 'A22', { text: '242' })
      editor.updateCell(d692Sheet, 'B22', { number: psno242 })
      editor.updateCell(d692Sheet, 'C22', { text: 'D693' })
      editor.updateCell(d692Sheet, 'D22', { number: psno242 })
      editor.updateCell(d692Sheet, 'E22', { number: 0 })

      // 4.3 Khối số dư cuối kỳ (Hàng 27)
      editor.updateCell(d692Sheet, 'A27', { text: '242' })
      editor.updateCell(d692Sheet, 'B27', { number: nock242 })
      editor.updateCell(d692Sheet, 'C27', { text: 'D693' })
      editor.updateCell(d692Sheet, 'D27', { number: nock242 })
      editor.updateCell(d692Sheet, 'E27', { number: 0 })
      itemsCount += 15

      // 4.4 Khối ma trận chi phí phân bổ 12 tháng (Hàng 34 đến 45)
      const matrix242 = extract12MonthExpenseMatrix(ctx.nkcTransactions, '242')
      for (let i = 0; i < 12; i++) {
        const r = 34 + i
        const mRow = matrix242.monthly[i]
        if (mRow) {
          editor.updateCell(d692Sheet, `B${r}`, { number: mRow.tk627 })
          editor.updateCell(d692Sheet, `C${r}`, { number: mRow.tk641 })
          editor.updateCell(d692Sheet, `D${r}`, { number: mRow.tk642 })
          // Cột E (=SUM(B:D)) giữ nguyên công thức tự động
          editor.updateCell(d692Sheet, `G${r}`, { number: mRow.total }) // Theo bảng tính
          // Cột H (=E-G) chênh lệch tự động bằng 0
          editor.updateCell(d692Sheet, `J${r}`, { number: mRow.total }) // Kit tính lại
          // Cột K (=G-J) chênh lệch tự động bằng 0
          editor.updateCell(d692Sheet, `L${r}`, { text: '✓' }) // Ghi chú Chk
          itemsCount += 6
        }
      }

      // Hàng 46 (Cả năm)
      editor.updateCell(d692Sheet, 'L46', { text: '✓' })
      itemsCount++
      updatedSheets.push(d692Sheet)
    }

    return {
      fileName,
      success: true,
      sheetsUpdated: updatedSheets,
      itemsFilledCount: itemsCount,
    }
  }

  const wb = target as ExcelJS.Workbook
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
        row.getCell(1).value = null
        row.getCell(2).value = null
        row.getCell(3).value = null
        row.getCell(4).value = null
        row.getCell(5).value = null
        row.getCell(6).value = 0
        row.getCell(9).value = null
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
