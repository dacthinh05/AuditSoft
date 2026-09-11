import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'

/**
 * Filler cho tệp D200 - Dau tu - ABC 2020.xlsx
 * Tự động điền Lead schedule các khoản đầu tư tài chính và doanh thu tài chính phát sinh.
 */
export function fillInvestmentWorkingPaper(
  editor: OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'D200 - Dau tu - ABC 2020.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  // 1. ADD
  if (editor.hasSheet('ADD')) {
    editor.fillAddSheet(ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. D210 Lead schedule
  const d210Sheet = editor.hasSheet('D210') ? 'D210' : editor.hasSheet('D 210') ? 'D 210' : null
  if (d210Sheet) {
    const invMap: Record<string, number> = {
      '121': 12,
      '1281': 13,
      '1288': 14,
      '221': 17,
      '222': 18,
      '228': 19,
      '2291': 21,
    }

    for (const [prefix, rowNum] of Object.entries(invMap)) {
      const isProvision = prefix === '2291'
      let sumCK = 0
      let sumDK = 0

      for (const [code, a] of ctx.cdfsAccounts.entries()) {
        if (code.startsWith(prefix)) {
          sumCK += isProvision ? (a.cock || a.nock || 0) : (a.nock || a.cock || 0)
          sumDK += isProvision ? (a.sdcdk || a.sdndk || 0) : (a.sdndk || a.sdcdk || 0)
        }
      }

      editor.setLeadRowValues(d210Sheet, rowNum, { ck: sumCK, dk: sumDK })
      itemsCount++
    }

    updatedSheets.push(d210Sheet)
  }

  // 3. D290 Kiểm tra doanh thu tài chính từ đầu tư (TK 515)
  const d290Sheet = editor.hasSheet('D290') ? 'D290' : editor.hasSheet('D 290') ? 'D 290' : null
  if (d290Sheet) {
    const finIncomeEntries = ctx.nkcTransactions
      .filter((t) => t.credit.startsWith('515'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15)

    let r = 16
    for (const item of finIncomeEntries) {
      editor.fillSampleRow(d290Sheet, r, {
        date: item.dateVal,
        docNo: item.docNo,
        desc: item.desc,
        amount: item.amount,
        debit: item.debit,
        credit: item.credit,
      })
      r++
      itemsCount++
    }
    updatedSheets.push(d290Sheet)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
