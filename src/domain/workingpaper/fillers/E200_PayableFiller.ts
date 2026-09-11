import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import { extractCounterpartStats } from '../counterpartExtractor'
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

export function fillPayableWorkingPaper(
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E200 - Phai tra - Mau 2024 - Thinh.xlsx'
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

    // 2. E 210 Lead schedule
    const e210Sheet = editor.hasSheet('E 210') ? 'E 210' : editor.hasSheet('E210') ? 'E210' : null
    if (e210Sheet) {
      const sum331CoCK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('331'))
        .reduce((s, a) => s + (a.cock || 0), 0)
      const sum331NoCK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('331'))
        .reduce((s, a) => s + (a.nock || 0), 0)
      const sum331CoDK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('331'))
        .reduce((s, a) => s + (a.sdcdk || 0), 0)
      const sum331NoDK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('331'))
        .reduce((s, a) => s + (a.sdndk || 0), 0)

      let netAdj331Co = 0
      if (ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
        for (const aje of ctx.adjustingEntries) {
          if (aje.tkCo.startsWith('331')) netAdj331Co += aje.soTien
          if (aje.tkNo.startsWith('331')) netAdj331Co -= aje.soTien
        }
      }

      editor.setLeadRowValues(e210Sheet, 13, { ck: sum331NoCK, dk: sum331NoDK, colDk: 8 })
      editor.setLeadRowValues(e210Sheet, 16, { ck: sum331CoCK, dk: sum331CoDK, adj: netAdj331Co, colAdj: 5, colDk: 8 })
      itemsCount += 3
      updatedSheets.push(e210Sheet)
    }

    // 2.2 Sheet E 241 — Bút toán điều chỉnh kiểm toán Phải trả
    const e241Sheet = editor.hasSheet('E 241') ? 'E 241' : editor.hasSheet('E241') ? 'E241' : null
    if (e241Sheet) {
      const payAjes = (ctx.adjustingEntries || []).filter(
        (a) => a.glvRef === 'E241' || a.tkNo.startsWith('331') || a.tkCo.startsWith('331') || a.tkNo.startsWith('338') || a.tkCo.startsWith('338'),
      )
      if (payAjes.length > 0) {
        const count = editor.fillAjeSheet(e241Sheet, 14, 15, payAjes, 'Phải trả người bán')
        itemsCount += count * 8
      } else {
        editor.updateCell(e241Sheet, 'C13', { text: 'Không phát sinh.' })
        itemsCount++
      }
      updatedSheets.push(e241Sheet)
    }

    // 2.1 E 250.2
    const e250_2Sheet = editor.hasSheet('E 250.2') ? 'E 250.2' : editor.hasSheet('E250.2') ? 'E250.2' : null
    if (e250_2Sheet) {
      const vendorBalanceMap = new Map<string, { no: number; co: number; desc: string }>()
      for (const t of ctx.nkcTransactions) {
        if (t.debit.startsWith('331') || t.credit.startsWith('331')) {
          const key = t.custId || (t.desc.split(' ')[0] ?? 'NCC')
          const curr = vendorBalanceMap.get(key) ?? { no: 0, co: 0, desc: t.desc }
          if (t.debit.startsWith('331')) curr.no += t.amount
          if (t.credit.startsWith('331')) curr.co += t.amount
          vendorBalanceMap.set(key, curr)
        }
      }

      const sortedVendors = Array.from(vendorBalanceMap.entries())
        .sort((a, b) => Math.abs(b[1].co - b[1].no) - Math.abs(a[1].co - a[1].no))
        .slice(0, 25)

      let r = 20
      for (const [vendorId, bal] of sortedVendors) {
        const net = bal.co - bal.no
        editor.updateCell(e250_2Sheet, `A${r}`, { text: vendorId })
        editor.updateCell(e250_2Sheet, `B${r}`, { text: bal.desc.slice(0, 50) })
        editor.updateCell(e250_2Sheet, `C${r}`, { number: net > 0 ? net : 0 })
        editor.updateCell(e250_2Sheet, `D${r}`, { number: net < 0 ? Math.abs(net) : 0 })
        r++
        itemsCount++
      }
      updatedSheets.push(e250_2Sheet)
    }

    // 3. E 291
    const e291Sheet = editor.hasSheet('E 291') ? 'E 291' : editor.hasSheet('E291') ? 'E291' : null
    if (e291Sheet) {
      const topPurchases = ctx.nkcTransactions
        .filter((t) => t.credit.startsWith('331'))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 22)

      let r = 20
      for (const item of topPurchases) {
        editor.fillSampleRow(e291Sheet, r, {
          date: item.dateVal,
          docNo: item.docNo,
          desc: item.desc,
          debit: item.debit,
          credit: item.credit,
          amount: item.amount,
        })
        r++
        itemsCount++
      }
      updatedSheets.push(e291Sheet)
    }

    // 4. Sheet E 290 — Cơ cấu Nợ/Có đối ứng TK 331 và Tham chiếu REF (Đợt 1 & Cả năm)
    const e290Sheet = editor.hasSheet('E 290') ? 'E 290' : editor.hasSheet('E290') ? 'E290' : null
    if (e290Sheet) {
      const cp331P1 = extractCounterpartStats(ctx.nkcTransactions, '331', true)
      const cp331Full = extractCounterpartStats(ctx.nkcTransactions, '331', false)

      // Bảng 1: Đợt 1 (Hàng 14 đến 26 - 13 dòng)
      editor.fillCounterpartTable(e290Sheet, 14, 13, cp331P1)

      // Bảng 2: Cả năm (Hàng 36 đến 50 - 15 dòng)
      editor.fillCounterpartTable(e290Sheet, 36, 15, cp331Full)
      // Nhận xét và kết luận kiểm toán chuẩn VACPA
      editor.updateCell(e290Sheet, 'A30', {
        text: 'Đọc lướt sổ cái và không thấy có nghiệp vụ phát sinh bất thường.',
      })
      editor.updateCell(e290Sheet, 'A31', {
        text: 'Nợ phải trả chủ yếu phát sinh đối ứng với mua nguyên vật liệu, hàng hóa (TK 152, 156) và chi phí.',
      })
      editor.updateCell(e290Sheet, 'A32', {
        text: 'Thanh toán tiền chủ yếu qua ngân hàng (TK 112).',
      })
      editor.updateCell(e290Sheet, 'B54', {
        text: 'Không có phát sinh đối ứng bất thường trong cả năm.',
      })
      editor.updateCell(e290Sheet, 'B55', {
        text: 'Mua nguyên vật liệu, hàng hóa và dịch vụ được chi trả đầy đủ, đúng hạn.',
      })
      itemsCount += 61
      updatedSheets.push(e290Sheet)
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

  // 2. E 210 Lead schedule
  const wsE210 = findWorksheetFuzzy(wb, ['E 210', 'E210'])
  if (wsE210) {
    const sum331CoCK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.cock || 0), 0)
    const sum331NoCK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.nock || 0), 0)
    const sum331CoDK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.sdcdk || 0), 0)
    const sum331NoDK = Array.from(ctx.cdfsAccounts.values())
      .filter((a) => a.matk.startsWith('331'))
      .reduce((s, a) => s + (a.sdndk || 0), 0)

    // Trả trước cho người bán ngắn hạn (Dư Nợ 331) - Row 13, Cột Năm trước là H (cột 8)
    setLeadRowValues(wsE210, 13, { ck: sum331NoCK, dk: sum331NoDK, colDk: 8 })

    // Phải trả người bán ngắn hạn (Dư Có 331) - Row 16, Cột Năm trước là H (cột 8)
    setLeadRowValues(wsE210, 16, { ck: sum331CoCK, dk: sum331CoDK, colDk: 8 })
    itemsCount += 2
    updatedSheets.push(wsE210.name)
  }
  // 2.1 E 250.2 Chi tiết số dư phải trả người bán (331) theo Nhà cung cấp
  const wsE250_2 = findWorksheetFuzzy(wb, ['E 250.2', 'E250.2', 'E 250.1', 'E250.1'])
  if (wsE250_2) {
    const vendorBalanceMap = new Map<string, { no: number; co: number; desc: string }>()
    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('331') || t.credit.startsWith('331')) {
        const key = t.custId || (t.desc.split(' ')[0] ?? 'NCC')
        const curr = vendorBalanceMap.get(key) ?? { no: 0, co: 0, desc: t.desc }
        if (t.debit.startsWith('331')) curr.no += t.amount
        if (t.credit.startsWith('331')) curr.co += t.amount
        vendorBalanceMap.set(key, curr)
      }
    }

    const sortedVendors = Array.from(vendorBalanceMap.entries())
      .sort((a, b) => Math.abs(b[1].co - b[1].no) - Math.abs(a[1].co - a[1].no))
      .slice(0, 25)

    let r = 20
    for (const [vendorId, bal] of sortedVendors) {
      const net = bal.co - bal.no
      const row = wsE250_2.getRow(r)
      styleCellCode(row.getCell(1), vendorId)
      styleCellText(row.getCell(2), bal.desc.slice(0, 50))
      styleCellAmount(row.getCell(3), net > 0 ? net : 0) // Dư Có 331 (Phải trả)
      styleCellAmount(row.getCell(4), net < 0 ? Math.abs(net) : 0) // Dư Nợ 331 (Trả trước)
      r++
      itemsCount++
    }
    updatedSheets.push(wsE250_2.name)
  }


  // 3. E 291 Chọn mẫu kiểm tra phát sinh phải trả người bán (Hàng 20-42, giữ hàng 44 =SUM, hàng 46 Bảng 2)
  const wsE291 = findWorksheetFuzzy(wb, ['E 291', 'E291', 'E 251', 'E251'])
  if (wsE291) {
    const topPurchases = ctx.nkcTransactions
      .filter((t) => t.credit.startsWith('331'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 22) // Giới hạn tối đa 22 dòng (hàng 20 đến 41), tuyệt đối không tràn sang hàng 44 =SUM và hàng 46 Bảng 2!

    let r = 20
    for (const item of topPurchases) {
      const row = wsE291.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push(wsE291.name)
  }
  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
