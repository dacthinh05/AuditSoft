import type ExcelJS from 'exceljs'
import type { OpenXmlPackageEditor } from './openxml/OpenXmlPackageEditor'

/**
 * Các mẫu câu kết luận kiểm toán chuẩn mực theo Hồ sơ kiểm toán mẫu VACPA
 * Đảm bảo đủ 3 yếu tố: [Thủ tục đã làm] + [Kết quả phát hiện] + [Ý kiến khẳng định trên BCTC]
 */
export const AuditConclusionTemplates = {
  /**
   * Kết luận Lead Schedule tổng hợp (*10)
   */
  leadSchedule: (sectionName: string, hasAdjustments = false, ajeNote?: string): string => {
    if (hasAdjustments && ajeNote) {
      return (
        `KẾT LUẬN: Trên cơ sở các thủ tục kiểm toán đã thực hiện theo Chương trình kiểm toán phần hành ` +
        `(bao gồm thủ tục phân tích, kiểm tra chi tiết, đối chiếu chứng từ và xác nhận từ bên thứ ba), ` +
        `chúng tôi nhận thấy số dư khoản mục "${sectionName}" tại ngày 31/12 trên Báo cáo tài chính đã được phản ánh ` +
        `trung thực và hợp lý trên các khía cạnh trọng yếu, ngoại trừ các bút toán điều chỉnh kiểm toán (${ajeNote}) ` +
        `đã được tổng hợp tại Bảng tổng hợp bút toán điều chỉnh B360/B410.`
      )
    }
    return (
      `KẾT LUẬN: Trên cơ sở các thủ tục kiểm toán đã thực hiện theo Chương trình kiểm toán phần hành ` +
      `(bao gồm thủ tục phân tích VSA 520, kiểm tra chi tiết, đối chiếu chứng từ và thư xác nhận bên thứ ba), ` +
      `chúng tôi nhận thấy số dư khoản mục "${sectionName}" tại ngày 31/12 trên Báo cáo tài chính đã được phản ánh ` +
      `trung thực và hợp lý trên các khía cạnh trọng yếu, phù hợp với Chuẩn mực và Chế độ Kế toán Doanh nghiệp Việt Nam.`
    )
  },

  /**
   * Kết luận bảng kiểm tra chọn mẫu phát sinh VSA 530 (*91)
   */
  sampleTesting: (sectionName: string, sampleCount: number, errorCount = 0): string => {
    if (errorCount > 0) {
      return (
        `KẾT LUẬN CHỌN MẪU: Đã kiểm tra chọn mẫu ${sampleCount} chứng từ phát sinh trọng yếu và ngẫu nhiên đại diện theo chuẩn mực VSA 530. ` +
        `Phát hiện ${errorCount} trường hợp có chênh lệch/thiếu sót chứng từ đã được nêu chi tiết ở trên và phản ánh vào bảng sai sót B410. ` +
        `Các mẫu còn lại đều có đầy đủ hóa đơn GTGT, phiếu chi/UNC, hợp đồng kinh tế và phê duyệt hợp lệ.`
      )
    }
    return (
      `KẾT LUẬN CHỌN MẪU: Đã kiểm tra chọn mẫu ${sampleCount} chứng từ phát sinh trọng yếu và ngẫu nhiên đại diện theo chuẩn mực VSA 530. ` +
      `Toàn bộ các nghiệp vụ được chọn đều có đầy đủ hóa đơn GTGT hợp lệ, chứng từ thanh toán ngân hàng/phiếu chi, ` +
      `hợp đồng kinh tế và sự phê duyệt của cấp có thẩm quyền. Không phát hiện hành vi gian lận hoặc sai sót vượt mức CTT.`
    )
  },

  /**
   * Kết luận kiểm tra Cut-off khóa sổ trước và sau 31/12 (*95, *96)
   */
  cutoffTesting: (sectionName: string): string => {
    return (
      `KẾT LUẬN CUT-OFF: Đã thực hiện kiểm tra tính đúng kỳ (Cut-off) đối với các nghiệp vụ phát sinh trước và sau ngày khóa sổ 31/12 ` +
      `(đối chiếu ngày lập hóa đơn, ngày biên bản bàn giao/nghiệm thu và ngày ghi sổ kế toán). ` +
      `Các nghiệp vụ được ghi nhận đúng niên độ tài chính, không phát hiện việc ghi nhận khống hoặc dịch chuyển niên độ đối với khoản mục "${sectionName}".`
    )
  },

  /**
   * Kết luận Thư xác nhận / Đối chiếu bên thứ ba (*41, *52)
   */
  confirmation: (sectionName: string, sentCount: number, replyCount: number): string => {
    return (
      `KẾT LUẬN XÁC NHẬN: Đã thực hiện chọn mẫu gửi thư xác nhận đối với ${sentCount} đối tượng trọng yếu. ` +
      `Số lượng thư thu hồi đạt ${replyCount}/${sentCount} đối tượng. Đối với các thư chưa nhận được phản hồi, ` +
      `KTV đã thực hiện thủ tục kiểm toán thay thế (kiểm tra chứng từ thu/chi tiền sau ngày 31/12, hóa đơn, biên bản giao nhận). ` +
      `Kết quả số dư xác nhận và thủ tục thay thế hoàn toàn phù hợp với sổ kế toán.`
    )
  },
}

