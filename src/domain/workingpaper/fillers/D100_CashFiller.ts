import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
  styleCellAmount,
  styleCellCode,
  styleCellDate,
  styleCellText,
} from '../helpers'

export function fillCashWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D100 - Tien - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD sheet
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D 110 Lead schedule tổng hợp
  const wsD110 = wb.getWorksheet('D 110')
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

    updatedSheets.push('D 110')
  }

  // 3. D 110.1 Chi tiết từng tài khoản ngân hàng
  const wsD110_1 = wb.getWorksheet('D 110.1')
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
    updatedSheets.push('D 110.1')
  }

  // 4. D 141 Bút toán điều chỉnh
  const wsD141 = wb.getWorksheet('D 141')
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
    updatedSheets.push('D 141')
  }

  // 5. D 191.1 Chọn mẫu chi tiền mặt (1111)
  const wsD191_1 = wb.getWorksheet('D 191.1')
  if (wsD191_1) {
    const cashOutEntries = ctx.nkcTransactions.filter((t) => t.credit.startsWith('1111'))
    const keyCash = cashOutEntries.filter((t) => Math.abs(t.amount) >= 10_000_000).sort((a, b) => b.amount - a.amount).slice(0, 10)
    const otherCash = cashOutEntries.filter((t) => !keyCash.includes(t))
    const step = Math.max(1, Math.floor(otherCash.length / 10))
    const repCash = []
    for (let i = 0; i < otherCash.length && repCash.length < 10; i += step) {
      const item = otherCash[i]
      if (item) repCash.push(item)
    }

    const cashSamples = [...keyCash, ...repCash].slice(0, 20)

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
    updatedSheets.push('D 191.1')
  }

  // 6. D 191.2 Chọn mẫu phát sinh tiền gửi ngân hàng (112)
  const wsD191_2 = wb.getWorksheet('D 191.2')
  if (wsD191_2) {
    const bankEntries = ctx.nkcTransactions.filter((t) => t.debit.startsWith('112') || t.credit.startsWith('112'))
    const topBank = bankEntries.sort((a, b) => b.amount - a.amount).slice(0, 20)

    let r = 24
    for (const item of topBank.slice(0, 15)) {
      const row = wsD191_2.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      styleCellCode(row.getCell(7), 'ü')
      r++
      itemsCount++
    }
    updatedSheets.push('D 191.2')
  }

  // 7. D 195TM Cutoff Tiền mặt
  const ws195TM = wb.getWorksheet('D 195TM')
  if (ws195TM) {
    const cashYearEnd = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('111') || t.credit.startsWith('111'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    let r = 14
    for (const item of cashYearEnd.slice(0, 5)) {
      const row = ws195TM.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      styleCellCode(row.getCell(7), 'ü')
      r++
      itemsCount++
    }
    updatedSheets.push('D 195TM')
  }

  // 8. D 195TGNH Cutoff Tiền gửi ngân hàng
  const ws195TGNH = wb.getWorksheet('D 195TGNH')
  if (ws195TGNH) {
    const bankYearEnd = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('112') || t.credit.startsWith('112'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    let r = 13
    for (const item of bankYearEnd) {
      const row = ws195TGNH.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      styleCellCode(row.getCell(7), 'ü')
      r++
      itemsCount++
    }
    updatedSheets.push('D 195TGNH')
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
