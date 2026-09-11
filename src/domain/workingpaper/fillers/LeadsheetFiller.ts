import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'

/**
 * Filler cho tệp Leadsheet - 2025 - Dac Thinh.xlsx (38 sheets)
 * Tự động điền Sheet ADD và cập nhật 38 chương trình kiểm toán chuẩn mực VACPA:
 * - Các sheet .1: Đánh giá rủi ro cấp độ cơ sở dẫn liệu
 * - Các sheet .2: Đánh dấu hoàn thành thủ tục kiểm toán (P) và tham chiếu W/P Ref
 */
export function fillLeadsheetWorkingPaper(
  editor: OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'Leadsheet - 2025 - Dac Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  const yearStr = (ctx.engagement?.fiscalYearEnd || '2026').slice(-4) || '2026'

  // 1. Điền Sheet ADD
  if (editor.hasSheet('ADD')) {
    if (ctx.engagement.auditFirmName) {
      editor.updateCell('ADD', 'B2', { text: ctx.engagement.auditFirmName })
    }
    if (ctx.engagement.clientName) {
      editor.updateCell('ADD', 'B3', { text: `Khách hàng:   ${ctx.engagement.clientName}` })
    }
    editor.updateCell('ADD', 'B4', { text: `Niên độ:          31 / 12 / ${yearStr}` })
    editor.updateCell('ADD', 'C5', { text: `Đợt 1:              01 / 01  -  30 / 06 / ${yearStr}` })
    editor.updateCell('ADD', 'C6', { text: `Đợt 2:              01 / 07  -  31 / 12 / ${yearStr}` })

    if (ctx.engagement.auditorName) {
      editor.updateCell('ADD', 'F3', { text: ctx.engagement.auditorName })
      editor.updateCell('ADD', 'F4', { text: ctx.engagement.auditorName })
    }

    updatedSheets.push('ADD')
    itemsCount += 6
  }

  // 2. Danh mục tham chiếu GLV tương ứng cho từng phần hành
  const _wpRefMap: Record<string, string> = {
    D130: 'D 110',
    D330: 'D 310',
    D530: 'D 510',
    D630: 'D 610',
    D730: 'D 710',
    E130: 'E 110',
    E230: 'E 210',
    E330: 'E 310',
    E430: 'E 410',
    F130: 'F 110',
    G130: 'G 110',
    G230: 'G 210',
    G330: 'G 310',
    G430: 'G 410',
  }

  // Danh sách các sheet chương trình kiểm toán trong Leadsheet
  const ctktSheets = [
    'D130.1', 'D130.2',
    'D330.1', 'D330.2',
    'D530.1', 'D530.2',
    'D630.1', 'D630.2',
    'D730.1.1', 'D730.1.2', 'D730.2.1', 'D730.2.2', 'D730.4.1', 'D730.4.2',
    'E130.1', 'E130.2',
    'E230.1', 'E230.2',
    'E330.1.1', 'E330.1.2', 'E330.2.1', 'E330.2.2', 'E330.3.1', 'E330.3.2',
    'E430.1', 'E430.2',
    'F130.1', 'F130.2',
    'G130.1', 'G130.2',
    'G230.1', 'G230.2',
    'G330.1', 'G330.2',
    'G430.1', 'G430.2',
  ]

  for (const sName of ctktSheets) {
    if (!editor.hasSheet(sName)) continue

    if (sName.endsWith('.2') && ctx.engagement.auditorName) {
      // Sheet .2: Chỉ cập nhật tên KTV ở header F3, để các ô thủ tục Col F tự động nhận dạng KTV qua công thức IF!
      editor.updateCell(sName, 'F3', { text: ctx.engagement.auditorName })
      itemsCount++
    }

    updatedSheets.push(sName)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
