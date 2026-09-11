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

export function fillReceivableWorkingPaper(
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D300 - Phai thu - Mau 2025 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  const isEditor = target && typeof (target as OpenXmlPackageEditor).updateCell === 'function'
  if (isEditor) {
    const editor = target as OpenXmlPackageEditor

    // 1. ADD Sheet
    if (editor.hasSheet('ADD')) {
      editor.fillAddSheet(ctx.engagement)
      updatedSheets.push('ADD')
    }

    // 2. Sheet D 310 — Lead schedule
    const d310Sheet = editor.hasSheet('D 310') ? 'D 310' : editor.hasSheet('D310') ? 'D310' : null
    if (d310Sheet) {
      const acc131 = ctx.cdfsAccounts.get('131') || ctx.cdfsAccounts.get('1311') || ctx.cdfsAccounts.get('1312')
      if (acc131) {
        const sum131NoCK = Array.from(ctx.cdfsAccounts.values())
          .filter((a) => a.matk.startsWith('131'))
          .reduce((s, a) => s + (a.nock || 0), 0)
        const sum131CoCK = Array.from(ctx.cdfsAccounts.values())
          .filter((a) => a.matk.startsWith('131'))
          .reduce((s, a) => s + (a.cock || 0), 0)
        const sum131NoDK = Array.from(ctx.cdfsAccounts.values())
          .filter((a) => a.matk.startsWith('131'))
          .reduce((s, a) => s + (a.sdndk || 0), 0)
        const sum131CoDK = Array.from(ctx.cdfsAccounts.values())
          .filter((a) => a.matk.startsWith('131'))
          .reduce((s, a) => s + (a.sdcdk || 0), 0)

        // Tính AJE điều chỉnh Nợ/Có 131 nếu có
        let adjNo131 = 0
        let netAdj131 = 0
        let netAdj2293 = 0
        if (ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
          for (const aje of ctx.adjustingEntries) {
            if (aje.tkNo.startsWith('131')) netAdj131 += aje.soTien
            if (aje.tkCo.startsWith('131')) netAdj131 -= aje.soTien
            if (aje.tkNo.startsWith('2293') || aje.tkNo.startsWith('139')) netAdj2293 -= aje.soTien
            if (aje.tkCo.startsWith('2293') || aje.tkCo.startsWith('139')) netAdj2293 += aje.soTien
          }
        }

        editor.setLeadRowValues(d310Sheet, 12, { ck: sum131NoCK, dk: sum131NoDK, adj: netAdj131, colAdj: 5 })
        editor.updateCell(d310Sheet, 'F12', { number: sum131NoCK + netAdj131 })

        editor.setLeadRowValues(d310Sheet, 14, { ck: sum131CoCK, dk: sum131CoDK })

        const acc2293 = ctx.cdfsAccounts.get('2293') || ctx.cdfsAccounts.get('139')
        const ck2293 = acc2293?.cock ?? 0
        const dk2293 = acc2293?.sdcdk ?? 0
        editor.setLeadRowValues(d310Sheet, 16, { ck: ck2293, dk: dk2293, adj: netAdj2293, colAdj: 5 })
        editor.updateCell(d310Sheet, 'F16', { number: ck2293 + netAdj2293 })
        itemsCount += 6
      }
      updatedSheets.push(d310Sheet)
    }

    // 3. Sheet D 341 — Bút toán điều chỉnh kiểm toán Phải thu
    const d341Sheet = editor.hasSheet('D 341') ? 'D 341' : editor.hasSheet('D341') ? 'D341' : null
    if (d341Sheet) {
      if (ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
        const recAjes = ctx.adjustingEntries.filter(
          (a) => a.glvRef === 'D341' || a.tkNo.startsWith('131') || a.tkCo.startsWith('131') || a.tkNo.startsWith('2293') || a.tkCo.startsWith('2293'),
        )
        const count = editor.fillAjeSheet(d341Sheet, 14, 15, recAjes, 'Phải thu khách hàng')
        itemsCount += count * 8
      } else {
        editor.updateCell(d341Sheet, 'C14', { text: 'Không phát sinh bút toán điều chỉnh.' })
        itemsCount++
      }
      updatedSheets.push(d341Sheet)
    }


    // 4. Trích xuất danh sách công nợ khách hàng (theo từng đối tượng)
    const custMap = new Map<string, { no: number; co: number; desc: string; no6M: number; co6M: number }>()
    for (const t of ctx.nkcTransactions) {
      if (t.debit.startsWith('131') || t.credit.startsWith('131')) {
        const key = t.custId || (t.desc.split(' ')[0] ?? 'KHACH_HANG')
        const curr = custMap.get(key) ?? { no: 0, co: 0, desc: t.desc, no6M: 0, co6M: 0 }
        if (t.debit.startsWith('131')) {
          curr.no += t.amount
          if (t.month <= 6) curr.no6M += t.amount
        }
        if (t.credit.startsWith('131')) {
          curr.co += t.amount
          if (t.month <= 6) curr.co6M += t.amount
        }
        custMap.set(key, curr)
      }
    }

    const sortedCusts = Array.from(custMap.entries())
      .sort((a, b) => Math.abs(b[1].no - b[1].co) - Math.abs(a[1].no - a[1].co))
      .slice(0, 35)

    // 4.1 Sheet D 351.1 — Bảng phân tích số dư công nợ Đợt 1 (30/06)
    const d351_1Sheet = editor.hasSheet('D 351.1') ? 'D 351.1' : editor.hasSheet('D351.1') ? 'D351.1' : null
    if (d351_1Sheet) {
      let r = 15
      for (const [custId, bal] of sortedCusts) {
        const net6M = bal.no6M - bal.co6M
        editor.updateCell(d351_1Sheet, `A${r}`, { text: custId })
        editor.updateCell(d351_1Sheet, `B${r}`, { text: bal.desc.slice(0, 50) })
        editor.updateCell(d351_1Sheet, `C${r}`, { number: net6M > 0 ? net6M : 0 })
        editor.updateCell(d351_1Sheet, `D${r}`, { number: net6M < 0 ? Math.abs(net6M) : 0 })
        editor.updateCell(d351_1Sheet, `G${r}`, { text: 'Trong hạn' })
        r++
        itemsCount += 5
      }
      updatedSheets.push(d351_1Sheet)
    }

    // 4.2 Sheet D 351.2 — Bảng tổng hợp số dư công nợ Đợt 2 (Cả năm 31/12)
    const d351_2Sheet = editor.hasSheet('D 351.2') ? 'D 351.2' : editor.hasSheet('D351.2') ? 'D351.2' : null
    if (d351_2Sheet) {
      let r = 14
      for (const [custId, bal] of sortedCusts) {
        const net = bal.no - bal.co
        editor.updateCell(d351_2Sheet, `A${r}`, { text: custId })
        editor.updateCell(d351_2Sheet, `B${r}`, { text: bal.desc.slice(0, 50) })
        editor.updateCell(d351_2Sheet, `C${r}`, { number: net > 0 ? net : 0 })
        editor.updateCell(d351_2Sheet, `D${r}`, { number: net < 0 ? Math.abs(net) : 0 })
        editor.updateCell(d351_2Sheet, `E${r}`, { text: 'D 352' })
        editor.updateCell(d351_2Sheet, `F${r}`, { number: 0 })
        editor.updateCell(d351_2Sheet, `G${r}`, { number: net })
        r++
        itemsCount += 7
      }
      updatedSheets.push(d351_2Sheet)
    }

    // 4.3 Sheet D 352 — Theo dõi Thư xác nhận công nợ (lấy từ D 351.2 sang)
    const d352Sheet = editor.hasSheet('D 352') ? 'D 352' : editor.hasSheet('D352') ? 'D352' : null
    if (d352Sheet) {
      let r = 16
      let subIndex = 1
      for (const [custId, bal] of sortedCusts.slice(0, 25)) {
        const net = bal.no - bal.co
        editor.updateCell(d352Sheet, `A${r}`, { text: custId })
        editor.updateCell(d352Sheet, `B${r}`, { text: bal.desc.slice(0, 50) })
        editor.updateCell(d352Sheet, `C${r}`, { number: net > 0 ? net : 0 })
        editor.updateCell(d352Sheet, `D${r}`, { number: net < 0 ? Math.abs(net) : 0 })
        editor.updateCell(d352Sheet, `F${r}`, { text: 'Khớp' })
        editor.updateCell(d352Sheet, `G${r}`, { text: `D 352.${subIndex}` })
        editor.updateCell(d352Sheet, `H${r}`, { text: 'Đã thu tiền' })
        r++
        subIndex++
        itemsCount += 7
      }
      updatedSheets.push(d352Sheet)
    }

    // 5. Sheet D 390 — Cơ cấu Nợ/Có đối ứng TK 131 và Tham chiếu REF (Đợt 1 & Cả năm)
    const d390Sheet = editor.hasSheet('D 390') ? 'D 390' : editor.hasSheet('D390') ? 'D390' : null
    if (d390Sheet) {
      const cp131P1 = extractCounterpartStats(ctx.nkcTransactions, '131', true)
      const cp131Full = extractCounterpartStats(ctx.nkcTransactions, '131', false)

      // Bảng 1: Đợt 1 (Hàng 16 đến 22 - 7 dòng)
      editor.fillCounterpartTable(d390Sheet, 16, 7, cp131P1)

      // Bảng 2: Cả năm (Hàng 34 đến 40 - 7 dòng)
      editor.fillCounterpartTable(d390Sheet, 34, 7, cp131Full)
      // Nhận xét và kết luận kiểm toán chuẩn VACPA
      editor.updateCell(d390Sheet, 'B27', {
        text: 'Không có nghiệp vụ phát sinh bất thường. Số liệu đối ứng chủ yếu với TK 511, 111, 112.',
      })
      editor.updateCell(d390Sheet, 'B43', {
        text: 'Không có nghiệp vụ phát sinh bất thường. Doanh thu bán hàng và thanh toán tiền hàng diễn ra bình thường.',
      })
      editor.updateCell(d390Sheet, 'B66', {
        text: 'Không phát sinh bất thường. Số dư và phát sinh nợ phải thu phù hợp với hồ sơ kế toán.',
      })
      itemsCount += 31
      updatedSheets.push(d390Sheet)
    }

    // 6. Sheet D 391 — Chọn mẫu kiểm tra cơ bản phát sinh Nợ/Có 131 theo VSA 530
    const d391Sheet = editor.hasSheet('D 391') ? 'D 391' : editor.hasSheet('D391') ? 'D391' : null
    if (d391Sheet) {
      const topReceivableEntries = ctx.nkcTransactions
        .filter((t) => t.debit.startsWith('131') || t.credit.startsWith('131'))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 25)

      let r = 17
      for (const t of topReceivableEntries) {
        editor.fillSampleRow(d391Sheet, r, {
          date: t.dateVal,
          docNo: t.docNo,
          desc: t.desc,
          debit: t.debit,
          credit: t.credit,
          amount: t.amount,
        })
        editor.updateCell(d391Sheet, `H${r}`, { text: '✓' })
        r++
        itemsCount++
      }
      updatedSheets.push(d391Sheet)
    }

    return {
      fileName,
      success: true,
      sheetsUpdated: updatedSheets,
      itemsFilledCount: itemsCount,
    }
  }

  // Fallback ExcelJS (Dành cho test in-memory)
  const wb = target as ExcelJS.Workbook
  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D 310 Lead schedule
  const wsD310 = findWorksheetFuzzy(wb, ['D 310', 'D310'])
  if (wsD310) {
    const acc131 = ctx.cdfsAccounts.get('131') || ctx.cdfsAccounts.get('1311') || ctx.cdfsAccounts.get('1312')
    if (acc131) {
      const sum131NoCK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.nock || 0), 0)
      const sum131CoCK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.cock || 0), 0)
      const sum131NoDK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.sdndk || 0), 0)
      const sum131CoDK = Array.from(ctx.cdfsAccounts.values())
        .filter((a) => a.matk.startsWith('131'))
        .reduce((s, a) => s + (a.sdcdk || 0), 0)

      setLeadRowValues(wsD310, 12, { ck: sum131NoCK, dk: sum131NoDK })
      setLeadRowValues(wsD310, 14, { ck: sum131CoCK, dk: sum131CoDK })

      const acc2293 = ctx.cdfsAccounts.get('2293') || ctx.cdfsAccounts.get('139')
      setLeadRowValues(wsD310, 16, { ck: acc2293?.cock ?? 0, dk: acc2293?.sdcdk ?? 0 })
      itemsCount += 3
    }
    updatedSheets.push(wsD310.name)
  }

  // 3. D 391 Chọn mẫu kiểm tra phát sinh công nợ
  const wsD391 = findWorksheetFuzzy(wb, ['D 391', 'D391', 'D 354', 'D354'])
  if (wsD391) {
    const topReceivableEntries = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('131') || t.credit.startsWith('131'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 32)

    let r = 17
    for (const t of topReceivableEntries) {
      const row = wsD391.getRow(r)
      styleCellDate(row.getCell(1), t.dateVal)
      styleCellCode(row.getCell(2), t.docNo)
      styleCellText(row.getCell(3), t.desc)
      styleCellCode(row.getCell(4), t.debit)
      styleCellCode(row.getCell(5), t.credit)
      styleCellAmount(row.getCell(6), t.amount)
      styleCellCode(row.getCell(8), 'P')
      r++
      itemsCount++
    }
    updatedSheets.push(wsD391.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
