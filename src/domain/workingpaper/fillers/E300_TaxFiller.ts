import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
  findWorksheetFuzzy,
  getAccountRollup,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
  styleCellAmount,
} from '../helpers'

export function fillTaxWorkingPaper(
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E300 - Thue - Mau 2024 - Thinh.xlsx'
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

    // 2. E 310 Lead schedule
    const e310Sheet = editor.hasSheet('E 310') ? 'E 310' : editor.hasSheet('E310') ? 'E310' : null
    if (e310Sheet) {
      const calcTaxAdj = (prefix: string, isCreditNormal: boolean) => {
        let adj = 0
        if (ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
          for (const aje of ctx.adjustingEntries) {
            if (aje.tkNo.startsWith(prefix)) adj += isCreditNormal ? -aje.soTien : aje.soTien
            if (aje.tkCo.startsWith(prefix)) adj += isCreditNormal ? aje.soTien : -aje.soTien
          }
        }
        return adj
      }

      const acc1331 = getAccountRollup(ctx.cdfsAccounts, '1331')
      const adj1331 = calcTaxAdj('1331', false)
      editor.setLeadRowValues(e310Sheet, 11, { ck: acc1331.ck, dk: acc1331.dk, adj: adj1331, colAdj: 5 })
      editor.updateCell(e310Sheet, 'F11', { number: acc1331.ck + adj1331 })

      const acc1332 = getAccountRollup(ctx.cdfsAccounts, '1332')
      const adj1332 = calcTaxAdj('1332', false)
      editor.setLeadRowValues(e310Sheet, 12, { ck: acc1332.ck, dk: acc1332.dk, adj: adj1332, colAdj: 5 })
      editor.updateCell(e310Sheet, 'F12', { number: acc1332.ck + adj1332 })

      const acc33311 = getAccountRollup(ctx.cdfsAccounts, '33311')
      const adj33311 = calcTaxAdj('33311', true)
      editor.setLeadRowValues(e310Sheet, 19, { ck: acc33311.ck, dk: acc33311.dk, adj: adj33311, colAdj: 5 })
      editor.updateCell(e310Sheet, 'F19', { number: acc33311.ck + adj33311 })

      const acc33312 = getAccountRollup(ctx.cdfsAccounts, '33312')
      const adj33312 = calcTaxAdj('33312', true)
      editor.setLeadRowValues(e310Sheet, 20, { ck: acc33312.ck, dk: acc33312.dk, adj: adj33312, colAdj: 5 })
      editor.updateCell(e310Sheet, 'F20', { number: acc33312.ck + adj33312 })

      const acc3333 = getAccountRollup(ctx.cdfsAccounts, '3333')
      const adj3333 = calcTaxAdj('3333', true)
      editor.setLeadRowValues(e310Sheet, 21, { ck: acc3333.ck, dk: acc3333.dk, adj: adj3333, colAdj: 5 })
      editor.updateCell(e310Sheet, 'F21', { number: acc3333.ck + adj3333 })

      const acc3334 = getAccountRollup(ctx.cdfsAccounts, '3334')
      const adj3334 = calcTaxAdj('3334', true)
      editor.setLeadRowValues(e310Sheet, 22, { ck: acc3334.ck, dk: acc3334.dk, adj: adj3334, colAdj: 5 })
      editor.updateCell(e310Sheet, 'F22', { number: acc3334.ck + adj3334 })

      const acc3335 = getAccountRollup(ctx.cdfsAccounts, '3335')
      const adj3335 = calcTaxAdj('3335', true)
      editor.setLeadRowValues(e310Sheet, 23, { ck: acc3335.ck, dk: acc3335.dk, adj: adj3335, colAdj: 5 })
      editor.updateCell(e310Sheet, 'F23', { number: acc3335.ck + adj3335 })
      itemsCount += 14
      updatedSheets.push(e310Sheet)
    }

    // 2.0 Sheet E 341 — Bút toán điều chỉnh kiểm toán Thuế
    const e341Sheet = editor.hasSheet('E 341') ? 'E 341' : editor.hasSheet('E341') ? 'E341' : null
    if (e341Sheet) {
      const taxAjes = (ctx.adjustingEntries || []).filter(
        (a) =>
          a.glvRef === 'E341' ||
          a.tkNo.startsWith('333') ||
          a.tkCo.startsWith('333') ||
          a.tkNo.startsWith('133') ||
          a.tkCo.startsWith('133'),
      )
      if (taxAjes.length > 0) {
        const count = editor.fillAjeSheet(e341Sheet, 14, 15, taxAjes, 'Thuế và các khoản phải nộp')
        itemsCount += count * 8
      } else {
        editor.updateCell(e341Sheet, 'C15', { text: 'Không phát sinh.' })
        itemsCount++
      }
      updatedSheets.push(e341Sheet)
    }

    // 2.1 E 310.1 Chi tiết các loại thuế
    const e310_1Sheet = editor.hasSheet('E 310.1') ? 'E 310.1' : editor.hasSheet('E310.1') ? 'E310.1' : null
    if (e310_1Sheet) {
      const acc1331 = ctx.cdfsAccounts.get('1331')
      editor.setLeadRowValues(e310_1Sheet, 11, { ck: acc1331?.nock ?? 0, dk: acc1331?.sdndk ?? 0 })
      const acc1332 = ctx.cdfsAccounts.get('1332')
      editor.setLeadRowValues(e310_1Sheet, 12, { ck: acc1332?.nock ?? 0, dk: acc1332?.sdndk ?? 0 })
      const acc33312 = ctx.cdfsAccounts.get('33312')
      editor.setLeadRowValues(e310_1Sheet, 19, { ck: acc33312?.cock ?? 0, dk: acc33312?.sdcdk ?? 0 })
      const acc3333 = ctx.cdfsAccounts.get('3333')
      editor.setLeadRowValues(e310_1Sheet, 20, { ck: acc3333?.cock ?? 0, dk: acc3333?.sdcdk ?? 0 })
      const acc3334 = ctx.cdfsAccounts.get('3334')
      editor.setLeadRowValues(e310_1Sheet, 21, { ck: acc3334?.cock ?? 0, dk: acc3334?.sdcdk ?? 0 })
      const acc3335 = ctx.cdfsAccounts.get('3335')
      editor.setLeadRowValues(e310_1Sheet, 22, { ck: acc3335?.cock ?? 0, dk: acc3335?.sdcdk ?? 0 })
      itemsCount += 6
      updatedSheets.push(e310_1Sheet)
    }

    // 3. E 380 Đối chiếu kê khai thuế 12 tháng
    const e380Sheet = editor.hasSheet('E 380') ? 'E 380' : editor.hasSheet('E380') ? 'E380' : null
    if (e380Sheet) {
      const yearStr = (ctx.engagement?.fiscalYearEnd || '2026').slice(-4) || '2026'
      editor.updateCell(e380Sheet, 'A15', { formula: `"KÊ KHAI THUẾ GTGT NĂM ${yearStr}"` })
      editor.updateCell(e380Sheet, 'E34', { text: `Số dư sổ kế toán 31/12/${yearStr}` })

      const vatInMonthly = new Array(12).fill(0)
      for (const t of ctx.nkcTransactions) {
        const mIdx = Math.max(0, Math.min(11, t.month - 1))
        if (t.debit.startsWith('133')) vatInMonthly[mIdx] += t.amount
      }

      const r = 19
      for (let m = 0; m < 12; m++) {
        editor.updateCell(e380Sheet, `J${r + m}`, { number: vatInMonthly[m] ?? 0 })
        itemsCount++
      }

      const declarations = ctx.vatDeclarations ?? []
      if (declarations.length > 0) {
        const byMonth = new Map<number, { vatIn: number; vatOut: number; d37: number; e38: number; f42: number; g40: number }>()
        for (const d of declarations) {
          const m = d.period.month ?? (d.period.quarter ? d.period.quarter * 3 : 0)
          if (m < 1 || m > 12) continue
          const cur = byMonth.get(m) ?? { vatIn: 0, vatOut: 0, d37: 0, e38: 0, f42: 0, g40: 0 }
          const v25 = Number(d.indicators['25']?.numericValue ?? d.indicators['23']?.numericValue ?? 0n)
          const v35 = Number(d.indicators['35']?.numericValue ?? d.indicators['34']?.numericValue ?? 0n)
          cur.vatIn += v25
          cur.vatOut += v35
          cur.d37 += Number(d.indicators['37']?.numericValue ?? 0n)
          cur.e38 += Number(d.indicators['38']?.numericValue ?? 0n)
          cur.f42 += Number(d.indicators['42']?.numericValue ?? 0n)
          cur.g40 += Number(d.indicators['40']?.numericValue ?? 0n)
          byMonth.set(m, cur)
        }
        for (const [m, v] of byMonth) {
          const rowNum = 18 + m
          editor.updateCell(e380Sheet, `B${rowNum}`, { number: v.vatIn })
          editor.updateCell(e380Sheet, `C${rowNum}`, { number: v.vatOut })
          editor.updateCell(e380Sheet, `D${rowNum}`, { number: v.d37 })
          editor.updateCell(e380Sheet, `E${rowNum}`, { number: v.e38 })
          editor.updateCell(e380Sheet, `F${rowNum}`, { number: v.f42 })
          editor.updateCell(e380Sheet, `G${rowNum}`, { number: v.g40 })
          itemsCount += 6
        }
      }
      updatedSheets.push(e380Sheet)
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

  // 2. E 310 Lead schedule
  const wsE310 = findWorksheetFuzzy(wb, ['E 310', 'E310'])
  if (wsE310) {
    // Dùng getAccountRollup để tự động gom tài khoản con (ví dụ 13311, 13312 -> 1331)
    const acc1331 = getAccountRollup(ctx.cdfsAccounts, '1331')
    setLeadRowValues(wsE310, 11, { ck: acc1331.ck, dk: acc1331.dk })

    const acc1332 = getAccountRollup(ctx.cdfsAccounts, '1332')
    setLeadRowValues(wsE310, 12, { ck: acc1332.ck, dk: acc1332.dk })

    const acc33311 = getAccountRollup(ctx.cdfsAccounts, '33311')
    setLeadRowValues(wsE310, 19, { ck: acc33311.ck, dk: acc33311.dk })

    const acc33312 = getAccountRollup(ctx.cdfsAccounts, '33312')
    setLeadRowValues(wsE310, 20, { ck: acc33312.ck, dk: acc33312.dk })

    const acc3333 = getAccountRollup(ctx.cdfsAccounts, '3333')
    setLeadRowValues(wsE310, 21, { ck: acc3333.ck, dk: acc3333.dk })

    const acc3334 = getAccountRollup(ctx.cdfsAccounts, '3334')
    setLeadRowValues(wsE310, 22, { ck: acc3334.ck, dk: acc3334.dk })

    const acc3335 = getAccountRollup(ctx.cdfsAccounts, '3335')
    setLeadRowValues(wsE310, 23, { ck: acc3335.ck, dk: acc3335.dk })

    itemsCount += 7
    updatedSheets.push(wsE310.name)
  }

  // 2.1 E 310.1 Chi tiết các loại thuế
  const wsE310_1 = findWorksheetFuzzy(wb, ['E 310.1', 'E310.1'])
  if (wsE310_1) {
    const acc1331 = ctx.cdfsAccounts.get('1331')
    setLeadRowValues(wsE310_1, 11, { ck: acc1331?.nock ?? 0, dk: acc1331?.sdndk ?? 0 })
    const acc1332 = ctx.cdfsAccounts.get('1332')
    setLeadRowValues(wsE310_1, 12, { ck: acc1332?.nock ?? 0, dk: acc1332?.sdndk ?? 0 })
    const acc33312 = ctx.cdfsAccounts.get('33312')
    setLeadRowValues(wsE310_1, 19, { ck: acc33312?.cock ?? 0, dk: acc33312?.sdcdk ?? 0 })
    const acc3333 = ctx.cdfsAccounts.get('3333')
    setLeadRowValues(wsE310_1, 20, { ck: acc3333?.cock ?? 0, dk: acc3333?.sdcdk ?? 0 })
    const acc3334 = ctx.cdfsAccounts.get('3334')
    setLeadRowValues(wsE310_1, 21, { ck: acc3334?.cock ?? 0, dk: acc3334?.sdcdk ?? 0 })
    const acc3335 = ctx.cdfsAccounts.get('3335')
    setLeadRowValues(wsE310_1, 22, { ck: acc3335?.cock ?? 0, dk: acc3335?.sdcdk ?? 0 })
    itemsCount += 6
    updatedSheets.push(wsE310_1.name)
  }

  // 3. E 380 Đối chiếu kê khai thuế 12 tháng
  const wsE380 = findWorksheetFuzzy(wb, ['E 380', 'E380'])
  if (wsE380) {
    const yearStr = (ctx.engagement?.fiscalYearEnd || '2026').slice(-4) || '2026'

    // Cập nhật tiêu đề năm niên độ nếu có chuỗi năm cũ
    const a15 = wsE380.getCell('A15')
    a15.value = { formula: `"KÊ KHAI THUẾ GTGT NĂM ${yearStr}"` }
    const e34 = wsE380.getCell('E34')
    if (typeof e34.value === 'string' && e34.value.includes('Số dư sổ kế toán')) {
      e34.value = `Số dư sổ kế toán 31/12/${yearStr}`
    }

    // 1. Số liệu Sổ kế toán: Cột J (cột 10) = PS NỢ 133* (SỔ KẾ TOÁN)
    const vatInMonthly = new Array(12).fill(0)
    for (const t of ctx.nkcTransactions) {
      const mIdx = Math.max(0, Math.min(11, t.month - 1))
      if (t.debit.startsWith('133')) vatInMonthly[mIdx] += t.amount
    }

    const r = 19
    for (let m = 0; m < 12; m++) {
      const row = wsE380.getRow(r + m)
      styleCellAmount(row.getCell(10), vatInMonthly[m] ?? 0)
      itemsCount++
    }

    // 2. Số liệu Kê khai thuế GTGT từ tờ khai XML (nếu có):
    // Cột B: VAT đầu vào ([25] hoặc [23])
    // Cột C: VAT đầu ra ([35] hoặc [34])
    // Cột D: Giảm [37], E: Tăng [38], F: Xin hoàn [42], G: Phải nộp [40]
    // Cột H: Số dư, Cột K: Chênh lệch (+J - B - D + E) có sẵn công thức Excel tự tính
    const declarations = ctx.vatDeclarations ?? []
    if (declarations.length > 0) {
      const byMonth = new Map<number, { vatIn: number; vatOut: number; d37: number; e38: number; f42: number; g40: number }>()
      for (const d of declarations) {
        const m = d.period.month ?? (d.period.quarter ? d.period.quarter * 3 : 0)
        if (m < 1 || m > 12) continue
        const cur = byMonth.get(m) ?? { vatIn: 0, vatOut: 0, d37: 0, e38: 0, f42: 0, g40: 0 }
        const v25 = Number(d.indicators['25']?.numericValue ?? d.indicators['23']?.numericValue ?? 0n)
        const v35 = Number(d.indicators['35']?.numericValue ?? d.indicators['34']?.numericValue ?? 0n)
        cur.vatIn += v25
        cur.vatOut += v35
        cur.d37 += Number(d.indicators['37']?.numericValue ?? 0n)
        cur.e38 += Number(d.indicators['38']?.numericValue ?? 0n)
        cur.f42 += Number(d.indicators['42']?.numericValue ?? 0n)
        cur.g40 += Number(d.indicators['40']?.numericValue ?? 0n)
        byMonth.set(m, cur)
      }

      for (const [m, v] of byMonth) {
        const row = wsE380.getRow(18 + m)
        styleCellAmount(row.getCell(2), v.vatIn)
        styleCellAmount(row.getCell(3), v.vatOut)
        styleCellAmount(row.getCell(4), v.d37)
        styleCellAmount(row.getCell(5), v.e38)
        styleCellAmount(row.getCell(6), v.f42)
        styleCellAmount(row.getCell(7), v.g40)
        itemsCount += 6
      }
    } else {
      // Khi chưa nạp tờ khai, để 0 ở các tháng
      for (let m = 0; m < 12; m++) {
        const row = wsE380.getRow(r + m)
        if (!row.getCell(2).value) styleCellAmount(row.getCell(2), 0)
        if (!row.getCell(3).value) styleCellAmount(row.getCell(3), 0)
      }
    }

    updatedSheets.push(wsE380.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
