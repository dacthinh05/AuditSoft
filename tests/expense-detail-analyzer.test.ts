import { describe, expect, it } from 'vitest'
import { makeMoney } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import { analyzeJournal, buildDetail } from '../src/domain/analytics/ExpenseDetailAnalyzer'

function entry(debit: string, credit: string, month: number, amount: bigint): JournalEntry {
  return {
    id: `${debit}-${month}-${amount}`,
    source: { fileName: '', sheetName: '', rowNumber: 0 },
    postingDate: null,
    documentNumber: null,
    description: null,
    debitAccount: debit,
    creditAccount: credit,
    amount: makeMoney(amount, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month,
    issues: [],
  }
}

describe('ExpenseDetailAnalyzer', () => {
  it('gom đúng TK 4 số theo tháng cho 641 (mẫu TK6412 như ảnh)', () => {
    const entries = [
      entry('6412', '111', 3, 112860000n),
      entry('6412', '111', 6, 138730000n),
      entry('6418', '111', 9, 5113908n),
      entry('131', '5111', 3, 4194660900n),
    ]
    const { sell } = analyzeJournal(entries)
    expect(sell.accounts).toEqual(['6412', '6418'])
    const idx6412 = sell.accounts.indexOf('6412')
    expect(sell.months[idx6412]?.[2]).toBe(112860000)
    expect(sell.months[idx6412]?.[5]).toBe(138730000)
    expect(sell.totals[idx6412]).toBe(251590000)
  })

  it('tỷ lệ null khi doanh thu tháng = 0 (không #DIV/0!)', () => {
    const entries = [entry('6428', '111', 6, 10000000n)]
    const { admin } = analyzeJournal(entries)
    expect(admin.revenue[5]).toBe(0)
    expect(admin.ratios[5]).toBeNull()
  })

  it('tỷ lệ đúng khi có doanh thu', () => {
    const entries = [
      entry('6412', '111', 12, 181901333n),
      entry('6418', '111', 12, 9755640n),
      entry('131', '5111', 12, 2790948900n),
    ]
    const { sell } = analyzeJournal(entries)
    // (181901333 + 9755640) / 2790948900 * 100 ≈ 6.9%
    expect(sell.ratios[11]).toBeCloseTo(6.9, 1)
  })

  it('entries rỗng cho báo cáo rỗng, không throw', () => {
    const { sell, admin } = analyzeJournal([])
    expect(sell.accounts).toEqual([])
    expect(admin.accounts).toEqual([])
    expect(sell.ratios).toHaveLength(12)
  })

  it('bỏ qua bút toán tháng null và TK ngoài 641/642', () => {
    const bad = entry('6412', '111', 3, 100n)
    const result = buildDetail(
      [
        { account: '6412', month: 3, amount: 100 },
        { account: '6421', month: 3, amount: 200 },
        { account: '6412', month: 99, amount: 999 },
      ],
      '641',
      Array.from({ length: 12 }, () => 1000),
    )
    expect(bad.debitAccount).toBe('6412')
    expect(result.accounts).toEqual(['6412'])
    expect(result.months[0]?.[2]).toBe(100)
  })
})
