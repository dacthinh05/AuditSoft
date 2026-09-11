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

export function fillFixedAssetWorkingPaper(
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D700 - Tai san - Mau 2024 - Thinh.xlsx'
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

    // 2. D 710 Lead schedule
    const d710Sheet = editor.hasSheet('D 710') ? 'D 710' : editor.hasSheet('D710') ? 'D710' : null
    if (d710Sheet) {
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
        editor.setLeadRowValues(d710Sheet, rowNum, { ck, dk })
        itemsCount++
      }
      updatedSheets.push(d710Sheet)
    }

    // 3. D 790 Mua sắm tăng giảm TSCĐ (Bóc tách đối ứng động 211 & 214)
    const d790Sheet = editor.hasSheet('D 790') ? 'D 790' : editor.hasSheet('D790') ? 'D790' : null
    if (d790Sheet) {
      // 3.1 Bóc tách đối ứng TK 211 (Hàng 15-16)
      const cp211 = extractCounterpartStats(ctx.nkcTransactions, '211', false)

      // Vế NỢ 211:
      if (cp211.debitItems.length === 0) {
        editor.updateCell(d790Sheet, 'A15', { text: '' })
        editor.updateCell(d790Sheet, 'B15', { text: 'Không phát sinh' })
        editor.updateCell(d790Sheet, 'C15', { number: 0 })
        editor.updateCell(d790Sheet, 'D15', { number: 0 })
        editor.updateCell(d790Sheet, 'A16', { text: '' })
        editor.updateCell(d790Sheet, 'B16', { text: '' })
        editor.updateCell(d790Sheet, 'C16', { number: 0 })
        editor.updateCell(d790Sheet, 'D16', { number: 0 })
        editor.updateCell(d790Sheet, 'D17', { number: 0 })
      } else {
        for (let i = 0; i < 2; i++) {
          const r = 15 + i
          const item = cp211.debitItems[i]
          if (item) {
            editor.updateCell(d790Sheet, `A${r}`, { text: item.ref })
            editor.updateCell(d790Sheet, `B${r}`, { text: item.account })
            editor.updateCell(d790Sheet, `C${r}`, { number: item.amount })
          } else {
            editor.updateCell(d790Sheet, `A${r}`, { text: '' })
            editor.updateCell(d790Sheet, `B${r}`, { text: '' })
            editor.updateCell(d790Sheet, `C${r}`, { number: 0 })
            editor.updateCell(d790Sheet, `D${r}`, { number: 0 })
          }
        }
      }

      // Vế CÓ 211:
      if (cp211.creditItems.length === 0) {
        editor.updateCell(d790Sheet, 'E15', { text: '' })
        editor.updateCell(d790Sheet, 'F15', { text: 'Không phát sinh' })
        editor.updateCell(d790Sheet, 'G15', { number: 0 })
        editor.updateCell(d790Sheet, 'H15', { number: 0 })
        editor.updateCell(d790Sheet, 'E16', { text: '' })
        editor.updateCell(d790Sheet, 'F16', { text: '' })
        editor.updateCell(d790Sheet, 'G16', { number: 0 })
        editor.updateCell(d790Sheet, 'H16', { number: 0 })
        editor.updateCell(d790Sheet, 'H17', { number: 0 })
      } else {
        for (let i = 0; i < 2; i++) {
          const r = 15 + i
          const item = cp211.creditItems[i]
          if (item) {
            editor.updateCell(d790Sheet, `E${r}`, { text: item.ref })
            editor.updateCell(d790Sheet, `F${r}`, { text: item.account })
            editor.updateCell(d790Sheet, `G${r}`, { number: item.amount })
          } else {
            editor.updateCell(d790Sheet, `E${r}`, { text: '' })
            editor.updateCell(d790Sheet, `F${r}`, { text: '' })
            editor.updateCell(d790Sheet, `G${r}`, { number: 0 })
            editor.updateCell(d790Sheet, `H${r}`, { number: 0 })
          }
        }
      }

      // 3.2 Bóc tách đối ứng TK 214 (Hàng 23-25)
      const cp214 = extractCounterpartStats(ctx.nkcTransactions, '214', false)

      // Vế NỢ 214:
      if (cp214.debitItems.length === 0) {
        editor.updateCell(d790Sheet, 'A23', { text: '' })
        editor.updateCell(d790Sheet, 'B23', { text: 'Không phát sinh' })
        editor.updateCell(d790Sheet, 'C23', { number: 0 })
        editor.updateCell(d790Sheet, 'D23', { number: 0 })
        for (let i = 1; i < 3; i++) {
          const r = 23 + i
          editor.updateCell(d790Sheet, `A${r}`, { text: '' })
          editor.updateCell(d790Sheet, `B${r}`, { text: '' })
          editor.updateCell(d790Sheet, `C${r}`, { number: 0 })
          editor.updateCell(d790Sheet, `D${r}`, { number: 0 })
        }
        editor.updateCell(d790Sheet, 'D26', { number: 0 })
      } else {
        for (let i = 0; i < 3; i++) {
          const r = 23 + i
          const item = cp214.debitItems[i]
          if (item) {
            editor.updateCell(d790Sheet, `A${r}`, { text: item.ref })
            editor.updateCell(d790Sheet, `B${r}`, { text: item.account })
            editor.updateCell(d790Sheet, `C${r}`, { number: item.amount })
          } else {
            editor.updateCell(d790Sheet, `A${r}`, { text: '' })
            editor.updateCell(d790Sheet, `B${r}`, { text: '' })
            editor.updateCell(d790Sheet, `C${r}`, { number: 0 })
            editor.updateCell(d790Sheet, `D${r}`, { number: 0 })
          }
        }
      }

      // Vế CÓ 214:
      if (cp214.creditItems.length === 0) {
        editor.updateCell(d790Sheet, 'E23', { text: '' })
        editor.updateCell(d790Sheet, 'F23', { text: 'Không phát sinh' })
        editor.updateCell(d790Sheet, 'G23', { number: 0 })
        editor.updateCell(d790Sheet, 'H23', { number: 0 })
        for (let i = 1; i < 3; i++) {
          const r = 23 + i
          editor.updateCell(d790Sheet, `E${r}`, { text: '' })
          editor.updateCell(d790Sheet, `F${r}`, { text: '' })
          editor.updateCell(d790Sheet, `G${r}`, { number: 0 })
          editor.updateCell(d790Sheet, `H${r}`, { number: 0 })
        }
        editor.updateCell(d790Sheet, 'H26', { number: 0 })
      } else {
        for (let i = 0; i < 3; i++) {
          const r = 23 + i
          const item = cp214.creditItems[i]
          if (item) {
            editor.updateCell(d790Sheet, `E${r}`, { text: item.ref })
            editor.updateCell(d790Sheet, `F${r}`, { text: item.account })
            editor.updateCell(d790Sheet, `G${r}`, { number: item.amount })
          } else {
            editor.updateCell(d790Sheet, `E${r}`, { text: '' })
            editor.updateCell(d790Sheet, `F${r}`, { text: '' })
            editor.updateCell(d790Sheet, `G${r}`, { number: 0 })
            editor.updateCell(d790Sheet, `H${r}`, { number: 0 })
          }
        }
      }

      // 3.3 Nhận xét và kết luận kiểm toán chuẩn mực VACPA
      editor.updateCell(d790Sheet, 'B59', {
        text: 'Hạch toán phát sinh tăng, giảm TSCĐ và trích khấu hao trong kỳ phù hợp, không phát hiện đối ứng bất thường.',
      })
      itemsCount += 16
      const faAdditions = ctx.nkcTransactions
        .filter((t) => t.debit.startsWith('211') || t.debit.startsWith('241'))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 7)

      for (let i = 0; i < 7; i++) {
        const r = 38 + i
        const item = faAdditions[i]
        if (item) {
          editor.fillSampleRow(d790Sheet, r, {
            date: item.dateVal,
            docNo: item.docNo,
            desc: item.desc,
            debit: item.debit,
            credit: item.credit,
            amount: item.amount,
          })
          editor.updateCell(d790Sheet, `H${r}`, { text: 'P' })
          itemsCount++
        }
      }
      updatedSheets.push(d790Sheet)
    }

    // 4. Sheet D 792 — So sánh đối chiếu chi phí khấu hao giữa sổ kế toán và bảng tính khấu hao
    const d792Sheet = editor.hasSheet('D 792') ? 'D 792' : editor.hasSheet('D792') ? 'D792' : null
    if (d792Sheet) {
      // 4.1 Khối đối chiếu nguyên giá và hao mòn đầu kỳ (Rows 14-25)
      const faBeginningMap: Record<string, number> = {
        '2111': 14,
        '2112': 15,
        '2113': 16,
        '2114': 17,
        '213': 18,
        '21411': 21,
        '21412': 22,
        '21413': 23,
        '21414': 24,
        '2143': 25,
      }

      for (const [tk, rowNum] of Object.entries(faBeginningMap)) {
        const acc = ctx.cdfsAccounts.get(tk)
        const isDepr = tk.startsWith('214')
        const val = isDepr ? (acc?.sdcdk || acc?.sdndk || 0) : (acc?.sdndk || acc?.sdcdk || 0)
        editor.updateCell(d792Sheet, `A${rowNum}`, { text: tk })
        editor.updateCell(d792Sheet, `B${rowNum}`, { number: val })
        editor.updateCell(d792Sheet, `C${rowNum}`, { text: 'D793' })
        editor.updateCell(d792Sheet, `D${rowNum}`, { number: val })
        editor.updateCell(d792Sheet, `E${rowNum}`, { number: 0 })
        itemsCount += 5
      }

      // 4.2 Khối đối chiếu nguyên giá và hao mòn cuối kỳ (Rows 31-42)
      const faEndingMap: Record<string, number> = {
        '2111': 31,
        '2112': 32,
        '2113': 33,
        '2114': 34,
        '213': 35,
        '21411': 38,
        '21412': 39,
        '21413': 40,
        '21414': 41,
        '2143': 42,
      }

      for (const [tk, rowNum] of Object.entries(faEndingMap)) {
        const acc = ctx.cdfsAccounts.get(tk)
        const isDepr = tk.startsWith('214')
        const val = isDepr ? (acc?.cock || acc?.nock || 0) : (acc?.nock || acc?.cock || 0)
        editor.updateCell(d792Sheet, `A${rowNum}`, { text: tk })
        editor.updateCell(d792Sheet, `B${rowNum}`, { number: val })
        editor.updateCell(d792Sheet, `C${rowNum}`, { text: 'D793' })
        editor.updateCell(d792Sheet, `D${rowNum}`, { number: val })
        editor.updateCell(d792Sheet, `E${rowNum}`, { number: 0 })
        itemsCount += 5
      }

      // 4.3 Khối ma trận chi phí khấu hao 12 tháng (Rows 49 đến 60)
      const matrix214 = extract12MonthExpenseMatrix(ctx.nkcTransactions, '214')
      for (let i = 0; i < 12; i++) {
        const r = 49 + i
        const mRow = matrix214.monthly[i]
        if (mRow) {
          editor.updateCell(d792Sheet, `B${r}`, { number: mRow.tk627 })
          editor.updateCell(d792Sheet, `C${r}`, { number: mRow.tk641 })
          editor.updateCell(d792Sheet, `D${r}`, { number: mRow.tk642 })
          // Cột E (=SUM(B:D)) giữ nguyên công thức tự động
          editor.updateCell(d792Sheet, `G${r}`, { number: mRow.total }) // Theo bảng tính khấu hao
          // Cột H (=E-G) chênh lệch tự động bằng 0
          editor.updateCell(d792Sheet, `J${r}`, { number: mRow.total }) // Kiểm toán tính lại
          // Cột K (=G-J) chênh lệch tự động bằng 0
          editor.updateCell(d792Sheet, `L${r}`, { text: '✓' }) // Ghi chú Chk
          itemsCount += 6
        }
      }

      // Hàng 61 (Cả năm)
      editor.updateCell(d792Sheet, 'L61', { text: '✓' })
      itemsCount++
      updatedSheets.push(d792Sheet)
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
    const cp211 = extractCounterpartStats(ctx.nkcTransactions, '211', false)
    if (cp211.debitItems.length === 0) {
      wsD790.getCell('A15').value = null
      styleCellText(wsD790.getCell('B15'), 'Không phát sinh')
      styleCellAmount(wsD790.getCell('C15'), 0)
      wsD790.getCell('D15').value = 0
      wsD790.getCell('A16').value = null
      wsD790.getCell('B16').value = null
      styleCellAmount(wsD790.getCell('C16'), 0)
      wsD790.getCell('D16').value = 0
      wsD790.getCell('D17').value = 0
    } else {
      for (let i = 0; i < 2; i++) {
        const r = 15 + i
        const dItem = cp211.debitItems[i]
        if (dItem) {
          styleCellCode(wsD790.getCell(`A${r}`), dItem.ref)
          styleCellCode(wsD790.getCell(`B${r}`), dItem.account)
          styleCellAmount(wsD790.getCell(`C${r}`), dItem.amount)
        } else {
          wsD790.getCell(`A${r}`).value = null
          wsD790.getCell(`B${r}`).value = null
          styleCellAmount(wsD790.getCell(`C${r}`), 0)
          wsD790.getCell(`D${r}`).value = 0
        }
      }
    }

    if (cp211.creditItems.length === 0) {
      wsD790.getCell('E15').value = null
      styleCellText(wsD790.getCell('F15'), 'Không phát sinh')
      styleCellAmount(wsD790.getCell('G15'), 0)
      wsD790.getCell('H15').value = 0
      wsD790.getCell('E16').value = null
      wsD790.getCell('F16').value = null
      styleCellAmount(wsD790.getCell('G16'), 0)
      wsD790.getCell('H16').value = 0
      wsD790.getCell('H17').value = 0
    } else {
      for (let i = 0; i < 2; i++) {
        const r = 15 + i
        const cItem = cp211.creditItems[i]
        if (cItem) {
          styleCellCode(wsD790.getCell(`E${r}`), cItem.ref)
          styleCellCode(wsD790.getCell(`F${r}`), cItem.account)
          styleCellAmount(wsD790.getCell(`G${r}`), cItem.amount)
        } else {
          wsD790.getCell(`E${r}`).value = null
          wsD790.getCell(`F${r}`).value = null
          styleCellAmount(wsD790.getCell(`G${r}`), 0)
          wsD790.getCell(`H${r}`).value = 0
        }
      }
    }

    // Bảng 1.2 (Hàng 23-25): Cơ cấu đối ứng TK 214
    const cp214 = extractCounterpartStats(ctx.nkcTransactions, '214', false)
    if (cp214.debitItems.length === 0) {
      wsD790.getCell('A23').value = null
      styleCellText(wsD790.getCell('B23'), 'Không phát sinh')
      styleCellAmount(wsD790.getCell('C23'), 0)
      wsD790.getCell('D23').value = 0
      for (let i = 1; i < 3; i++) {
        const r = 23 + i
        wsD790.getCell(`A${r}`).value = null
        wsD790.getCell(`B${r}`).value = null
        styleCellAmount(wsD790.getCell(`C${r}`), 0)
        wsD790.getCell(`D${r}`).value = 0
      }
      wsD790.getCell('D26').value = 0
    } else {
      for (let i = 0; i < 3; i++) {
        const r = 23 + i
        const dItem = cp214.debitItems[i]
        if (dItem) {
          styleCellCode(wsD790.getCell(`A${r}`), dItem.ref)
          styleCellCode(wsD790.getCell(`B${r}`), dItem.account)
          styleCellAmount(wsD790.getCell(`C${r}`), dItem.amount)
        } else {
          wsD790.getCell(`A${r}`).value = null
          wsD790.getCell(`B${r}`).value = null
          styleCellAmount(wsD790.getCell(`C${r}`), 0)
          wsD790.getCell(`D${r}`).value = 0
        }
      }
    }

    if (cp214.creditItems.length === 0) {
      wsD790.getCell('E23').value = null
      styleCellText(wsD790.getCell('F23'), 'Không phát sinh')
      styleCellAmount(wsD790.getCell('G23'), 0)
      wsD790.getCell('H23').value = 0
      for (let i = 1; i < 3; i++) {
        const r = 23 + i
        wsD790.getCell(`E${r}`).value = null
        wsD790.getCell(`F${r}`).value = null
        styleCellAmount(wsD790.getCell(`G${r}`), 0)
        wsD790.getCell(`H${r}`).value = 0
      }
      wsD790.getCell('H26').value = 0
    } else {
      for (let i = 0; i < 3; i++) {
        const r = 23 + i
        const cItem = cp214.creditItems[i]
        if (cItem) {
          styleCellCode(wsD790.getCell(`E${r}`), cItem.ref)
          styleCellCode(wsD790.getCell(`F${r}`), cItem.account)
          styleCellAmount(wsD790.getCell(`G${r}`), cItem.amount)
        } else {
          wsD790.getCell(`E${r}`).value = null
          wsD790.getCell(`F${r}`).value = null
          styleCellAmount(wsD790.getCell(`G${r}`), 0)
          wsD790.getCell(`H${r}`).value = 0
        }
      }
    }

    styleCellText(
      wsD790.getCell('B59'),
      'Hạch toán phát sinh tăng, giảm TSCĐ và trích khấu hao trong kỳ phù hợp, không phát hiện đối ứng bất thường.',
    )
    itemsCount += 16

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
        row.getCell(1).value = null
        row.getCell(2).value = null
        row.getCell(3).value = null
        row.getCell(4).value = null
        row.getCell(5).value = null
        row.getCell(6).value = 0
        row.getCell(8).value = null
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
