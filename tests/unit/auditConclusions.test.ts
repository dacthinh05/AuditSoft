import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import {
  AuditConclusionTemplates,
  insertAuditConclusion,
  insertTickmarksLegend,
  VACPA_TICKMARKS,
} from '../../src/domain/workingpaper/conclusionEngine'
import {
  styleTotalDoubleUnderline,
  styleAjeAdjustmentCell,
} from '../../src/domain/workingpaper/helpers'

describe('VACPA Audit Conclusions & Visual Styles Unit Tests', () => {
  it('sinh câu kết luận Lead Schedule đúng chuẩn 3 phần', () => {
    const textNoAdj = AuditConclusionTemplates.leadSchedule('Tiền và tương đương tiền')
    expect(textNoAdj).toContain('KẾT LUẬN:')
    expect(textNoAdj).toContain('Chương trình kiểm toán phần hành')
    expect(textNoAdj).toContain('trung thực và hợp lý trên các khía cạnh trọng yếu')

    const textWithAdj = AuditConclusionTemplates.leadSchedule('Phải thu khách hàng', true, 'AJE 01')
    expect(textWithAdj).toContain('ngoại trừ các bút toán điều chỉnh kiểm toán (AJE 01)')
    expect(textWithAdj).toContain('B360/B410')
  })

  it('sinh câu kết luận kiểm tra mẫu VSA 530 và Cut-off 31/12', () => {
    const sampleText = AuditConclusionTemplates.sampleTesting('Hàng tồn kho', 15)
    expect(sampleText).toContain('KẾT LUẬN CHỌN MẪU: Đã kiểm tra chọn mẫu 15 chứng từ')
    expect(sampleText).toContain('VSA 530')

    const cutoffText = AuditConclusionTemplates.cutoffTesting('Tiền gửi ngân hàng')
    expect(cutoffText).toContain('KẾT LUẬN CUT-OFF:')
    expect(cutoffText).toContain('ngày khóa sổ 31/12')
  })

  it('chèn Khối Chú Giải Tickmarks vào worksheet ExcelJS thành công', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('TestTickmarks')
    const nextRow = insertTickmarksLegend(ws, 10, 1)

    expect(nextRow).toBe(10 + 1 + VACPA_TICKMARKS.length)
    expect(ws.getCell('A10').value).toContain('Chú thích ký hiệu kiểm toán (Tickmarks):')
    expect(ws.getCell('A11').value).toBe('^')
    expect(ws.getCell('B11').value).toContain('Footing')
  })

  it('chèn Khối Kết Luận Kiểm Toán vào worksheet ExcelJS với màu nền chuẩn #E2EFDA', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('TestConclusion')
    const conclusion = AuditConclusionTemplates.leadSchedule('Chi phí bán hàng')
    const nextRow = insertAuditConclusion(ws, 20, conclusion, 7, 'Nguyễn Văn A', '15/01/2026')

    expect(nextRow).toBe(23)
    const cellA20 = ws.getCell('A20')
    expect(cellA20.value).toBe(conclusion)
    expect(cellA20.fill).toBeDefined()
    expect((cellA20.fill as ExcelJS.PatternFill).fgColor?.argb).toBe('FFE2EFDA')

    const signCell = ws.getCell('E22')
    expect(signCell.value).toContain('Nguyễn Văn A')
  })

  it('áp dụng style dòng tổng cộng gạch chân đôi và ô AJE điều chỉnh', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('TestStyles')
    const rowTotal = ws.getRow(5)
    styleTotalDoubleUnderline(rowTotal, 1, 5)

    expect(rowTotal.getCell(1).border?.bottom?.style).toBe('double')
    expect(rowTotal.getCell(1).border?.top?.style).toBe('thin')

    const ajeCell = ws.getCell('C8')
    styleAjeAdjustmentCell(ajeCell, 15000000)
    expect(ajeCell.value).toBe(15000000)
    expect((ajeCell.fill as ExcelJS.PatternFill).fgColor?.argb).toBe('FFFFF2CC')
  })
})
