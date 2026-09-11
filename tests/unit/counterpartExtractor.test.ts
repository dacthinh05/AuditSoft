import { describe, it, expect } from 'vitest'
import { extractCounterpartStats, extract12MonthExpenseMatrix } from '../../src/domain/workingpaper/counterpartExtractor'
import type { NkcTransaction } from '../../src/domain/workingpaper/types'

describe('Counterpart Extractor Unit Tests', () => {
  const mockTransactions: NkcTransaction[] = [
    {
      rowNum: 1,
      dateStr: '15/03/2025',
      dateVal: new Date('2025-03-15'),
      docNo: 'HDBR01',
      desc: 'Bán hàng thu tiền ngay qua ngân hàng',
      debit: '1121',
      credit: '5111',
      amount: 100000000,
      month: 3,
    },
    {
      rowNum: 2,
      dateStr: '20/05/2025',
      dateVal: new Date('2025-05-20'),
      docNo: 'HDBR02',
      desc: 'Bán hàng cho khách chưa thu tiền',
      debit: '131',
      credit: '5112',
      amount: 250000000,
      month: 5,
    },
    {
      rowNum: 3,
      dateStr: '10/10/2025',
      dateVal: new Date('2025-10-10'),
      docNo: 'HDBR03',
      desc: 'Bán hàng đợt 2 thu tiền mặt',
      debit: '1111',
      credit: '5111',
      amount: 50000000,
      month: 10,
    },
    {
      rowNum: 4,
      dateStr: '12/04/2025',
      dateVal: new Date('2025-04-12'),
      docNo: 'PKT01',
      desc: 'Hàng bán bị trả lại',
      debit: '5111',
      credit: '131',
      amount: 20000000,
      month: 4,
    },
  ]

  it('bóc tách chính xác đối ứng cả năm cho TK 511', () => {
    const stats = extractCounterpartStats(mockTransactions, '511', false)
    expect(stats.totalCreditAmount).toBe(400000000)
    expect(stats.totalDebitAmount).toBe(20000000)

    // Vế Có: TK đối ứng bên Nợ gồm 131 (250tr), 112 (100tr), 111 (50tr)
    expect(stats.creditItems.length).toBe(3)
    expect(stats.creditItems[0]?.account).toBe('131')
    expect(stats.creditItems[0]?.amount).toBe(250000000)
    expect(stats.creditItems[0]?.ref).toBe('D390')

    expect(stats.creditItems[1]?.account).toBe('112')
    expect(stats.creditItems[1]?.amount).toBe(100000000)
    expect(stats.creditItems[1]?.ref).toBe('D190')

    // Vế Nợ: TK đối ứng bên Có là 131 (20tr)
    expect(stats.debitItems.length).toBe(1)
    expect(stats.debitItems[0]?.account).toBe('131')
    expect(stats.debitItems[0]?.amount).toBe(20000000)
    expect(stats.debitItems[0]?.ref).toBe('D390')
  })

  it('bóc tách chính xác đối ứng Đợt 1 (chỉ tháng 1 đến 6)', () => {
    const statsP1 = extractCounterpartStats(mockTransactions, '511', true)
    // Tháng 10 (50tr) bị loại bỏ ở Đợt 1 -> Tổng Có = 350tr
    expect(statsP1.totalCreditAmount).toBe(350000000)
    expect(statsP1.creditItems.find((i) => i.account === '111')).toBeUndefined()
    expect(statsP1.creditItems.length).toBe(2)
  })
  it('bóc tách chính xác ma trận chi phí 12 tháng cho TK 242 và 214', () => {
    const expenseTxs: NkcTransaction[] = [
      {
        rowNum: 10,
        dateStr: '31/01/2025',
        dateVal: new Date('2025-01-31'),
        docNo: 'PB01',
        desc: 'Phân bổ CCDC T1',
        debit: '6273',
        credit: '2422',
        amount: 30000000,
        month: 1,
      },
      {
        rowNum: 11,
        dateStr: '31/01/2025',
        dateVal: new Date('2025-01-31'),
        docNo: 'PB01',
        desc: 'Phân bổ CCDC văn phòng T1',
        debit: '6422',
        credit: '2421',
        amount: 10000000,
        month: 1,
      },
      {
        rowNum: 12,
        dateStr: '28/02/2025',
        dateVal: new Date('2025-02-28'),
        docNo: 'PB02',
        desc: 'Phân bổ chi phí bán hàng T2',
        debit: '6417',
        credit: '2422',
        amount: 15000000,
        month: 2,
      },
    ]

    const matrix242 = extract12MonthExpenseMatrix(expenseTxs, '242')
    expect(matrix242.monthly.length).toBe(12)
    expect(matrix242.monthly[0]?.month).toBe(1)
    expect(matrix242.monthly[0]?.tk627).toBe(30000000)
    expect(matrix242.monthly[0]?.tk642).toBe(10000000)
    expect(matrix242.monthly[0]?.total).toBe(40000000)

    expect(matrix242.monthly[1]?.month).toBe(2)
    expect(matrix242.monthly[1]?.tk641).toBe(15000000)
    expect(matrix242.monthly[1]?.total).toBe(15000000)

    expect(matrix242.totalYear.tk627).toBe(30000000)
    expect(matrix242.totalYear.tk641).toBe(15000000)
    expect(matrix242.totalYear.tk642).toBe(10000000)
    expect(matrix242.totalYear.total).toBe(55000000)
  })
})
