import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
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
import { analyzeTransactions } from '../../analytics/ExpenseDetailAnalyzer'
import type { ExpenseDetailReport } from '../../analytics/types'

function cellText(ws: ExcelJS.Worksheet, r: number, c: number): string {
  const v = ws.getRow(r).getCell(c).value
  if (v == null) return ''
  if (v != null && typeof v === 'object' && 'text' in v) {
    const t: unknown = v.text
    if (typeof t === 'string') return t
  }
  return String(v)
}

/** Dò dòng header bảng tháng: chứa chữ 'Tháng' (3 cột đầu) VÀ có mã TK 64xx trên cùng dòng. */
function findHeaderRow(ws: ExcelJS.Worksheet): number {
  for (let r = 1; r <= 45; r++) {
    let hasMonthLabel = false
    for (let c = 1; c <= 3; c++) {
      if (cellText(ws, r, c).toLowerCase().includes('tháng')) {
        hasMonthLabel = true
        break
      }
    }
    if (!hasMonthLabel) continue
    // Bỏ qua dòng tiêu đề section (vd '...qua các tháng:') — phải có mã TK 64xx
    for (let c = 1; c <= 40; c++) {
      if (/64\d{2}/.test(cellText(ws, r, c))) return r
    }
  }
  return -1
}

/**
 * Điền bảng phân tích 641/642 theo tháng (mẫu giấy G353/G453):
 * dò layout theo nội dung, ghi giá trị số (không công thức nên không #DIV/0!).
 * Trả về số dòng tháng đã ghi, 0 khi sheet không khớp layout.
 */
function hasCellFormula(cell: ExcelJS.Cell): boolean {
  return Boolean(
    cell.value &&
    typeof cell.value === 'object' &&
    ('formula' in cell.value || 'sharedFormula' in cell.value)
  )
}

/**
 * Điền bảng phân tích 641/642 theo tháng (mẫu giấy G353/G453):
 * Chỉ điền các cột tài khoản con (64xx), tuyệt đối không đè các cột Tổng, Doanh thu, Tỷ lệ
 * vốn đã có sẵn công thức trong template (=SUM, =+ADD!..., =H/I).
 */
function fillMonthlyExpenseSheet(ws: ExcelJS.Worksheet, report: ExpenseDetailReport): number {
  const headerRow = findHeaderRow(ws)
  if (headerRow < 0) return 0

  const colByAccount = new Map<string, number>()
  let colTotal = -1
  let colRevenue = -1
  let colRatio = -1
  for (let c = 1; c <= 40; c++) {
    const t = cellText(ws, headerRow, c)
    const codeMatch = t.match(/64\d{2}/)
    if (codeMatch && !colByAccount.has(codeMatch[0])) {
      colByAccount.set(codeMatch[0], c)
    }
    const lower = t.toLowerCase()
    if (colTotal < 0 && lower.includes('tổng')) colTotal = c
    if (colRevenue < 0 && lower.includes('doanh thu')) colRevenue = c
    if (colRatio < 0 && (lower.includes('tỷ lệ') || lower.includes('ty le'))) colRatio = c
  }
  if (colByAccount.size === 0) return 0

  let written = 0
  for (let r = headerRow + 1; r <= headerRow + 25; r++) {
    const first = cellText(ws, r, 1).trim().toLowerCase()
    const monthNum = Number(cellText(ws, r, 1).trim())
    const isTotalRow = first.includes('cộng')
    if (!isTotalRow && !(monthNum >= 1 && monthNum <= 12)) continue
    const row = ws.getRow(r)
    if (isTotalRow) {
      for (const [acc, c] of colByAccount) {
        const cell = row.getCell(c)
        if (!hasCellFormula(cell)) {
          const idx = report.accounts.indexOf(acc)
          styleCellAmount(cell, idx >= 0 ? (report.totals[idx] ?? 0) : 0)
        }
      }
      // Chỉ điền nếu cell chưa có công thức sẵn
      const grandTotal = report.totals.reduce((s, v) => s + v, 0)
      const grandRevenue = report.revenue.reduce((s, v) => s + v, 0)
      if (colTotal > 0 && !hasCellFormula(row.getCell(colTotal))) {
        styleCellAmount(row.getCell(colTotal), grandTotal)
      }
      if (colRevenue > 0 && !hasCellFormula(row.getCell(colRevenue))) {
        styleCellAmount(row.getCell(colRevenue), grandRevenue)
      }
      if (colRatio > 0 && !hasCellFormula(row.getCell(colRatio))) {
        row.getCell(colRatio).value = grandRevenue > 0 ? Number(((grandTotal / grandRevenue) * 100).toFixed(1)) : 0
      }
    } else {
      const mIdx = monthNum - 1
      for (const [acc, c] of colByAccount) {
        const idx = report.accounts.indexOf(acc)
        const val = idx >= 0 ? (report.months[idx]?.[mIdx] ?? 0) : 0
        styleCellAmount(row.getCell(c), val)
      }
      // Chỉ điền nếu cell chưa có công thức sẵn (giữ nguyên =SUM(...) và =+ADD!...)
      const monthTotal = report.months.reduce((s, m) => s + (m[mIdx] ?? 0), 0)
      const rev = report.revenue[mIdx] ?? 0
      if (colTotal > 0 && !hasCellFormula(row.getCell(colTotal))) {
        styleCellAmount(row.getCell(colTotal), monthTotal)
      }
      if (colRevenue > 0 && !hasCellFormula(row.getCell(colRevenue))) {
        styleCellAmount(row.getCell(colRevenue), rev)
      }
      if (colRatio > 0 && !hasCellFormula(row.getCell(colRatio))) {
        const ratio = report.ratios[mIdx]
        row.getCell(colRatio).value = ratio ?? 0
      }
    }
    written++
  }
  return written
}
/** Nhận diện prefix 641/642 của sheet qua mã TK trong dòng header */
function detectPrefix(ws: ExcelJS.Worksheet): '641' | '642' | null {
  const headerRow = findHeaderRow(ws)
  if (headerRow < 0) return null
  for (let c = 1; c <= 40; c++) {
    const m = cellText(ws, headerRow, c).match(/64\d{2}/)
    if (m) return m[0].startsWith('641') ? '641' : '642'
  }
  const title = Array.from({ length: 10 }, (_, i) => cellText(ws, i + 1, 1)).join(' ')
  if (title.includes('641')) return '641'
  if (title.includes('642')) return '642'
  return null
}

