import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
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
import {
  AuditConclusionTemplates,
  insertAuditConclusion,
  insertTickmarksLegend,
} from '../conclusionEngine'
import { getWorkingPaperRef } from '../RefDictionary'
import type { NkcTransaction } from '../types'

interface Counterpart3DigitSummary {
  acc3: string
  amount: number
  wpRef: string
}

/**
 * Gom nhóm đối ứng tài khoản 3 chữ số từ Sổ NKC và tra cứu mã tham chiếu #Ref từ Ref.xlsx
 */
function aggregate3DigitCounterparts(
  transactions: NkcTransaction[],
  targetPrefix: string,
  targetSide: 'DEBIT' | 'CREDIT',
): Counterpart3DigitSummary[] {
  const map = new Map<string, number>()

  for (const t of transactions) {
    if (targetSide === 'DEBIT') {
      // Phát sinh Nợ target (ví dụ Nợ 111 hoặc Nợ 112) -> Đối ứng Có (t.credit)
      if (t.debit.startsWith(targetPrefix)) {
        const raw = t.credit.trim()
        const acc3 = raw.slice(0, 3)
        if (acc3) {
          map.set(acc3, (map.get(acc3) || 0) + (t.amount || 0))
        }
      }
    } else {
      // Phát sinh Có target (ví dụ Có 111 hoặc Có 112) -> Đối ứng Nợ (t.debit)
      if (t.credit.startsWith(targetPrefix)) {
        const raw = t.debit.trim()
        const acc3 = raw.slice(0, 3)
        if (acc3) {
          map.set(acc3, (map.get(acc3) || 0) + (t.amount || 0))
        }
      }
    }
  }

  return Array.from(map.entries())
    .map(([acc3, amount]) => ({
      acc3,
      amount,
      wpRef: getWorkingPaperRef(acc3) || '#Ref',
    }))
    .sort((a, b) => b.amount - a.amount)
}
export function fillCashWorkingPaper(
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D100 - Tien - Mau 2024 - Thinh.xlsx'
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

    // 2. D 110 Lead schedule tổng hợp
    const d110Sheet = editor.hasSheet('D 110') ? 'D 110' : editor.hasSheet('D110') ? 'D110' : null
    if (d110Sheet) {
      const sum111CK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('111'))
        .reduce((s, a) => s + (a.nock || a.cock || 0), 0)
      const sum111DK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('111'))
        .reduce((s, a) => s + (a.sdndk || a.sdcdk || 0), 0)
      editor.setLeadRowValues(d110Sheet, 11, { tk: '1111', ten: 'Tiền mặt-VND', ck: sum111CK, dk: sum111DK })
      itemsCount++

      const sum1121CK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('1121'))
        .reduce((s, a) => s + (a.nock || a.cock || 0), 0)
      const sum1121DK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('1121'))
        .reduce((s, a) => s + (a.sdndk || a.sdcdk || 0), 0)
      editor.setLeadRowValues(d110Sheet, 14, { tk: '1121', ten: 'Tiền gửi ngân hàng VND', ck: sum1121CK, dk: sum1121DK })
      itemsCount++

      const sum1122CK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('1122'))
        .reduce((s, a) => s + (a.nock || a.cock || 0), 0)
      const sum1122DK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('1122'))
        .reduce((s, a) => s + (a.sdndk || a.sdcdk || 0), 0)
      editor.setLeadRowValues(d110Sheet, 15, { tk: '1122', ten: 'Tiền gửi ngân hàng USD', ck: sum1122CK, dk: sum1122DK })
      itemsCount++

      editor.setLeadRowValues(d110Sheet, 16, { tk: '1128', ten: 'Tiền gửi khác', ck: 0, dk: 0 })

      const acc1281 = ctx.cdfsAccounts.get('1281')
      const sum1281CK = acc1281?.nock ?? 0
      const sum1281DK = acc1281?.sdndk ?? 0
      editor.setLeadRowValues(d110Sheet, 19, { tk: '1281', ten: 'Tiền gửi có kỳ hạn < 3 tháng', ck: sum1281CK, dk: sum1281DK })
      editor.setLeadRowValues(d110Sheet, 20, { tk: '1288', ten: 'Đầu tư ngắn hạn khác', ck: 0, dk: 0 })
      itemsCount++

      updatedSheets.push(d110Sheet)
    }

    // 3. D 110.1 Chi tiết từng tài khoản ngân hàng
    const d110_1Sheet = editor.hasSheet('D 110.1') ? 'D 110.1' : editor.hasSheet('D110.1') ? 'D110.1' : null
    if (d110_1Sheet) {
      const bankAccounts = Array.from(ctx.cdfsAccounts.values()).filter((a) => a.matk.startsWith('112'))
      for (let i = 0; i < 8; i++) {
        const acc = bankAccounts[i]
        const r = 14 + i
        if (acc) {
          editor.setLeadRowValues(d110_1Sheet, r, {
            tk: acc.matk,
            ten: acc.tentk,
            ck: acc.nock || acc.cock,
            dk: acc.sdndk || acc.sdcdk,
          })
          itemsCount++
        } else {
          editor.setLeadRowValues(d110_1Sheet, r, { ck: 0, dk: 0 })
        }
      }
      updatedSheets.push(d110_1Sheet)
    }

    // 4. D 141 Bút toán điều chỉnh AJE
    const d141Sheet = editor.hasSheet('D 141') ? 'D 141' : editor.hasSheet('D141') ? 'D141' : null
    if (d141Sheet && ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
      const cashAjes = ctx.adjustingEntries.filter(
        (a) => a.tkNo.startsWith('111') || a.tkCo.startsWith('111') || a.tkNo.startsWith('112') || a.tkCo.startsWith('112'),
      ).slice(0, 6)
      const r = 14
      for (let i = 0; i < cashAjes.length; i++) {
        const aje = cashAjes[i]
        if (!aje) continue
        editor.updateCell(d141Sheet, `A${r + i}`, { text: String(i + 1) })
        editor.updateCell(d141Sheet, `B${r + i}`, { text: aje.glvRef || 'D141.1' })
        editor.updateCell(d141Sheet, `C${r + i}`, { text: aje.noiDung })
        editor.updateCell(d141Sheet, `D${r + i}`, { text: aje.tkNo })
        editor.updateCell(d141Sheet, `E${r + i}`, { text: aje.tkCo })
        editor.updateCell(d141Sheet, `F${r + i}`, { number: aje.soTien })
        itemsCount++
      }
      updatedSheets.push(d141Sheet)
    }
    // 4.1. D146 Bảng tổng hợp đối chiếu số dư tiền gửi ngân hàng
    const d146Sheet = editor.hasSheet('D146') ? 'D146' : editor.hasSheet('D 146') ? 'D 146' : null
    if (d146Sheet) {
      const bankAccounts = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('112') || a.matk.startsWith('128'))
        .sort((a, b) => a.matk.localeCompare(b.matk))

      // Điền Đợt 2 (Từ hàng 42 đến tối đa hàng 51)
      for (let i = 0; i < 10; i++) {
        const r = 42 + i
        const acc = bankAccounts[i]
        if (acc) {
          const ck = acc.nock || acc.cock || 0
          editor.updateCell(d146Sheet, `A${r}`, { text: acc.matk })
          editor.updateCell(d146Sheet, `B${r}`, { text: acc.tentk })
          editor.updateCell(d146Sheet, `C${r}`, { number: ck })
          itemsCount += 3
        }
      }
      updatedSheets.push(d146Sheet)
    }

    // 4.2. D 190 Tổng hợp đối ứng tài khoản 3 số & tham chiếu #Ref
    const d190Sheet = editor.hasSheet('D 190') ? 'D 190' : editor.hasSheet('D190') ? 'D190' : null
    if (d190Sheet) {
      // Khối 1: Tiền mặt (111)
      const cashDebits = aggregate3DigitCounterparts(ctx.nkcTransactions, '111', 'DEBIT')
      const cashCredits = aggregate3DigitCounterparts(ctx.nkcTransactions, '111', 'CREDIT')

      // Điền Nợ 111 (Hàng 17..24, Cột A: TC, B: TKĐƯ, C: Số tiền)
      for (let i = 0; i < 8; i++) {
        const r = 17 + i
        const item = cashDebits[i]
        if (item) {
          editor.updateCell(d190Sheet, `A${r}`, { text: item.wpRef })
          editor.updateCell(d190Sheet, `B${r}`, { text: item.acc3 })
          editor.updateCell(d190Sheet, `C${r}`, { number: item.amount })
          itemsCount += 3
        }
      }

      // Điền Có 111 (Hàng 17..24, Cột F: TC, G: TKĐƯ, H: Số tiền)
      for (let i = 0; i < 8; i++) {
        const r = 17 + i
        const item = cashCredits[i]
        if (item) {
          editor.updateCell(d190Sheet, `F${r}`, { text: item.wpRef })
          editor.updateCell(d190Sheet, `G${r}`, { text: item.acc3 })
          editor.updateCell(d190Sheet, `H${r}`, { number: item.amount })
          itemsCount += 3
        }
      }

      // Khối 2: Tiền gửi ngân hàng (112)
      const bankDebits = aggregate3DigitCounterparts(ctx.nkcTransactions, '112', 'DEBIT')
      const bankCredits = aggregate3DigitCounterparts(ctx.nkcTransactions, '112', 'CREDIT')

      // Điền Nợ 112 (Hàng 34..44, Cột A: TC, B: TKĐƯ, C: Số tiền)
      for (let i = 0; i < 11; i++) {
        const r = 34 + i
        const item = bankDebits[i]
        if (item) {
          editor.updateCell(d190Sheet, `A${r}`, { text: item.wpRef })
          editor.updateCell(d190Sheet, `B${r}`, { text: item.acc3 })
          editor.updateCell(d190Sheet, `C${r}`, { number: item.amount })
          itemsCount += 3
        }
      }

      // Điền Có 112 (Hàng 34..44, Cột F: TC, G: TKĐƯ, H: Số tiền)
      for (let i = 0; i < 11; i++) {
        const r = 34 + i
        const item = bankCredits[i]
        if (item) {
          editor.updateCell(d190Sheet, `F${r}`, { text: item.wpRef })
          editor.updateCell(d190Sheet, `G${r}`, { text: item.acc3 })
          editor.updateCell(d190Sheet, `H${r}`, { number: item.amount })
          itemsCount += 3
        }
      }

      updatedSheets.push(d190Sheet)
    }

    // 5. D 191.1 Chọn mẫu phát sinh tiền mặt ĐỢT 1 (Tháng 1 đến Tháng 6)
    const d191_1Sheet = editor.hasSheet('D 191.1') ? 'D 191.1' : editor.hasSheet('D191.1') ? 'D191.1' : null
    if (d191_1Sheet) {
      const cashDot1 = ctx.nkcTransactions.filter(
        (t) => t.month >= 1 && t.month <= 6 && (t.debit.startsWith('111') || t.credit.startsWith('111')),
      )
      const keyCash = cashDot1.filter((t) => Math.abs(t.amount) >= 10_000_000).sort((a, b) => b.amount - a.amount).slice(0, 15)
      const otherCash = cashDot1.filter((t) => !keyCash.includes(t))
      const step = Math.max(1, Math.floor(otherCash.length / 10))
      const repCash = []
      for (let i = 0; i < otherCash.length && repCash.length < 10; i += step) {
        const item = otherCash[i]
        if (item) repCash.push(item)
      }
      const cashSamples = [...keyCash, ...repCash].slice(0, 30)
      let r = 23
      for (const item of cashSamples) {
        editor.updateCell(d191_1Sheet, `A${r}`, { date: item.dateVal })
        editor.updateCell(d191_1Sheet, `B${r}`, { text: item.docNo })
        editor.updateCell(d191_1Sheet, `C${r}`, { text: item.desc })
        editor.updateCell(d191_1Sheet, `D${r}`, { text: item.debit })
        editor.updateCell(d191_1Sheet, `E${r}`, { text: item.credit })
        editor.updateCell(d191_1Sheet, `F${r}`, { number: item.amount })
        editor.updateCell(d191_1Sheet, `G${r}`, { text: 'P' })
        r++
        itemsCount++
      }
      updatedSheets.push(d191_1Sheet)
    }

    // 6. D 191.2 Chọn mẫu phát sinh tiền gửi ĐỢT 2 (Tháng 7 đến Tháng 12)
    const d191_2Sheet = editor.hasSheet('D 191.2') ? 'D 191.2' : editor.hasSheet('D191.2') ? 'D191.2' : null
    if (d191_2Sheet) {
      const bankDot2 = ctx.nkcTransactions.filter(
        (t) => t.month >= 7 && t.month <= 12 && (t.debit.startsWith('112') || t.credit.startsWith('112')),
      )
      const topBank = bankDot2.sort((a, b) => b.amount - a.amount).slice(0, 30)
      let r = 24
      for (const item of topBank) {
        editor.updateCell(d191_2Sheet, `A${r}`, { date: item.dateVal })
        editor.updateCell(d191_2Sheet, `B${r}`, { text: item.docNo })
        editor.updateCell(d191_2Sheet, `C${r}`, { text: item.desc })
        editor.updateCell(d191_2Sheet, `D${r}`, { text: item.debit })
        editor.updateCell(d191_2Sheet, `E${r}`, { text: item.credit })
        editor.updateCell(d191_2Sheet, `F${r}`, { number: item.amount })
        editor.updateCell(d191_2Sheet, `G${r}`, { text: 'P' })
        r++
        itemsCount++
      }
      updatedSheets.push(d191_2Sheet)
    }

    // 7. D 195TM Cutoff Tiền mặt
    const d195tmSheet = editor.hasSheet('D 195TM') ? 'D 195TM' : editor.hasSheet('D195TM') ? 'D195TM' : null
    if (d195tmSheet) {
      const cashAll = ctx.nkcTransactions.filter((t) => t.debit.startsWith('111') || t.credit.startsWith('111'))
      const cashYearEnd = cashAll.filter((t) => t.month === 12).slice(-5)
      const fallbackSamples = cashYearEnd.length >= 5 ? cashYearEnd : cashAll.slice(-5)
      for (let i = 0; i < 10; i++) {
        const r = 15 + i
        const item = fallbackSamples[i]
        if (item) {
          editor.fillSampleRow(d195tmSheet, r, {
            date: item.dateVal,
            docNo: item.docNo,
            desc: item.desc,
            debit: item.debit,
            credit: item.credit,
            amount: item.amount,
          })
          editor.updateCell(d195tmSheet, `G${r}`, { text: 'P' })
          itemsCount++
        }
      }
      updatedSheets.push(d195tmSheet)
    }

    // 8. D 195TGNH Cutoff Tiền gửi
    const d195tgnhSheet = editor.hasSheet('D 195TGNH') ? 'D 195TGNH' : editor.hasSheet('D195TGNH') ? 'D195TGNH' : null
    if (d195tgnhSheet) {
      const bankAll = ctx.nkcTransactions.filter((t) => t.debit.startsWith('112') || t.credit.startsWith('112'))
      const bankYearEnd = bankAll.filter((t) => t.month === 12).slice(-5)
      const fallbackBank = bankYearEnd.length >= 5 ? bankYearEnd : bankAll.slice(-5)
      for (let i = 0; i < 10; i++) {
        const r = 13 + i
        const item = fallbackBank[i]
        if (item) {
          editor.fillSampleRow(d195tgnhSheet, r, {
            date: item.dateVal,
            docNo: item.docNo,
            desc: item.desc,
            debit: item.debit,
            credit: item.credit,
            amount: item.amount,
          })
          editor.updateCell(d195tgnhSheet, `G${r}`, { text: 'P' })
          itemsCount++
        }
      }
      updatedSheets.push(d195tgnhSheet)
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

  // 1. ADD sheet
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D 110 Lead schedule tổng hợp
  const wsD110 = findWorksheetFuzzy(wb, ['D 110', 'D110'])
  if (wsD110) {
    const sum111CK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('111'))
      .reduce((s, a) => s + (a.nock || a.cock || 0), 0)
    const sum111DK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('111'))
      .reduce((s, a) => s + (a.sdndk || a.sdcdk || 0), 0)
    setLeadRowValues(wsD110, 11, { tk: '1111', ten: 'Tiền mặt-VND', ck: sum111CK, dk: sum111DK })
    itemsCount++

    const sum1121CK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('1121'))
      .reduce((s, a) => s + (a.nock || a.cock || 0), 0)
    const sum1121DK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('1121'))
      .reduce((s, a) => s + (a.sdndk || a.sdcdk || 0), 0)
    setLeadRowValues(wsD110, 14, { tk: '1121', ten: 'Tiền gửi ngân hàng VND', ck: sum1121CK, dk: sum1121DK })
    itemsCount++

    const sum1122CK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('1122'))
      .reduce((s, a) => s + (a.nock || a.cock || 0), 0)
    const sum1122DK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('1122'))
      .reduce((s, a) => s + (a.sdndk || a.sdcdk || 0), 0)
    setLeadRowValues(wsD110, 15, { tk: '1122', ten: 'Tiền gửi ngân hàng USD', ck: sum1122CK, dk: sum1122DK })
    itemsCount++

    setLeadRowValues(wsD110, 16, { tk: '1128', ten: 'Tiền gửi khác', ck: 0, dk: 0 })

    const acc1281 = ctx.cdfsAccounts.get('1281')
    const sum1281CK = acc1281?.nock ?? 0
    const sum1281DK = acc1281?.sdndk ?? 0
    setLeadRowValues(wsD110, 19, { tk: '1281', ten: 'Tiền gửi có kỳ hạn < 3 tháng', ck: sum1281CK, dk: sum1281DK })
    setLeadRowValues(wsD110, 20, { tk: '1288', ten: 'Đầu tư ngắn hạn khác', ck: 0, dk: 0 })
    itemsCount++

    // Cập nhật Leadsheet D110
    updatedSheets.push(wsD110.name)
  }

  // 3. D 110.1 Chi tiết từng tài khoản ngân hàng
  const wsD110_1 = findWorksheetFuzzy(wb, ['D 110.1', 'D110.1'])
  if (wsD110_1) {
    const bankAccounts = Array.from(ctx.cdfsAccounts.values()).filter((a) => a.matk.startsWith('112'))
    for (let i = 0; i < 8; i++) {
      const acc = bankAccounts[i]
      const r = 14 + i
      if (acc) {
        setLeadRowValues(wsD110_1, r, {
          tk: acc.matk,
          ten: acc.tentk,
          ck: acc.nock || acc.cock,
          dk: acc.sdndk || acc.sdcdk,
        })
        itemsCount++
      } else {
        setLeadRowValues(wsD110_1, r, { ck: 0, dk: 0 })
      }
    }
    updatedSheets.push(wsD110_1.name)
  }

  // 4. D 141 Bút toán điều chỉnh
  const wsD141 = findWorksheetFuzzy(wb, ['D 141', 'D141'])
  if (wsD141 && ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
    const cashAjes = ctx.adjustingEntries.filter(
      (a) => a.tkNo.startsWith('111') || a.tkCo.startsWith('111') || a.tkNo.startsWith('112') || a.tkCo.startsWith('112'),
    ).slice(0, 6)
    const r = 14
    for (let i = 0; i < cashAjes.length; i++) {
      const aje = cashAjes[i]
      if (!aje) continue
      const row = wsD141.getRow(r + i)
      styleCellCode(row.getCell(1), String(i + 1))
      styleCellCode(row.getCell(2), aje.glvRef || 'D141.1')
      styleCellText(row.getCell(3), aje.noiDung)
      styleCellCode(row.getCell(4), aje.tkNo)
      styleCellCode(row.getCell(5), aje.tkCo)
      styleCellAmount(row.getCell(6), aje.soTien)
      styleCellText(row.getCell(7), aje.chiTieuCdkt || 'Tiền và tương đương tiền')
      itemsCount++
    }
    updatedSheets.push(wsD141.name)
  }
  // 4.1. D146 Bảng tổng hợp đối chiếu số dư tiền gửi ngân hàng
  const wsD146 = findWorksheetFuzzy(wb, ['D146', 'D 146'])
  if (wsD146) {
    const bankAccounts = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('112') || a.matk.startsWith('128'))
      .sort((a, b) => a.matk.localeCompare(b.matk))

    // Điền Đợt 2 (Từ hàng 42 đến tối đa hàng 51)
    for (let i = 0; i < 10; i++) {
      const r = 42 + i
      const row = wsD146.getRow(r)
      const acc = bankAccounts[i]
      if (acc) {
        const ck = acc.nock || acc.cock || 0
        styleCellCode(row.getCell(1), acc.matk)
        styleCellText(row.getCell(2), acc.tentk)
        styleCellAmount(row.getCell(3), ck)
        itemsCount += 3
      }
    }
    updatedSheets.push(wsD146.name)
  }

  // 4.2. D 190 Tổng hợp đối ứng tài khoản 3 số & tham chiếu #Ref
  const wsD190 = findWorksheetFuzzy(wb, ['D 190', 'D190'])
  if (wsD190) {
    // Khối 1: Tiền mặt (111)
    const cashDebits = aggregate3DigitCounterparts(ctx.nkcTransactions, '111', 'DEBIT')
    const cashCredits = aggregate3DigitCounterparts(ctx.nkcTransactions, '111', 'CREDIT')

    for (let i = 0; i < 8; i++) {
      const r = 17 + i
      const row = wsD190.getRow(r)
      const dItem = cashDebits[i]
      if (dItem) {
        styleCellCode(row.getCell(1), dItem.wpRef)
        styleCellCode(row.getCell(2), dItem.acc3)
        styleCellAmount(row.getCell(3), dItem.amount)
        itemsCount += 3
      }
      const cItem = cashCredits[i]
      if (cItem) {
        styleCellCode(row.getCell(6), cItem.wpRef)
        styleCellCode(row.getCell(7), cItem.acc3)
        styleCellAmount(row.getCell(8), cItem.amount)
        itemsCount += 3
      }
    }

    // Khối 2: Tiền gửi ngân hàng (112)
    const bankDebits = aggregate3DigitCounterparts(ctx.nkcTransactions, '112', 'DEBIT')
    const bankCredits = aggregate3DigitCounterparts(ctx.nkcTransactions, '112', 'CREDIT')

    for (let i = 0; i < 11; i++) {
      const r = 34 + i
      const row = wsD190.getRow(r)
      const dItem = bankDebits[i]
      if (dItem) {
        styleCellCode(row.getCell(1), dItem.wpRef)
        styleCellCode(row.getCell(2), dItem.acc3)
        styleCellAmount(row.getCell(3), dItem.amount)
        itemsCount += 3
      }
      const cItem = bankCredits[i]
      if (cItem) {
        styleCellCode(row.getCell(6), cItem.wpRef)
        styleCellCode(row.getCell(7), cItem.acc3)
        styleCellAmount(row.getCell(8), cItem.amount)
        itemsCount += 3
      }
    }

    updatedSheets.push(wsD190.name)
  }

  // 5. D 191.1 Chọn mẫu chi tiền mặt ĐỢT 1 (Tháng 1 đến Tháng 6)
  const wsD191_1 = findWorksheetFuzzy(wb, ['D 191.1', 'D191.1'])
  if (wsD191_1) {
    const cashDot1 = ctx.nkcTransactions.filter(
      (t) => t.month >= 1 && t.month <= 6 && (t.debit.startsWith('111') || t.credit.startsWith('111')),
    )
    const keyCash = cashDot1.filter((t) => Math.abs(t.amount) >= 10_000_000).sort((a, b) => b.amount - a.amount).slice(0, 15)
    const otherCash = cashDot1.filter((t) => !keyCash.includes(t))
    const step = Math.max(1, Math.floor(otherCash.length / 10))
    const repCash = []
    for (let i = 0; i < otherCash.length && repCash.length < 10; i += step) {
      const item = otherCash[i]
      if (item) repCash.push(item)
    }

    const cashSamples = [...keyCash, ...repCash].slice(0, 30)

    let r = 23
    for (const item of cashSamples) {
      const row = wsD191_1.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      styleCellCode(row.getCell(7), 'P')
      r++
      itemsCount++
    }
    updatedSheets.push(wsD191_1.name)
  }

  // 6. D 191.2 Chọn mẫu phát sinh tiền gửi ngân hàng ĐỢT 2 (Tháng 7 đến Tháng 12)
  const wsD191_2 = findWorksheetFuzzy(wb, ['D 191.2', 'D191.2'])
  if (wsD191_2) {
    const bankDot2 = ctx.nkcTransactions.filter(
      (t) => t.month >= 7 && t.month <= 12 && (t.debit.startsWith('112') || t.credit.startsWith('112')),
    )
    const topBank = bankDot2.sort((a, b) => b.amount - a.amount).slice(0, 30)

    let r = 24
    for (const item of topBank) {
      const row = wsD191_2.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      styleCellCode(row.getCell(7), 'P')
      r++
      itemsCount++
    }
    updatedSheets.push(wsD191_2.name)
  }

  // 7. D 195TM Cutoff Tiền mặt (Lấy các giao dịch sát ngày khóa sổ 31/12)
  const ws195TM = findWorksheetFuzzy(wb, ['D 195TM', 'D195TM'])
  if (ws195TM) {
    const cashAll = ctx.nkcTransactions.filter((t) => t.debit.startsWith('111') || t.credit.startsWith('111'))
    const cashYearEnd = cashAll
      .filter((t) => t.month === 12)
      .slice(-5)
    const fallbackSamples = cashYearEnd.length >= 5 ? cashYearEnd : cashAll.slice(-5)

    for (let i = 0; i < 10; i++) {
      const r = 14 + i
      const row = ws195TM.getRow(r)
      const item = fallbackSamples[i]
      if (item) {
        styleCellDate(row.getCell(1), item.dateVal)
        styleCellCode(row.getCell(2), item.docNo)
        styleCellText(row.getCell(3), item.desc)
        styleCellCode(row.getCell(4), item.debit)
        styleCellCode(row.getCell(5), item.credit)
        styleCellAmount(row.getCell(6), item.amount)
        styleCellCode(row.getCell(7), 'P')
        itemsCount++
      } else {
        // Dọn sạch dữ liệu cũ và tickmark mồ côi
        row.getCell(1).value = null
        row.getCell(2).value = null
        row.getCell(3).value = null
        row.getCell(4).value = null
        row.getCell(5).value = null
        row.getCell(6).value = 0
        row.getCell(7).value = null
      }
    }
    // D 195TM đã có sẵn chú thích tickmark tại hàng 33 và KẾT LUẬN tại hàng 35 trong template
    updatedSheets.push(ws195TM.name)
  }

  // 8. D 195TGNH Cutoff Tiền gửi ngân hàng (Lấy các giao dịch sát 31/12)
  const ws195TGNH = findWorksheetFuzzy(wb, ['D 195TGNH', 'D195TGNH'])
  if (ws195TGNH) {
    const bankAll = ctx.nkcTransactions.filter((t) => t.debit.startsWith('112') || t.credit.startsWith('112'))
    const bankYearEnd = bankAll
      .filter((t) => t.month === 12)
      .slice(-5)
    const fallbackBank = bankYearEnd.length >= 5 ? bankYearEnd : bankAll.slice(-5)

    for (let i = 0; i < 10; i++) {
      const r = 13 + i
      const row = ws195TGNH.getRow(r)
      const item = fallbackBank[i]
      if (item) {
        styleCellDate(row.getCell(1), item.dateVal)
        styleCellCode(row.getCell(2), item.docNo)
        styleCellText(row.getCell(3), item.desc)
        styleCellCode(row.getCell(4), item.debit)
        styleCellCode(row.getCell(5), item.credit)
        styleCellAmount(row.getCell(6), item.amount)
        styleCellCode(row.getCell(7), 'P')
        itemsCount++
      } else {
        row.getCell(1).value = null
        row.getCell(2).value = null
        row.getCell(3).value = null
        row.getCell(4).value = null
        row.getCell(5).value = null
        row.getCell(6).value = 0
        row.getCell(7).value = null
      }
    }
    // D 195TGNH đã có sẵn chú thích tickmark tại hàng 33 và KẾT LUẬN tại hàng 35 trong template
    updatedSheets.push(ws195TGNH.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
