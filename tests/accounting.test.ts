import { describe, expect, it } from 'vitest'
import { moneyFromNumber } from '../src/domain/money'
import { aggregateGlByAccount, checkTrialBalanceEquation, reconcileGlWithTrialBalance } from '../src/main/accounting/AccountingReconciliationEngine'
import type { JournalEntry, TrialBalanceRow } from '../src/shared/types/analytics'

function entry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? 'e',
    source: { fileName: 't.xlsx', sheetName: 'S', rowNumber: 1 },
    postingDate: partial.postingDate ?? '2025-01-05',
    documentNumber: partial.documentNumber ?? 'PT1',
    description: partial.description ?? '',
    debitAccount: partial.debitAccount ?? '',
    creditAccount: partial.creditAccount ?? '',
    amount: partial.amount ?? moneyFromNumber(0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: 1,
    issues: [],
  }
}

function tbRow(account: string, psNo: number, psCo: number): TrialBalanceRow {
  return {
    account,
    accountName: '',
    openingDebit: moneyFromNumber(0),
    openingCredit: moneyFromNumber(0),
    movementDebit: moneyFromNumber(psNo),
    movementCredit: moneyFromNumber(psCo),
    closingDebit: moneyFromNumber(0),
    closingCredit: moneyFromNumber(0),
    source: { fileName: 'tb.xlsx', sheetName: 'TB', rowNumber: 2 },
  }
}

describe('Accounting integrity (§9)', () => {
  it('Σ Nợ = Σ Có → balanced; PASS khi CĐSPS khớp', () => {
    const entries = [
      entry({ debitAccount: '152', creditAccount: '331', amount: moneyFromNumber(100) }),
      entry({ debitAccount: '331', creditAccount: '112', amount: moneyFromNumber(40) }),
    ]
    const rec = reconcileGlWithTrialBalance(entries, [
      tbRow('152', 100, 0), tbRow('331', 40, 100), tbRow('112', 0, 40),
    ])
    expect(rec.balanced).toBe(true)
    expect(rec.status).toBe('PASS')
  })

  it('bút toán một vế → Σ Nợ ≠ Σ Có (nguyên tắc kế toán kép)', () => {
    const entries = [
      entry({ debitAccount: '152', creditAccount: '331', amount: moneyFromNumber(100) }),
      entry({ debitAccount: '9999', creditAccount: '', amount: moneyFromNumber(7) }),
    ]
    const rec = reconcileGlWithTrialBalance(entries, [])
    expect(rec.balanced).toBe(false)
    expect(rec.status).toBe('ERROR')
  })

  it('GL ↔ CĐSPS khớp → PASS; lệch → WARNING; thiếu một bên → ERROR/note', () => {
    const entries = [
      entry({ debitAccount: '11213', creditAccount: '51111', amount: moneyFromNumber(300) }),
      entry({ debitAccount: '51111', creditAccount: '11213', amount: moneyFromNumber(100) }),
    ]
    const tb = [tbRow('11213', 300, 100)]
    const ok = reconcileGlWithTrialBalance(entries, tb)
    expect(ok.rows[0]!.status).toBe('PASS')

    const tbWrong = [tbRow('11213', 999, 0)]
    const bad = reconcileGlWithTrialBalance(entries, tbWrong)
    expect(bad.rows[0]!.status).toBe('WARNING')
    expect(bad.rows[0]!.note).toContain('Không khớp')

    const tbOnly = [tbRow('13111', 500, 0)]
    const missing = reconcileGlWithTrialBalance(entries, tbOnly)
    expect(missing.rows.find((r) => r.account === '13111')!.status).toBe('ERROR')
  })

  it('TK phát sinh trên GL nhưng không có trên CĐSPS → WARNING row', () => {
    const entries = [entry({ debitAccount: '64276', creditAccount: '1111', amount: moneyFromNumber(50) })]
    const rec = reconcileGlWithTrialBalance(entries, [])
    expect(rec.unmatchedGlAccounts).toContain('64276')
    expect(rec.rows[0]!.status).toBe('WARNING')
    expect(rec.status).toBe('WARNING') // cân nhưng có TK thiếu ở CĐSPS
  })

  it('aggregateGlByAccount tổng đúng theo MATK nguyên bản', () => {
    const agg = aggregateGlByAccount([
      entry({ debitAccount: '64276', creditAccount: '1111', amount: moneyFromNumber(10) }),
      entry({ debitAccount: '64276', creditAccount: '3311', amount: moneyFromNumber(15) }),
      entry({ debitAccount: '1111', creditAccount: '64276', amount: moneyFromNumber(5) }),
    ])
    const a = agg.get('64276')!
    expect(a.debitTurnover.raw).toBe(25n)
    expect(a.creditTurnover.raw).toBe(5n)
    expect(a.count).toBe(3)
  })

  it('CĐSPS phương trình DK+PS=CK sai được phát hiện', () => {
    const rows: TrialBalanceRow[] = [
      {
        ...tbRow('11213', 50, 20),
        openingDebit: moneyFromNumber(100),
        closingDebit: moneyFromNumber(120), // đúng phải là 130
      },
    ]
    const issues = checkTrialBalanceEquation(rows)
    expect(issues.some((i) => i.account === '11213' && i.issue.includes('≠'))).toBe(true)
  })
})
