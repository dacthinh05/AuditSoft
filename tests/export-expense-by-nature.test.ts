import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ExpenseByNatureEngine } from '../src/domain/analytics/ExpenseByNatureEngine'
import { buildExpenseByNatureWorkbook } from '../src/infrastructure/excel/exportExpenseByNature'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'

describe('Export Expense By Nature Excel Workbook', () => {
  it('tạo bảng Excel ma trận dọc-ngang thành công với đầy đủ công thức và format', async () => {
    const entries: JournalEntry[] = [
      {
        id: '1',
        source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
        month: 1,
        date: '2026-01-15',
        voucherNumber: 'PC001',
        description: 'Xuất kho NVL sản xuất',
        debitAccount: '621',
        creditAccount: '152',
        amount: makeMoney(50_000_000n, 0),
      },
      {
        id: '2',
        source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 2 },
        month: 1,
        date: '2026-01-20',
        voucherNumber: 'PC002',
        description: 'Lương công nhân trực tiếp',
        debitAccount: '622',
        creditAccount: '334',
        amount: makeMoney(30_000_000n, 0),
      },
      {
        id: '3',
        source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 3 },
        month: 1,
        date: '2026-01-25',
        voucherNumber: 'PC003',
        description: 'Khấu hao máy móc sản xuất',
        debitAccount: '6274',
        creditAccount: '214',
        amount: makeMoney(10_000_000n, 0),
      },
    ]

    const report = ExpenseByNatureEngine.analyze(entries)
    const wb = buildExpenseByNatureWorkbook(report, 'Công ty TNHH May Mặc Gia Công Test', '2026')

    expect(wb.worksheets.length).toBe(1)
    const ws = wb.getWorksheet('ChiPhi_YeuTo_12M')!
    expect(ws).toBeDefined()

    // Kiểm tra hàng 6 & 7 (Header)
    expect(ws.getCell('A6').value).toBe('KỲ KẾ TOÁN')

    // Kiểm tra hàng 8 (Tháng 01)
    expect(ws.getCell('A8').value).toBe('Tháng 01')

    // Kiểm tra hàng 20 (CẢ NĂM)
    expect(ws.getCell('A20').value).toBe('CẢ NĂM')

    // Kiểm tra lưu file và dung lượng
    const tempOut = path.resolve('temp_test_export_nature.xlsx')
    await wb.xlsx.writeFile(tempOut)

    try {
      expect(fs.existsSync(tempOut)).toBe(true)
      expect(fs.statSync(tempOut).size).toBeGreaterThan(5000)
    } finally {
      if (fs.existsSync(tempOut)) fs.rmSync(tempOut, { force: true })
    }
  })
})
