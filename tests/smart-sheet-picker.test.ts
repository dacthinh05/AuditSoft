import { describe, expect, it } from 'vitest'
import { pickBestNkcSheet } from '../src/renderer/state/slices/reconcileSlice'
import type { WorkbookSheetMeta } from '../src/shared/ipc'

function mockSheet(name: string, totalRows: number, confidence: number): WorkbookSheetMeta {
  return {
    name,
    totalRows,
    confidence,
    suggestedHeaderRow: 1,
    headerLabels: ['Ngay', 'SoCT', 'DienGiai', 'TKNo', 'TKCo', 'SoTien'],
    previewRows: [],
    suggestedMapping: {
      date: 0,
      voucher: 1,
      description: 2,
      debit: 3,
      credit: 4,
      amount: 5,
    },
  }
}

describe('pickBestNkcSheet — Nhận diện thông minh sheet Sổ Nhật ký chung', () => {
  it('ưu tiên chọn sheet có tên bắt đầu bằng NKC thay vì sheet Bìa / Hướng dẫn', () => {
    const sheets: WorkbookSheetMeta[] = [
      mockSheet('Bia', 3, 10),
      mockSheet('HuongDan', 12, 5),
      mockSheet('NKC_2025', 15000, 95),
      mockSheet('CDPS', 120, 40),
    ]

    const selected = pickBestNkcSheet(sheets)
    expect(selected?.name).toBe('NKC_2025')
  })

  it('ưu tiên chọn sheet có tên chứa NhatKyChung hoặc SO_NKC hoặc GL', () => {
    const sheets: WorkbookSheetMeta[] = [
      mockSheet('ThongTinDoanhNghiep', 5, 0),
      mockSheet('So_NhatKyChung_TongHop', 8500, 85),
      mockSheet('BaoCaoTaiChinh', 50, 20),
    ]

    const selected = pickBestNkcSheet(sheets)
    expect(selected?.name).toBe('So_NhatKyChung_TongHop')
  })

  it('khi tên sheet không chứa từ khóa NKC, chọn sheet có độ tin cậy confidence TT200 cao nhất', () => {
    const sheets: WorkbookSheetMeta[] = [
      mockSheet('Sheet1', 4, 15),
      mockSheet('Data_Raw', 6200, 92),
      mockSheet('TongHop', 200, 60),
    ]

    const selected = pickBestNkcSheet(sheets)
    expect(selected?.name).toBe('Data_Raw')
  })

  it('bỏ qua sheet rỗng (0 dòng) và chọn sheet có nhiều dữ liệu nhất', () => {
    const sheets: WorkbookSheetMeta[] = [
      mockSheet('NKC_Empty', 0, 0),
      mockSheet('DuLieuPhatSinh', 5400, 50),
      mockSheet('ThamChieu', 10, 10),
    ]

    const selected = pickBestNkcSheet(sheets)
    expect(selected?.name).toBe('DuLieuPhatSinh')
  })

  it('trả về sheet duy nhất nếu file chỉ có 1 sheet', () => {
    const sheets: WorkbookSheetMeta[] = [mockSheet('SheetChinh', 1200, 80)]
    const selected = pickBestNkcSheet(sheets)
    expect(selected?.name).toBe('SheetChinh')
  })

  it('trả về undefined nếu danh sách sheet rỗng', () => {
    expect(pickBestNkcSheet([])).toBeUndefined()
  })
})
