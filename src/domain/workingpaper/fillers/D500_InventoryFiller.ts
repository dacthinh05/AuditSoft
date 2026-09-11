import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
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

function isInternalCostClosingEntry(t: { docNo?: string; desc?: string; debit: string; credit: string }): boolean {
  const doc = String(t.docNo || '').toUpperCase()
  const desc = String(t.desc || '').toLowerCase()
  if (doc.includes('KC') || doc.includes('KCH')) return true
  if (
    desc.includes('kết chuyển') ||
    desc.includes('ket chuyen') ||
    desc.includes('tong gia thanh') ||
    desc.includes('tổng giá thành') ||
    desc.includes('gvhb') ||
    desc.includes('kch')
  ) {
    return true
  }
  if (t.debit.startsWith('154') && t.credit.startsWith('62')) return true
  if (t.debit.startsWith('155') && t.credit.startsWith('154')) return true
  if (t.debit.startsWith('632') && t.credit.startsWith('155') && (doc.includes('KC') || desc.includes('gvhb') || desc.includes('tong'))) return true
  return false
}

export function fillInventoryWorkingPaper(
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D500 - HTK - Mau 2024 - Thinh.xlsx'
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

    // 2. D 510 Lead schedule
    const d510Sheet = editor.hasSheet('D 510') ? 'D 510' : editor.hasSheet('D510') ? 'D510' : null
    if (d510Sheet) {
      const invMap: Record<string, number> = {
        '151': 12,
        '152': 13,
        '153': 14,
        '154': 15,
        '155': 16,
        '156': 17,
        '157': 18,
        '158': 19,
        '2294': 20,
      }

      for (const [prefix, rowNum] of Object.entries(invMap)) {
        const accounts = Array.from(ctx.cdfsAccounts.values()).filter((a) => a.matk.startsWith(prefix))
        const isProvision = prefix === '2294' || prefix === '159'
        const sumCK = accounts.reduce((s, a) => s + (isProvision ? (a.cock || a.nock || 0) : (a.nock || a.cock || 0)), 0)
        const sumDK = accounts.reduce((s, a) => s + (isProvision ? (a.sdcdk || a.sdndk || 0) : (a.sdndk || a.sdcdk || 0)), 0)

        // Tính số điều chỉnh thuần từ danh sách bút toán AJE
        let netAdj = 0
        if (ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
          for (const aje of ctx.adjustingEntries) {
            if (aje.tkNo.startsWith(prefix)) {
              netAdj += isProvision ? -aje.soTien : aje.soTien
            }
            if (aje.tkCo.startsWith(prefix)) {
              netAdj += isProvision ? aje.soTien : -aje.soTien
            }
          }
        }

        const sumAfter = sumCK + netAdj
        editor.setLeadRowValues(d510Sheet, rowNum, {
          ck: sumCK,
          dk: sumDK,
          adj: netAdj,
          colAdj: 5,
        })
        // Cập nhật Cột 6 (F): Số sau kiểm toán
        editor.updateCell(d510Sheet, `F${rowNum}`, { number: sumAfter })
        itemsCount += 3
      }
      updatedSheets.push(d510Sheet)
    }

    // 3. D 595 Cutoff Phiếu nhập kho / xuất kho (Loại trừ 100% bút toán kết chuyển KC)
    const d595Sheet = editor.hasSheet('D 595') ? 'D 595' : editor.hasSheet('D595') ? 'D595' : null
    if (d595Sheet) {
      // 3.1 Bảng 1 (Hàng 18-20): Mẫu 3 nghiệp vụ nhập kho cuối năm thực tế
      const nonClosingInbound = ctx.nkcTransactions.filter((t) => {
        if (isInternalCostClosingEntry(t)) return false
        const isInvDebit = t.debit.startsWith('152') || t.debit.startsWith('153') || t.debit.startsWith('155') || t.debit.startsWith('156')
        const isPurchase = t.credit.startsWith('331') || t.credit.startsWith('111') || t.credit.startsWith('112') || t.credit.startsWith('141')
        const isActualReceipt = isPurchase || (t.debit.startsWith('155') && !isInternalCostClosingEntry(t))
        return isInvDebit && isActualReceipt
      })

      const decInbound = nonClosingInbound
        .filter((t) => t.month === 12)
        .sort((a, b) => {
          const da = String(a.dateVal ?? a.dateStr)
          const db = String(b.dateVal ?? b.dateStr)
          return db.localeCompare(da) || b.amount - a.amount
        })

      const finalInbound = decInbound.length >= 3 ? decInbound.slice(0, 3) : nonClosingInbound.slice(-3).reverse()

      for (let i = 0; i < 3; i++) {
        const r = 18 + i
        const item = finalInbound[i]
        if (item) {
          editor.fillSampleRow(d595Sheet, r, {
            date: item.dateVal,
            docNo: item.docNo,
            desc: item.desc,
            debit: item.debit,
            credit: item.credit,
            amount: item.amount,
          })
          itemsCount++
        }
      }

      // 3.2 Bảng 2 (Hàng 24-26): Mẫu 3 nghiệp vụ xuất kho cuối năm thực tế
      const nonClosingOutbound = ctx.nkcTransactions.filter((t) => {
        if (isInternalCostClosingEntry(t)) return false
        const isInvCredit = t.credit.startsWith('152') || t.credit.startsWith('153') || t.credit.startsWith('155') || t.credit.startsWith('156')
        const isActualIssue = t.debit.startsWith('621') || t.debit.startsWith('627') || t.debit.startsWith('641') || t.debit.startsWith('642') || t.debit.startsWith('632')
        return isInvCredit && isActualIssue
      })

      const decOutbound = nonClosingOutbound
        .filter((t) => t.month === 12)
        .sort((a, b) => {
          const da = String(a.dateVal ?? a.dateStr)
          const db = String(b.dateVal ?? b.dateStr)
          return db.localeCompare(da) || b.amount - a.amount
        })

      const finalOutbound = decOutbound.length >= 3 ? decOutbound.slice(0, 3) : nonClosingOutbound.slice(-3).reverse()

      for (let i = 0; i < 3; i++) {
        const r = 24 + i
        const item = finalOutbound[i]
        if (item) {
          editor.fillSampleRow(d595Sheet, r, {
            date: item.dateVal,
            docNo: item.docNo,
            desc: item.desc,
            debit: item.debit,
            credit: item.credit,
            amount: item.amount,
          })
          itemsCount++
        }
      }

      updatedSheets.push(d595Sheet)
    }

    // 4. D 553 Đối chiếu giá trị ghi sổ mua hàng với nhập kho trên bảng XNT (12 tháng)
    const d553Sheet = editor.hasSheet('D553') ? 'D553' : editor.hasSheet('D 553') ? 'D 553' : null
    if (d553Sheet) {
      const no152 = new Array(12).fill(0)
      const co152 = new Array(12).fill(0)
      const no155 = new Array(12).fill(0)
      const co155 = new Array(12).fill(0)

      for (const t of ctx.nkcTransactions) {
        if (!t.month || t.month < 1 || t.month > 12) continue
        const mIdx = t.month - 1
        if (t.debit.startsWith('152')) no152[mIdx] += t.amount
        if (t.credit.startsWith('152')) co152[mIdx] += t.amount
        if (t.debit.startsWith('155')) no155[mIdx] += t.amount
        if (t.credit.startsWith('155')) co155[mIdx] += t.amount
      }

      // Điền Bảng 1 (NVL 152) - Hàng 17 đến 28, Cột K (11) và L (12)
      for (let m = 0; m < 12; m++) {
        const r = 17 + m
        editor.updateCell(d553Sheet, `K${r}`, { number: no152[m] ?? 0 })
        editor.updateCell(d553Sheet, `L${r}`, { number: co152[m] ?? 0 })
      }

      // Điền Bảng 2 (Thành phẩm 155) - Hàng 35 đến 46, Cột K (11) và L (12)
      for (let m = 0; m < 12; m++) {
        const r = 35 + m
        editor.updateCell(d553Sheet, `K${r}`, { number: no155[m] ?? 0 })
        editor.updateCell(d553Sheet, `L${r}`, { number: co155[m] ?? 0 })
      }

      updatedSheets.push(d553Sheet)
      itemsCount += 48
    }

    // 5. D 541 Bút toán điều chỉnh kiểm toán Hàng tồn kho
    const d541Sheet = editor.hasSheet('D541') ? 'D541' : editor.hasSheet('D 541') ? 'D 541' : null
    if (d541Sheet && ctx.adjustingEntries && ctx.adjustingEntries.length > 0) {
      const invAjes = ctx.adjustingEntries.filter(
        (a) =>
          a.glvRef === 'D541' ||
          a.tkNo.startsWith('15') ||
          a.tkCo.startsWith('15') ||
          a.tkNo.startsWith('2294') ||
          a.tkCo.startsWith('2294') ||
          a.tkNo.startsWith('159') ||
          a.tkCo.startsWith('159'),
      ).slice(0, 8)

      for (let i = 0; i < invAjes.length; i++) {
        const aje = invAjes[i]
        if (!aje) continue
        const r = 14 + i
        const isDebit15 = aje.tkNo.startsWith('15')
        const impactVal = isDebit15 ? aje.soTien : -aje.soTien

        editor.updateCell(d541Sheet, `A${r}`, { text: String(i + 1) })
        editor.updateCell(d541Sheet, `B${r}`, { text: aje.glvRef || `D541.${i + 1}` })
        editor.updateCell(d541Sheet, `C${r}`, { text: aje.noiDung })
        editor.updateCell(d541Sheet, `D${r}`, { text: aje.tkNo })
        editor.updateCell(d541Sheet, `E${r}`, { text: aje.tkCo })
        editor.updateCell(d541Sheet, `F${r}`, { number: aje.soTien })
        editor.updateCell(d541Sheet, `G${r}`, { text: 'Hàng tồn kho' })
        editor.updateCell(d541Sheet, `H${r}`, { number: impactVal })
        itemsCount += 8
      }
      updatedSheets.push(d541Sheet)
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
  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
