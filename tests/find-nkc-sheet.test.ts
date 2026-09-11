import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { findNkcSheet } from '../src/domain/workingpaper/WorkingPaperGenerator'

describe('findNkcSheet — tìm sheet NKC linh hoạt theo biến thể tên', () => {
  it('nhận đúng sheet NKC_TrcDC kể cả khi có sheet khác đứng đầu', () => {
    const wb = new ExcelJS.Workbook()
    const wsIntro = wb.addWorksheet('Trang bìa')
    wb.addWorksheet('NKC_TrcDC')
    const wsOther = wb.addWorksheet('Bảng kê')

    expect(wsIntro.name).toBe('Trang bìa')
    expect(wsOther.name).toBe('Bảng kê')
    const found = findNkcSheet(wb)
    expect(found?.name).toBe('NKC_TrcDC')
  })

  it('nhận các biến thể: NKC, NKC SAU DC, NKC-2025, NhatKyChung, GL', () => {
    const variants = [
      'NKC',
      'NKC SAU DC',
      'NKC_SauDC',
      'NKC-2025',
      'nkc_trc_dc',
      'Nhật Ký Chung',
      'Nhat_Ky_Chung',
      'GL',
    ]

    for (const name of variants) {
      const wb = new ExcelJS.Workbook()
      wb.addWorksheet('HuongDan')
      wb.addWorksheet(name)
      const found = findNkcSheet(wb)
      expect(found?.name).toBe(name)
    }
  })

  it('fallback về sheet đầu tiên nếu không có sheet nào khớp tên NKC', () => {
    const wb = new ExcelJS.Workbook()
    const ws1 = wb.addWorksheet('Sheet1')
    wb.addWorksheet('Sheet2')
    const found = findNkcSheet(wb)
    expect(found?.name).toBe('Sheet1')
    expect(ws1.name).toBe('Sheet1')
  })
})
