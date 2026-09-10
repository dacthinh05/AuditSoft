import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
  findWorksheetFuzzy,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
  styleCellAmount,
} from '../helpers'

export function fillTaxWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E300 - Thue - Mau 2024 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

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
    // 1331 Thuế GTGT được khấu trừ (Row 11)
    const acc1331 = ctx.cdfsAccounts.get('1331')
    setLeadRowValues(wsE310, 11, { ck: acc1331?.nock ?? 0, dk: acc1331?.sdndk ?? 0 })

    // 1332 Thuế GTGT TSCĐ (Row 12)
    const acc1332 = ctx.cdfsAccounts.get('1332')
    setLeadRowValues(wsE310, 12, { ck: acc1332?.nock ?? 0, dk: acc1332?.sdndk ?? 0 })

    // 33311 Thuế GTGT đầu ra (Row 19)
    const acc33311 = ctx.cdfsAccounts.get('33311')
    setLeadRowValues(wsE310, 19, { ck: acc33311?.cock ?? 0, dk: acc33311?.sdcdk ?? 0 })

    // 33312 Thuế GTGT hàng nhập khẩu (Row 20)
    const acc33312 = ctx.cdfsAccounts.get('33312')
    setLeadRowValues(wsE310, 20, { ck: acc33312?.cock ?? 0, dk: acc33312?.sdcdk ?? 0 })

    // 3333 Thuế XNK (Row 21)
    const acc3333 = ctx.cdfsAccounts.get('3333')
    setLeadRowValues(wsE310, 21, { ck: acc3333?.cock ?? 0, dk: acc3333?.sdcdk ?? 0 })

    // 3334 Thuế TNDN (Row 22)
    const acc3334 = ctx.cdfsAccounts.get('3334')
    setLeadRowValues(wsE310, 22, { ck: acc3334?.cock ?? 0, dk: acc3334?.sdcdk ?? 0 })

    // 3335 Thuế TNCN (Row 23)
    const acc3335 = ctx.cdfsAccounts.get('3335')
    setLeadRowValues(wsE310, 23, { ck: acc3335?.cock ?? 0, dk: acc3335?.sdcdk ?? 0 })

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
    a15.value = `KÊ KHAI THUẾ GTGT NĂM ${yearStr}`
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
