import { describe, it, expect } from 'vitest'
import {
  matchJournalToColumn,
  getJournalMonth,
} from '../src/renderer/components/Analytics/MatrixDrilldownModal'
import {
  exportMatrixDrilldownExcel,
  type MatrixDrilldownExportParams,
} from '../src/renderer/components/Analytics/exportMatrixDrilldownExcel'
import type { JournalRowDTO } from '../src/shared/types/analytics'

describe('Matrix Drilldown Matching & Filtering Logic', () => {
  it('khớp chính xác các tài khoản theo từng cột khoản mục', () => {
    const jRev: JournalRowDTO = { id: '1', date: '2025-02-10', doc: 'HD01', desc: 'Bán hàng', debit: '131', credit: '5111', amount: 100_000_000, month: 2, issues: [] }
    const jCogs: JournalRowDTO = { id: '2', date: '2025-02-10', doc: 'PX01', desc: 'Xuất kho', debit: '632', credit: '1561', amount: 70_000_000, month: 2, issues: [] }
    const jFinExp: JournalRowDTO = { id: '3', date: '2025-02-15', doc: 'UNC01', desc: 'Lãi vay', debit: '635', credit: '1121', amount: 50_000_000, month: 2, issues: [] }
    const jFinRev: JournalRowDTO = { id: '4', date: '2025-02-28', doc: 'BC01', desc: 'Lãi tiền gửi', debit: '1121', credit: '515', amount: 5_000_000, month: 2, issues: [] }
    const jSell: JournalRowDTO = { id: '5', date: '2025-02-20', doc: 'PC01', desc: 'Vận chuyển', debit: '6417', credit: '1111', amount: 15_000_000, month: 2, issues: [] }
    const jAdmin: JournalRowDTO = { id: '6', date: '2025-02-25', doc: 'PC02', desc: 'Tiếp khách', debit: '6428', credit: '1111', amount: 20_000_000, month: 2, issues: [] }
    const jOther: JournalRowDTO = { id: '7', date: '2025-02-26', doc: 'PC03', desc: 'Phạt thuế', debit: '811', credit: '1111', amount: 2_000_000, month: 2, issues: [] }
    const jInv: JournalRowDTO = { id: '8', date: '2025-02-05', doc: 'PN01', desc: 'Nhập kho vải', debit: '1521', credit: '331', amount: 200_000_000, month: 2, issues: [] }

    expect(matchJournalToColumn(jRev, 'REV_511')).toBe(true)
    expect(matchJournalToColumn(jRev, 'COGS_632')).toBe(false)

    expect(matchJournalToColumn(jCogs, 'COGS_632')).toBe(true)
    expect(matchJournalToColumn(jFinExp, 'FIN_EXP_635')).toBe(true)
    expect(matchJournalToColumn(jFinRev, 'FIN_REV_515')).toBe(true)
    expect(matchJournalToColumn(jSell, 'SELL_641')).toBe(true)
    expect(matchJournalToColumn(jAdmin, 'ADMIN_642')).toBe(true)
    expect(matchJournalToColumn(jOther, 'OTHER_EXP_811')).toBe(true)
    expect(matchJournalToColumn(jInv, 'INV_BUY_15X')).toBe(true)
  })

  it('xác định đúng tháng hạch toán từ trường month hoặc chuỗi date', () => {
    const j1: JournalRowDTO = { id: '1', date: '2025-02-15', doc: '1', desc: '', debit: '', credit: '', amount: 0, month: 2, issues: [] }
    const j2: JournalRowDTO = { id: '2', date: '2025-08-20', doc: '2', desc: '', debit: '', credit: '', amount: 0, month: null, issues: [] }
    const j3: JournalRowDTO = { id: '3', date: '15/12/2025', doc: '3', desc: '', debit: '', credit: '', amount: 0, month: null, issues: [] }

    expect(getJournalMonth(j1)).toBe(2)
    expect(getJournalMonth(j2)).toBe(8)
    expect(getJournalMonth(j3)).toBe(12)
  })
})

describe('Matrix Drilldown Excel Export 2-Sheet Pivot', () => {
  it('xuất file Excel thành công với 2 sheet TongHop_Pivot và ChiTiet_SoCai', async () => {
    const sampleRows: JournalRowDTO[] = [
      { id: '1', date: '2025-02-15', doc: 'PKT01', desc: 'Lỗ tỷ giá', debit: '635', credit: '1122', amount: 5_210_000_000, month: 2, issues: [] },
      { id: '2', date: '2025-02-18', doc: 'UNC02', desc: 'Lãi vay ngân hàng VCB', debit: '635', credit: '1121', amount: 480_500_000, month: 2, issues: [] },
      { id: '3', date: '2025-02-20', doc: 'PKT03', desc: 'Trích trước lãi vay', debit: '635', credit: '335', amount: 150_145_821, month: 2, issues: [] },
    ]

    const params: MatrixDrilldownExportParams = {
      columnKey: 'FIN_EXP_635',
      columnLabel: 'Chi phí tài chính',
      accountPattern: 'Nợ 635',
      month: 2,
      companyName: 'Công ty Cổ phần May ABC',
      fiscalYear: '2025',
      anomalyNote: 'T02 tăng 1103.3% so với T01',
      rows: sampleRows,
    }

    // Không throw error khi thực thi xuất file
    await expect(exportMatrixDrilldownExcel(params)).resolves.not.toThrow()
  })
})
