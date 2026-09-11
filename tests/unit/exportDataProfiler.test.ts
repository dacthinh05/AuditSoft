import { describe, it, expect } from 'vitest'
import { buildProfilerWorkbook } from '../../src/infrastructure/excel/exportDataProfiler'
import { buildReportWorkbook } from '../../src/infrastructure/excel/exportWorkbook'
import { profileDiffRows } from '../../src/domain/profiling/dataProfiler'
import type { DiffRow, ReconcileResult } from '../../src/domain/types'

describe('Export Data Profiler Excel Unit Tests', () => {
  const mockDiffRows: DiffRow[] = [
    {
      id: 'row-1',
      stt: 1,
      source: 'TEST',
      kind: 'ADDED_AFTER',
      voucher: 'PC001',
      description: 'Chi phí mua hàng ngày 31/12',
      debit: '156',
      credit: '111',
      amountAfter: '1500000000',
      amountBefore: '0',
      difference: '1500000000',
      dateISO: '2024-12-31',
      loiNgay: false,
      note: 'Bút toán mới',
    },
    {
      id: 'row-2',
      stt: 2,
      source: 'TEST',
      kind: 'CHANGED_AFTER',
      voucher: 'BN002',
      description: 'Thanh toán tiền hàng tròn số',
      debit: '331',
      credit: '112',
      amountAfter: '5000000000',
      amountBefore: '4000000000',
      difference: '1000000000',
      dateISO: '2024-09-15',
      loiNgay: false,
      note: 'Đổi số tiền',
    },
  ]

  const summary = profileDiffRows(mockDiffRows)

  it('buildProfilerWorkbook sinh ra 2 worksheet hợp lệ khi có filteredRows', () => {
    const wb = buildProfilerWorkbook(summary, mockDiffRows, 'Khóa sổ 31/12')
    expect(wb.worksheets.length).toBe(2)

    const ws1 = wb.getWorksheet('Tong hop Phan tich & Cutoff')
    expect(ws1).toBeDefined()
    expect(ws1?.getCell('A1').value).toContain('BÁO CÁO TRỰC QUAN HÓA DỮ LIỆU & PHÂN TÍCH RỦI RO KHÓA SỔ')

    const ws2 = wb.getWorksheet('Chi tiet chung tu loc')
    expect(ws2).toBeDefined()
    expect(ws2?.getCell('A1').value).toContain('KHÓA SỔ 31/12')
  })

  it('buildProfilerWorkbook sinh ra 1 worksheet khi không truyền filteredRows', () => {
    const wb = buildProfilerWorkbook(summary)
    expect(wb.worksheets.length).toBe(1)
    expect(wb.worksheets[0]?.name).toBe('Tong hop Phan tich & Cutoff')
  })

  it('buildReportWorkbook tích hợp đủ 9 sheets bao gồm cả Data Profiler', () => {
    const mockReconcileResult: ReconcileResult = {
      beforeEntries: [],
      afterEntries: [],
      diffRows: mockDiffRows,
      groups: [],
      inventory: [],
      errors: [],
      bctc: {
        cdktRows: [],
        kqkdRows: [],
        financialCdkt: [],
        financialKqkd: [],
        workingPaperLines: [],
        totals: {
          tongTaiSanTang: 0,
          tongTaiSanGiam: 0,
          tongNguonVonTang: 0,
          tongNguonVonGiam: 0,
          chenhLechCanDoi: 0,
          canDoiToanBang: true,
          anhHuongLoiNhuanThuan: 0,
          soDongChuaMap: 0,
        },
      },
      stats: {
        beforeCount: 0,
        afterCount: 2,
        diffCount: 2,
        unmatchedCount: 0,
        totalDiffAmount: '2500000000',
        elapsedMs: 10,
      },
      entryTypeSummary: {
        filteredLineCount: 2,
        groupCount: 1,
        collapsedLines: 0,
        totalAfter: '6500000000',
        totalBefore: '4000000000',
        totalDifference: '2500000000',
      },
    }

    const wb = buildReportWorkbook({ result: mockReconcileResult, excludeKetChuyen: false })
    expect(wb.worksheets.length).toBe(9)

    const profilerWs = wb.getWorksheet('Phan tich & Rui ro Cutoff')
    expect(profilerWs).toBeDefined()
    expect(profilerWs?.getCell('A1').value).toContain('BÁO CÁO TRỰC QUAN HÓA DỮ LIỆU & PHÂN TÍCH RỦI RO KHÓA SỔ')
  })
})
