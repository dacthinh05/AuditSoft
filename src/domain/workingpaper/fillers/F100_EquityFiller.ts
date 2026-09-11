import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import {
  fillAddSheet,
  findWorksheetFuzzy,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
} from '../helpers'

export function fillEquityWorkingPaper(
  target: ExcelJS.Workbook | OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'F100 - Von - Mau 2024 - Thinh.xlsx'
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

    // 2. F110 Lead schedule
    const f110Sheet = editor.hasSheet('F110') ? 'F110' : editor.hasSheet('F 110') ? 'F 110' : null
    if (f110Sheet) {
      const acc4111 = ctx.cdfsAccounts.get('4111') || ctx.cdfsAccounts.get('411')
      editor.setLeadRowValues(f110Sheet, 11, {
        ck: acc4111?.cock || acc4111?.nock || 0,
        dk: acc4111?.sdcdk || acc4111?.sdndk || 0,
        colDk: 8,
      })
      itemsCount++

      const acc4211 = ctx.cdfsAccounts.get('4211')
      const ck4211 = acc4211?.cock ? acc4211.cock : -(acc4211?.nock ?? 0)
      const dk4211 = acc4211?.sdcdk ? acc4211.sdcdk : -(acc4211?.sdndk ?? 0)
      editor.setLeadRowValues(f110Sheet, 13, { ck: ck4211, dk: dk4211, colDk: 8 })
      itemsCount++

      const acc4212 = ctx.cdfsAccounts.get('4212')
      const ck4212 = acc4212?.cock ? acc4212.cock : -(acc4212?.nock ?? 0)
      const dk4212 = acc4212?.sdcdk ? acc4212.sdcdk : -(acc4212?.sdndk ?? 0)
      editor.setLeadRowValues(f110Sheet, 14, { ck: ck4212, dk: dk4212, colDk: 8 })
      itemsCount++

      updatedSheets.push(f110Sheet)
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

  // 2. F110 Lead schedule
  const wsF110 = findWorksheetFuzzy(wb, ['F110', 'F 110'])
  if (wsF110) {
    // 4111 Vốn đầu tư của CSH (Row 11) - in F110, Col 4 is ck, Col 6 is aje, Col 7 is sau, Col 8 is dk
    const acc4111 = ctx.cdfsAccounts.get('4111') || ctx.cdfsAccounts.get('411')
    setLeadRowValues(wsF110, 11, {
      ck: acc4111?.cock || acc4111?.nock || 0,
      dk: acc4111?.sdcdk || acc4111?.sdndk || 0,
      colAje: 6,
      colSau: 7,
      colDk: 8,
    })
    itemsCount++

    // 4211 Lợi nhuận năm trước (Row 13)
    const acc4211 = ctx.cdfsAccounts.get('4211')
    const ck4211 = acc4211?.cock ? acc4211.cock : -(acc4211?.nock ?? 0)
    const dk4211 = acc4211?.sdcdk ? acc4211.sdcdk : -(acc4211?.sdndk ?? 0)
    setLeadRowValues(wsF110, 13, { ck: ck4211, dk: dk4211, colAje: 6, colSau: 7, colDk: 8 })
    itemsCount++

    // 4212 Lợi nhuận năm nay (Row 14)
    const acc4212 = ctx.cdfsAccounts.get('4212')
    const ck4212 = acc4212?.cock ? acc4212.cock : -(acc4212?.nock ?? 0)
    const dk4212 = acc4212?.sdcdk ? acc4212.sdcdk : -(acc4212?.sdndk ?? 0)
    setLeadRowValues(wsF110, 14, { ck: ck4212, dk: dk4212, colAje: 6, colSau: 7, colDk: 8 })
    itemsCount++

    updatedSheets.push(wsF110.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
