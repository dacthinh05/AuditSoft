import { describe, expect, it } from 'vitest'
import { AuditDataEngineManager } from '../src/domain/engine/AuditDataEngineManager'
import {
  fromJournalEntry,
  fromNormalizedEntry,
  type JournalEntryRecord,
} from '../src/domain/engine/IAuditDataEngine'
import { InMemoryJsEngine } from '../src/domain/engine/InMemoryJsEngine'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import type { NormalizedEntry } from '../src/domain/types'

describe('Phase 1: Embedded OLAP Engine Foundation Test Suite', () => {
  it('1. Khởi tạo thành công Engine qua AuditDataEngineManager (Fallback an toàn)', async () => {
    let fallbackNotified = false
    const engine = await AuditDataEngineManager.createEngine({
      preferredType: 'in_memory_js',
      onFallback: () => {
        fallbackNotified = true
      },
    })

    expect(engine).toBeDefined()
    expect(engine.engineType).toBe('in_memory_js')
    expect(engine.isAccelerated).toBe(false)
    expect(fallbackNotified).toBe(false)

    await engine.destroy()
  })

  it('2. Chuyển đổi dữ liệu chính xác từ JournalEntry và NormalizedEntry sang JournalEntryRecord', () => {
    const sampleJournalEntry: JournalEntry = {
      id: 'je_101',
      source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 15 },
      postingDate: '2024-03-20',
      documentNumber: 'PC001',
      description: 'Chi tiền trả lãi vay ngân hàng',
      debitAccount: '6351',
      creditAccount: '1121',
      amount: makeMoney(150_000_000n, 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: 'BIDV',
      customerName: 'Ngân hàng BIDV',
      month: 3,
      issues: [],
    }

    const record1 = fromJournalEntry(sampleJournalEntry)
    expect(record1.id).toBe('je_101')
    expect(record1.entryDate).toBe('2024-03-20')
    expect(record1.docNo).toBe('PC001')
    expect(record1.debitAccount).toBe('6351')
    expect(record1.creditAccount).toBe('1121')
    expect(record1.amount).toBe(150_000_000n)
    expect(record1.partnerCode).toBe('BIDV')
    expect(record1.partnerName).toBe('Ngân hàng BIDV')
    expect(record1.sourceRow).toBe(15)

    const sampleNormalizedEntry: NormalizedEntry = {
      rowIndex: 42,
      displayDate: '20/03/2024',
      dateISO: '2024-03-20',
      rawDateText: '20/03/2024',
      voucher: 'PT002',
      debit: '1111',
      credit: '131',
      amount: makeMoney(50_000_000n, 0),
      errors: [],
    }

    const record2 = fromNormalizedEntry(sampleNormalizedEntry)
    expect(record2.id).toBe('ne_42')
    expect(record2.entryDate).toBe('2024-03-20')
    expect(record2.docNo).toBe('PT002')
    expect(record2.debitAccount).toBe('1111')
    expect(record2.creditAccount).toBe('131')
    expect(record2.amount).toBe(50_000_000n)
  })

  it('3. Bulk insert dữ liệu, theo dõi tiến độ và kiểm tra thống kê tổng số dòng và tiền', async () => {
    const engine = new InMemoryJsEngine()
    await engine.initialize()

    const records: JournalEntryRecord[] = []
    const count = 5000
    for (let i = 1; i <= count; i++) {
      records.push({
        id: `rec_${i}`,
        entryDate: '2024-05-10',
        docNo: `VCH_${i}`,
        docDate: '2024-05-10',
        description: `Bút toán thứ ${i}`,
        debitAccount: i % 2 === 0 ? '6351' : '1561',
        creditAccount: '1121',
        amount: BigInt(i * 1000),
        partnerCode: `NCC_${i % 10}`,
        partnerName: `Nhà cung cấp ${i % 10}`,
        sourceRow: i,
      })
    }

    let progressReported = false
    const inserted = await engine.bulkInsert(records, (p, total) => {
      progressReported = true
      expect(total).toBe(count)
    })

    expect(inserted).toBe(count)
    expect(progressReported).toBe(true)

    const rowCount = await engine.getRowCount()
    expect(rowCount).toBe(count)

    const totalAmount = await engine.getTotalAmount()
    // Công thức tổng: 1000 * n*(n+1)/2 = 1000 * 5000 * 5001 / 2 = 12,502,500,000
    expect(totalAmount).toBe(12_502_500_000n)

    const stats = await engine.getStats()
    expect(stats.totalRows).toBe(count)
    expect(stats.totalAmount).toBe(12_502_500_000n)
    expect(stats.loadTimeMs).toBeGreaterThanOrEqual(0)

    await engine.destroy()
  })

  it('4. Thực thi các mẫu truy vấn kiểm toán cơ bản qua query()', async () => {
    const engine = new InMemoryJsEngine()
    await engine.initialize()

    const testRecords: JournalEntryRecord[] = [
      {
        id: '1',
        entryDate: '2024-01-15',
        docNo: 'V01',
        docDate: '2024-01-15',
        description: 'Chi trả lãi vay định kỳ',
        debitAccount: '6351',
        creditAccount: '1121',
        amount: 80_000_000n,
        partnerCode: 'VCB',
        partnerName: 'Vietcombank',
        sourceRow: 1,
      },
      {
        id: '2',
        entryDate: '2024-02-20',
        docNo: 'V02',
        docDate: '2024-02-20',
        description: 'Lãi tiền gửi tiết kiệm',
        debitAccount: '1121',
        creditAccount: '5151',
        amount: 20_000_000n,
        partnerCode: 'VCB',
        partnerName: 'Vietcombank',
        sourceRow: 2,
      },
      {
        id: '3',
        entryDate: '2024-03-10',
        docNo: 'V03',
        docDate: '2024-03-10',
        description: 'Trích khấu hao TSCĐ',
        debitAccount: '6424',
        creditAccount: '2141',
        amount: 50_000_000n,
        partnerCode: '',
        partnerName: '',
        sourceRow: 3,
      },
      {
        id: '4',
        entryDate: '2024-04-12',
        docNo: 'V04',
        docDate: '2024-04-12',
        description: 'Bán hàng cho Công ty An Phát',
        debitAccount: '131',
        creditAccount: '5111',
        amount: 500_000_000n,
        partnerCode: 'KH_ANPHAT',
        partnerName: 'Công ty An Phát',
        sourceRow: 4,
      },
      {
        id: '5',
        entryDate: '2024-04-18',
        docNo: 'V05',
        docDate: '2024-04-18',
        description: 'Cho đối tác vay vốn không tính lãi',
        debitAccount: '1283',
        creditAccount: '1121',
        amount: 300_000_000n,
        partnerCode: 'DT_B',
        partnerName: 'Đối tác B',
        sourceRow: 5,
      },
    ]

    await engine.bulkInsert(testRecords)

    // A. Query COUNT(*) và SUM(amount)
    const countRes = await engine.query<{ count: number; total_amount: string }>(
      'SELECT COUNT(*), SUM(amount) FROM journal_entries;'
    )
    expect(countRes[0].count).toBe(5)
    expect(BigInt(countRes[0].total_amount)).toBe(950_000_000n)

    // B. Query EBITDA components
    const ebitdaRes = await engine.query<{
      total_interest_expense: string
      total_interest_income: string
      total_depreciation: string
    }>('SELECT TOTAL_INTEREST_EXPENSE, TOTAL_INTEREST_INCOME, TOTAL_DEPRECIATION FROM journal_entries;')

    expect(BigInt(ebitdaRes[0].total_interest_expense)).toBe(80_000_000n)
    expect(BigInt(ebitdaRes[0].total_interest_income)).toBe(20_000_000n)
    expect(BigInt(ebitdaRes[0].total_depreciation)).toBe(50_000_000n)

    // C. Query Pareto
    const paretoRes = await engine.query<{
      partner_code: string
      total_amount: string
      share_pct: number
    }>("SELECT partner_code FROM journal_entries WHERE credit_account LIKE '511%' GROUP BY partner_code;")

    expect(paretoRes.length).toBe(1)
    expect(paretoRes[0].partner_code).toBe('KH_ANPHAT')
    expect(BigInt(paretoRes[0].total_amount)).toBe(500_000_000n)

    // D. Query Related Party (TK 128 >= 100M)
    const relatedRes = await engine.query<{ doc_no: string; amount: string }>(
      "SELECT * FROM journal_entries WHERE debit_account LIKE '128%';"
    )
    expect(relatedRes.length).toBe(1)
    expect(relatedRes[0].doc_no).toBe('V04' ? 'V05' : 'V05')
    expect(BigInt(relatedRes[0].amount)).toBe(300_000_000n)

    await engine.clear()
    const emptyCount = await engine.getRowCount()
    expect(emptyCount).toBe(0)

    await engine.destroy()
  })
})