/**
 * Danh mục ký hiệu kiểm toán (Tickmarks) chuẩn VACPA
 */
export const VACPA_TICKMARKS = [
  { symbol: '^', desc: 'Đã kiểm tra số cộng số học dọc và ngang (Footing & Cross-footing khớp đúng).' },
  { symbol: '✓', desc: 'Đã kiểm tra, đối chiếu với chứng từ gốc hợp lệ (Vouching to source documents).' },
  { symbol: 'GL', desc: 'Đã khớp đúng với Sổ Cái kế toán (Agreed to General Ledger).' },
  { symbol: 'TB', desc: 'Đã khớp đúng Bảng Cân Đối Số Phát Sinh (Agreed to Trial Balance).' },
]

/**
 * Chèn Khối Chú Giải Ký Hiệu Kiểm Toán (Tickmarks Legend) vào Worksheet (ExcelJS)
 */
export function insertTickmarksLegend(
  ws: ExcelJS.Worksheet,
  startRow: number,
  startCol = 1,
): number {
  const headerRow = ws.getRow(startRow)
  const headerCell = headerRow.getCell(startCol)
  headerCell.value = 'Chú thích ký hiệu kiểm toán (Tickmarks):'
  headerCell.font = { bold: true, italic: true, size: 10, color: { argb: 'FF1F4E79' } }

  VACPA_TICKMARKS.forEach((tm, idx) => {
    const row = ws.getRow(startRow + 1 + idx)
    const symCell = row.getCell(startCol)
    symCell.value = tm.symbol
    symCell.font = { bold: true, size: 10, color: { argb: 'FFC00000' } }
    symCell.alignment = { horizontal: 'center' }

    const descCell = row.getCell(startCol + 1)
    descCell.value = tm.desc
    descCell.font = { italic: true, size: 9.5, color: { argb: 'FF333333' } }
  })

  return startRow + 1 + VACPA_TICKMARKS.length
}

/**
 * Chèn Khối KẾT LUẬN KIỂM TOÁN (Audit Conclusion Box) chuẩn mực vào Worksheet (ExcelJS)
 */
export function insertAuditConclusion(
  ws: ExcelJS.Worksheet,
  startRow: number,
  conclusionText: string,
  endCol = 7,
  auditorName?: string,
  auditDate?: string,
): number {
  const row = ws.getRow(startRow)
  row.getCell(1).value = conclusionText
  row.getCell(1).font = { bold: true, italic: true, size: 10, color: { argb: 'FF1E4620' } }
  row.getCell(1).alignment = { wrapText: true, vertical: 'middle' }

  // Merge dải cột cho câu kết luận
  try {
    ws.mergeCells(startRow, 1, startRow + 1, endCol)
  } catch {
    // ignore if already merged
  }

  // Tô nền xanh lá nhạt sang trọng (#E2EFDA)
  for (let r = startRow; r <= startRow + 1; r++) {
    const currRow = ws.getRow(r)
    currRow.height = 24
    for (let c = 1; c <= endCol; c++) {
      const cell = currRow.getCell(c)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFA9D08E' } },
        bottom: { style: 'thin', color: { argb: 'FFA9D08E' } },
        left: c === 1 ? { style: 'thin', color: { argb: 'FFA9D08E' } } : undefined,
        right: c === endCol ? { style: 'thin', color: { argb: 'FFA9D08E' } } : undefined,
      }
    }
  }

  // Chèn thông tin Người thực hiện & Ngày ký dưới góc phải khối kết luận
  if (auditorName || auditDate) {
    const signRow = ws.getRow(startRow + 2)
    const signText = `KTV thực hiện: ${auditorName ?? 'KTV'}  |  Ngày lập: ${auditDate ?? '31/12'}`
    const signCell = signRow.getCell(endCol - 2)
    signCell.value = signText
    signCell.font = { italic: true, size: 9, color: { argb: 'FF595959' } }
    signCell.alignment = { horizontal: 'right' }
    try {
      ws.mergeCells(startRow + 2, endCol - 2, startRow + 2, endCol)
    } catch {
      // ignore
    }
    return startRow + 3
  }

  return startRow + 2
}

/**
 * Hỗ trợ chèn kết luận và tickmarks qua OpenXmlPackageEditor
 */
export function insertAuditConclusionOpenXml(
  editor: OpenXmlPackageEditor,
  sheetName: string,
  startRow: number,
  conclusionText: string,
  col = 'A',
): void {
  editor.updateCell(sheetName, `${col}${startRow}`, { text: conclusionText })
}
