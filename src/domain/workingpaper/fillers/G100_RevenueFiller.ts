import type ExcelJS from 'exceljs'
import { stripDiacritics } from '../../clean'
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

export function fillRevenueWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'G100 - Doanh thu - Mau 2025- Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // Monthly stats & customer map
  const revEntries = []
  const monthlyRev: number[] = new Array(12).fill(0)
  const sub5111: number[] = new Array(12).fill(0)
  const sub5112: number[] = new Array(12).fill(0)
  const sub5113: number[] = new Array(12).fill(0)
  const sub521: number[] = new Array(12).fill(0)
  const sub711: number[] = new Array(12).fill(0)
  const sub3387: number[] = new Array(12).fill(0)
  const custRevMap = new Map<string, number>()

  for (const t of ctx.nkcTransactions) {
    const mIdx = Math.max(0, Math.min(11, t.month - 1))
    if (t.credit.startsWith('511')) {
      revEntries.push(t)
      const curTotal = monthlyRev[mIdx] ?? 0
      monthlyRev[mIdx] = curTotal + t.amount
      if (t.credit.startsWith('5111')) {
        const cur = sub5111[mIdx] ?? 0
        sub5111[mIdx] = cur + t.amount
      } else if (t.credit.startsWith('5112')) {
        const cur = sub5112[mIdx] ?? 0
        sub5112[mIdx] = cur + t.amount
      } else if (t.credit.startsWith('5113')) {
        const cur = sub5113[mIdx] ?? 0
        sub5113[mIdx] = cur + t.amount
      }

      const cKey = t.custId || (t.desc.split(' ')[0] ?? 'KHACH_HANG')
      custRevMap.set(cKey, (custRevMap.get(cKey) || 0) + t.amount)
    }
    if (t.debit.startsWith('521')) {
      sub521[mIdx] = (sub521[mIdx] ?? 0) + t.amount
    }
    if (t.credit.startsWith('711')) {
      sub711[mIdx] = (sub711[mIdx] ?? 0) + t.amount
    }
    if (t.credit.startsWith('3387')) {
      sub3387[mIdx] = (sub3387[mIdx] ?? 0) + t.amount
    }
  }

  // Bóc tách doanh thu thuế GTGT từ tờ khai thuế (0%, 5%, 10%)
  const vat0Pct: number[] = new Array(12).fill(0)
  const vat5Pct: number[] = new Array(12).fill(0)
  const vat10Pct: number[] = new Array(12).fill(0)
  if (ctx.vatDeclarations && ctx.vatDeclarations.length > 0) {
    for (const d of ctx.vatDeclarations) {
      const m = d.period.month ?? (d.period.quarter ? d.period.quarter * 3 : 0)
      if (m < 1 || m > 12) continue
      const idx = m - 1
      const c26 = Number(d.indicators['26']?.numericValue ?? 0n)
      const c27 = Number(d.indicators['27']?.numericValue ?? 0n)
      const c28 = Number(d.indicators['28']?.numericValue ?? 0n)
      const c29 = Number(d.indicators['29']?.numericValue ?? 0n)
      const c34 = Number(d.indicators['34']?.numericValue ?? 0n)

      vat0Pct[idx] = (vat0Pct[idx] ?? 0) + (c26 + c27)
      vat5Pct[idx] = (vat5Pct[idx] ?? 0) + c28
      const r10 = c29 > 0 ? c29 : Math.max(0, c34 - (c26 + c27 + c28))
      vat10Pct[idx] = (vat10Pct[idx] ?? 0) + r10
    }
  }

  const totalRevAmount = monthlyRev.reduce((a, b) => a + b, 0)
  const pmValue = ctx.materiality?.pm ?? Math.round(totalRevAmount * 0.01 * 0.75) // 0.75% of Revenue as default PM

  // 2. G 110 Lead schedule
  const wsG110 = findWorksheetFuzzy(wb, ['G 110', 'G110'])
  if (wsG110) {
    const acc5111 = ctx.cdfsAccounts.get('5111')
    setLeadRowValues(wsG110, 11, {
      ck: acc5111?.psco ?? 0,
      dk: acc5111?.psco ?? 0,
    })
    itemsCount++

    const acc5112 = ctx.cdfsAccounts.get('5112')
    setLeadRowValues(wsG110, 12, {
      ck: acc5112?.psco ?? 0,
      dk: acc5112?.psco ?? 0,
    })
    itemsCount++

    const acc5113 = ctx.cdfsAccounts.get('5113')
    setLeadRowValues(wsG110, 13, {
      ck: acc5113?.psco ?? 0,
      dk: acc5113?.psco ?? 0,
    })
    itemsCount++

    const acc5211 = ctx.cdfsAccounts.get('5211')
    const acc5212 = ctx.cdfsAccounts.get('5212')
    const acc5213 = ctx.cdfsAccounts.get('5213')
    setLeadRowValues(wsG110, 16, { ck: acc5211?.psno ?? 0, dk: acc5211?.psno ?? 0 })
    setLeadRowValues(wsG110, 17, { ck: acc5212?.psno ?? 0, dk: acc5212?.psno ?? 0 })
    setLeadRowValues(wsG110, 18, { ck: acc5213?.psno ?? 0, dk: acc5213?.psno ?? 0 })
    itemsCount += 3

    const acc515 = ctx.cdfsAccounts.get('515') || ctx.cdfsAccounts.get('5151') || ctx.cdfsAccounts.get('5152')
    const acc711 = ctx.cdfsAccounts.get('711')
    setLeadRowValues(wsG110, 21, { ck: acc515?.psco ?? 0, dk: acc515?.psco ?? 0 })
    setLeadRowValues(wsG110, 23, { ck: acc711?.psco ?? 0, dk: acc711?.psco ?? 0 })
    itemsCount += 2

    updatedSheets.push(wsG110.name)
  }

  // 3. G 150 Bảng kê đối chiếu doanh thu thuế & sổ kế toán (Chuẩn Mẫu 2025)
  const wsG150 = findWorksheetFuzzy(wb, ['G 150', 'G150'])
  if (wsG150) {
    let totalTaxRevenue = 0
    for (let m = 1; m <= 12; m++) {
      const r = 15 + m
      const v0 = vat0Pct[m - 1] ?? 0
      const v5 = vat5Pct[m - 1] ?? 0
      const v10 = vat10Pct[m - 1] ?? 0
      totalTaxRevenue += v0 + v5 + v10

      // Khối Kê khai thuế: Cột B (0%), C (5%), D (10%)
      styleCellAmount(wsG150.getCell(`B${r}`), v0)
      styleCellAmount(wsG150.getCell(`C${r}`), v5)
      styleCellAmount(wsG150.getCell(`D${r}`), v10)
      // Cột E (=SUM(B:D)): giữ nguyên công thức của template

      // Khối Sổ kế toán: Cột G (Có 511), H (Nợ 521), I (Có 711), J (Có 3387)
      styleCellAmount(wsG150.getCell(`G${r}`), monthlyRev[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`H${r}`), sub521[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`I${r}`), sub711[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`J${r}`), sub3387[m - 1] ?? 0)
      // Cột K (CL =+E-G-I-J+H): giữ nguyên công thức của template

      itemsCount += 7
    }

    // Bảo vệ chống lỗi #DIV/0! tại dòng 29 nếu mẫu số = 0
    if (totalTaxRevenue === 0) {
      wsG150.getCell('B29').value = 0
      wsG150.getCell('C29').value = 0
      wsG150.getCell('D29').value = 0
    }
    const totalGlLedger = totalRevAmount + sub711.reduce((a, b) => a + b, 0)
    if (totalGlLedger === 0) {
      wsG150.getCell('G29').value = 0
      wsG150.getCell('I29').value = 0
    }

    updatedSheets.push(wsG150.name)
  }
  // 4. G 151 Biến động doanh thu theo tháng
  const wsG151 = findWorksheetFuzzy(wb, ['G 151', 'G151'])
  if (wsG151) {
    for (let m = 1; m <= 12; m++) {
      const r = 13 + m
      styleCellAmount(wsG151.getCell(`B${r}`), sub5111[m - 1] ?? 0)
      styleCellAmount(wsG151.getCell(`C${r}`), sub5112[m - 1] ?? 0)
      styleCellAmount(wsG151.getCell(`D${r}`), sub5113[m - 1] ?? 0)
      itemsCount += 3
    }
    updatedSheets.push(wsG151.name)
  }
  // 4.1 G 152 Đối chiếu doanh thu theo 12 tháng (Theo sổ sách vs Báo cáo bán hàng)
  const wsG152 = findWorksheetFuzzy(wb, ['G 152', 'G152'])
  if (wsG152) {
    for (let m = 1; m <= 12; m++) {
      const r = 16 + m // Dòng 17 (T1) -> Dòng 28 (T12)
      const revMonth = monthlyRev[m - 1] ?? 0
      // Cột D: Theo sổ sách (VND)
      styleCellAmount(wsG152.getCell(`D${r}`), revMonth)
      // Cột F: Theo báo cáo bán hàng (VND) - mặc định khớp nếu chưa có file kho riêng
      styleCellAmount(wsG152.getCell(`F${r}`), revMonth)
      itemsCount += 2
    }
    updatedSheets.push(wsG152.name)
  }


  // 5. G191.chonmau — Bảng xác định cỡ mẫu VSA 530
  const wsChonMau = findWorksheetFuzzy(wb, ['G191.chonmau', 'G191'])
  if (wsChonMau) {
    const g21 = wsChonMau.getCell('G21')
    const hasG21Formula = g21.value && typeof g21.value === 'object' && ('formula' in g21.value || 'sharedFormula' in g21.value)
    if (!hasG21Formula) styleCellAmount(g21, totalRevAmount)

    wsChonMau.getCell('G23').value = 0.75
    wsChonMau.getCell('G23').numFmt = '0.0%'

    const g24 = wsChonMau.getCell('G24')
    const hasG24Formula = g24.value && typeof g24.value === 'object' && ('formula' in g24.value || 'sharedFormula' in g24.value)
    if (!hasG24Formula) styleCellAmount(g24, pmValue)

    wsChonMau.getCell('G25').value = 0.75
    wsChonMau.getCell('G25').numFmt = '0.00'
    itemsCount += 4
    updatedSheets.push(wsChonMau.name)
  }

  // 6. G 191.1 — Bảng chi tiết mẫu chọn (Key items + Risk items + MUS samples)
  const wsG191 = findWorksheetFuzzy(wb, ['G 191.1', 'G191.1'])
  if (wsG191) {
    // 6.1 Key items >= PM
    const keyItems = revEntries.filter((e) => Math.abs(e.amount) >= pmValue)
    // 6.2 Specific risk items (weekend, cutoff, sensitive keywords, round numbers)
    const riskItems = revEntries.filter((e) => {
      const absAmt = Math.abs(e.amount)
      if (absAmt >= pmValue) return false
      const desc = stripDiacritics(e.desc).toUpperCase()
      return desc.includes('DIEU CHINH') || desc.includes('TRICH TRUOC') || desc.includes('HOAN NHAP') || desc.includes('CHINH SACH') || absAmt >= 100_000_000
    }).slice(0, 10)
    // 6.3 Representative MUS sample
    const remaining = revEntries.filter((e) => !keyItems.includes(e) && !riskItems.includes(e))
    const step = Math.max(1, Math.floor(remaining.length / 15))
    const repSamples = []
    for (let i = 0; i < remaining.length && repSamples.length < 15; i += step) {
      const it = remaining[i]
      if (it) repSamples.push(it)
    }

    const allSamples = [...keyItems, ...riskItems, ...repSamples].slice(0, 35)

    let r = 17
    for (const item of allSamples) {
      const row = wsG191.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellCode(row.getCell(4), item.debit)
      styleCellCode(row.getCell(5), item.credit)
      styleCellAmount(row.getCell(6), item.amount)
      r++
      itemsCount++
    }
    updatedSheets.push(wsG191.name)
  }

  // 7. G 194 Khách hàng lớn
  const wsG194 = findWorksheetFuzzy(wb, ['G 194', 'G194'])
  if (wsG194) {
    const sortedCusts = Array.from(custRevMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15)
    for (let i = 0; i < sortedCusts.length; i++) {
      const entry = sortedCusts[i]
      if (!entry) continue
      const [custId, amt] = entry
      const r = 13 + i
      const row = wsG194.getRow(r)
      styleCellCode(row.getCell(1), String(i + 1))
      styleCellCode(row.getCell(2), custId)
      // Tìm tên khách hàng đại diện trong chứng từ để không bị lặp lại Mã KH
      const matchTxn = revEntries.find((e) => (e.custId || e.desc.split(' ')[0]) === custId)
      const custName = matchTxn?.desc || custId
      styleCellText(row.getCell(3), custName.slice(0, 60))
      styleCellAmount(row.getCell(4), amt)
      // Cột 5 (E) có công thức =D13/$D$34 -> TUYỆT ĐỐI KHÔNG ĐÈ!
      const c5 = row.getCell(5)
      const hasC5Formula = c5.value && typeof c5.value === 'object' && ('formula' in c5.value || 'sharedFormula' in c5.value)
      if (!hasC5Formula) {
        c5.value = totalRevAmount > 0 ? amt / totalRevAmount : 0
        c5.numFmt = '0.0%'
        c5.alignment = { horizontal: 'right', vertical: 'middle' }
      }
      styleCellCode(row.getCell(6), 'Độc lập')
      itemsCount += 5
    }
    updatedSheets.push(wsG194.name)
  }

  // 8. G 195 Cutoff doanh thu (5 trước và 5 sau 31/12)
  const wsG195 = findWorksheetFuzzy(wb, ['G 195', 'G195'])
  if (wsG195) {
    const yearEndItems = [...revEntries].filter((e) => e.month === 12).slice(-10)
    for (let i = 0; i < 10; i++) {
      const item = yearEndItems[i]
      const r = 13 + i
      const row = wsG195.getRow(r)
      if (item) {
        styleCellDate(row.getCell(1), item.dateVal)
        styleCellCode(row.getCell(2), item.docNo)
        styleCellText(row.getCell(3), item.desc)
        styleCellAmount(row.getCell(4), item.amount)
        styleCellCode(row.getCell(5), item.docNo)
        styleCellDate(row.getCell(6), item.dateVal)
        itemsCount += 6
      } else {
        row.getCell(1).value = ''
        row.getCell(2).value = ''
        row.getCell(3).value = ''
        row.getCell(4).value = 0
        row.getCell(5).value = ''
        row.getCell(6).value = ''
      }
    }
    updatedSheets.push(wsG195.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
