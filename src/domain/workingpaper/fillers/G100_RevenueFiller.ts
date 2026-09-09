import type ExcelJS from 'exceljs'
import { stripDiacritics } from '../../clean'
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
  const custRevMap = new Map<string, number>()

  for (const t of ctx.nkcTransactions) {
    if (t.credit.startsWith('511')) {
      revEntries.push(t)
      const mIdx = Math.max(0, Math.min(11, t.month - 1))
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
  }

  const totalRevAmount = monthlyRev.reduce((a, b) => a + b, 0)
  const pmValue = ctx.materiality?.pm ?? Math.round(totalRevAmount * 0.01 * 0.75) // 0.75% of Revenue as default PM

  // 2. G 110 Lead schedule
  const wsG110 = wb.getWorksheet('G 110')
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

    updatedSheets.push('G 110')
  }

  // 3. G 150 Bảng kê doanh thu 12 tháng
  const wsG150 = wb.getWorksheet('G 150')
  if (wsG150) {
    for (let m = 1; m <= 12; m++) {
      const r = 15 + m
      const amt = monthlyRev[m - 1] ?? 0
      styleCellAmount(wsG150.getCell(`B${r}`), amt)
      styleCellAmount(wsG150.getCell(`G${r}`), amt)
      itemsCount++
    }
    updatedSheets.push('G 150')
  }

  // 4. G 151 Biến động doanh thu theo tháng
  const wsG151 = wb.getWorksheet('G 151')
  if (wsG151) {
    for (let m = 1; m <= 12; m++) {
      const r = 13 + m
      styleCellAmount(wsG151.getCell(`B${r}`), sub5111[m - 1] ?? 0)
      styleCellAmount(wsG151.getCell(`C${r}`), sub5112[m - 1] ?? 0)
      styleCellAmount(wsG151.getCell(`D${r}`), sub5113[m - 1] ?? 0)
      itemsCount += 3
    }
    updatedSheets.push('G 151')
  }

  // 5. G191.chonmau — Bảng xác định cỡ mẫu VSA 530
  const wsChonMau = wb.getWorksheet('G191.chonmau')
  if (wsChonMau) {
    styleCellAmount(wsChonMau.getCell('G21'), totalRevAmount)
    wsChonMau.getCell('G23').value = 0.75
    wsChonMau.getCell('G23').numFmt = '0.0%'
    styleCellAmount(wsChonMau.getCell('G24'), pmValue)
    wsChonMau.getCell('G25').value = 0.75
    wsChonMau.getCell('G25').numFmt = '0.00'
    itemsCount += 4
    updatedSheets.push('G191.chonmau')
  }

  // 6. G 191.1 — Bảng chi tiết mẫu chọn (Key items + Risk items + MUS samples)
  const wsG191 = wb.getWorksheet('G 191.1')
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
    updatedSheets.push('G 191.1')
  }

  // 7. G 194 Khách hàng lớn
  const wsG194 = wb.getWorksheet('G 194')
  if (wsG194) {
    const sortedCusts = Array.from(custRevMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
    for (let i = 0; i < sortedCusts.length; i++) {
      const entry = sortedCusts[i]
      if (!entry) continue
      const [custId, amt] = entry
      const r = 13 + i
      const row = wsG194.getRow(r)
      styleCellCode(row.getCell(1), String(i + 1))
      styleCellCode(row.getCell(2), custId)
      styleCellText(row.getCell(3), custId)
      styleCellAmount(row.getCell(4), amt)
      row.getCell(5).value = totalRevAmount > 0 ? amt / totalRevAmount : 0
      row.getCell(5).numFmt = '0.0%'
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' }
      styleCellCode(row.getCell(6), 'Độc lập')
      itemsCount++
    }
    updatedSheets.push('G 194')
  }

  // 8. G 195 Cutoff doanh thu
  const wsG195 = wb.getWorksheet('G 195')
  if (wsG195) {
    const yearEndItems = [...revEntries].filter((e) => e.month === 12).slice(-10)
    for (let i = 0; i < yearEndItems.length; i++) {
      const item = yearEndItems[i]
      if (!item) continue
      const r = 13 + i
      const row = wsG195.getRow(r)
      styleCellDate(row.getCell(1), item.dateVal)
      styleCellCode(row.getCell(2), item.docNo)
      styleCellText(row.getCell(3), item.desc)
      styleCellAmount(row.getCell(4), item.amount)
      styleCellCode(row.getCell(5), item.docNo)
      styleCellDate(row.getCell(6), item.dateVal)
      itemsCount++
    }
    updatedSheets.push('G 195')
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
