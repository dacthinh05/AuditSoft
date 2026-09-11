import { describe, expect, it } from 'vitest'
import { makeMoney } from '../src/domain/money'
import type { IncomeStatementData, JournalEntry } from '../src/shared/types/analytics'
import { buildKqkdYoY } from '../src/domain/analytics/KqkdYoY'

function entry(debit: string, credit: string, amount: bigint): JournalEntry {
  return {
    id: `${debit}-${credit}-${amount}`,
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
    month: 6,
    issues: [],
  }
}

function b02Line(maSo: string, current: bigint | null, prior: bigint | null): IncomeStatementData['lines'][number] {
  return {
    maSo,
    chiTieu: maSo,
    current: current == null ? null : makeMoney(current, 0),
    prior: prior == null ? null : makeMoney(prior, 0),
  }
}

describe('buildKqkdYoY', () => {
  it('ưu tiên B02 đủ 2 năm, diff và % đúng', () => {
    const income: IncomeStatementData = {
      lines: [
        b02Line('01', 10000000000n, 8000000000n),
        b02Line('11', 7000000000n, 6000000000n),
      ],
      source: null,
    }
    const { rows, fromB02 } = buildKqkdYoY(income, [])
    expect(fromB02).toBe(true)
    const r01 = rows.find((r) => r.maSo === '01')
    expect(r01?.current).toBe(10000000000)
    expect(r01?.prior).toBe(8000000000)
    expect(r01?.diff).toBe(2000000000)
    expect(r01?.pct).toBe(25)
  })

  it('chỉ NKC: năm nay từ TK, năm trước null', () => {
    const entries = [
      entry('131', '511', 6000000000n),
      entry('632', '156', 4000000000n),
      entry('642', '111', 500000000n),
    ]
    const { rows, fromB02 } = buildKqkdYoY(null, entries)
    expect(fromB02).toBe(false)
    const byMaSo = new Map(rows.map((r) => [r.maSo, r]))
    expect(byMaSo.get('01')?.current).toBe(6000000000)
    expect(byMaSo.get('01')?.prior).toBeNull()
    expect(byMaSo.get('11')?.current).toBe(4000000000)
    expect(byMaSo.get('10')?.current).toBe(6000000000)
    expect(byMaSo.get('60')?.current).toBe(2000000000)
    expect(byMaSo.get('70')?.current).toBe(1500000000)
  })

  it('rỗng thì không throw, bảng rỗng', () => {
    const { rows } = buildKqkdYoY(null, [])
    expect(rows).toEqual([])
  })
})
