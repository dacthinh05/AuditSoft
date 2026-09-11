import { describe, expect, it } from 'vitest'
import { TaxCrossReconciler } from '../src/domain/analytics/TaxCrossReconciler'
import { buildTaxReconWorkbook } from '../src/main/export/TaxReconExporter'
import { makeMoney, MONEY_ZERO } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import type { VatDeclarationSnapshot } from '../src/shared/types/taxAnalytics'

function vatDecl(key: string, label: string, ct22: bigint, ct43: bigint, ct34 = 0n): VatDeclarationSnapshot {
  const ind = (code: string, numericValue: bigint) => ({ code, name: code, rawValue: String(numericValue), numericValue })
  return {
    taxpayerId: '0101234567',
    taxpayerName: 'CTY TEST',
    formCode: '01/GTGT',
    period: { type: 'QUARTER', value: label, normalizedKey: key, year: 2025, quarter: Number(key.slice(-1)) },
    declarationType: 'ORIGINAL',
    indicators: { '22': ind('22', ct22), '34': ind('34', ct34), '43': ind('43', ct43) },
  }
}

function entry(month: number, creditAccount: string, amount: bigint): JournalEntry {
  return {
    id: `e-${month}-${creditAccount}`,
    source: { fileName: 't.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: '2025-01-15',
    documentNumber: 'CT001',
    description: 'test',
    debitAccount: '111',
    creditAccount,
    amount: makeMoney(amount, 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month,
    issues: [],
  }
}

describe('Tax flow [22]/[43] (port TaxRecord)', () => {
  it('kỳ đầu FIRST_PERIOD, kỳ khớp MATCHED, kỳ lệch DISCREPANCY', () => {
    const res = TaxCrossReconciler.reconcile(
      [entry(1, '5111', 100n)],
      [
        vatDecl('2025-Q1', 'Quý 1/2025', 50n, 80n),
        vatDecl('2025-Q2', 'Quý 2/2025', 80n, 90n),
        vatDecl('2025-Q3', 'Quý 3/2025', 70n, 0n),
      ],
      [],
    )
    expect(res.vatRows).toHaveLength(3)
    expect(res.vatRows[0]!.flowStatus).toBe('FIRST_PERIOD')
    expect(res.vatRows[0]!.openingBalance22).toBe(50n)
    expect(res.vatRows[1]!.flowStatus).toBe('MATCHED')
    expect(res.vatRows[2]!.flowStatus).toBe('DISCREPANCY')
    expect(res.vatRows[2]!.flowNote).toContain('70')
  })

  it('exporter dựng workbook 2 sheet mở được', async () => {
    const res = TaxCrossReconciler.reconcile(
      [entry(1, '5111', 100n)],
      [vatDecl('2025-Q1', 'Quý 1/2025', 50n, 80n, 100n)],
      [],
    )
    const wb = buildTaxReconWorkbook(res)
    expect(wb.worksheets.map((w) => w.name)).toEqual(['E380_GTGT', 'E381_TNCN'])
    const ws = wb.getWorksheet('E380_GTGT')!
    expect(ws.rowCount).toBeGreaterThanOrEqual(3) // header + 1 dòng + tổng
    expect(ws.getRow(2).getCell('taxIn25').value).toBeDefined()
    expect(MONEY_ZERO.raw).toBe(0n)
  })
})