export function fillExpenseWorkingPaper(
  wbOrEditor: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  if (wbOrEditor && 'hasSheet' in wbOrEditor && typeof (wbOrEditor as { hasSheet: unknown }).hasSheet === 'function') {
    const editor = wbOrEditor as OpenXmlPackageEditor
    if (editor.hasSheet('ADD')) {
      editor.fillAddSheet(ctx.engagement)
      updatedSheets.push('ADD')
    }
    const g210Sheet = editor.hasSheet('G210') ? 'G210' : editor.hasSheet('G 210') ? 'G 210' : null
    if (g210Sheet) {
      const acc632 = ctx.cdfsAccounts.get('632')
      const acc6321 = ctx.cdfsAccounts.get('6321')
      const acc6322 = ctx.cdfsAccounts.get('6322')
      const cogsVal = acc632 != null ? acc632.psno : (acc6321?.psno ?? 0) + (acc6322?.psno ?? 0)
      editor.setLeadRowValues(g210Sheet, 12, { ck: cogsVal, dk: cogsVal })
      itemsCount++
      updatedSheets.push(g210Sheet)
    }
    return {
      fileName,
      success: true,
      sheetsUpdated: updatedSheets,
      itemsFilledCount: itemsCount,
    }
  }

  const wb = wbOrEditor as ExcelJS.Workbook
  normalizeWorkbookSharedFormulas(wb)
  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  const detail = analyzeTransactions(ctx.nkcTransactions)
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement, detail.sell.revenue)
    updatedSheets.push('ADD')
  }

  // 2. G210 Lead schedule Giá vốn hàng bán (632)
  const wsG210 = findWorksheetFuzzy(wb, ['G210', 'G 210'])
  if (wsG210) {
    const acc632 = ctx.cdfsAccounts.get('632')
    const acc6321 = ctx.cdfsAccounts.get('6321')
    const acc6322 = ctx.cdfsAccounts.get('6322')

    const cogsVal = acc632 != null ? acc632.psno : (acc6321?.psno ?? 0) + (acc6322?.psno ?? 0)
    setLeadRowValues(wsG210, 12, { ck: cogsVal, dk: cogsVal })
    itemsCount++

    updatedSheets.push(wsG210.name)
  }

  // 3. G291.2 Chọn mẫu phát sinh mua hàng (Nợ 152, 611 / Có 331)
  const wsG291_2 = findWorksheetFuzzy(wb, ['G291.2', 'G 291.2', 'G291'])
  if (wsG291_2) {
    const purchaseSamples = ctx.nkcTransactions
      .filter((t) => (t.debit.startsWith('152') || t.debit.startsWith('611')) && t.credit.startsWith('331'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15)

    let r = 14
    for (const item of purchaseSamples) {
      const row = wsG291_2.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(5), item.debit)
      styleCellCode(row.getCell(6), item.credit)
      styleCellAmount(row.getCell(7), item.amount)
      styleCellCode(row.getCell(9), 'P')
      r++
      itemsCount++
    }
    updatedSheets.push(wsG291_2.name)
  }

  // 4. G310 Lead schedule Chi phí bán hàng (641)
  const wsG310 = findWorksheetFuzzy(wb, ['G310', 'G 310'])
  if (wsG310) {
    const acc641 = ctx.cdfsAccounts.get('641')
    if (acc641) {
      setLeadRowValues(wsG310, 12, { ck: acc641.psno, dk: acc641.psno })
      itemsCount++
    }
    updatedSheets.push(wsG310.name)
  }

  // 5. G410 Lead schedule Chi phí quản lý doanh nghiệp (642)
  const wsG410 = findWorksheetFuzzy(wb, ['G410', 'G 410'])
  if (wsG410) {
    const acc642 = ctx.cdfsAccounts.get('642')
    if (acc642) {
      setLeadRowValues(wsG410, 13, { ck: acc642.psno, dk: acc642.psno })
      itemsCount++
    }
    updatedSheets.push(wsG410.name)
  }

  // 6. G490 Chọn mẫu chi phí QLDN (642)
  const wsG490 = findWorksheetFuzzy(wb, ['G490', 'G 490'])
  if (wsG490) {
    // Bảng 1 (Hàng 22-31): Tổng hợp đối ứng Nợ 642 / Có các tài khoản
    const creditCounterMap = new Map<string, number>()
    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('642')) {
        const cAcc = t.credit.slice(0, 3) || t.credit
        creditCounterMap.set(cAcc, (creditCounterMap.get(cAcc) || 0) + t.amount)
      }
    }
    const sortedCounters = Array.from(creditCounterMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
    for (let i = 0; i < 10; i++) {
      const r = 22 + i
      const row = wsG490.getRow(r)
      const item = sortedCounters[i]
      if (item) {
        styleCellCode(row.getCell(3), item[0])
        styleCellAmount(row.getCell(4), item[1])
        itemsCount += 2
      }
      // Cột 5 (E) có công thức =D22/$D$32, hàng 32 có công thức =SUM(D22:D31) -> TUYỆT ĐỐI KHÔNG ĐÈ!
    }

    // Bảng 2 (Hàng 40-57): Chọn mẫu kiểm tra chứng từ chi phí QLDN > 30 triệu (tối đa 18 dòng)
    const gnaSamples = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('642'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 18)

    for (let i = 0; i < 18; i++) {
      const r = 40 + i
      const row = wsG490.getRow(r)
      const item = gnaSamples[i]
      if (item) {
        styleCellDate(row.getCell(2), item.dateVal)
        styleCellCode(row.getCell(3), item.docNo)
        styleCellText(row.getCell(4), item.desc)
        styleCellCode(row.getCell(5), item.debit)
        styleCellCode(row.getCell(6), item.credit)
        styleCellAmount(row.getCell(7), item.amount)
        styleCellCode(row.getCell(8), 'P')
        itemsCount += 7
      } else {
        row.getCell(2).value = null
        row.getCell(3).value = null
        row.getCell(4).value = null
        row.getCell(5).value = null
        row.getCell(6).value = null
        row.getCell(7).value = 0
        row.getCell(8).value = null
      }
    }
    updatedSheets.push(wsG490.name)
  }

  // 7-8. G353/G453 Phân tích 641/642 theo tháng (TK 4 số) — dò sheet + nhận diện prefix theo nội dung
  // detail đã được tính ở bước 1 (ADD)
  const candidates: Array<{ names: string[]; fallback: '641' | '642' }> = [
    { names: ['G353', 'G 353'], fallback: '641' },
    { names: ['G453', 'G 453'], fallback: '642' },
  ]
  for (const cand of candidates) {
    const ws = findWorksheetFuzzy(wb, cand.names)
    if (!ws) continue
    const prefix = detectPrefix(ws) ?? cand.fallback
    const written = fillMonthlyExpenseSheet(ws, prefix === '641' ? detail.sell : detail.admin)
    if (written > 0) {
      itemsCount += written
      updatedSheets.push(ws.name)
    }
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
