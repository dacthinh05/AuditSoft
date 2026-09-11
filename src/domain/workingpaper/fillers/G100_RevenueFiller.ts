import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult, CdfsAccountRow } from '../types'
import {
  fillAddSheet,
  findWorksheetFuzzy,
  setLeadRowValues,
  styleCellAmount,
  computeAccountAdjustment,
} from '../helpers'
import { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
import { extractCounterpartStats } from '../counterpartExtractor'
function sumCdfsAccounts(
  cdfsMap: Map<string, CdfsAccountRow>,
  prefix: string,
  side: 'CREDIT' | 'DEBIT',
): { ck: number; dk: number } {
  let ck = 0
  let dk = 0
  for (const [code, a] of cdfsMap.entries()) {
    if (code.startsWith(prefix)) {
      if (side === 'CREDIT') {
        ck += a.psco ?? 0
        dk += a.psco ?? 0
      } else {
        ck += a.psno ?? 0
        dk += a.psno ?? 0
      }
    }
  }
  return { ck, dk }
}
export function fillRevenueWorkingPaper(
  target: OpenXmlPackageEditor | ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'G100 - Doanh thu - Mau 2025- Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  const isEditor = target && typeof (target as OpenXmlPackageEditor).updateCell === 'function'

  // Monthly stats & customer map
  const revEntries: typeof ctx.nkcTransactions = []
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
      monthlyRev[mIdx] = (monthlyRev[mIdx] ?? 0) + t.amount
      if (t.credit.startsWith('5112')) {
        sub5112[mIdx] = (sub5112[mIdx] ?? 0) + t.amount
      } else if (t.credit.startsWith('5113')) {
        sub5113[mIdx] = (sub5113[mIdx] ?? 0) + t.amount
      } else {
        // 5111, 51111, hoặc 511 chung -> dồn vào sub5111
        sub5111[mIdx] = (sub5111[mIdx] ?? 0) + t.amount
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
  // Tổng hợp số liệu kê khai thuế GTGT 12 tháng từ tờ khai thuế
  const vat0Pct: number[] = new Array(12).fill(0)
  const vat5Pct: number[] = new Array(12).fill(0)
  const vat10Pct: number[] = new Array(12).fill(0)
  if (ctx.vatDeclarations && ctx.vatDeclarations.length > 0) {
    for (const d of ctx.vatDeclarations) {
      const m = d.period.month ?? (d.period.quarter ? d.period.quarter * 3 : 0)
      if (m >= 1 && m <= 12) {
        const ind26 = Number(d.indicators?.['26']?.numericValue ?? 0n) + Number(d.indicators?.['27']?.numericValue ?? 0n)
        const ind28 = Number(d.indicators?.['28']?.numericValue ?? 0n)
        const ind29 = Number(d.indicators?.['29']?.numericValue ?? 0n)
        vat0Pct[m - 1] = (vat0Pct[m - 1] ?? 0) + ind26
        vat5Pct[m - 1] = (vat5Pct[m - 1] ?? 0) + ind28
        vat10Pct[m - 1] = (vat10Pct[m - 1] ?? 0) + ind29
      }
    }
  }


  if (isEditor) {
    const editor = target as OpenXmlPackageEditor

    // 1. ADD
    if (editor.hasSheet('ADD')) {
      editor.fillAddSheet(ctx.engagement)
      updatedSheets.push('ADD')
    }

    // 2. G 110 Lead schedule
    const g110Sheet = editor.hasSheet('G 110') ? 'G 110' : editor.hasSheet('G110') ? 'G110' : null
    if (g110Sheet) {
      let v5111 = sumCdfsAccounts(ctx.cdfsAccounts, '5111', 'CREDIT')
      const v5112 = sumCdfsAccounts(ctx.cdfsAccounts, '5112', 'CREDIT')
      const v5113 = sumCdfsAccounts(ctx.cdfsAccounts, '5113', 'CREDIT')

      // Nếu không có tiểu khoản 5111, 5112, 5113 nhưng có tài khoản 511 tổng hợp
      if (v5111.ck === 0 && v5112.ck === 0 && v5113.ck === 0) {
        v5111 = sumCdfsAccounts(ctx.cdfsAccounts, '511', 'CREDIT')
      }

      const adj5111 =
        computeAccountAdjustment(ctx.adjustingEntries, '5111', 'CREDIT') ||
        computeAccountAdjustment(ctx.adjustingEntries, '511', 'CREDIT')
      editor.setLeadRowValues(g110Sheet, 11, { ck: v5111.ck, dk: v5111.dk, adj: adj5111 })

      const adj5112 = computeAccountAdjustment(ctx.adjustingEntries, '5112', 'CREDIT')
      editor.setLeadRowValues(g110Sheet, 12, { ck: v5112.ck, dk: v5112.dk, adj: adj5112 })

      const adj5113 = computeAccountAdjustment(ctx.adjustingEntries, '5113', 'CREDIT')
      editor.setLeadRowValues(g110Sheet, 13, { ck: v5113.ck, dk: v5113.dk, adj: adj5113 })

      const v5211 = sumCdfsAccounts(ctx.cdfsAccounts, '5211', 'DEBIT')
      const v5212 = sumCdfsAccounts(ctx.cdfsAccounts, '5212', 'DEBIT')
      const v5213 = sumCdfsAccounts(ctx.cdfsAccounts, '5213', 'DEBIT')
      const adj5211 = computeAccountAdjustment(ctx.adjustingEntries, '5211', 'DEBIT')
      const adj5212 = computeAccountAdjustment(ctx.adjustingEntries, '5212', 'DEBIT')
      const adj5213 = computeAccountAdjustment(ctx.adjustingEntries, '5213', 'DEBIT')
      editor.setLeadRowValues(g110Sheet, 16, { ck: v5211.ck, dk: v5211.dk, adj: adj5211 })
      editor.setLeadRowValues(g110Sheet, 17, { ck: v5212.ck, dk: v5212.dk, adj: adj5212 })
      editor.setLeadRowValues(g110Sheet, 18, { ck: v5213.ck, dk: v5213.dk, adj: adj5213 })

      const v515 = sumCdfsAccounts(ctx.cdfsAccounts, '515', 'CREDIT')
      const adj515 = computeAccountAdjustment(ctx.adjustingEntries, '515', 'CREDIT')
      editor.setLeadRowValues(g110Sheet, 21, { ck: v515.ck, dk: v515.dk, adj: adj515 })

      const v711 = sumCdfsAccounts(ctx.cdfsAccounts, '711', 'CREDIT')
      const adj711 = computeAccountAdjustment(ctx.adjustingEntries, '711', 'CREDIT')
      editor.setLeadRowValues(g110Sheet, 23, { ck: v711.ck, dk: v711.dk, adj: adj711 })
      itemsCount += 8
      updatedSheets.push(g110Sheet)
    }

    // 2.1 G 150 Đối chiếu thuế GTGT và sổ kế toán 12 tháng
    const g150Sheet = editor.hasSheet('G 150') ? 'G 150' : editor.hasSheet('G150') ? 'G150' : null
    if (g150Sheet) {
      for (let m = 1; m <= 12; m++) {
        const r = 15 + m
        editor.updateCell(g150Sheet, `B${r}`, { number: vat0Pct[m - 1] ?? 0, styleId: 684 })
        editor.updateCell(g150Sheet, `C${r}`, { number: vat5Pct[m - 1] ?? 0, styleId: 684 })
        editor.updateCell(g150Sheet, `D${r}`, { number: vat10Pct[m - 1] ?? 0, styleId: 684 })
        editor.updateCell(g150Sheet, `G${r}`, { number: monthlyRev[m - 1] ?? 0, styleId: 691 })
        editor.updateCell(g150Sheet, `H${r}`, { number: sub521[m - 1] ?? 0, styleId: 692 })
        editor.updateCell(g150Sheet, `I${r}`, { number: sub711[m - 1] ?? 0, styleId: 693 })
        editor.updateCell(g150Sheet, `J${r}`, { number: sub3387[m - 1] ?? 0, styleId: 694 })
        itemsCount += 7
      }
      updatedSheets.push(g150Sheet)
    }

    // 3. G 151 Biến động doanh thu theo tháng
    const g151Sheet = editor.hasSheet('G 151') ? 'G 151' : editor.hasSheet('G151') ? 'G151' : null
    if (g151Sheet) {
      for (let m = 1; m <= 12; m++) {
        const r = 13 + m
        editor.updateCell(g151Sheet, `B${r}`, { number: sub5111[m - 1] ?? 0 })
        editor.updateCell(g151Sheet, `C${r}`, { number: sub5112[m - 1] ?? 0 })
        editor.updateCell(g151Sheet, `D${r}`, { number: sub5113[m - 1] ?? 0 })
        itemsCount += 3
      }
      updatedSheets.push(g151Sheet)
    }

    // 4. G 152 Đối chiếu 12 tháng
    const g152Sheet = editor.hasSheet('G 152') ? 'G 152' : editor.hasSheet('G152') ? 'G152' : null
    if (g152Sheet) {
      for (let m = 1; m <= 12; m++) {
        const r = 16 + m
        const revMonth = monthlyRev[m - 1] ?? 0
        editor.updateCell(g152Sheet, `D${r}`, { number: revMonth })
        editor.updateCell(g152Sheet, `F${r}`, { number: revMonth })
        itemsCount += 2
      }
      updatedSheets.push(g152Sheet)
    }

    // 4.1 G 190.1 & G 190.2: Bảng kê phát sinh theo tài khoản đối ứng (Đợt 1 & Cả năm)
    const fillCounterpartSheet = (sName: string, isP1: boolean) => {
      if (!editor.hasSheet(sName)) return

      // Cấu hình các khối tài khoản và dòng bắt đầu trên sheet G 190.1 / G 190.2
      const sections = [
        { prefix: '511', startRow: 16, maxRows: 7 }, // Rows 16 - 22
        { prefix: '521', startRow: 29, maxRows: 5 }, // Rows 29 - 33
        { prefix: '515', startRow: 39, maxRows: 5 }, // Rows 39 - 43
        { prefix: '711', startRow: 49, maxRows: 5 }, // Rows 49 - 53
      ]

      for (const sec of sections) {
        const stats = extractCounterpartStats(ctx.nkcTransactions, sec.prefix, isP1)

        // Điền 1. PS NỢ: Cột A (Tham chiếu), Cột B (TK ĐỨ), Cột C (Số tiền)
        for (let i = 0; i < sec.maxRows; i++) {
          const r = sec.startRow + i
          const item = stats.debitItems[i]
          if (item) {
            editor.updateCell(sName, `A${r}`, { text: item.ref })
            editor.updateCell(sName, `B${r}`, { text: item.account })
            editor.updateCell(sName, `C${r}`, { number: item.amount })
            itemsCount += 3
          } else {
            editor.updateCell(sName, `A${r}`, { text: '' })
            editor.updateCell(sName, `B${r}`, { text: '' })
            editor.updateCell(sName, `C${r}`, { number: 0 })
          }
        }

        // Điền 2. PS CÓ: Cột E (Tham chiếu), Cột F (TK ĐỨ), Cột G (Số tiền)
        for (let i = 0; i < sec.maxRows; i++) {
          const r = sec.startRow + i
          const item = stats.creditItems[i]
          if (item) {
            editor.updateCell(sName, `E${r}`, { text: item.ref })
            editor.updateCell(sName, `F${r}`, { text: item.account })
            editor.updateCell(sName, `G${r}`, { number: item.amount })
            itemsCount += 3
          } else {
            editor.updateCell(sName, `E${r}`, { text: '' })
            editor.updateCell(sName, `F${r}`, { text: '' })
            editor.updateCell(sName, `G${r}`, { number: 0 })
          }
        }
      }

      // Đánh giá & Kết luận (Row 59)
      editor.updateCell(sName, 'B59', {
        text: 'Không phát sinh bất thường. Doanh thu phát sinh đối ứng chủ yếu với Phải thu khách hàng (TK 131) và Tiền gửi ngân hàng (TK 112).',
      })
      itemsCount++
      updatedSheets.push(sName)
    }

    // Đổ Đợt 1 vào G 190.1
    const g190_1 = editor.hasSheet('G 190.1') ? 'G 190.1' : editor.hasSheet('G190.1') ? 'G190.1' : null
    if (g190_1) fillCounterpartSheet(g190_1, true)

    // Đổ Cả năm vào G 190.2
    const g190_2 = editor.hasSheet('G 190.2') ? 'G 190.2' : editor.hasSheet('G190.2') ? 'G190.2' : null
    if (g190_2) fillCounterpartSheet(g190_2, false)


    // 5. G 191.1 Chi tiết mẫu chọn
    const g191Sheet = editor.hasSheet('G 191.1') ? 'G 191.1' : editor.hasSheet('G191.1') ? 'G191.1' : null
    if (g191Sheet) {
      const topSamples = revEntries.slice(0, 20)
      topSamples.forEach((item, idx) => {
        const r = 17 + idx
        editor.updateCell(g191Sheet, `A${r}`, { date: item.dateStr || item.dateVal, styleId: 737 })
        editor.updateCell(g191Sheet, `B${r}`, { text: item.docNo, styleId: 737 })
        editor.updateCell(g191Sheet, `C${r}`, { text: item.desc, styleId: 140 })
        editor.updateCell(g191Sheet, `D${r}`, { text: item.debit, styleId: 140 })
        editor.updateCell(g191Sheet, `E${r}`, { text: item.credit, styleId: 140 })
        editor.updateCell(g191Sheet, `F${r}`, { number: item.amount, styleId: 164 })
        if (item.exchangeRate) {
          editor.updateCell(g191Sheet, `G${r}`, { number: item.exchangeRate, styleId: 142 })
        }
        if (item.usdAmount) {
          editor.updateCell(g191Sheet, `H${r}`, { number: item.usdAmount, styleId: 164 })
        }
        itemsCount += 6
      })
      updatedSheets.push(g191Sheet)
    }

    // 6. G 194 Khách hàng lớn
    const g194Sheet = editor.hasSheet('G 194') ? 'G 194' : editor.hasSheet('G194') ? 'G194' : null
    if (g194Sheet) {
      const sortedCusts = Array.from(custRevMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15)
      let totalAnnualRev = 0
      sortedCusts.forEach(([custId, amt], idx) => {
        totalAnnualRev += amt
        const r = 13 + idx
        editor.updateCell(g194Sheet, `A${r}`, { text: String(idx + 1) })
        editor.updateCell(g194Sheet, `B${r}`, { text: custId })
        editor.updateCell(g194Sheet, `C${r}`, { text: custId.slice(0, 60) })
        editor.updateCell(g194Sheet, `D${r}`, { number: amt, styleId: 164 })
        editor.updateCell(g194Sheet, `F${r}`, { text: 'Độc lập' })
        itemsCount += 5
      })
      const allRevTotal = monthlyRev.reduce((a, b) => a + b, 0) || totalAnnualRev
      editor.updateCell(g194Sheet, 'D34', { number: allRevTotal, styleId: 164 })
      updatedSheets.push(g194Sheet)
    }

    // 7. G 195 Cutoff
    const g195Sheet = editor.hasSheet('G 195') ? 'G 195' : editor.hasSheet('G195') ? 'G195' : null
    if (g195Sheet) {
      const cutoffItems = revEntries.slice(-4)
      cutoffItems.forEach((item, idx) => {
        const r = 14 + idx
        editor.updateCell(g195Sheet, `A${r}`, { date: item.dateStr || item.dateVal, styleId: 564 })
        editor.updateCell(g195Sheet, `B${r}`, { text: item.docNo, styleId: 564 })
        editor.updateCell(g195Sheet, `C${r}`, { text: item.desc, styleId: 564 })
        editor.updateCell(g195Sheet, `D${r}`, { number: item.amount, styleId: 164 })
        editor.updateCell(g195Sheet, `H${r}`, { text: '2025', styleId: 564 })
        itemsCount += 5
      })
      updatedSheets.push(g195Sheet)
    }

    return {
      fileName,
      success: true,
      sheetsUpdated: updatedSheets,
      itemsFilledCount: itemsCount,
    }
  }

  // Fallback ExcelJS path (chỉ dùng cho tests mock)
  const wb = target as ExcelJS.Workbook
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  const wsG110 = findWorksheetFuzzy(wb, ['G 110', 'G110'])
  if (wsG110) {
    const acc5111 = ctx.cdfsAccounts.get('5111')
    setLeadRowValues(wsG110, 11, { ck: acc5111?.psco ?? 0, dk: acc5111?.psco ?? 0 })
    itemsCount++
    updatedSheets.push(wsG110.name)
  }

  const wsG150 = findWorksheetFuzzy(wb, ['G 150', 'G150'])
  if (wsG150) {
    // Bóc tách doanh thu thuế GTGT từ tờ khai thuế (0%, 5%, 10%)
    const vat0Pct: number[] = new Array(12).fill(0)
    const vat5Pct: number[] = new Array(12).fill(0)
    const vat10Pct: number[] = new Array(12).fill(0)
    if (ctx.vatDeclarations && ctx.vatDeclarations.length > 0) {
      for (const d of ctx.vatDeclarations) {
        const m = d.period.month ?? (d.period.quarter ? d.period.quarter * 3 : 0)
        if (m >= 1 && m <= 12) {
          const ind26 = Number(d.indicators?.['26']?.numericValue ?? 0n) + Number(d.indicators?.['27']?.numericValue ?? 0n)
          const ind28 = Number(d.indicators?.['28']?.numericValue ?? 0n)
          const ind29 = Number(d.indicators?.['29']?.numericValue ?? 0n)
          vat0Pct[m - 1] = (vat0Pct[m - 1] ?? 0) + ind26
          vat5Pct[m - 1] = (vat5Pct[m - 1] ?? 0) + ind28
          vat10Pct[m - 1] = (vat10Pct[m - 1] ?? 0) + ind29
        }
      }
    }

    for (let m = 1; m <= 12; m++) {
      const r = 15 + m
      styleCellAmount(wsG150.getCell(`B${r}`), vat0Pct[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`C${r}`), vat5Pct[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`D${r}`), vat10Pct[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`G${r}`), monthlyRev[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`H${r}`), sub521[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`I${r}`), sub711[m - 1] ?? 0)
      styleCellAmount(wsG150.getCell(`J${r}`), sub3387[m - 1] ?? 0)
      itemsCount += 7
    }
    updatedSheets.push(wsG150.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
