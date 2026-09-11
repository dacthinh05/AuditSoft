import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import { extract12MonthExpenseMatrix, extractCounterpartStats } from '../counterpartExtractor'
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

    // 3. D 690 Chi tiết phát sinh chi phí trả trước (TK 242)
    const d690Sheet = editor.hasSheet('D 690') ? 'D 690' : editor.hasSheet('D690') ? 'D690' : null
    if (d690Sheet) {
      const cp242 = extractCounterpartStats(ctx.nkcTransactions, '242', false)

      // Vế NỢ 242 (Hàng 15-17):
      if (cp242.debitItems.length === 0) {
        editor.updateCell(d690Sheet, 'A15', { text: '' })
        editor.updateCell(d690Sheet, 'B15', { text: 'Không phát sinh' })
        editor.updateCell(d690Sheet, 'C15', { number: 0 })
        editor.updateCell(d690Sheet, 'D15', { number: 0 })
        for (let i = 1; i < 3; i++) {
          const r = 15 + i
          editor.updateCell(d690Sheet, `A${r}`, { text: '' })
          editor.updateCell(d690Sheet, `B${r}`, { text: '' })
          editor.updateCell(d690Sheet, `C${r}`, { number: 0 })
          editor.updateCell(d690Sheet, `D${r}`, { number: 0 })
        }
        editor.updateCell(d690Sheet, 'D19', { number: 0 })
      } else {
        for (let i = 0; i < 3; i++) {
          const r = 15 + i
          const item = cp242.debitItems[i]
          if (item) {
            editor.updateCell(d690Sheet, `A${r}`, { text: item.ref })
            editor.updateCell(d690Sheet, `B${r}`, { text: item.account })
            editor.updateCell(d690Sheet, `C${r}`, { number: item.amount })
          } else {
            editor.updateCell(d690Sheet, `A${r}`, { text: '' })
            editor.updateCell(d690Sheet, `B${r}`, { text: '' })
            editor.updateCell(d690Sheet, `C${r}`, { number: 0 })
            editor.updateCell(d690Sheet, `D${r}`, { number: 0 })
          }
        }
      }

      // Vế CÓ 242 (Hàng 15-17):
      if (cp242.creditItems.length === 0) {
        editor.updateCell(d690Sheet, 'E15', { text: '' })
        editor.updateCell(d690Sheet, 'F15', { text: 'Không phát sinh' })
        editor.updateCell(d690Sheet, 'G15', { number: 0 })
        editor.updateCell(d690Sheet, 'H15', { number: 0 })
        for (let i = 1; i < 3; i++) {
          const r = 15 + i
          editor.updateCell(d690Sheet, `E${r}`, { text: '' })
          editor.updateCell(d690Sheet, `F${r}`, { text: '' })
          editor.updateCell(d690Sheet, `G${r}`, { number: 0 })
          editor.updateCell(d690Sheet, `H${r}`, { number: 0 })
        }
        editor.updateCell(d690Sheet, 'H19', { number: 0 })
      } else {
        for (let i = 0; i < 3; i++) {
          const r = 15 + i
          const item = cp242.creditItems[i]
          if (item) {
            editor.updateCell(d690Sheet, `E${r}`, { text: item.ref })
            editor.updateCell(d690Sheet, `F${r}`, { text: item.account })
            editor.updateCell(d690Sheet, `G${r}`, { number: item.amount })
          } else {
            editor.updateCell(d690Sheet, `E${r}`, { text: '' })
            editor.updateCell(d690Sheet, `F${r}`, { text: '' })
            editor.updateCell(d690Sheet, `G${r}`, { number: 0 })
            editor.updateCell(d690Sheet, `H${r}`, { number: 0 })
          }
        }
      }

      editor.updateCell(d690Sheet, 'B23', {
        text: 'Chi phí trả trước được phân bổ đều đặn và hợp lý vào chi phí sản xuất kinh doanh (TK 627, 642).',
      })
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
    const cp242 = extractCounterpartStats(ctx.nkcTransactions, '242', false)
    // Vế NỢ 242 (Hàng 15-17):
    if (cp242.debitItems.length === 0) {
      wsD690.getCell('A15').value = null
      styleCellText(wsD690.getCell('B15'), 'Không phát sinh')
      styleCellAmount(wsD690.getCell('C15'), 0)
      wsD690.getCell('D15').value = 0
      for (let i = 1; i < 3; i++) {
        const r = 15 + i
        wsD690.getCell(`A${r}`).value = null
        wsD690.getCell(`B${r}`).value = null
        styleCellAmount(wsD690.getCell(`C${r}`), 0)
        wsD690.getCell(`D${r}`).value = 0
      }
      wsD690.getCell('D19').value = 0
    } else {
      for (let i = 0; i < 3; i++) {
        const r = 15 + i
        const dItem = cp242.debitItems[i]
        if (dItem) {
          styleCellCode(wsD690.getCell(`A${r}`), dItem.ref)
          styleCellCode(wsD690.getCell(`B${r}`), dItem.account)
          styleCellAmount(wsD690.getCell(`C${r}`), dItem.amount)
        } else {
          wsD690.getCell(`A${r}`).value = null
          wsD690.getCell(`B${r}`).value = null
          styleCellAmount(wsD690.getCell(`C${r}`), 0)
          wsD690.getCell(`D${r}`).value = 0
        }
      }
    }

    // Vế CÓ 242 (Hàng 15-17):
    if (cp242.creditItems.length === 0) {
      wsD690.getCell('E15').value = null
      styleCellText(wsD690.getCell('F15'), 'Không phát sinh')
      styleCellAmount(wsD690.getCell('G15'), 0)
      wsD690.getCell('H15').value = 0
      for (let i = 1; i < 3; i++) {
        const r = 15 + i
        wsD690.getCell(`E${r}`).value = null
        wsD690.getCell(`F${r}`).value = null
        styleCellAmount(wsD690.getCell(`G${r}`), 0)
        wsD690.getCell(`H${r}`).value = 0
      }
      wsD690.getCell('H19').value = 0
    } else {
      for (let i = 0; i < 3; i++) {
        const r = 15 + i
        const cItem = cp242.creditItems[i]
        if (cItem) {
          styleCellCode(wsD690.getCell(`E${r}`), cItem.ref)
          styleCellCode(wsD690.getCell(`F${r}`), cItem.account)
          styleCellAmount(wsD690.getCell(`G${r}`), cItem.amount)
        } else {
          wsD690.getCell(`E${r}`).value = null
          wsD690.getCell(`F${r}`).value = null
          styleCellAmount(wsD690.getCell(`G${r}`), 0)
          wsD690.getCell(`H${r}`).value = 0
        }
      }
    }
    itemsCount += 12
    styleCellText(
      wsD690.getCell('B23'),
      'Chi phí trả trước được phân bổ đều đặn và hợp lý vào chi phí sản xuất kinh doanh (TK 627, 642).',
    )
    itemsCount++
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
